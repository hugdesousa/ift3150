/* =========================================================================
   app/(root)/search/page.tsx — aucun accès à searchParams
   ========================================================================= */
import SearchClient from "./SearchClient";

export default function Page() {
  return <SearchClient />; /* pas de prop */
}
