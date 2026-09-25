import { z } from 'zod';
import { apiError, AppError, requireOwner, sameOrigin, readJson } from '@/lib/auth';
import { resumeSchema } from '@/lib/resume/schema';
import { aiProvider } from '@/lib/ai/resume-ai';
import { sourceStorage } from '@/lib/storage/repository';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const owner = await requireOwner();
    const body = z
      .object({
        resume: resumeSchema,
        instruction: z.string().min(1).max(8000),
        sourceIds: z.array(z.string().uuid()).max(5),
      })
      .parse(await readJson(request));
    if (/\b(?:create|make)\b.*\b(?:variant|version|copy)\b/i.test(body.instruction))
      throw new AppError(
        'Variant creation is not enabled yet. Your master resume will stay intact; edit a proposal here or export your data first.',
      );
    const sources = await Promise.all(
      body.sourceIds.map(async (id) => {
        const { source, bytes } = await sourceStorage().get(owner, id);
        return {
          ...source,
          ...(source.kind === 'image'
            ? { dataUrl: `data:${source.mime};base64,${Buffer.from(bytes).toString('base64')}` }
            : {}),
        };
      }),
    );
    return Response.json(
      await aiProvider().updateResume({
        resume: body.resume,
        instruction: body.instruction,
        sources,
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
