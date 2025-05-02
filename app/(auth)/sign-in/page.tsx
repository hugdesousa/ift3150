"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);

    if (res?.error) setError(res.error);
    else window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Connexion</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <input
        name="email"
        type="email"
        required
        className="input"
        placeholder="Email"
      />
      <input
        name="password"
        type="password"
        required
        className="input"
        placeholder="Mot de passe"
      />

      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      {/* switch link */}
      <p className="pt-2 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/sign-up" className="text-amber-600 hover:underline">
          Inscription
        </Link>
      </p>
    </form>
  );
}
