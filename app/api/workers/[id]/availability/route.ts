/* =========================================================================
   app/api/workers/[id]/availability/route.ts
   ========================================================================= */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { workers, appointments } from "@/database/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

/* ---------- validation ---------- */
const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type Slot = { dayOfWeek: number; start: string; end: string };
type Availability = { weekly: Slot[]; exceptions?: string[] };

/* ========================================================================= */
export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    /* --- params & query -------------------------------------------- */
    const { id: workerId } = await ctx.params; // ⬅️  attendre params
    if (!workerId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const dateParam = req.nextUrl.searchParams.get("date") ?? "";
    const parsed = querySchema.safeParse({ date: dateParam });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format date invalide (YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    const { date } = parsed.data;

    /* --- profil worker --------------------------------------------- */
    const row = await db.query.workers.findFirst({
      where: eq(workers.id, workerId),
      columns: { availability: true },
    });
    if (!row) {
      return NextResponse.json(
        { error: "Travailleur introuvable" },
        { status: 404 },
      );
    }

    const avail: Availability =
      typeof row.availability === "string"
        ? JSON.parse(row.availability)
        : (row.availability as Availability);

    /* --- blocs pour le jour demandé ------------------------------- */
    const jsDay = new Date(`${date}T12:00:00`).getDay(); // 0=Dim … 6=Sam
    const dayBlocks = avail.weekly.filter((b) => {
      const d = Number((b as any).dayOfWeek ?? (b as any).day);
      return d === jsDay;
    });
    if (!dayBlocks.length) return NextResponse.json({ slots: [] });

    /* --- génère toutes les heures sur ces blocs -------------------- */
    const rawSlots = dayBlocks.flatMap((b) => {
      const hStart = parseInt(b.start.split(":")[0], 10);
      const hEnd = parseInt(b.end.split(":")[0], 10);
      return Array.from(
        { length: hEnd - hStart },
        (_, i) => `${String(hStart + i).padStart(2, "0")}:00`,
      );
    });

    /* --- retire les rendez-vous existants -------------------------- */
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const taken = await db.query.appointments.findMany({
      where: and(
        eq(appointments.worker_id, workerId),
        gte(appointments.start_time, dayStart),
        lt(appointments.start_time, dayEnd),
      ),
      columns: { start_time: true },
    });

    const booked = taken.map(
      (a) => `${String(a.start_time.getHours()).padStart(2, "0")}:00`,
    );

    const slots = rawSlots.filter((s) => !booked.includes(s));

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("availability API error →", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
