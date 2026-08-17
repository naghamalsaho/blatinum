import { http } from "@/shared/api/http"; // استخدمي المسار المعتمد لديكِ لـ Axios instance

/**
 * ==========================================
 * 1. إدارة توكنات الأجهزة (Device Tokens)
 * ==========================================
 */

/**
 * تسجيل FCM Token الخاص بالجهاز في السيرفر
 * @param {string} fcmToken - توكن Firebase الخاص بالجهاز
 * @param {string} deviceType - نوع الجهاز (web, ios, android)
 */
export const registerDeviceTokenApi = async (fcmToken, deviceType = "web") => {
  const formData = new FormData();
  formData.append("fcm_token", fcmToken);
  formData.append("device_type", deviceType);

  const response = await http.post("/device-tokens", formData);
  return response.data;
};

/**
 * حذف FCM Token من السيرفر (يُستدعى عند تسجيل الخروج Logout)
 * @param {string} fcmToken - التوكن المراد حذفه
 */
export const deleteDeviceTokenApi = async (fcmToken) => {
  const response = await http.delete("/device-tokens", {
    data: { fcm_token: fcmToken },
  });
  return response.data;
};

/**
 * ==========================================
 * 2. إدارة قائمة وحالة الإشعارات (Notifications)
 * ==========================================
 */

/**
 * جلب قائمة الإشعارات الخاصة بالمستخدم الحالي
 * @param {Object} params - خيارات البحث أو الترقيم (e.g. { page: 1, limit: 10 })
 */
export const getNotificationsApi = async (params = {}) => {
  const response = await http.get("/notifications", { params });
  return response.data;
};

/**
 * جلب عدد الإشعارات غير المقروءة فقط (لإظهاره فوق جرس الإشعارات)
 */
export const getUnreadNotificationsCountApi = async () => {
  const response = await http.get("/notifications/unread-count");
  return response.data;
};

/**
 * تحديد إشعار معين كمقروء
 * @param {string|number} notificationId - معرف الإشعار
 */
export const markNotificationAsReadApi = async (notificationId) => {
  const response = await http.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * تحديد جميع الإشعارات كمقروءة دفعة واحدة
 */
export const markAllNotificationsAsReadApi = async () => {
  const response = await http.patch("/notifications/read-all");
  return response.data;
};