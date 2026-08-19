import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import "@/shared/ui/modal.css";

const CLOSE_ANIMATION_MS = 220;

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  className = "",
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const previousOverflow = useRef("");
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));

      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return;
    }

    setVisible(false);

    const timer = setTimeout(() => {
      setMounted(false);
      document.body.style.overflow = previousOverflow.current;
    }, CLOSE_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`app-modal ${visible ? "is-open" : ""} ${className}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <button
        type="button"
        className="app-modal__backdrop"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div
        className={`app-modal__panel app-modal__panel--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descId}>{description}</p> : null}
          </div>

          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {children ? <div className="app-modal__body">{children}</div> : null}

        {footer ? <div className="app-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  className: PropTypes.string,
};
