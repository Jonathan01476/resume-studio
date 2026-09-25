export function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
export function localMode() {
  return (
    !hasSupabase() &&
    !process.env.VERCEL &&
    (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEMO_MODE === 'true')
  );
}
