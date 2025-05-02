/* ------------------------------------------------------------------
   Notifications helpers  — insertion + Socket.IO + déclinaisons RDV
------------------------------------------------------------------- */
import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { getIO } from "@/lib/services/sockets/socket-server";

/* ---------- type commun ------------------------------------------ */
type Payload = {
  title: string;
  body: string;
  link?: string;
  senderName: string;
  senderAvatar: string | null;
};

/* ---------- persistance + émission --------------------------------*/
async function _insertAndEmit(
  room: string,
  data: Payload & {
    receiverType: "user" | "worker" | "guest";
    receiverId?: string | null;
    guestSessionId?: string | null;
  },
) {
  /* 1️⃣  DB ------------------------------------------------------- */
  const [rec] = await db.insert(notifications).values(data).returning();

  /* 2️⃣  temps-réel ---------------------------------------------- */
  const ns = getIO()?.of("/notifications");

  /* — toast ------------------------------------------------------ */
  ns?.to(room).emit("notification", rec);

  /* — badge (+1) ------------------------------------------------- */
  // si le lien est de la forme "/chat/<id>" on isole l'id,
  // sinon on passe null ; le client saura s’il doit incrémenter
  const id = data.link?.startsWith("/chat/") ? data.link.split("/")[2] : null;
  ns?.to(room).emit("unread:+1", { convId: id });
}

/* ---------- helpers destinataires -------------------------------- */
export const notifyUser = (userId: string, p: Payload) =>
  _insertAndEmit(`user:${userId}`, {
    receiverType: "user",
    receiverId: userId,
    ...p,
  });

export const notifyWorker = (workerId: string, p: Payload) =>
  _insertAndEmit(`worker:${workerId}`, {
    receiverType: "worker",
    receiverId: workerId,
    ...p,
  });

export const notifyGuest = (guestId: string, p: Payload) =>
  _insertAndEmit(`guest:${guestId}`, {
    receiverType: "guest",
    guestSessionId: guestId,
    ...p,
  });

/* ---------- RDV : helpers de haut niveau ------------------------- */
export function formatDate(d: Date) {
  return d.toLocaleString("fr-CA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const notifyAppointment = {
  requested(
    userId: string | null,
    guestId: string | null,
    { start }: { start: Date },
    sender: { name: string; avatar: string | null },
  ) {
    const p = {
      title: "Proposition de rendez-vous",
      body: `Proposé pour le ${formatDate(start)}`,
      link: "/my-appointments",
      senderName: sender.name,
      senderAvatar: sender.avatar,
    };
    if (userId) return notifyUser(userId, p);
    if (guestId) return notifyGuest(guestId, p);
  },

  confirmed(
    workerId: string,
    { start }: { start: Date },
    sender: { name: string; avatar: string | null },
  ) {
    return notifyWorker(workerId, {
      title: "Rendez-vous confirmé",
      body: `Confirmé pour le ${formatDate(start)}`,
      link: "/my-appointments",
      senderName: sender.name,
      senderAvatar: sender.avatar,
    });
  },

  cancelled(
    other: { userId?: string; guestId?: string; workerId?: string },
    { start }: { start: Date },
    sender: { name: string; avatar: string | null },
  ) {
    const base = {
      title: "Rendez-vous annulé",
      body: `Le RDV du ${formatDate(start)} a été annulé`,
      link: "/my-appointments",
      senderName: sender.name,
      senderAvatar: sender.avatar,
    };
    if (other.userId) return notifyUser(other.userId, base);
    if (other.guestId) return notifyGuest(other.guestId, base);
    if (other.workerId) return notifyWorker(other.workerId, base);
  },

  completed(
    userId: string | null,
    guestId: string | null,
    { start }: { start: Date },
    sender: { name: string; avatar: string | null },
  ) {
    const p = {
      title: "Comment s’est passé votre RDV ?",
      body: `Laissez un avis pour la prestation du ${formatDate(start)}`,
      link: "/my-appointments",
      senderName: sender.name,
      senderAvatar: sender.avatar,
    };
    if (userId) return notifyUser(userId, p);
    if (guestId) return notifyGuest(guestId, p);
  },
};
