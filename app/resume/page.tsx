import { repository } from '@/lib/db/repository';
import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
import { PrintButton } from '@/components/resume/PrintButton';
import { Header } from '@/components/layout/Header';
import { hasSupabase, localMode } from '@/lib/config';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function PublicResume() {
  let resume = null;
  let failed = false;
  if (hasSupabase() || localMode()) {
    try {
      resume = await repository().getPublishedResume('master');
    } catch {
      failed = true;
    }
  }
  return (
    <>
      <Header>{resume && <PrintButton />}</Header>
      <main id="main" className="public-main">
        {resume ? (
          <>
            <div className="document-toolbar web-only">
              <span className="status-dot" />
              <span>{resume.metadata.sample ? 'SAMPLE DOCUMENT' : 'LIVE DOCUMENT'}</span>
              <span className="toolbar-line" />
              <span>
                Last updated{' '}
                {new Date(resume.metadata.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </span>
            </div>
            <div className="document-frame">
              <aside className="document-rail web-only">
                <span>CAREER, IN CONTEXT.</span>
                <span>01 — 01</span>
              </aside>
              <ResumeRenderer resume={resume} />
            </div>
            <div className="public-footer web-only">
              <span>A document that grows with you.</span>
              <span>
                BUILT WITH FOLIO <span className="tiny-mark">f.</span>
              </span>
            </div>
          </>
        ) : (
          <div className="empty-page">
            <span className="eyebrow">FOLIO / RESUME</span>
            <h1>{failed ? 'Temporarily unavailable' : 'Your next chapter starts here.'}</h1>
            <p>
              {failed
                ? 'The published resume could not be loaded. Please try again shortly.'
                : 'No resume has been published yet. Open the studio to create your first draft.'}
            </p>
            <Link href="/edit" className="button primary">
              Open studio →
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
