import { Header } from '@/components/layout/Header';
import { hasSupabase } from '@/lib/config';
import { LoginForm } from '@/components/editor/LoginForm';
export default function Login() {
  return (
    <>
      <Header editor />
      <main id="main" className="login-main">
        <span className="eyebrow">YOUR DOCUMENT. YOUR WORKSPACE.</span>
        <h1>Welcome back.</h1>
        <p>Sign in to edit and publish your resume.</p>
        {hasSupabase() ? (
          <LoginForm />
        ) : (
          <div className="notice">
            The production editor is locked until Supabase and the owner account are configured. See
            the project README for setup.
          </div>
        )}
      </main>
    </>
  );
}
