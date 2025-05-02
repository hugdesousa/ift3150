// // app/api/push-token/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/database/drizzle";
// import { pushTokens, guestPushTokens } from "@/database/schema";
// import { auth } from "@/auth";
//
// export async function POST(req: NextRequest) {
//   const { token } = await req.json();
//   if (!token) return NextResponse.json({}, { status: 400 });
//
//   const session = await auth();
//   const guestId = req.cookies.get("guest_token")?.value ?? null;
//
//   if (session?.user?.id) {
//     await db
//       .insert(pushTokens)
//       .values({ userId: session.user.id, token })
//       .onConflictDoNothing();
//   } else if (guestId) {
//     await db
//       .insert(guestPushTokens)
//       .values({ guestSessionId: guestId, token })
//       .onConflictDoNothing();
//   } else {
//     return NextResponse.json({}, { status: 401 });
//   }
//
//   return NextResponse.json({ ok: true });
// }
