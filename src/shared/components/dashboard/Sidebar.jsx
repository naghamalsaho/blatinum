import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Bell,
  ClipboardList,
  FileText,
  Folder,
  Scale,
  
  Users,
  Building2,
  Settings,
  LogOut,
} from "lucide-react";

const navGroups = [
  {
    title: "الرئيسية",
    items: [
      { to: "/dashboard", label: "لوحة التحكم", icon: LayoutGrid },
      { to: "/dashboard/notifications", label: "الإشعارات", icon: Bell },
    ],
  },
  {
    title: "إدارة النظام",
    items: [
      { to: "/dashboard/orders", label: "الطلبات", icon: ClipboardList },
      { to: "/dashboard/payments", label: "الدفعات", icon: FileText },
      { to: "/dashboard/contracts", label: "العقود", icon: Scale },
      { to: "/dashboard/files", label: "المستندات", icon: Folder },
    ],
  },
  {
    title: "الموارد",
    items: [
      { to: "/dashboard/users", label: "المستخدمون", icon: Users },
      { to: "/dashboard/warehouses", label: "المستودعات", icon: Building2 },
      { to: "/dashboard/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

// eslint-disable-next-line react/prop-types
export default function Sidebar({ open = true, onClose }) {
  return (
    <aside className={`dashboard-sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-badge">عق</span>

          <div className="brand-text">
            <h1>نظام العقارات</h1>
            <p>لوحة الإدارة</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        >
          ×
        </button>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <span className="nav-group-title">{group.title}</span>

            <div className="nav-group-items">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn">
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}