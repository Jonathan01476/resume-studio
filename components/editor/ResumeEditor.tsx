'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  History,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ResumePreview } from './ResumePreview';
import { StructuredEditor } from './StructuredEditor';
import { Resume, resumeSchema } from '@/lib/resume/schema';
import { changesBetween } from '@/lib/resume/transformations';
import type { ResumeSource } from '@/lib/ingestion/types';
import type { ResumeVersion } from '@/lib/db/repository';
type Proposal = { resume: Resume; message: string; kind: 'ai' | 'restore' | 'import' };
async function request(url: string, body?: unknown) {
  const response = await fetch(
    url,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed. Please retry.');
  return result;
}
export function ResumeEditor({
  initial,
  publishedVersion,
  local,
  aiEnabled,
}: {
  initial: Resume;
  publishedVersion: number | null;
  local: boolean;
  aiEnabled: boolean;
}) {
  const [resume, setResume] = useState(initial),
    [saved, setSaved] = useState(initial),
    [published, setPublished] = useState(publishedVersion);
  const [tab, setTab] = useState<'compose' | 'content' | 'history'>('compose');
  const [prompt, setPrompt] = useState('');
  const [sources, setSources] = useState<ResumeSource[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const publishRef = useRef<HTMLDialogElement>(null);
  const dirty = JSON.stringify(resume) !== JSON.stringify(saved);
  const valid = resumeSchema.safeParse(resume);
  const frozen = Boolean(busy || proposal);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('folio-sources') ?? '[]');
      if (Array.isArray(ids)) setSources(ids);
    } catch {}
  }, []);
  function updateSources(next: ResumeSource[]) {
    setSources(next);
    try {
      localStorage.setItem('folio-sources', JSON.stringify(next));
    } catch {}
  }
  async function save(value = resume, reason = 'manual') {
    const result = await request('/api/resume', { action: 'save', resume: value, reason });
    setResume(result.resume);
    setSaved(result.resume);
    return result.resume as Resume;
  }
  async function run(label: string, work: () => Promise<void>) {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please retry.');
    } finally {
      setBusy('');
    }
  }
  async function generate() {
    await run('Thinking', async () => {
      const baseline = await save();
      const result = await request('/api/ai', {
        resume: baseline,
        instruction: prompt,
        sourceIds: sources.map((s) => s.id),
      });
      const parsed = resumeSchema.parse(result.resume);
      if (changesBetween(baseline, parsed).length === 0) {
        setMessage(result.message);
        return;
      }
      setProposal({ resume: parsed, message: result.message, kind: 'ai' });
    });
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    await run('Uploading', async () => {
      let next = [...sources];
      for (const file of Array.from(files)) {
        if (next.length >= 5) throw new Error('You can attach up to 5 files to a command.');
        if (file.size > 3 * 1024 * 1024) throw new Error(`${file.name} exceeds the 3 MB limit.`);
        const form = new FormData();
        form.set('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        next = [...next, result.source];
        updateSources(next);
      }
      setMessage('Sources preserved. Add an instruction to propose changes.');
    });
    if (uploadRef.current) uploadRef.current.value = '';
  }
  async function loadHistory() {
    setTab('history');
    await run('Loading history', async () => {
      const result = await request('/api/versions');
      setVersions(result.versions);
    });
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.slug}-resume.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <Header editor>
        <span className="save-indicator">
          <i className={dirty ? 'unsaved' : ''} />
          {busy ? `${busy}…` : dirty ? 'Unsaved changes' : 'Draft saved'}
        </span>
        <Link href="/resume" target="_blank" className="button subtle">
          View live <ArrowUpRight size={14} />
        </Link>
        <button
          className="button secondary"
          disabled={frozen || !valid.success}
          onClick={() =>
            run('Saving', async () => {
              await save();
              setMessage('Draft saved. The live resume is unchanged.');
            })
          }
        >
          Save draft
        </button>
        <button
          className="button primary"
          disabled={frozen || !valid.success}
          onClick={() => publishRef.current?.showModal()}
        >
          Publish <ArrowUpRight size={14} />
        </button>
      </Header>
      <main id="main" className="studio">
        <aside className="editor-sidebar">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">PERSONAL WORKSPACE</span>
              <h1>
                {resume.title || 'Master resume'}
                <ChevronDown size={15} />
              </h1>
            </div>
            <span className="workspace-badge">{local ? 'LOCAL' : 'CLOUD'}</span>
          </div>
          <div className="editor-tabs" role="tablist" aria-label="Editor views">
            {(['compose', 'content', 'history'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                aria-controls="editor-tabpanel"
                id={`tab-${t}`}
                disabled={frozen}
                onClick={() => (t === 'history' ? loadHistory() : setTab(t))}
              >
                {t === 'compose' ? (
                  <Sparkles size={14} />
                ) : t === 'content' ? (
                  <FileText size={14} />
                ) : (
                  <History size={14} />
                )}
                <span>
                  {t === 'compose' ? 'Assistant' : t === 'content' ? 'Content' : 'History'}
                </span>
              </button>
            ))}
          </div>
          <div
            className="editor-scroll"
            role="tabpanel"
            id="editor-tabpanel"
            aria-labelledby={`tab-${tab}`}
          >
            <fieldset disabled={frozen} className="editor-fieldset">
              {tab === 'compose' && (
                <div className="compose-panel">
                  <div className="assistant-heading">
                    <span className="assistant-symbol">
                      <Sparkles size={19} />
                    </span>
                    <span className="mode-badge">{aiEnabled ? 'AI CONNECTED' : 'DEMO MODE'}</span>
                  </div>
                  <h2>
                    Your experience.
                    <br />A clearer story.
                  </h2>
                  <p className="muted">
                    Bring your career into focus. Add a source, describe a change, and review the
                    result.
                  </p>
                  <div className="command-box">
                    <label htmlFor="ai-prompt" className="sr-only">
                      AI instruction
                    </label>
                    <textarea
                      id="ai-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Tell AI what you want to change…"
                      rows={5}
                      maxLength={8000}
                    />
                    <div className="command-bottom">
                      <button
                        className="icon-button"
                        aria-label="Attach sources"
                        onClick={() => uploadRef.current?.click()}
                      >
                        <Paperclip size={16} />
                      </button>
                      <span>
                        {sources.length
                          ? `${sources.length} source${sources.length > 1 ? 's' : ''}`
                          : 'Changes need your approval'}
                      </span>
                      <button
                        className="command-submit"
                        disabled={!prompt.trim() || !valid.success}
                        aria-label="Generate proposal"
                        onClick={generate}
                      >
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                  {!aiEnabled && (
                    <p className="fine-print ai-mode-note">
                      No AI key needed to explore. Demo mode supports section reordering and basic
                      shortening; it does not interpret files.
                    </p>
                  )}
                  <div className="suggestions">
                    <span className="eyebrow">TRY AN INSTRUCTION</span>
                    {[
                      'Move certifications above projects',
                      'Make project descriptions more concise',
                      'Emphasize my AI engineering experience',
                    ].map((value) => (
                      <button key={value} onClick={() => setPrompt(value)}>
                        {value}
                        <Plus size={13} />
                      </button>
                    ))}
                  </div>
                  <div className="sources-heading">
                    <span className="eyebrow">SOURCE MATERIAL</span>
                    <span>{String(sources.length).padStart(2, '0')}</span>
                  </div>
                  <button className="upload-zone" onClick={() => uploadRef.current?.click()}>
                    <Upload size={19} />
                    <strong>Add context to your resume</strong>
                    <span>PDF, images, or text · up to 3 MB each</span>
                  </button>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,text/plain"
                    multiple
                    hidden
                    onChange={(e) => upload(e.target.files)}
                  />
                  {sources.map((source) => (
                    <div className="source-item" key={source.id}>
                      <FileText size={16} />
                      <div>
                        <a
                          href={`/api/sources/${source.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.name}
                        </a>
                        <span>{source.message}</span>
                        {source.text && (
                          <details>
                            <summary>Extracted text</summary>
                            <pre>{source.text}</pre>
                          </details>
                        )}
                      </div>
                      <button
                        className="icon-button"
                        aria-label={`Detach ${source.name}`}
                        onClick={() => updateSources(sources.filter((s) => s.id !== source.id))}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="privacy-note">
                    <span className="mini-line" />
                    <p>
                      {aiEnabled
                        ? 'Sending a command shares your current resume and attached sources with the configured AI provider.'
                        : 'Your document stays yours. AI proposes changes; you decide what becomes part of your resume.'}
                    </p>
                  </div>
                </div>
              )}
              {tab === 'content' && (
                <>
                  <div className="content-intro">
                    <h2>The details, in your hands.</h2>
                    <p>Edit any field. The document updates as you type.</p>
                  </div>
                  <StructuredEditor resume={resume} onChange={setResume} />
                  <div className="data-actions">
                    <button className="button secondary" onClick={exportJson}>
                      Export JSON
                    </button>
                    <button className="button subtle" onClick={() => importRef.current?.click()}>
                      Import JSON
                    </button>
                    <input
                      ref={importRef}
                      hidden
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        run('Reading file', async () => {
                          if (file.size > 500000)
                            throw new Error('JSON must be smaller than 500 KB.');
                          const parsed = resumeSchema.parse(JSON.parse(await file.text()));
                          setProposal({
                            resume: {
                              ...parsed,
                              id: resume.id,
                              slug: resume.slug,
                              metadata: { ...resume.metadata, sample: parsed.metadata.sample },
                            },
                            message: 'Review imported information before replacing your draft.',
                            kind: 'import',
                          });
                        });
                        e.target.value = '';
                      }}
                    />
                  </div>
                </>
              )}
              {tab === 'history' && (
                <div className="history-panel">
                  <h2>A record of your progress.</h2>
                  <p className="muted">
                    Previous drafts are kept when you save. Restoring creates a new draft and leaves
                    the live resume unchanged.
                  </p>
                  {versions.length === 0 ? (
                    <div className="history-empty">
                      <Clock3 size={25} />
                      <p>No earlier versions yet.</p>
                      <span>Save your first draft to start its history.</span>
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div className="version-item" key={version.id}>
                        <div>
                          <strong>Version {version.resume.metadata.version}</strong>
                          <span>{new Date(version.createdAt).toLocaleString()}</span>
                          <small>{version.reason}</small>
                        </div>
                        <button
                          className="button subtle"
                          onClick={() =>
                            setProposal({
                              resume: {
                                ...version.resume,
                                metadata: {
                                  ...resume.metadata,
                                  sample: version.resume.metadata.sample,
                                },
                              },
                              message:
                                'Review this earlier version before restoring it as your draft.',
                              kind: 'restore',
                            })
                          }
                        >
                          Review
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </fieldset>
          </div>
          <div className="sidebar-footer">
            <span>
              <i className="status-dot" />
              {local ? 'Stored on this device’s server' : 'Supabase connected'}
            </span>
            {!local && (
              <button
                disabled={Boolean(busy)}
                onClick={() =>
                  run('Signing out', async () => {
                    if (dirty) await save();
                    const response = await fetch('/api/auth', { method: 'DELETE' });
                    if (!response.ok) throw new Error('Could not sign out. Please retry.');
                    localStorage.removeItem('folio-sources');
                    window.location.assign('/login');
                  })
                }
              >
                Sign out
              </button>
            )}
          </div>
        </aside>
        <section className="preview-workspace" aria-label="Live resume preview">
          <div className="preview-toolbar">
            <div>
              <span className="status-dot" />
              <span>{proposal ? 'PROPOSED DOCUMENT' : 'LIVE PREVIEW'}</span>
              <span className="preview-divider">/</span>
              <span className="muted">US Letter</span>
            </div>
            <span className="preview-version">
              {published === null ? 'Not published' : `Published v${published}`} · Draft v
              {resume.metadata.version}
            </span>
          </div>
          <div className="preview-scroll">
            {proposal && (
              <div className="proposal-banner">
                <Sparkles size={15} />
                <span>Reviewing a proposal. Your draft is unchanged.</span>
              </div>
            )}
            <ResumePreview resume={proposal?.resume ?? resume} />
            <div className="preview-footnote">
              <span>ONE DOCUMENT. ALWAYS EVOLVING.</span>
              <span>8.5 × 11 IN</span>
            </div>
          </div>
        </section>
      </main>
      {(!valid.success || error || message || busy) && (
        <div
          className={`feedback-toast web-only ${error || !valid.success ? 'is-error' : ''}`}
          role={error || !valid.success ? 'alert' : 'status'}
        >
          {busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
          <span>
            {error ||
              (!valid.success
                ? `${valid.error.issues[0].path.join('.')}: ${valid.error.issues[0].message}`
                : '') ||
              (busy ? `${busy}…` : message)}
          </span>
          {!busy && (
            <button
              aria-label="Dismiss message"
              className="icon-button"
              onClick={() => {
                setError('');
                setMessage('');
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {proposal && (
        <section className="change-review web-only" aria-label="Review proposed changes">
          <div className="review-heading">
            <div>
              <span className="eyebrow">APPROVAL REQUIRED</span>
              <h2>
                {proposal.kind === 'restore'
                  ? 'Restore a previous version'
                  : proposal.kind === 'import'
                    ? 'Review imported resume'
                    : 'Review proposed changes'}
              </h2>
            </div>
            <button
              className="icon-button"
              aria-label="Discard proposal"
              disabled={Boolean(busy)}
              onClick={() => setProposal(null)}
            >
              <X size={18} />
            </button>
          </div>
          <p>{proposal.message}</p>
          <div className="change-list">
            {changesBetween(resume, proposal.resume).map((change) => (
              <details key={change.path} open>
                <summary>{change.path}</summary>
                <div>
                  <pre className="removed">− {change.before || '(empty)'}</pre>
                  <pre className="added">+ {change.after || '(empty)'}</pre>
                </div>
              </details>
            ))}
          </div>
          <div className="review-actions">
            <button
              className="button secondary"
              disabled={Boolean(busy)}
              onClick={() => setProposal(null)}
            >
              Discard
            </button>
            <button
              className="button primary"
              disabled={Boolean(busy)}
              onClick={() =>
                run('Saving proposal', async () => {
                  await save(proposal.resume, proposal.kind === 'ai' ? 'ai' : 'manual');
                  setProposal(null);
                  setMessage('Proposal saved to your draft. Publish when you’re ready.');
                })
              }
            >
              Approve & save draft <Check size={14} />
            </button>
          </div>
        </section>
      )}
      <dialog className="publish-dialog" aria-labelledby="publish-title" ref={publishRef}>
        <span className="eyebrow">READY TO GO LIVE?</span>
        <h2 id="publish-title">Publish this resume.</h2>
        <p>
          This saves your current draft and updates the public document at <strong>/resume</strong>.
          Your previous versions are preserved.
        </p>
        {resume.metadata.sample && (
          <p className="notice">
            This document still contains fictional sample information and will be labeled as a
            sample.
          </p>
        )}
        <div className="review-actions">
          <button className="button secondary" onClick={() => publishRef.current?.close()}>
            Keep editing
          </button>
          <button
            className="button primary"
            onClick={() => {
              publishRef.current?.close();
              run('Publishing', async () => {
                const draft = await save();
                const result = await request('/api/resume', {
                  action: 'publish',
                  id: draft.id,
                  version: draft.metadata.version,
                });
                setPublished(result.resume.metadata.version);
                setMessage('Published. Your live URL now shows this version.');
              });
            }}
          >
            Publish now <ArrowUpRight size={14} />
          </button>
        </div>
      </dialog>
    </>
  );
}
