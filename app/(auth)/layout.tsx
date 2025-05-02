/* =========================================================================
   app/(auth)/layout.tsx — layout responsive + mini-nav
   ========================================================================= */
"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); //  pour lien actif

  return (
    <main className="flex min-h-screen w-full flex-col md:grid md:grid-cols-2">
      {/* ILLUSTRATION (desktop) */}
      <section className="relative hidden overflow-hidden md:block">
        <Image
          src="/images/auth-ill.jpg"
          alt="Illustration"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 to-black/30" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-white">
          <Image
            src="/icons/bot-message.svg"
            alt="Helpr logo"
            width={200}
            height={200}
          />
          <h1 className="mt-4 text-4xl font-bold">Helpr</h1>
          <p className="mt-3 max-w-xs text-center text-gray-200">
            Trouvez un professionnel de confiance ou proposez vos services en un
            clic.
          </p>
        </div>
      </section>

      {/* FORMULAIRE + NAV */}
      <section className="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 md:p-10">
        {/* mini-nav  */}
        <nav className="absolute left-4 top-4 flex items-center gap-4 text-sm">
          <Link href="/" className="font-medium text-amber-600 hover:underline">
            Accueil
          </Link>
          <span className="hidden sm:inline">&bull;</span>
          <Link
            href="/sign-in"
            className={`hover:underline ${pathname === "/sign-in" ? "font-semibold" : ""}`}
          >
            Connexion
          </Link>
          <Link
            href="/sign-up"
            className={`hover:underline ${pathname === "/sign-up" ? "font-semibold" : ""}`}
          >
            Inscription
          </Link>
        </nav>

        {/* carte formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
        >
          {/* logo mobile */}
          <div className="mb-6 flex items-center justify-center gap-2 md:hidden">
            <Image
              src="/icons/bot-message.svg"
              alt="Helpr"
              width={48}
              height={48}
            />
            <span className="text-2xl font-semibold text-amber-600">Helpr</span>
          </div>

          {/* children = sign-in ou sign-up */}
          <div
            className="flex flex-col gap-4 [&_input]:h-10 [&_input]:w-full [&_input]:rounded-md
            [&_input]:border [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm
            [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-amber-500"
          >
            {children}
          </div>
        </motion.div>
      </section>

      {/* header illu mobile */}
      <section className="relative block h-40 w-full overflow-hidden md:hidden">
        <Image
          src="/images/auth-ill.jpg"
          alt="Illustration"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 to-black/30" />
      </section>
    </main>
  );
}
