import PropTypes from "prop-types";
import { Search, Filter } from "lucide-react";

export default function Toolbar({
  placeholder,
  selectOptions = [],
}) {
  return (
    <div className="legal-toolbar">
      <div className="toolbar-search">
        <Search size={18} />

        <input
          type="text"
          placeholder={placeholder}
        />
      </div>

      <div className="toolbar-filters">
        <button
          type="button"
          className="ghost-filter-btn"
        >
          <Filter size={16} />
          <span>فلترة</span>
        </button>

        <select
          className="toolbar-select"
          defaultValue="all"
        >
          {selectOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  placeholder: PropTypes.string,
  selectOptions: PropTypes.array,
};