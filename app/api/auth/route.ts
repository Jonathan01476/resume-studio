import { z } from 'zod';
import { apiError, AppError, sameOrigin, supabase, readJson } from '@/lib/auth';
import { hasSupabase } from '@/lib/config';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!hasSupabase() || !process.env.OWNER_USER_ID)
      throw new AppError('Authentication is not configured.', 503);
    const body = z
      .object({ email: z.email(), password: z.string().min(8).max(512) })
      .parse(await readJson(request, 4096));
    const db = await supabase();
    const { data, error } = await db.auth.signInWithPassword(body);
    if (error || data.user?.id !== process.env.OWNER_USER_ID) {
      await db.auth.signOut();
      throw new AppError('Unable to sign in with these credentials.', 401);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const db = await supabase();
    await db.auth.signOut();
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
