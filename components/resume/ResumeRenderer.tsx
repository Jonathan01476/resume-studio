import { ArrowUpRight, MapPin } from 'lucide-react';
import { Resume, SectionName, safeUrl } from '@/lib/resume/schema';
import { Details } from './Details';
const titles: Record<SectionName, string> = {
  experience: 'Experience',
  projects: 'Selected projects',
  education: 'Education',
  skills: 'Technical skills',
  certifications: 'Certifications',
};
function date(value: string) {
  if (!value) return '';
  const [year, month] = value.split('-');
  return month
    ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1]} ${year}`
    : year;
}
function External({ href, children }: { href: string; children: React.ReactNode }) {
  return href && safeUrl.safeParse(href).success ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={12} className="web-only" />
    </a>
  ) : null;
}
function Technologies({ items }: { items: string[] }) {
  return items.length ? <p className="technologies">{items.join(' / ')}</p> : null;
}
export function ResumeRenderer({ resume, preview = false }: { resume: Resume; preview?: boolean }) {
  const { profile } = resume;
  return (
    <article className="resume-document" aria-label={`${profile.name} resume`}>
      <div className="document-kicker">
        <span>
          <i /> ELECTRONIC RESUME
        </span>
        <span>
          {resume.metadata.sample ? 'FICTIONAL SAMPLE' : 'CAREER PROFILE'}{' '}
          <span className="kicker-version">
            / V{String(resume.metadata.version).padStart(2, '0')}
          </span>
        </span>
      </div>
      <header className="document-header">
        <h1>{profile.name}</h1>
        <p className="headline">{profile.headline}</p>
        <div className="contact-line">
          {profile.location && (
            <span>
              <MapPin size={12} />
              {profile.location}
            </span>
          )}
          {profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
          {profile.phone && <span>{profile.phone}</span>}
          {profile.website && <External href={profile.website}>Website</External>}
          {profile.github && <External href={profile.github}>GitHub</External>}
          {profile.linkedin && <External href={profile.linkedin}>LinkedIn</External>}
        </div>
        {profile.summary && <p className="summary">{profile.summary}</p>}
      </header>
      {resume.sectionOrder.map(
        (section, index) =>
          resume[section].length > 0 && (
            <section className="resume-section" key={section} id={preview ? undefined : section}>
              <h2>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {titles[section]}
                <i />
              </h2>
              <div className="section-content">
                {section === 'experience' &&
                  resume.experience.map((item) => (
                    <div className="resume-entry" key={item.id}>
                      <div className="entry-heading">
                        <h3>{item.position || 'Position'}</h3>
                        <span className="date">
                          {date(item.startDate)}
                          {item.startDate && (item.current || item.endDate) ? ' — ' : ''}
                          {item.current ? 'Present' : date(item.endDate)}
                        </span>
                      </div>
                      <div className="entry-subtitle">
                        <span>{item.organization}</span>
                        {item.location && <span>{item.location}</span>}
                      </div>
                      {item.bullets.length > 0 && (
                        <ul>
                          {item.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                      <div className="entry-bottom">
                        <Technologies items={item.technologies} />
                        {(item.details || item.url) && (
                          <Details title={item.position} label="More">
                            <p>{item.details}</p>
                            <Technologies items={item.technologies} />
                            <External href={item.url}>Organization</External>
                          </Details>
                        )}
                      </div>
                    </div>
                  ))}
                {section === 'projects' &&
                  resume.projects.map((item) => (
                    <div className="resume-entry project-entry" key={item.id}>
                      <div className="entry-heading">
                        <h3>{item.title}</h3>
                        <Details title={item.title}>
                          <p className="panel-lead">{item.description}</p>
                          {item.longDescription && <p>{item.longDescription}</p>}
                          {item.architecture && (
                            <>
                              <h3>How it works</h3>
                              <p className="architecture">{item.architecture}</p>
                            </>
                          )}
                          {item.bullets.length > 0 && (
                            <ul>
                              {item.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                          <Technologies items={item.technologies} />
                          {item.images
                            .filter((url) => url && safeUrl.safeParse(url).success)
                            .map((url, i) => (
                              <a href={url} key={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt={`${item.title} screenshot ${i + 1}`}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              </a>
                            ))}
                          <div className="panel-links">
                            <External href={item.github}>Source code</External>
                            <External href={item.liveUrl}>Live project</External>
                          </div>
                        </Details>
                      </div>
                      <p className="project-description">{item.description}</p>
                      {item.bullets.length > 0 && (
                        <ul>
                          {item.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                      <Technologies items={item.technologies} />
                      <div className="print-only">
                        {item.github && <span>{item.github} </span>}
                        {item.liveUrl && <span>{item.liveUrl}</span>}
                      </div>
                    </div>
                  ))}
                {section === 'education' &&
                  resume.education.map((item) => (
                    <div className="resume-entry" key={item.id}>
                      <div className="entry-heading">
                        <h3>{item.institution}</h3>
                        <span className="date">
                          {date(item.startDate)}
                          {item.startDate && item.endDate ? ' — ' : ''}
                          {date(item.endDate)}
                        </span>
                      </div>
                      <p className="education-degree">
                        {[item.degree, item.major].filter(Boolean).join(' in ')}
                        {item.minor ? ` · Minor in ${item.minor}` : ''}
                      </p>
                      {item.location && <p className="education-location">{item.location}</p>}
                      {item.coursework.length > 0 && (
                        <p className="coursework">{item.coursework.join(' · ')}</p>
                      )}
                      {item.achievements.length > 0 && (
                        <ul>
                          {item.achievements.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                {section === 'skills' && (
                  <dl className="skill-list">
                    {resume.skills.map((item) => (
                      <div key={item.id}>
                        <dt>{item.category}</dt>
                        <dd>{item.items.join(' · ')}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {section === 'certifications' &&
                  resume.certifications.map((item) => (
                    <div className="resume-entry certification" key={item.id}>
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {item.issuer}
                          {item.issueDate ? ` / ${date(item.issueDate)}` : ''}
                        </p>
                      </div>
                      <Details title={item.name} label="Credential">
                        <dl className="credential-details">
                          <dt>Issuer</dt>
                          <dd>{item.issuer}</dd>
                          <dt>Issued</dt>
                          <dd>{date(item.issueDate) || 'Not provided'}</dd>
                          <dt>Credential ID</dt>
                          <dd>{item.credentialId || 'Not provided'}</dd>
                        </dl>
                        <p>{item.description}</p>
                        <External href={item.credentialUrl}>Verify credential</External>
                      </Details>
                    </div>
                  ))}
              </div>
            </section>
          ),
      )}
      <footer className="document-footer">
        <span>
          {resume.metadata.sample
            ? 'ILLUSTRATIVE DATA · NOT REAL CREDENTIALS'
            : 'DESIGNED FOR THE WEB. READY FOR PAPER.'}
        </span>
        <span>
          {profile.name
            .split(' ')
            .map((s) => s[0])
            .join('')
            .slice(0, 3)}{' '}
          / {new Date(resume.metadata.updatedAt).getUTCFullYear()}
        </span>
      </footer>
    </article>
  );
}
