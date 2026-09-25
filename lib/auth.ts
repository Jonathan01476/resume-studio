import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hasSupabase, localMode } from './config';
export async function supabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            /* Server components cannot refresh cookies; proxy does. */
          }
        },
      },
    },
  );
}
export async function owner() {
  if (localMode()) return 'local-owner';
  if (!hasSupabase() || !process.env.OWNER_USER_ID) return null;
  const client = await supabase();
  const { data, error } = await client.auth.getUser();
  return !error && data.user?.id === process.env.OWNER_USER_ID ? data.user.id : null;
}
export async function requireOwner() {
  const id = await owner();
  if (!id) throw new AppError('Sign in as the owner to continue.', 401);
  return id;
}
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  // Next's internal request URL may use localhost even when the browser used 127.0.0.1.
  // Host is the browser's target authority; browser scripts cannot forge it.
  let valid = false;
  try {
    const url = new URL(origin ?? '');
    const protocol = process.env.VERCEL ? 'https:' : new URL(request.url).protocol;
    valid = url.origin === origin && url.host === host && url.protocol === protocol;
  } catch {}
  if (!valid) throw new AppError('Request origin is not allowed.', 403);
}
export async function readJson(request: Request, limit = 500_000) {
  const reader = request.body?.getReader();
  if (!reader) throw new AppError('Request body is missing.');
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      throw new AppError('Request is too large.', 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AppError('Invalid JSON.');
  }
}
export function apiError(error: unknown) {
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error && typeof error === 'object' && 'issues' in error)
    return Response.json(
      { error: 'Some fields are invalid. Check dates, URLs, and required values.' },
      { status: 422 },
    );
  console.error('Request failed:', error instanceof Error ? error.message : 'Unknown error');
  return Response.json(
    {
      error:
        'This operation could not be completed. Your changes are still available; please retry.',
    },
    { status: 503 },
  );
}
