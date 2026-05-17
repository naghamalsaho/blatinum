import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  PackageSearch,
  Users,
} from "lucide-react";

const overviewCards = [
  {
    title: "Departments",
    to: "/admin/departments",
    icon: BriefcaseBusiness,
  },
  {
    title: "Warehouses",
    to: "/admin/warehouses",
    icon: Building2,
  },
  {
    title: "Items",
    to: "/admin/items",
    icon: PackageSearch,
  },
  {
    title: "Users",
    to: "/admin/users",
    icon: Users,
    disabled: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="admin-home">
      <section className="admin-home-hero">
        <div>
          <p className="admin-home-kicker">Admin</p>
          <h1>Platinum</h1>
        </div>
      </section>

      <section className="admin-overview-grid" aria-label="Admin sections">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <>
              <span className="admin-overview-icon">
                <Icon size={22} />
              </span>
              <span className="admin-overview-copy">
                <strong>{card.title}</strong>
              </span>
              {!card.disabled && <ArrowUpRight size={18} />}
            </>
          );

          if (card.disabled) {
            return (
              <div className="admin-overview-card is-disabled" key={card.title}>
                {content}
              </div>
            );
          }

          return (
            <Link className="admin-overview-card" to={card.to} key={card.title}>
              {content}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
