import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCcbx6AwNxoY7qtUy4XtsNSlTA-c5qYj_M",
  authDomain: "blatinum-ec058.firebaseapp.com",
  projectId: "blatinum-ec058",
  storageBucket: "blatinum-ec058.firebasestorage.app",
  messagingSenderId: "931454591753",
  appId: "1:931454591753:web:903d2237be9a84b344e9d8",
  measurementId: "G-SL7M9L07P9"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// 🔑 مفتاح VAPID الذي نسختيه
const VAPID_KEY = "BOezG6g9EhcdznarOMSZ1GxXHMD_h-94h3mM6lfts3LFehM_LN2di1NHnu0GvRNOaaZbFlx9czDSnwsdcaQSerU";

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      // تأكد من تسجيل Service Worker المخصص أولاً (حتى لا يعيد السيرفر إرسال index.html)
      let swRegistration = null;
      try {
        if ('serviceWorker' in navigator) {
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }
      } catch (regErr) {
        console.warn('فشل تسجيل الـ Service Worker:', regErr);
      }

      // 💡 مررنا الآن تسجيل الـ SW كخيار إلى getToken للحصول على توكن صالح
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });
      
      if (currentToken) {
        console.log("تم استخراج FCM Token بنجاح:", currentToken);
        return currentToken;
      } else {
        console.log("لم نتمكن من الحصول على التوكن.");
      }
    } else {
      console.log("تم رفض الإذن بالإشعارات.");
    }
  } catch (err) {
    console.error("حدث خطأ أثناء جلب التوكن:", err);
  }
};

// Legacy helper that resolves once — kept for compatibility but not ideal for continuous listening.
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// Preferred: subscribe to foreground messages with a callback and receive an unsubscribe function
export const subscribeToForegroundMessages = (callback) => {
  if (typeof callback !== "function") return () => {};
  // onMessage returns an unsubscribe function
  const unsubscribe = onMessage(messaging, (payload) => {
    try {
      callback(payload);
    } catch (e) {
      console.warn("subscribeToForegroundMessages callback error", e);
    }
  });
  return unsubscribe || (() => {});
};