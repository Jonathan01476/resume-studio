import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { localMode } from '../config';
import { supabase, AppError } from '../auth';
import { ResumeSource, sourceSchema } from '../ingestion/types';
export interface SourceStorage {
  put(owner: string, source: ResumeSource, bytes: Uint8Array): Promise<void>;
  get(owner: string, id: string): Promise<{ source: ResumeSource; bytes: Uint8Array }>;
}
const root = path.join(process.cwd(), '.local', 'sources');
class LocalSourceStorage implements SourceStorage {
  async put(owner: string, source: ResumeSource, bytes: Uint8Array) {
    const dir = path.join(root, owner);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, source.id), bytes);
    await writeFile(path.join(dir, `${source.id}.json`), JSON.stringify(source));
  }
  async get(owner: string, id: string) {
    const dir = path.join(root, owner);
    return {
      source: sourceSchema.parse(JSON.parse(await readFile(path.join(dir, `${id}.json`), 'utf8'))),
      bytes: new Uint8Array(await readFile(path.join(dir, id))),
    };
  }
}
class SupabaseSourceStorage implements SourceStorage {
  async put(_owner: string, source: ResumeSource, bytes: Uint8Array) {
    const db = await supabase();
    const bucket = db.storage.from('resume-sources');
    const { error } = await bucket.upload(source.storageKey, bytes, { contentType: source.mime });
    if (error) throw error;
    const manifest = await bucket.upload(`${source.storageKey}.json`, JSON.stringify(source), {
      contentType: 'application/json',
    });
    if (manifest.error) {
      await bucket.remove([source.storageKey]);
      throw manifest.error;
    }
  }
  async get(owner: string, id: string) {
    const db = await supabase();
    const key = `${owner}/${id}`;
    const bucket = db.storage.from('resume-sources');
    const { data: manifest, error: manifestError } = await bucket.download(`${key}.json`);
    if (manifestError) throw manifestError;
    const source = sourceSchema.parse(JSON.parse(await manifest.text()));
    const { data, error } = await bucket.download(key);
    if (error) throw error;
    return { source, bytes: new Uint8Array(await data.arrayBuffer()) };
  }
}
export function sourceStorage(): SourceStorage {
  return localMode() ? new LocalSourceStorage() : new SupabaseSourceStorage();
}
export function checkSourceId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    throw new AppError('Invalid attachment identifier.');
}
