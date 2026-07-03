import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users2,
  Search,
  Plus,
  Trash2,
  Shield,
  Award,
  Eye,          // أيقونة استعراض تفاصيل الإسناد
  MapPinned,    // أيقونة للمواقع الجغرافية
  Building2,    // أيقونة للأبنية داخل المشاريع
  CalendarDays, // أيقونة للتواريخ
  Compass       // أيقونة لنصف قطر التواجد المسموح
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
  fetchAllocatedLocations // استيراد الـ Thunk الجديد
} from "../features/engineers/model/engineer.thunks";
import { clearSelectedAllocations } from "../features/engineers/model/engineer.slice";

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

// دالة مساعدة لتنسيق التاريخ بشكل لطيف
function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function EngineeringEngineersPage() {
  const dispatch = useDispatch();

  // جلب البيانات الإضافية للإسنادات من الـ slice
  const { 
    items: engineers = [], 
    loading, 
    actionLoading, 
    error,
    selectedAllocations = [],
    allocationsLoading
  } = useSelector((state) => state.engineers || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  
  // حالات التحكم بمودال عرض المواقع الجغرافية للمهندس
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [activeEngineer, setActiveEngineer] = useState(null);

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

  // منطق تجميع وفلترة الإسنادات الجغرافية بحسب المشروع (بحيث يظهر كل مشروع كبطاقة واحدة غنية)
  const groupedProjects = useMemo(() => {
    const projectsMap = {};

    selectedAllocations.forEach((alloc) => {
      const pId = alloc.project_id;
      if (!projectsMap[pId]) {
        projectsMap[pId] = {
          id: pId,
          name: alloc.project_name || "مشروع غير مسمى",
          status: alloc.project?.status || "unknown",
          description: alloc.project?.description || "لا يوجد وصف للمشروع.",
          locationName: alloc.project?.location?.name || "غير محدد",
          allocations: [],
          allBuildings: alloc.project?.buildings || [],
        };
      }
      projectsMap[pId].allocations.push(alloc);
    });

    return Object.values(projectsMap);
  }, [selectedAllocations]);

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

  // عند فتح مودال تفاصيل الإسناد للمهندس
  const handleOpenLocations = (engineer) => {
    const engineerId =
      engineer?.additional_info?.engineer_id ||
      engineer?.account?.id ||
      engineer?.id;

    setActiveEngineer(engineer);
    setLocationsOpen(true);
    dispatch(fetchAllocatedLocations(engineerId));
  };

  // عند إغلاق المودال نقوم بتفريغ الداتا لتجنب ظهور بيانات قديمة في الفتحة القادمة
  const handleCloseLocations = () => {
    setLocationsOpen(false);
    setActiveEngineer(null);
    dispatch(clearSelectedAllocations());
  };

  return (
    <div className="engineering-page engineering-engineers-page">
      <PageHeader
        kicker="القسم الهندسي"
        title="المهندسون"
        subtitle="عرض جميع المهندسين مع إمكانية الإضافة والحذف واستعراض مواقع الإسناد الجغرافي."
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
                      <td>{experience} سنة</td>
                      <td>
                        <div className="row-actions">
                          {/* زر استعراض المواقع الجديد */}
                          <button
                            type="button"
                            className="icon-action-btn primary"
                            onClick={() => handleOpenLocations(engineer)}
                            title="عرض مواقع وإسنادات المهندس"
                            style={{ color: "var(--dash-text)", background: "rgba(0,0,0,0.04)" }}
                          >
                            <Eye size={16} />
                          </button>

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

      {/* مودال إضافة مهندس جديد المحتفظ بتنظيمه الجميل */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إضافة مهندس"
        description="أدخل بيانات المهندس ثم احفظ."
        size="lg"
      >
        <form className="engineering-form" onSubmit={handleCreate}>
          <div className="engineering-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              label="الاسم الأول"
              iconClass="fa-solid fa-user"
              error=""
            />
            <Field
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              label="اسم العائلة"
              iconClass="fa-solid fa-user"
              error=""
            />
            <Field
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              label="البريد الإلكتروني"
              iconClass="fa-solid fa-envelope"
              error=""
            />
            <Field
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              label="رقم الهاتف"
              iconClass="fa-solid fa-phone"
              error=""
            />
            <Field
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              label="التخصص"
              iconClass="fa-solid fa-briefcase"
              error=""
            />
            <Field
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleChange}
              label="سنوات الخبرة"
              iconClass="fa-solid fa-award"
              error=""
            />
            <Field
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              label="العنوان"
              iconClass="fa-solid fa-location-dot"
              error=""
            />
            <Field
              type="text"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              label="الجنس"
              iconClass="fa-solid fa-venus-mars"
              error=""
            />
            <Field
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              label="كلمة المرور"
              iconClass="fa-solid fa-lock"
              error=""
            />
            <Field
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              label="تأكيد كلمة المرور"
              iconClass="fa-solid fa-lock"
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

      {/* المودال الجديد والجميل لاستعراض تفاصيل مواقع وإسنادات المهندس الجغرافية */}
      <Modal
        open={locationsOpen}
        onClose={handleCloseLocations}
        title={`مواقع وإسنادات المهندس: ${extractEngineerName(activeEngineer)}`}
        description="استعراض شامل لكافة المشاريع والأبنية المسندة للمهندس مع الصلاحيات الجغرافية المحددة له."
        size="lg"
      >
        {allocationsLoading ? (
          <div className="project-empty-state">جاري جلب المواقع والإسنادات الحالية...</div>
        ) : groupedProjects.length === 0 ? (
          <div className="project-empty-state">هذا المهندس غير مسند إلى أي موقع أو مشروع حالياً.</div>
        ) : (
          <div className="allocated-locations-list" style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingLeft: "4px" }}>
            {groupedProjects.map((proj) => (
              <div 
                key={proj.id} 
                className="allocated-project-card" 
                style={{
                  border: "1px solid var(--dash-line)",
                  borderRadius: "16px",
                  padding: "16px",
                  background: "var(--dash-topbar-bg)",
                  boxShadow: "var(--dash-shadow)"
                }}
              >
                {/* رأس كرت المشروع وتفاصيله الرئيسية */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "var(--dash-text)", fontWeight: 700 }}>
                      {proj.name}
                    </h4>
                    <span style={{ fontSize: "12px", color: "var(--dash-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <MapPinned size={14} /> {proj.locationName}
                    </span>
                  </div>
                  <span 
                    className="project-chip" 
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: proj.status === "in_progress" ? "rgba(46, 125, 50, 0.1)" : "rgba(120, 120, 120, 0.1)",
                      color: proj.status === "in_progress" ? "#2e7d32" : "#555"
                    }}
                  >
                    {proj.status === "in_progress" ? "نشط" : "متوقف / غير محدد"}
                  </span>
                </div>

                <p style={{ margin: "4px 0 12px", fontSize: "13px", color: "var(--dash-muted)", lineBreak: "auto" }}>
                  {proj.description}
                </p>

                {/* تفاصيل سجلات الإسناد الخاصة بالمهندس داخل هذا المشروع */}
                <div style={{ borderTop: "1px dashed var(--dash-line)", paddingTop: "12px", marginBottom: "12px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "var(--dash-text)" }}>
                    صلاحيات وسجلات الإسناد الممنوحة له:
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {proj.allocations.map((alloc) => (
                      <div 
                        key={alloc.id} 
                        style={{
                          background: "rgba(0,0,0,0.02)",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          fontSize: "12px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: 700, color: alloc.allocation_type === "project_wide" ? "#b45309" : "#0369a1" }}>
                            {alloc.allocation_type === "project_wide" ? "💼 مسؤول عن كامل المشروع" : `🏢 مخصص لبناء: ${alloc.building_number || "بناء محدد"}`}
                          </span>
                          
                          <span style={{ color: "var(--dash-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Compass size={13} /> نصف قطر السماحية: <strong>{alloc.allowed_radius} متر</strong>
                          </span>
                        </div>

                        <div className="project-chip-row" style={{ gap: "12px", color: "var(--dash-muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <CalendarDays size={13} /> البداية: {formatDate(alloc.start_date) || "غير محدد"}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <CalendarDays size={13} /> النهاية: {formatDate(alloc.end_date) || "مفتوح ومستمر"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* استعراض الأبنية التابعة للمشروع المرفقة في الـ Rich API لمنع طلبات إضافية */}
                {proj.allBuildings && proj.allBuildings.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--dash-line)", paddingTop: "12px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "var(--dash-text)" }}>
                      أبنية المشروع المتاحة ورؤيتها بالكامل ({proj.allBuildings.length}):
                    </h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                      {proj.allBuildings.map((b) => (
                        <div 
                          key={b.id} 
                          style={{
                            border: "1px solid var(--dash-line)",
                            borderRadius: "8px",
                            padding: "6px 8px",
                            background: "rgba(0,0,0,0.01)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          {/* عرض صورة البناء إن وجدت المرفوعة على الـ Rich API */}
                          {b.attachments && b.attachments[0]?.url ? (
                            <img 
                              src={b.attachments[0].url} 
                              alt={b.building_number} 
                              style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} 
                            />
                          ) : (
                            <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-muted)" }}>
                              <Building2 size={16} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--dash-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {b.building_number}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--dash-muted)" }}>
                              {b.floors_count ? `${b.floors_count} طوابق` : "حالة غير محددة"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <Button
            type="button"
            className="ghost-filter-btn"
            onClick={handleCloseLocations}
          >
            إغلاق النافذة
          </Button>
        </div>
      </Modal>
    </div>
  );
}