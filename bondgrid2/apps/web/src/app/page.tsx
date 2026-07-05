import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-white">
      <section className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Bond<span className="text-blue-500">Grid</span>
        </h1>

        <div className="mt-10 grid gap-4">
          <Link
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
            href="/login"
          >
            Login
          </Link>

          <Link
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-900"
            href="/admin-signup"
          >
            Admin Signup
          </Link>
        </div>
      </section>
    </main>
  );
}
