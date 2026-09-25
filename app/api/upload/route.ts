import { apiError, AppError, requireOwner, sameOrigin } from '@/lib/auth';
import { identifyFile, MAX_FILE_BYTES } from '@/lib/ingestion/validate-file';
import { extractPdf } from '@/lib/ingestion/pdf';
import { validateImage } from '@/lib/ingestion/image';
import { sourceStorage } from '@/lib/storage/repository';
import { sourceSchema } from '@/lib/ingestion/types';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const owner = await requireOwner();
    // Limit streamed request before multipart parsing (including absent/forged Content-Length).
    const reader = request.body?.getReader();
    if (!reader) throw new AppError('Choose a file.');
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_FILE_BYTES + 65536) {
        await reader.cancel();
        throw new AppError('Files must be smaller than 3 MB.', 413);
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
    }).formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new AppError('Choose a file.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    let mime: string;
    try {
      mime = identifyFile(bytes, file.type);
    } catch (e) {
      throw new AppError((e as Error).message);
    }
    const id = crypto.randomUUID();
    let text = '';
    let status = 'ready';
    let message = 'Ready for interpretation.';
    const kind = mime === 'application/pdf' ? 'pdf' : mime.startsWith('image/') ? 'image' : 'text';
    if (kind === 'pdf') {
      try {
        text = await extractPdf(bytes.slice());
        if (!text) {
          status = 'extraction-failed';
          message = 'No text found. This may be a scanned PDF; attach an image or paste the text.';
        }
      } catch {
        status = 'extraction-failed';
        message =
          'Text could not be extracted. The original is preserved; try an unlocked PDF or paste the text.';
      }
    }
    if (kind === 'text') text = new TextDecoder().decode(bytes).slice(0, 60000);
    if (kind === 'image') {
      await validateImage(bytes);
      status = 'needs-vision';
      message = 'Image preserved. Interpretation requires a vision-capable AI provider.';
    }
    const source = sourceSchema.parse({
      id,
      name: file.name.slice(0, 255),
      kind,
      mime,
      text,
      status,
      message,
      storageKey: `${owner}/${id}`,
    });
    await sourceStorage().put(owner, source, bytes);
    return Response.json({ source });
  } catch (e) {
    return apiError(e);
  }
}
