import PropTypes from "prop-types";
import {
  AlertTriangle,
  WifiOff,
  LockKeyhole,
  ShieldAlert,
  SearchX,
  ServerCrash,
  RotateCcw,
} from "lucide-react";

import Modal from "@/shared/components/Modal";
import "@/shared/ui/api-error-dialog.css";

function getVariantFromMessage(message = "") {
  const text = message.toLowerCase();

  if (text.includes("network") || text.includes("connection") || text.includes("connect")) {
    return "network";
  }

  if (text.includes("unauthorized") || text.includes("token") || text.includes("session")) {
    return "unauthorized";
  }

  if (text.includes("forbidden") || text.includes("not allowed")) {
    return "forbidden";
  }

  if (text.includes("not found") || text.includes("404")) {
    return "not_found";
  }

  if (text.includes("server") || text.includes("500") || text.includes("sqlstate") || text.includes("exception")) {
    return "server";
  }

  if (
    text.includes("restrict violation") ||
    text.includes("foreign key") ||
    text.includes("projects_location_id_foreign") ||
    text.includes("cannot delete")
  ) {
    return "relation";
  }

  return "default";
}

const VARIANTS = {
  network: {
    title: "لا يوجد اتصال",
    icon: WifiOff,
  },
  unauthorized: {
    title: "انتهت الجلسة",
    icon: LockKeyhole,
  },
  forbidden: {
    title: "غير مصرح",
    icon: ShieldAlert,
  },
  not_found: {
    title: "البيانات غير موجودة",
    icon: SearchX,
  },
  server: {
    title: "خطأ في الخادم",
    icon: ServerCrash,
  },
  relation: {
    title: "لا يمكن حذف السجل",
    icon: AlertTriangle,
  },
  default: {
    title: "حدث خطأ",
    icon: AlertTriangle,
  },
};

export default function ApiErrorDialog({
  open,
  message,
  imageSrc = null,
  onClose,
  onRetry,
}) {
  const variant = getVariantFromMessage(message);
  const { title, icon: Icon } = VARIANTS[variant] || VARIANTS.default;

  return (
    <Modal open={open} title={title} description={message} onClose={onClose} size="md">
      <div className="api-error-dialog">
        <div className="api-error-dialog__art">
          {imageSrc ? (
            <img className="api-error-dialog__image" src={imageSrc} alt="" />
          ) : (
            <div className="api-error-dialog__fallback">
              <span className="api-error-dialog__orb api-error-dialog__orb--one" />
              <span className="api-error-dialog__orb api-error-dialog__orb--two" />
              <div className="api-error-dialog__icon">
                <Icon size={28} />
              </div>
            </div>
          )}
        </div>

        <div className="api-error-dialog__body">
          <p className="api-error-dialog__text">{message}</p>

          <div className="api-error-dialog__actions">
            <button
              type="button"
              className="api-error-dialog__secondary"
              onClick={onClose}
            >
              إغلاق
            </button>

            {onRetry ? (
              <button
                type="button"
                className="api-error-dialog__primary"
                onClick={onRetry}
              >
                <RotateCcw size={16} />
                إعادة المحاولة
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

ApiErrorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  imageSrc: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
};