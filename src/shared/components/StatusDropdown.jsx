import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Check, ChevronDown, PencilLine } from "lucide-react";

export default function StatusDropdown({
  value,
  options,
  onChange,
  className = "",
  trigger = "icon",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={`status-dropdown ${className}`}>
      {trigger === "icon" ? (
        <button
          type="button"
          className="icon-action-btn"
          onClick={() => setOpen((prev) => !prev)}
          title="Edit status"
          aria-label="Edit status"
        >
          <PencilLine size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="status-dropdown-trigger"
          onClick={() => setOpen((prev) => !prev)}
        >
          <div className="status-dropdown-trigger-content">
            {selectedOption?.dotClass ? (
              <span className={`status-dot ${selectedOption.dotClass}`} />
            ) : null}

            <span>{selectedOption?.label || "Select"}</span>
          </div>

          <ChevronDown size={16} />
        </button>
      )}

      {open && (
        <div className="status-dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`status-dropdown-item ${
                option.value === selectedOption?.value ? "active" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <div className="status-dropdown-item-content">
                <span className={`status-dot ${option.dotClass || ""}`} />
                <span>{option.label}</span>
              </div>

              {option.value === selectedOption?.value ? (
                <Check size={14} className="status-dropdown-check" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

StatusDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      dotClass: PropTypes.string,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  trigger: PropTypes.oneOf(["icon", "button"]),
};
