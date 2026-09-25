import 'server-only';
import { Resume } from '../resume/schema';
import { localMode, hasSupabase } from '../config';
import { LocalResumeRepository } from './local-repository';
import { SupabaseResumeRepository } from './supabase-repository';
export interface ResumeVersion {
  id: string;
  createdAt: string;
  reason: string;
  resume: Resume;
}
export interface ResumeRepository {
  getPublishedResume(slug: string): Promise<Resume | null>;
  getResume(slug: string): Promise<Resume | null>;
  saveDraft(resume: Resume, reason?: string): Promise<Resume>;
  publishResume(id: string, expectedVersion: number): Promise<Resume>;
  getVersions(id: string): Promise<ResumeVersion[]>;
}
export function repository(): ResumeRepository {
  if (hasSupabase()) return new SupabaseResumeRepository();
  if (localMode()) return new LocalResumeRepository();
  throw new Error('Persistence is not configured.');
}
