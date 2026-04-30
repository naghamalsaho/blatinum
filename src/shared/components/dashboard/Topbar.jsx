import { Menu, Search, Globe, Bell, ChevronDown } from "lucide-react";

// eslint-disable-next-line react/prop-types
export default function Topbar({ onMenuClick }) {
  return (
    <header className="dashboard-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
        >
          <Menu size={20} />
        </button>

        <button type="button" className="icon-btn">
          <Globe size={18} />
        </button>

        <button type="button" className="icon-btn">
          <Bell size={18} />
        </button>

        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="بحث..." />
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-title">
          <h2>لوحة التحكم</h2>
          <p>مرحباً، هذه نظرة عامة على النظام</p>
        </div>

        <button type="button" className="profile-pill">
          <span className="profile-avatar">ع</span>
          <span className="profile-name">المدير</span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}