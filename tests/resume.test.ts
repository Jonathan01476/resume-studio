import { describe, it, expect, vi } from 'vitest';
import { sampleResume } from '../lib/resume/sample-data';
import { resumeSchema } from '../lib/resume/schema';
import { changesBetween } from '../lib/resume/transformations';
import { identifyFile } from '../lib/ingestion/validate-file';
import { MockResumeAIProvider, HttpResumeAIProvider } from '../lib/ai/resume-ai';
describe('resume trust boundaries', () => {
  it('validates realistic sample data', () =>
    expect(resumeSchema.safeParse(sampleResume).success).toBe(true));
  it('rejects executable URLs and malformed dates', () => {
    const r = structuredClone(sampleResume);
    r.projects[0].github = 'javascript:alert(1)';
    expect(resumeSchema.safeParse(r).success).toBe(false);
    r.projects[0].github = 'https://example.com';
    r.experience[0].startDate = '2025-13';
    expect(resumeSchema.safeParse(r).success).toBe(false);
  });
  it('rejects duplicate section order and entry identities', () => {
    const r = structuredClone(sampleResume);
    r.sectionOrder[0] = 'projects';
    expect(resumeSchema.safeParse(r).success).toBe(false);
    r.sectionOrder = sampleResume.sectionOrder;
    r.projects[0].id = r.experience[0].id;
    expect(resumeSchema.safeParse(r).success).toBe(false);
  });
  it('rejects spoofed uploads and active image formats', () => {
    expect(() =>
      identifyFile(new TextEncoder().encode('<svg onload="alert(1)">'), 'image/png'),
    ).toThrow();
    expect(() => identifyFile(new TextEncoder().encode('<svg/>'), 'image/svg+xml')).toThrow();
    expect(identifyFile(new TextEncoder().encode('%PDF-1.7'), 'application/pdf')).toBe(
      'application/pdf',
    );
  });
  it('mock proposals do not mutate the current resume or invent facts', async () => {
    const before = structuredClone(sampleResume);
    const result = await new MockResumeAIProvider().updateResume({
      resume: sampleResume,
      instruction: 'Move certifications above projects',
      sources: [],
    });
    expect(sampleResume).toEqual(before);
    expect(result.resume.sectionOrder.indexOf('certifications')).toBeLessThan(
      result.resume.sectionOrder.indexOf('projects'),
    );
    expect(changesBetween(before, result.resume).map((c) => c.path)).toEqual(['sectionOrder']);
  });
  it('rejects provider output that changes identity or returns unsafe data', async () => {
    vi.stubEnv('AI_API_URL', 'https://provider.example/update');
    vi.stubEnv('AI_API_KEY', 'test');
    const invalid = structuredClone(sampleResume);
    invalid.slug = 'hijacked';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ resume: invalid }))),
    );
    await expect(
      new HttpResumeAIProvider().updateResume({
        resume: sampleResume,
        instruction: 'Improve',
        sources: [],
      }),
    ).rejects.toThrow('identity');
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
