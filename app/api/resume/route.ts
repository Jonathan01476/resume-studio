import { z } from 'zod';
import { apiError, requireOwner, sameOrigin, readJson } from '@/lib/auth';
import { repository } from '@/lib/db/repository';
import { validateResume } from '@/lib/resume/schema';
export async function GET() {
  try {
    await requireOwner();
    return Response.json({ resume: await repository().getResume('master') });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireOwner();
    const body = await readJson(request);
    if (body.action === 'publish') {
      const input = z
        .object({ id: z.string().uuid(), version: z.number().int().nonnegative() })
        .parse(body);
      return Response.json({ resume: await repository().publishResume(input.id, input.version) });
    }
    const resume = validateResume(body.resume);
    return Response.json({
      resume: await repository().saveDraft(resume, body.reason === 'ai' ? 'ai-approved' : 'manual'),
    });
  } catch (e) {
    return apiError(e);
  }
}
