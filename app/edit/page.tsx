import { redirect } from 'next/navigation';
import { owner } from '@/lib/auth';
import { localMode } from '@/lib/config';
import { repository } from '@/lib/db/repository';
import { sampleResume } from '@/lib/resume/sample-data';
import { ResumeEditor } from '@/components/editor/ResumeEditor';
export const dynamic = 'force-dynamic';
export default async function Edit() {
  if (!(await owner())) redirect('/login');
  const repo = repository();
  const [draft, published] = await Promise.all([
    repo.getResume('master'),
    repo.getPublishedResume('master'),
  ]);
  return (
    <ResumeEditor
      initial={draft ?? structuredClone(sampleResume)}
      publishedVersion={published?.metadata.version ?? null}
      local={localMode()}
      aiEnabled={Boolean(process.env.AI_API_KEY && process.env.AI_API_URL)}
    />
  );
}
