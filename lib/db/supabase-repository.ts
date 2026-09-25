import 'server-only';
import { AppError, supabase } from '../auth';
import { Resume, validateResume } from '../resume/schema';
import type { ResumeRepository, ResumeVersion } from './repository';
export class SupabaseResumeRepository implements ResumeRepository {
  async getPublishedResume(slug: string) {
    const db = await supabase();
    const { data, error } = await db
      .from('published_resumes')
      .select('data')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data ? validateResume(data.data) : null;
  }
  async getResume(slug: string) {
    const db = await supabase();
    const { data, error } = await db.from('resumes').select('draft').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? validateResume(data.draft) : null;
  }
  async saveDraft(input: Resume, reason = 'manual') {
    const resume = validateResume(input);
    const db = await supabase();
    const { data, error } = await db.rpc('save_resume_draft', {
      payload: resume,
      expected_version: resume.metadata.version,
      save_reason: reason,
    });
    if (error) {
      if (error.message.includes('conflict'))
        throw new AppError('A newer draft exists. Reload before saving.', 409);
      throw error;
    }
    return validateResume(data);
  }
  async publishResume(id: string, expectedVersion: number) {
    const db = await supabase();
    const { data, error } = await db.rpc('publish_resume', {
      resume_id: id,
      expected_version: expectedVersion,
    });
    if (error) {
      if (error.message.includes('conflict'))
        throw new AppError('The draft changed. Reload before publishing.', 409);
      throw error;
    }
    return validateResume(data);
  }
  async getVersions(id: string): Promise<ResumeVersion[]> {
    const db = await supabase();
    const { data, error } = await db
      .from('resume_versions')
      .select('id,created_at,reason,data')
      .eq('resume_id', id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((v) => ({
      id: v.id,
      createdAt: v.created_at,
      reason: v.reason,
      resume: validateResume(v.data),
    }));
  }
}
