// import admin from "firebase-admin";
// import { db } from "@/database/drizzle";
// import { pushTokens } from "@/database/schema";
// import { eq } from "drizzle-orm";
//
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(
//       JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!),
//     ),
//   });
// }
//
// /**
//  * Envoie une notification Web Push / FCM.
//  *
//  * @param userId  Destinataire (id users)
//  * @param title   Titre de la notif
//  * @param body    Corps (90 car. max)
//  * @param url     Lien absolu à ouvrir (https://…)
//  * @param ttlSec  Validité (secondes) – défaut : 1 h
//  */
// export async function notifyUser(
//   userId: string,
//   title: string,
//   body: string,
//   url: string,
//   ttlSec = 3600,
// ) {
//   // 1) Récupère tous les tokens actifs de l’utilisateur
//   const tokens = await db
//     .select({ token: pushTokens.token })
//     .from(pushTokens)
//     .where(eq(pushTokens.userId, userId));
//
//   // 2) Si l’utilisateur a au moins un token, envoie la notif
//   if (tokens.length) {
//     await admin.messaging().sendEachForMulticast({
//       tokens: tokens.map((t) => t.token),
//
//       // 1) titre + corps seulement
//       notification: { title, body },
//
//       // 2) partie Web Push avec le lien
//       webpush: {
//         headers: { TTL: `${ttlSec}` },
//         fcmOptions: {
//           // ← pour Chrome, Edge, etc.
//           link: url,
//         },
//         notification: {
//           // ← pour Safari iOS / macOS
//           click_action: url,
//         },
//       },
//
//       // 3) facultatif : passer aussi l’URL dans data
//       data: { url },
//     });
//   } else {
//     // Aucun token FCM enregistré : on log seulement (pas de fallback SMS)
//     console.info(
//       `[notifyUser] Aucun token push pour user ${userId}. Notification ignorée.`,
//     );
//   }
// }
