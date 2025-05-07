// public/firebase-messaging-sw.js

// ✅ Firebase 초기화용 import
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

// ✅ 커스텀 알림 형태와 클릭 동작
self.addEventListener("push", (event) => {
  const data = event.data?.json();
  if (!data) return;

  const { title, body, icon, click_action } = data.notification;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      data: { url: click_action },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  );
});
