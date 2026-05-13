import PropTypes from "prop-types";
import {
  Search,
  Filter,
} from "lucide-react";

import StatusDropdown from "@/shared/components/StatusDropdown";

export default function Toolbar({
  placeholder,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  selectOptions = [],
}) {
  return (
    <div className="legal-toolbar">
      <div className="toolbar-search">
        <Search size={18} />

        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) =>
            onSearchChange(e.target.value)
          }
        />
      </div>

      <div className="toolbar-filters">
        <div className="toolbar-filter-label">
          <Filter size={16} />
          <span>فلترة</span>
        </div>

        <StatusDropdown
          trigger="button"
          value={filterValue}
          options={selectOptions}
          onChange={onFilterChange}
          className="toolbar-status-dropdown"
        />
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  placeholder: PropTypes.string,

  searchValue: PropTypes.string,

  onSearchChange: PropTypes.func,

  filterValue: PropTypes.string,

  onFilterChange: PropTypes.func,

  selectOptions: PropTypes.array,
};