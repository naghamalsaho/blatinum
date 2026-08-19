import PropTypes from "prop-types";
<<<<<<< HEAD
import {
  Bell,
  ChevronDown,
  Search,
  SunMedium,
  Moon,
  PanelsTopLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
=======
import { ChevronDown, Search, SunMedium, Moon, PanelsTopLeft } from "lucide-react";
>>>>>>> 7bad699 (save local work before pulling latest changes)
import { useTheme } from "../../theme/useTheme";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLanguage, setLanguage, t } from "@/shared/i18n";
import { getAssignedWorkspaces } from "@/shared/auth/workspaces";
import {
  requestForToken,
  subscribeToForegroundMessages,
} from "@/shared/utils/firebase/firebase";
import toast from "react-hot-toast";
import {
  registerDeviceTokenApi,
  getNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from "@/shared/api/notifications.api";

// دالة تشغيل صوت التنبيه
const playNotificationTone = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      return;
    }

    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch(() => {});
  } catch (err) {
    console.warn("خطأ في تشغيل صوت الإشعار:", err);
  }
};

export default function Topbar({
  title = "",
  subtitle = "",
  searchPlaceholder = "Search...",
  actions = [],
}) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const ThemeIcon = theme === "dark" ? SunMedium : Moon;
  const user = useSelector((state) => state.auth?.user);
<<<<<<< HEAD
  const account = user?.account || user || {};
  const notificationRef = useRef(null);
  const accountName =
    account.full_name ||
    [account.first_name, account.last_name].filter(Boolean).join(" ") ||
    "Administrator";
