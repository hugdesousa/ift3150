// // lib/fcm-server.ts
// import admin from "firebase-admin";
//
// const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_B64
//   ? JSON.parse(
//       Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString(
//         "utf8",
//       ),
//     )
//   : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
//
// if (!admin.apps.length) {
//   admin.initializeApp({ credential: admin.credential.cert(credentials) });
// }
//
// export const fcm = admin.messaging();
