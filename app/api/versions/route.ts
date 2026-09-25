import { apiError, requireOwner } from '@/lib/auth';
import { repository } from '@/lib/db/repository';
export async function GET() {
  try {
    await requireOwner();
    const repo = repository();
    const resume = await repo.getResume('master');
    return Response.json({ versions: resume ? await repo.getVersions(resume.id) : [] });
  } catch (e) {
    return apiError(e);
  }
}