=======
>>>>>>> 7bad699 (save local work before pulling latest changes)
  const canSwitchWorkspace = getAssignedWorkspaces(user).length > 1;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const notificationsLabel = t("notifications") || "الإشعارات";

  // 🔔 فك حظر الصوت في المتصفح
  useEffect(() => {
    const unlockAudio = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume().then(() => ctx.close());
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);
// 1️⃣ مرجع لتتبع الإشعارات المنبه عليها
const notifiedIdsRef = useRef(new Set());
const isInitialLoadRef = useRef(true);

useEffect(() => {
  let cancelled = false;

  const loadNotifications = async () => {
    try {
      const resp = await getNotificationsApi({ page: 1, limit: 8 });
      let items = [];
      if (Array.isArray(resp)) items = resp;
      else if (Array.isArray(resp.notifications)) items = resp.notifications;
      else if (Array.isArray(resp.data)) items = resp.data;

      const mapped = items.map((n) => ({
        id: `srv-${n.id}`,
        serverId: n.id,
        title: n.title || n.data?.title || n.type || "إشعار",
        message: n.body || n.message || n.data?.message || "",
        time: n.created_at
          ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString(),
        read: !!n.read || !!n.is_read || !!n.read_at,
      }));

      if (!cancelled) {
        // تصفية الإشعارات الجديدة غير المقروءة والتي لم ينطلق لها توست سابقاً
        const newUnnotifiedItems = mapped.filter(
          (item) => !item.read && !notifiedIdsRef.current.has(item.id)
        );

        if (newUnnotifiedItems.length > 0 && !isInitialLoadRef.current) {
          playNotificationTone();

          newUnnotifiedItems.forEach((inc) => {
            // 🛑 تم إضافة id الخاص بالإشعار لمنع ظهور مربعين توست على الشاشة نهائياً
            toast(`${inc.title}: ${inc.message}`, {
              id: inc.id, 
              duration: 5000,
            });
            notifiedIdsRef.current.add(inc.id);
          });
        } else {
          // حفظ كافة الإشعارات القديمة عند فتح الصفحة لأول مرة
          mapped.forEach((item) => notifiedIdsRef.current.add(item.id));
        }

        isInitialLoadRef.current = false;
        setNotifications(mapped);
      }
    } catch (e) {
      console.error("فشل جلب الإشعارات:", e);
    }
  };

  // جلب عند التحميل
  loadNotifications();

  // تحديث دوري كل 5 ثوانٍ
  const intervalId = setInterval(() => {
    loadNotifications();
  }, 5000);

  // استماع الفايربيس (يطلب تحديث البيانات فقط ويترك التوست للـ loadNotifications)
  let unsubscribe = null;
  try {
    unsubscribe = subscribeToForegroundMessages((payload) => {
      if (cancelled || !payload) return;
      loadNotifications();
    });
  } catch (err) {
    console.warn("Firebase listener warning:", err);
  }

  // تسجيل التوكن بالخلفية
  requestForToken()
    .then((token) => {
      if (token && !cancelled) {
        registerDeviceTokenApi(token).catch(() => {});
      }
    })
    .catch(() => {});

  const handleClickOutside = (event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setNotificationsOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
    if (typeof unsubscribe === "function") unsubscribe();
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const handleLangToggle = () => {
    const next = getLanguage() === "en" ? "ar" : "en";
    setLanguage(next);
    window.location.reload();
  };

  const markNotificationAsRead = (id) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    try {
      const srv = notifications.find((n) => n.id === id)?.serverId;
      if (srv) markNotificationAsReadApi(srv).catch(() => {});
    } catch (e) {}
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    markAllNotificationsAsReadApi().catch(() => {});
  };

  return (
    <header className="dashboard-topbar">
      <div className="topbar-right">
        <div className="topbar-title">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <ThemeIcon size={18} />
        </button>

        {actions.map((action) => {
          const Icon = action.icon || Bell;
          const isNotificationAction =
            action.key === "notifications" || action.key === "bell";

          if (action.key === "lang") {
            return (
              <button
                key={action.key}
                type="button"
                className="icon-btn topbar-lang-btn"
                onClick={handleLangToggle}
                aria-label={t("language")}
                title={t("language")}
              >
                <span>{getLanguage().toUpperCase()}</span>
                <ChevronDown size={13} />
              </button>
            );
          }

          if (isNotificationAction) {
            return (
              <div
                key={action.key || action.label}
                className="notification-wrapper"
                ref={notificationRef}
              >
                <button
                  type="button"
                  className={`icon-btn notification-btn ${notificationsOpen ? "active" : ""}`}
                  onClick={() => {
                    action.onClick?.();
                    setNotificationsOpen((open) => !open);
                  }}
                  aria-label={notificationsLabel}
                  title={notificationsLabel}
                >
                  <Icon size={18} />

                  {/* 🔴 شارة عداد الإشعارات غير المقروءة فوق الجرس */}
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="notification-dropdown" role="menu" aria-label={notificationsLabel}>
                    <div className="notification-header">
                      <strong>{notificationsLabel}</strong>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notification-clear-btn"
                          onClick={markAllNotificationsAsRead}
                        >
                          {"تمت القراءة"}
                        </button>
                      )}
                    </div>

                    <div className="notification-list">
                      {notifications.length ? (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`notification-item ${item.read ? "read" : "unread"}`}
                            onClick={() => {
                              markNotificationAsRead(item.id);
                              setNotificationsOpen(false);
                            }}
                          >
                            {!item.read && <span className="notification-dot" aria-hidden="true" />}
                            <span className="notification-copy">
                              <strong>{item.title}</strong>
                              <small>{item.message}</small>
                              <em>{item.time}</em>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="notification-empty">لا توجد إشعارات جديدة.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={action.key || action.label}
              type="button"
              className="icon-btn"
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
            >
              <Icon size={18} />
            </button>
          );
        })}

        {canSwitchWorkspace && (
          <button
            type="button"
            className="icon-btn workspace-switch-btn"
            onClick={() => navigate("/choose-workspace")}
            aria-label={t("switch_workspace")}
            title={t("switch_workspace")}
          >
            <PanelsTopLeft size={18} />
            <span>{t("switch_workspace")}</span>
          </button>
        )}

        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder={searchPlaceholder} />
        </div>

      </div>
    </header>
  );
<<<<<<< HEAD
}
=======
}

Topbar.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      onClick: PropTypes.func,
    })
  ),
};
>>>>>>> 7bad699 (save local work before pulling latest changes)
