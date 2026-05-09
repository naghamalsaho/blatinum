import { PencilLine, Trash2 } from "lucide-react";

export default function ActionButtons() {
  return (
    <div className="row-actions">
      <button
        type="button"
        className="icon-action-btn"
      >
        <PencilLine size={16} />
      </button>

      <button
        type="button"
        className="icon-action-btn danger"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}