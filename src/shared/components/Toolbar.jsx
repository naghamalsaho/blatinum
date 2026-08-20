import PropTypes from "prop-types";
import { Search, SlidersHorizontal } from "lucide-react";

import StatusDropdown from "@/shared/components/StatusDropdown";
import { t } from "@/shared/i18n";

export default function Toolbar({
  placeholder,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  selectOptions = [],
  action = null,
}) {
  return (
    <div className="legal-toolbar dashboard-toolbar-standard">
      <div className="toolbar-search">
        <Search size={18} />

        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="toolbar-filters">
        <div className="toolbar-filter-label">
          <SlidersHorizontal size={16} />
          <span>{t("filter")}</span>
        </div>

        <StatusDropdown
          trigger="button"
          value={filterValue}
          options={selectOptions}
          onChange={onFilterChange}
          className="toolbar-status-dropdown"
        />

        {action ? <div className="toolbar-action">{action}</div> : null}
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
  action: PropTypes.node,
};
