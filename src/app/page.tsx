"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";

export default function Home() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    return createClient(url, key);
  }, []);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [diag, setDiag] = useState<string>("");

  const onSignIn = async () => {
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setStatus(error ? `Error: ${error.message}` : "Check your email for a magic link.");
  };

  const onDiagnose = async () => {
    try {
      const url = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ?? "";
      const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ?? "";
      const res = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      setDiag(`GET /auth/v1/settings → ${res.status}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setDiag(`Diag error: ${message}`);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Isekai</h1>
        <p className="text-sm text-[var(--color-muted)]">Sign in to get started.</p>
      </header>

      <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
        <label className="mb-2 block text-sm">Email</label>
        <input
          className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={onSignIn}
          className="mt-3 inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
        >
          Send magic link
        </button>
        {status && <p className="mt-2 text-sm">{status}</p>}
        <button onClick={onDiagnose} className="mt-3 text-xs underline opacity-70">Run connection test</button>
        {diag && <p className="mt-1 text-xs opacity-80">{diag}</p>}
      </div>
    </div>
  );
}
