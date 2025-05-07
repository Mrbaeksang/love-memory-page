// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBoxMxUIfcaO67P11OsS3jCcmYT0t5dDDU",
  authDomain: "love-memory-push.firebaseapp.com",
  projectId: "love-memory-push",
  storageBucket: "love-memory-push.appspot.com",
  messagingSenderId: "861952693060",
  appId: "1:861952693060:web:4bf85d605818118dc37d11",
  measurementId: "G-WSNH7RVY33",
});

const messaging = firebase.messaging();

// ✅ 백그라운드 메시지 수신 핸들러 (이게 진짜 핵심!)
messaging.onBackgroundMessage(function (payload) {
  console.log("📦 백그라운드 메시지 수신:", payload);

  const { title, body, icon, click_action } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: icon || "/icon-512.png",
    data: {
      url: click_action || "/",
    },
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
