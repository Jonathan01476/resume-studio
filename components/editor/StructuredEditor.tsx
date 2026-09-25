'use client';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Resume, SectionName } from '@/lib/resume/schema';
import { emptyEntry } from '@/lib/resume/transformations';
const labels: Record<string, string> = {
  github: 'GitHub URL',
  linkedin: 'LinkedIn URL',
  url: 'External URL',
  liveUrl: 'Live URL',
  credentialUrl: 'Verification URL',
  credentialId: 'Credential ID',
  startDate: 'Start date',
  endDate: 'End date',
  issueDate: 'Issue date',
  longDescription: 'Extended description',
  current: 'Current position',
  items: 'Skills',
  images: 'Image URLs',
  coursework: 'Relevant coursework',
};
function label(key: string) {
  return labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}
function Field({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | string[] | boolean;
  onChange: (value: string | string[] | boolean) => void;
}) {
  if (typeof value === 'boolean')
    return (
      <label className="checkbox-field">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {label(name)}
      </label>
    );
  const multiline =
    Array.isArray(value) ||
    ['summary', 'description', 'longDescription', 'details', 'architecture'].includes(name);
  return (
    <label className="field">
      <span>
        {label(name)}
        {Array.isArray(value) && <small>one per line</small>}
        {name.toLowerCase().includes('date') && <small>YYYY or YYYY-MM</small>}
      </span>
      {multiline ? (
        <textarea
          rows={Array.isArray(value) ? Math.min(5, Math.max(2, value.length + 1)) : 3}
          value={Array.isArray(value) ? value.join('\n') : value}
          onChange={(e) =>
            onChange(Array.isArray(value) ? e.target.value.split('\n') : e.target.value)
          }
        />
      ) : (
        <input
          type={name === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function StructuredEditor({
  resume,
  onChange,
}: {
  resume: Resume;
  onChange: (resume: Resume) => void;
}) {
  function move(section: SectionName, index: number, direction: number) {
    const entries = [...resume[section]];
    const next = index + direction;
    if (next < 0 || next >= entries.length) return;
    [entries[index], entries[next]] = [entries[next], entries[index]];
    onChange({ ...resume, [section]: entries });
  }
  return (
    <div className="structured-editor">
      <details open className="edit-section">
        <summary>
          <span>Profile</span>
          <span className="section-count">01</span>
        </summary>
        <div className="edit-section-body">
          <Field
            name="title"
            value={resume.title}
            onChange={(v) => onChange({ ...resume, title: v as string })}
          />
          {Object.entries(resume.profile).map(([key, value]) => (
            <Field
              key={key}
              name={key}
              value={value}
              onChange={(v) => onChange({ ...resume, profile: { ...resume.profile, [key]: v } })}
            />
          ))}
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={resume.metadata.sample}
              onChange={(e) =>
                onChange({ ...resume, metadata: { ...resume.metadata, sample: e.target.checked } })
              }
            />
            Label as fictional sample
          </label>
          <p className="fine-print">
            Remove the sample label only after replacing all illustrative information with your own.
          </p>
        </div>
      </details>
      {resume.sectionOrder.map((section, order) => (
        <details className="edit-section" key={section}>
          <summary>
            <span>{label(section)}</span>
            <span className="section-count">{resume[section].length}</span>
          </summary>
          <div className="edit-section-body">
            <div className="section-actions">
              <span>Section order</span>
              <button
                type="button"
                className="icon-button"
                disabled={order === 0}
                aria-label={`Move ${section} section up`}
                onClick={() => {
                  const next = [...resume.sectionOrder];
                  [next[order], next[order - 1]] = [next[order - 1], next[order]];
                  onChange({ ...resume, sectionOrder: next });
                }}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={order === 4}
                aria-label={`Move ${section} section down`}
                onClick={() => {
                  const next = [...resume.sectionOrder];
                  [next[order], next[order + 1]] = [next[order + 1], next[order]];
                  onChange({ ...resume, sectionOrder: next });
                }}
              >
                <ArrowDown size={14} />
              </button>
            </div>
            {resume[section].map((item, index) => (
              <details className="edit-entry" key={item.id} open>
                <summary>
                  {('title' in item
                    ? item.title
                    : 'organization' in item
                      ? item.organization
                      : 'institution' in item
                        ? item.institution
                        : 'name' in item
                          ? item.name
                          : item.category) || `Entry ${index + 1}`}
                </summary>
                <div className="entry-tools">
                  <span>ENTRY {String(index + 1).padStart(2, '0')}</span>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === 0}
                    aria-label={`Move ${section} entry ${index + 1} up`}
                    onClick={() => move(section, index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === resume[section].length - 1}
                    aria-label={`Move ${section} entry ${index + 1} down`}
                    onClick={() => move(section, index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label={`Delete ${section} entry ${index + 1}`}
                    onClick={() =>
                      onChange({
                        ...resume,
                        [section]: resume[section].filter((e) => e.id !== item.id),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {Object.entries(item)
                  .filter(([key]) => key !== 'id')
                  .map(([key, value]) => (
                    <Field
                      key={key}
                      name={key}
                      value={value as string | string[] | boolean}
                      onChange={(v) =>
                        onChange({
                          ...resume,
                          [section]: resume[section].map((entry) =>
                            entry.id === item.id ? { ...entry, [key]: v } : entry,
                          ),
                        })
                      }
                    />
                  ))}
              </details>
            ))}
            <button
              type="button"
              className="button add-entry"
              onClick={() =>
                onChange({ ...resume, [section]: [...resume[section], emptyEntry(section)] })
              }
            >
              <Plus size={14} />
              Add{' '}
              {section === 'experience'
                ? 'experience'
                : section === 'education'
                  ? 'education'
                  : section === 'skills'
                    ? 'skill group'
                    : section === 'projects'
                      ? 'project'
                      : 'certification'}
            </button>
          </div>
        </details>
      ))}
    </div>
  );
}
