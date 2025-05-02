// importScripts(
//   "https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js",
// );
// importScripts(
//   "https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js",
// );
//
// firebase.initializeApp({
//   apiKey: "AIzaSyDoiKXjWoXCUmwHEiH8Ck2eKAKjkM4HIp0",
//   authDomain: "helpr-15bfd.firebaseapp.com",
//   projectId: "helpr-15bfd",
//   messagingSenderId: "552423866034",
//   appId: "1:552423866034:web:61981cb00ff65e914513ab",
// });
//
// const messaging = firebase.messaging();
//
// messaging.onBackgroundMessage(({ notification }) => {
//   self.registration.showNotification(notification.title, {
//     body: notification.body,
//     icon: "/icons/HELPR.svg",
//     data: { url: notification.click_action },
//   });
// });
//
// self.addEventListener("notificationclick", (e) => {
//   e.notification.close();
//   clients.openWindow(e.notification.data.url);
// });
