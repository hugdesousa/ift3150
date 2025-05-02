// "use client";
// import { useEffect } from "react";
// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";
//
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
// };
//
// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);
//
// export function useFCM() {
//   useEffect(() => {
//     (async () => {
//       if (!("serviceWorker" in navigator)) return;
//       if (Notification.permission !== "granted") {
//         const perm = await Notification.requestPermission();
//         if (perm !== "granted") return;
//       }
//
//       const reg = await navigator.serviceWorker.register(
//         "/firebase-messaging-sw.js",
//         { type: "classic" },
//       );
//
//       const token = await getToken(messaging, {
//         vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID!,
//         serviceWorkerRegistration: reg,
//       });
//
//       await fetch("/api/push-token", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token }),
//       });
//
//       onMessage(messaging, (payload) =>
//         console.log("FCM foreground:", payload),
//       );
//     })();
//   }, []);
// }
