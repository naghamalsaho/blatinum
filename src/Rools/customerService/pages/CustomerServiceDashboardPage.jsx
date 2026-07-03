import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  Headphones,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import { t } from "@/shared/i18n";
import {
  customerServiceAppointments,
  customerServiceClients,
  customerServiceOrders,
  formatStatus,
} from "../constants/customerServiceData";

import "../styles/customer-service.css";

const stats = [
  {
    title: t("stats_clients"),
    value: customerServiceClients.length,
    note: t("note_client_records"),
    icon: UsersRound,
  },
  {
    title: t("stats_appointments"),
    value: customerServiceAppointments.length,
    note: t("note_scheduled_service_activity"),
    icon: CalendarCheck,
  },
  {
    title: t("stats_orders"),
    value: customerServiceOrders.length,
    note: t("note_requests_to_follow_up"),
    icon: ClipboardCheck,
  },
  {
    title: t("stats_permissions"),
    value: "10",
    note: t("note_available_service_actions"),
    icon: Headphones,
  },
];

const quickLinks = [
  {
    title: t("quick_link_clients"),
    description: t("quick_link_clients_desc"),
    to: "/customer-service/clients",
    icon: UsersRound,
  },
  {
    title: t("quick_link_appointments"),
    description: t("quick_link_appointments_desc"),
    to: "/customer-service/appointments",
    icon: CalendarCheck,
  },
  {
    title: t("quick_link_orders"),
    description: t("quick_link_orders_desc"),
    to: "/customer-service/orders",
    icon: ClipboardCheck,
  },
];

export default function CustomerServiceDashboardPage() {
  const recentOrders = customerServiceOrders.slice(0, 3);

  return (
    <div className="customer-service-page">
      <PageHeader
        kicker={t("customer_service")}
        title={t("service_dashboard_title")}
        subtitle={t("service_dashboard_subtitle")}
      />

      <section className="legal-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            note={item.note}
            icon={item.icon}
          />
        ))}
      </section>

      <section className="customer-service-overview-grid">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link className="customer-service-overview-card" to={item.to} key={item.title}>
              <span className="customer-service-overview-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          );
        })}
      </section>

      <TableCard title={t("recent_orders")} count={recentOrders.length}>
        <table className="legal-table">
          <thead>
            <tr>
              <th>{t("order")}</th>
              <th>{t("client")}</th>
              <th>{t("project")}</th>
              <th>{t("status")}</th>
              <th>{t("priority")}</th>
              <th>{t("updated")}</th>
            </tr>
          </thead>

          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td data-label={t("order")}> 
                  <strong>{order.id}</strong>
                </td>
                <td data-label={t("client")}>{order.client}</td>
                <td data-label={t("project")}>{order.project} / {order.unit}</td>
                <td data-label={t("status")}> 
                  <span className={`customer-service-pill ${order.status}`}>
                    {formatStatus(order.status)}
                  </span>
                </td>
                <td data-label={t("priority")}> 
                  <span className={`customer-service-priority ${order.priority}`}>
                    {formatStatus(order.priority)}
                  </span>
                </td>
                <td data-label={t("updated")}>{order.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
