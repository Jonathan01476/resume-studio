'use client';
import { useState } from 'react';
export function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const form = new FormData(e.currentTarget);
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          window.location.assign('/edit');
        } catch (e) {
          setError((e as Error).message);
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </label>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in →'}
      </button>
      <p className="fine-print">Owner access only. Accounts are managed in Supabase.</p>
    </form>
  );
}
