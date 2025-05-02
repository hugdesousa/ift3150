/* =========================================================================
   app/components/Header.tsx — Header (logo | search | burger)
   ========================================================================= */
"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

import { UnreadContext } from "@/components/UnreadContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/utils";

interface HeaderProps {
  transparent?: boolean;
  fixed?: boolean;
  showSearchBar?: boolean;
  /** callback déclenché quand on clique sur l’icône Filtres */
  onOpenFilters?: () => void;
}

export default function Header({
  transparent = false,
  fixed = true,
  showSearchBar = false,
  onOpenFilters,
}: HeaderProps) {
  /* -------------------- session ------------------------------- */
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const unread = useContext(UnreadContext);

  const displayName =
    (user as any)?.full_name || (user as any)?.name || "Invité";
  const avatarUrl = (user as any)?.profile_image_url
    ? (user as any).profile_image_url.startsWith("http")
      ? (user as any).profile_image_url
      : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? ""}${
          (user as any).profile_image_url
        }`
    : (user as any)?.image || null;

  /* -------------------- local state ------------------------------- */
  const [searchOpen, setSearchOpen] = useState(showSearchBar);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loupeShift, setLoupeShift] = useState(0); // ← NEW

  const burgerRef = useRef<HTMLButtonElement>(null); // ← NEW
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* -------------------- click-outside ----------------------------- */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(e.target as Node)
      )
        setSearchOpen(false);
      if (
        menuPanelRef.current &&
        !menuPanelRef.current.contains(e.target as Node)
      )
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* -------------------- calc shift loupe -------------------------- */
  const computeShift = () => {
    if (burgerRef.current) {
      const burgerRight = burgerRef.current.getBoundingClientRect().right;
      const viewport = window.innerWidth;
      // Décalage négatif depuis la loupe jusqu’à 8 px avant le burger
      setLoupeShift(-(viewport - burgerRight - 8));
    }
  };

  useEffect(() => {
    if (searchOpen) computeShift();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    window.addEventListener("resize", computeShift);
    return () => window.removeEventListener("resize", computeShift);
  }, [searchOpen]);

  /* -------------------- handlers ---------------------------------- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };
  const closeMenu = () => setMenuOpen(false);

  /* -------------------- JSX --------------------------------------- */
  return (
    <header
      className={`w-full ${
        transparent ? "bg-transparent" : "bg-white"
      } ${fixed ? "fixed inset-x-0 top-0 z-50" : ""} shadow-sm`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Burger */}
        <button
          ref={burgerRef}
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-full p-1 hover:bg-gray-100"
          aria-label="Ouvrir le menu"
        >
          <Menu size={24} className="text-gray-600" />
        </button>

        {/* Logo HELPR */}
        <Link href="/" className="flex-1 text-center">
          <Image
            src="/icons/HELPR.svg"
            alt="HELPR"
            width={100}
            height={32}
            className="inline-block"
          />
        </Link>

        {/* Loupe */}
        <button
          onClick={() => setSearchOpen(true)}
          className="relative overflow-hidden rounded-full p-1 hover:bg-gray-100"
          aria-label="Rechercher"
        >
          <motion.span
            initial={false}
            animate={searchOpen ? { x: loupeShift } : { x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="block"
          >
            <Search size={24} className="text-gray-600" />
          </motion.span>
        </button>
      </div>

      {/* ================= FULL-WIDTH SEARCH OVERLAY ================= */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex items-center bg-white px-4"
            ref={searchPanelRef}
          >
            <form
              onSubmit={handleSearch}
              className="flex w-full items-center gap-2"
            >
              {/* Input + ligne animée */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                {/* Ligne orange */}
                <motion.div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-right bg-amber-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
                {/* X visible uniquement si texte */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Effacer"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filtres */}
              <button
                type="button"
                aria-label="Filtres"
                onClick={() => {
                  setSearchOpen(false); // ← ferme overlay
                  onOpenFilters?.(); // ← déclenche callback
                }}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.586a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z"
                  />
                </svg>
              </button>

              {/* Submit arrow */}
              <button
                type="submit"
                aria-label="Envoyer la recherche"
                className="rounded-full bg-amber-500 p-2 hover:bg-amber-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================== SLIDE-IN MENU ======================= */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu"
            ref={menuPanelRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed inset-0 z-40 flex"
          >
            <div className="flex w-64 flex-col bg-white p-6 shadow-lg">
              {/* Avatar + nom ou Invité */}
              <div className="mb-6 flex flex-col items-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="mb-2 rounded-full object-cover"
                  />
                ) : (
                  <Avatar className="mb-2 size-12">
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                )}
                <p className="text-sm font-medium text-gray-700">
                  {displayName}
                </p>
              </div>

              <nav className="flex-1 space-y-4 text-sm font-medium">
                <Link href="/" className="block" onClick={closeMenu}>
                  🏠 Accueil
                </Link>
                <Link href="/my-profile" className="block" onClick={closeMenu}>
                  👤 Mon profil
                </Link>
                <Link href="/chat" className="block" onClick={closeMenu}>
                  📨 Messages{unread > 0 && ` (${unread})`}
                </Link>
                <Link
                  href="/my-appointments"
                  className="block"
                  onClick={closeMenu}
                >
                  📅 Mes rendez-vous
                </Link>
                <Link href="/sign-up" className="block" onClick={closeMenu}>
                  🛠️ Devenir Helpr
                </Link>
              </nav>

              {!user ? (
                <>
                  <Link
                    href="/sign-in"
                    className="mt-6 block w-full text-left text-sm font-medium "
                    onClick={closeMenu}
                  >
                    🔑 Se connecter
                  </Link>
                  <Link
                    href="/sign-up"
                    className="my-6 block w-full text-left text-sm font-medium"
                    onClick={closeMenu}
                  >
                    ✍️ S’inscrire
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className="mt-6 block w-full text-left text-sm font-medium text-red-600"
                >
                  🚪 Se déconnecter
                </button>
              )}
            </div>
            <div className="flex-1 bg-black/20" onClick={closeMenu} />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
