'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '../../components/form/PasswordInput';
import { login } from '../../services/auth.api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      await login({ identifier, password });
      router.replace('/app/network');
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not log in.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-white">
      <form
        className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold">Login</h1>

        {error ? (
          <div className="mt-5 whitespace-pre-line rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <label className="mt-6 block text-sm text-slate-300">
          <span className="mb-2 block text-slate-400">Email or Phone</span>
          <input
            className="input"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm text-slate-300">
          <span className="mb-2 block text-slate-400">Password</span>
          <PasswordInput
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <Link
          className="mt-4 block text-center text-sm text-slate-400 hover:text-white"
          href="/"
        >
          Back
        </Link>
      </form>
    </main>
  );
}
