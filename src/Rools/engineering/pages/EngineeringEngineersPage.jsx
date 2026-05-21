import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users2,
  Search,
  Plus,
  Trash2,
  
  Shield,
  Award,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Modal from "@/shared/components/Modal";
import Field from "@/shared/components/Field";
import Button from "@/shared/components/Button";

import {
  fetchEngineers,
  createEngineer,
  deleteEngineer,
} from "../features/engineers/model/engineer.thunks";

import "../styles/engineering.css";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function extractEngineerName(engineer = {}) {
  return (
    engineer?.account?.full_name ||
    `${engineer?.account?.first_name || ""} ${engineer?.account?.last_name || ""}`.trim() ||
    "-"
  );
}

function extractEngineerEmail(engineer = {}) {
  return engineer?.account?.email || "-";
}

function extractEngineerPhone(engineer = {}) {
  return engineer?.account?.phone || "-";
}

function extractEngineerAddress(engineer = {}) {
  return engineer?.account?.address || "-";
}

function extractEngineerSpecialization(engineer = {}) {
  return engineer?.additional_info?.specialization || "-";
}

function extractEngineerExperience(engineer = {}) {
  return engineer?.additional_info?.experience_years ?? "-";
}

export default function EngineeringEngineersPage() {
  const dispatch = useDispatch();

  const { items: engineers = [], loading, actionLoading, error } = useSelector(
    (state) => state.engineers || {}
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    password: "",
    password_confirmation: "",
    specialization: "",
    experience_years: "",
  });

  useEffect(() => {
    dispatch(fetchEngineers());
  }, [dispatch]);

  const specializationOptions = useMemo(() => {
    const values = engineers
      .map((engineer) => extractEngineerSpecialization(engineer))
      .filter((value) => value && value !== "-");

    return Array.from(new Set(values));
  }, [engineers]);

  const filteredEngineers = useMemo(() => {
    const q = normalizeText(searchTerm);

    return engineers.filter((engineer) => {
      const searchable = [
        extractEngineerName(engineer),
        extractEngineerEmail(engineer),
        extractEngineerPhone(engineer),
        extractEngineerAddress(engineer),
        extractEngineerSpecialization(engineer),
        extractEngineerExperience(engineer),
      ]
        .map(normalizeText)
        .join(" ");

      const matchesSearch = !q || searchable.includes(q);
      const matchesSpecialization =
        specializationFilter === "all" ||
        normalizeText(extractEngineerSpecialization(engineer)) ===
          normalizeText(specializationFilter);

      return matchesSearch && matchesSpecialization;
    });
  }, [engineers, searchTerm, specializationFilter]);

  const totalEngineers = engineers.length;
  const totalSpecializations = specializationOptions.length;
  const avgExperience = useMemo(() => {
    const numbers = engineers
      .map((engineer) => Number(extractEngineerExperience(engineer)))
      .filter((n) => Number.isFinite(n) && n >= 0);

    if (!numbers.length) return 0;
    return (numbers.reduce((sum, n) => sum + n, 0) / numbers.length).toFixed(1);
  }, [engineers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      experience_years: Number(formData.experience_years),
    };

    const result = await dispatch(createEngineer(payload));

    if (createEngineer.fulfilled.match(result)) {
      setCreateOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        gender: "",
        password: "",
        password_confirmation: "",
        specialization: "",
        experience_years: "",
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("هل تريد حذف هذا المهندس؟");
    if (!confirmDelete) return;

    dispatch(deleteEngineer(id));
  };

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="القسم الهندسي"
        title="المهندسون"
        subtitle="عرض جميع المهندسين مع إمكانية الإضافة والحذف."
        action={
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} />
            <span>إضافة مهندس</span>
          </button>
        }
      />

      <div className="engineering-stats-grid">
        <StatCard
          title="إجمالي المهندسين"
          value={totalEngineers}
          note="كل السجلات"
          icon={Users2}
        />
        <StatCard
          title="التخصصات"
          value={totalSpecializations}
          note="تخصصات مختلفة"
          icon={Shield}
        />
        <StatCard
          title="متوسط الخبرة"
          value={avgExperience}
          note="سنوات خبرة"
          icon={Award}
        />
      </div>

      <div className="engineering-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو البريد أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="toolbar-select"
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
          >
            <option value="all">كل التخصصات</option>
            {specializationOptions.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="project-empty-state">جاري تحميل المهندسين...</div>
      ) : error ? (
        <div className="project-empty-state" style={{ color: "red" }}>
          {error}
        </div>
      ) : filteredEngineers.length === 0 ? (
        <div className="project-empty-state">لا توجد نتائج مطابقة.</div>
      ) : (
        <TableCard title="جدول المهندسين" count={filteredEngineers.length}>
          <div className="project-table-wrap">
            <table className="engineering-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>الهاتف</th>
                  <th>العنوان</th>
                  <th>التخصص</th>
                  <th>الخبرة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredEngineers.map((engineer) => {
                  const name = extractEngineerName(engineer);
                  const email = extractEngineerEmail(engineer);
                  const phone = extractEngineerPhone(engineer);
                  const address = extractEngineerAddress(engineer);
                  const specialization = extractEngineerSpecialization(engineer);
                  const experience = extractEngineerExperience(engineer);
                  const engineerId =
                    engineer?.additional_info?.engineer_id ||
                    engineer?.account?.id ||
                    engineer?.id;

                  return (
                    <tr key={engineerId}>
                      <td>{name}</td>
                      <td>{email}</td>
                      <td>{phone}</td>
                      <td>{address}</td>
                      <td>{specialization}</td>
                      <td>{experience}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() => handleDelete(engineerId)}
                            title="حذف المهندس"
                            aria-label="حذف المهندس"
                            disabled={actionLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إضافة مهندس"
        description="أدخل بيانات المهندس ثم احفظ."
        size="lg"
      >
        <form className="engineering-form" onSubmit={handleCreate}>
          <div className="engineering-form-grid">
            <Field
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              label="First Name"
              iconClass="fa-solid fa-user"
              error=""
            />
            <Field
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              label="Last Name"
              iconClass="fa-solid fa-user"
              error=""
            />
            <Field
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              label="Email"
              iconClass="fa-solid fa-envelope"
              error=""
            />
            <Field
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              label="Phone"
              iconClass="fa-solid fa-phone"
              error=""
            />
            <Field
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              label="Address"
              iconClass="fa-solid fa-location-dot"
              error=""
            />
            <Field
              type="text"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              label="Gender"
              iconClass="fa-solid fa-venus-mars"
              error=""
            />
            <Field
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              label="Password"
              iconClass="fa-solid fa-lock"
              error=""
            />
            <Field
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              label="Confirm Password"
              iconClass="fa-solid fa-lock"
              error=""
            />
            <Field
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              label="Specialization"
              iconClass="fa-solid fa-briefcase"
              error=""
            />
            <Field
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleChange}
              label="Experience Years"
              iconClass="fa-solid fa-award"
              error=""
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => setCreateOpen(false)}
              disabled={actionLoading}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}