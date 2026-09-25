import 'server-only';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resume, validateResume } from '../resume/schema';
import { sampleResume } from '../resume/sample-data';
import type { ResumeRepository, ResumeVersion } from './repository';
import { AppError } from '../auth';
type State = { draft: Resume; published: Resume | null; versions: ResumeVersion[] };
const directory = path.join(process.cwd(), '.local');
const file = path.join(directory, 'resume.json');
// Serialize mutations inside the single local development process; atomic rename avoids partial writes.
const globalQueue = globalThis as typeof globalThis & { resumeWrites?: Promise<unknown> };
function transaction<T>(work: () => Promise<T>): Promise<T> {
  const next = (globalQueue.resumeWrites ?? Promise.resolve()).then(work, work);
  globalQueue.resumeWrites = next.catch(() => {});
  return next;
}
async function read(): Promise<State> {
  try {
    const state = JSON.parse(await readFile(file, 'utf8')) as State;
    state.draft = validateResume(state.draft);
    if (state.published) state.published = validateResume(state.published);
    state.versions = state.versions.map((v) => ({ ...v, resume: validateResume(v.resume) }));
    return state;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT')
      return {
        draft: structuredClone(sampleResume),
        published: structuredClone(sampleResume),
        versions: [],
      };
    throw e;
  }
}
async function write(state: State) {
  await mkdir(directory, { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2));
  await rename(temporary, file);
}
export class LocalResumeRepository implements ResumeRepository {
  async getPublishedResume(slug: string) {
    const state = await read();
    return state.published?.slug === slug ? state.published : null;
  }
  async getResume(slug: string) {
    const state = await read();
    return state.draft.slug === slug ? state.draft : null;
  }
  async saveDraft(input: Resume, reason = 'manual') {
    return transaction(async () => {
      const resume = validateResume(input);
      const state = await read();
      if (resume.id !== state.draft.id || resume.slug !== state.draft.slug)
        throw new AppError('Resume identity cannot change.');
      if (resume.metadata.version !== state.draft.metadata.version)
        throw new AppError(
          'A newer draft exists. Reload before saving to avoid overwriting it.',
          409,
        );
      state.versions.unshift({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        reason,
        resume: state.draft,
      });
      state.draft = validateResume({
        ...resume,
        metadata: {
          ...state.draft.metadata,
          sample: resume.metadata.sample,
          updatedAt: new Date().toISOString(),
          version: state.draft.metadata.version + 1,
        },
      });
      await write(state);
      return state.draft;
    });
  }
  async publishResume(id: string, expectedVersion: number) {
    return transaction(async () => {
      const state = await read();
      if (state.draft.id !== id) throw new AppError('Resume not found.', 404);
      if (state.draft.metadata.version !== expectedVersion)
        throw new AppError('The draft changed. Reload and review it before publishing.', 409);
      state.versions.unshift({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        reason: 'publish',
        resume: state.draft,
      });
      state.published = validateResume(state.draft);
      await write(state);
      return state.published;
    });
  }
  async getVersions(id: string) {
    return (await read()).versions.filter((v) => v.resume.id === id).slice(0, 20);
  }
}
