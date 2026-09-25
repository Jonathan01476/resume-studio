import { apiError, requireOwner } from '@/lib/auth';
import { checkSourceId, sourceStorage } from '@/lib/storage/repository';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await requireOwner();
    const { id } = await params;
    checkSourceId(id);
    const { source, bytes } = await sourceStorage().get(owner, id);
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': source.mime,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(source.name)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
