/* global firebase */
/* eslint-disable no-undef */

importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCcbx6AwNxoY7qtUy4XtsNSlTA-c5qYj_M",
  authDomain: "blatinum-ec058.firebaseapp.com",
  projectId: "blatinum-ec058",
  storageBucket: "blatinum-ec058.firebasestorage.app",
  messagingSenderId: "931454591753",
  appId: "1:931454591753:web:903d2237be9a84b344e9d8",
  measurementId: "G-SL7M9L07P9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  try {
    const title = (payload && payload.notification && payload.notification.title) || 'إشعار جديد';
    const options = {
      body: (payload && payload.notification && payload.notification.body) || (payload && payload.data && payload.data.message) || '',
      icon: '/favicon.ico',
      data: payload?.data || {},
    };
    self.registration.showNotification(title, options);
  } catch (e) {
    // ignore
  }
});