import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FolderKanban,
  Users2,
  Plus,
  Search,
  FolderSearch,
  Building2,
  Paperclip,
  CalendarDays,
  MapPinned,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Modal from "@/shared/components/Modal";
import Field from "@/shared/components/Field";
import Button from "@/shared/components/Button";
import StatusBadge from "@/shared/components/StatusBadge";

import {
  fetchProjectEngineers,
  fetchProjectsForEngineer,
  assignEngineerProject,
} from "../features/engineerProjects/model/engineerProject.thunks";

import "../styles/engineering.css";

const STATUS_META = {
  in_progress: { label: "قيد التنفيذ", type: "ok" },
  stopped: { label: "متوقف", type: "busy" },
  completed: { label: "منجز", type: "off" },
  planned: { label: "مخطط", type: "busy" },
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value) {
  return value || "-";
}

function getEngineerIdFromRelation(relation = {}) {
  return (
    relation?.engineer?.additional_info?.engineer_id ||
    relation?.engineer?.account?.id ||
    relation?.id
  );
}

function getEngineerName(relation = {}) {
  return relation?.engineer?.account?.full_name || "-";
}

function getEngineerEmail(relation = {}) {
  return relation?.engineer?.account?.email || "-";
}

function getEngineerPhone(relation = {}) {
  return relation?.engineer?.account?.phone || "-";
}

function getEngineerAddress(relation = {}) {
  return relation?.engineer?.account?.address || "-";
}

function getEngineerSpecialization(relation = {}) {
  return relation?.engineer?.additional_info?.specialization || "-";
}

function getEngineerExperience(relation = {}) {
  return relation?.engineer?.additional_info?.experience_years ?? "-";
}

function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: status || "-",
      type: "off",
    }
  );
}

function groupProjects(assignments = []) {
  const map = new Map();

  assignments.forEach((relation) => {
    const project = relation?.project;
    if (!project?.id) return;

    const account = relation?.engineer?.account || {};
    const additional = relation?.engineer?.additional_info || {};
    const engineerId = getEngineerIdFromRelation(relation);

    if (!map.has(project.id)) {
      map.set(project.id, {
        project,
        relations: [],
        engineers: [],
      });
    }

    const bucket = map.get(project.id);
    bucket.relations.push(relation);

    const exists = bucket.engineers.some((eng) => eng.engineerId === engineerId);

    if (!exists) {
      bucket.engineers.push({
        engineerId,
        relation,
        account,
        info: additional,
        start_date: relation.start_date,
        end_date: relation.end_date,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a?.project?.name || "").localeCompare(String(b?.project?.name || ""))
  );
}

function groupEngineers(assignments = []) {
  const map = new Map();

  assignments.forEach((relation) => {
    const engineerId = getEngineerIdFromRelation(relation);
    if (!engineerId) return;

    const project = relation?.project;
    if (!project?.id) return;

    const account = relation?.engineer?.account || {};
    const additional = relation?.engineer?.additional_info || {};

    if (!map.has(engineerId)) {
      map.set(engineerId, {
        engineerId,
        relation,
        projects: [],
      });
    }

    const bucket = map.get(engineerId);
    bucket.relation = relation;

    const exists = bucket.projects.some((p) => p.project?.id === project.id);

    if (!exists) {
      bucket.projects.push({
        relationId: relation.id,
        project,
        relation,
      });
    }

    bucket.account = account;
    bucket.info = additional;
  });

  return Array.from(map.values())
    .map((bucket) => ({
      engineerId: bucket.engineerId,
      relation: bucket.relation || {},
      account: bucket.account || {},
      info: bucket.info || {},
      projects: bucket.projects.sort((a, b) =>
        String(a?.project?.name || "").localeCompare(String(b?.project?.name || ""))
      ),
    }))
    .sort((a, b) =>
      String(a?.account?.full_name || "").localeCompare(
        String(b?.account?.full_name || "")
      )
    );
}

export default function EngineeringDashboardPage() {
  const dispatch = useDispatch();

  const engineerState = useSelector(
    (state) => state.projectEngineer || state.engineerProjects || {}
  );

  const items =
    engineerState.items ||
    engineerState.engineerProjects ||
    engineerState.projectEngineers ||
    [];

  const loading = engineerState.loading;
  const error = engineerState.error;

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignData, setAssignData] = useState({
    engineer_id: "",
    project_id: "",
    start_date: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectBlock, setSelectedProjectBlock] = useState(null);

  const [engineerModalOpen, setEngineerModalOpen] = useState(false);
  const [selectedEngineerBlock, setSelectedEngineerBlock] = useState(null);

  useEffect(() => {
    dispatch(fetchProjectEngineers());
  }, [dispatch]);

  const groupedProjects = useMemo(() => groupProjects(items), [items]);
  const groupedEngineers = useMemo(() => groupEngineers(items), [items]);

  const filteredProjects = useMemo(() => {
    const q = normalizeText(searchTerm);

    return groupedProjects.filter(({ project, engineers }) => {
      const matchesStatus =
        statusFilter === "all" || project?.status === statusFilter;

      const searchable = [
        project?.name,
        project?.description,
        project?.location?.name,
        project?.status,
        ...engineers.flatMap((eng) => [
          eng?.account?.full_name,
          eng?.account?.email,
          eng?.account?.phone,
          eng?.info?.specialization,
        ]),
      ]
        .map(normalizeText)
        .join(" ");

      const matchesSearch = !q || searchable.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [groupedProjects, searchTerm, statusFilter]);

  const filteredEngineers = useMemo(() => {
    const q = normalizeText(searchTerm);

    return groupedEngineers.filter(({ relation, projects }) => {
      const engineerStatusMatch =
        statusFilter === "all" ||
        projects.some((p) => p?.project?.status === statusFilter);

      const searchable = [
        getEngineerName({ engineer: { account: relation?.engineer?.account } }),
        getEngineerEmail({ engineer: { account: relation?.engineer?.account } }),
        getEngineerPhone({ engineer: { account: relation?.engineer?.account } }),
        getEngineerAddress({ engineer: { account: relation?.engineer?.account } }),
        getEngineerSpecialization({ engineer: { additional_info: relation?.engineer?.additional_info } }),
        ...projects.flatMap((p) => [
          p?.project?.name,
          p?.project?.description,
          p?.project?.location?.name,
          p?.project?.status,
        ]),
      ]
        .map(normalizeText)
        .join(" ");

      const matchesSearch = !q || searchable.includes(q);

      return engineerStatusMatch && matchesSearch;
    });
  }, [groupedEngineers, searchTerm, statusFilter]);

  const totalRelations = items.length;
  const totalEngineers = groupedEngineers.length;
  const totalProjects = groupedProjects.length;
  const activeProjects = groupedProjects.filter(
    (item) => item?.project?.status === "in_progress"
  ).length;

  const showInitialLoading = loading && items.length === 0;

  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssign = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      assignEngineerProject({
        engineer_id: Number(assignData.engineer_id),
        project_id: Number(assignData.project_id),
        start_date: assignData.start_date,
      })
    );

    if (assignEngineerProject.fulfilled.match(result)) {
      setAssignOpen(false);
      setAssignData({
        engineer_id: "",
        project_id: "",
        start_date: "",
      });
      dispatch(fetchProjectEngineers());
    }
  };

  const openProjectDetails = (projectBlock) => {
    setSelectedProjectBlock(projectBlock);
    setProjectModalOpen(true);
    setEngineerModalOpen(false);
    setSelectedEngineerBlock(null);
  };

  const openEngineerProjects = (engineerBlock) => {
    setSelectedEngineerBlock(engineerBlock);
    setEngineerModalOpen(true);
    setProjectModalOpen(false);
    setSelectedProjectBlock(null);

    dispatch(fetchProjectsForEngineer(engineerBlock.engineerId));
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setSelectedProjectBlock(null);
  };

  const closeEngineerModal = () => {
    setEngineerModalOpen(false);
    setSelectedEngineerBlock(null);
  };

  const selectedEngineerProjects = useMemo(() => {
    const map = new Map();

    (engineerState.engineerProjects || []).forEach((relation) => {
      const project = relation?.project;
      if (!project?.id) return;

      if (!map.has(project.id)) {
        map.set(project.id, {
          project,
          relations: [],
        });
      }

      const bucket = map.get(project.id);
      bucket.relations.push(relation);
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a?.project?.name || "").localeCompare(String(b?.project?.name || ""))
    );
  }, [engineerState.engineerProjects]);

  const engineerModalLoading = engineerModalOpen && loading;

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="القسم الهندسي"
        title="لوحة القسم الهندسي"
        subtitle="إدارة المشاريع والمهندسين، مع عرض التفاصيل من نفس اللوحة."
        action={
          <Button
            type="button"
            className="primary-action-btn"
            onClick={() => setAssignOpen(true)}
          >
            <Plus size={18} />
            <span>إسناد مشروع</span>
          </Button>
        }
      />

      <div className="engineering-stats-grid">
        <StatCard
          title="الربطات"
          value={totalRelations}
          note="كل السجلات"
          icon={FolderKanban}
        />
        <StatCard
          title="المهندسون"
          value={totalEngineers}
          note="مهندسون مرتبطون"
          icon={Users2}
        />
        <StatCard
          title="المشاريع"
          value={totalProjects}
          note="مشاريع مختلفة"
          icon={CalendarDays}
        />
        <StatCard
          title="نشطة"
          value={activeProjects}
          note="قيد التنفيذ"
          icon={Building2}
        />
      </div>

      <div className="engineering-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="ابحث باسم المشروع أو المهندس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="planned">مخطط</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="stopped">متوقف</option>
            <option value="completed">منجز</option>
          </select>
        </div>
      </div>

      {showInitialLoading ? (
        <div className="project-empty-state">جاري التحميل...</div>
      ) : error ? (
        <div className="project-empty-state" style={{ color: "red" }}>
          {error}
        </div>
      ) : (
        <>
          <div className="engineering-summary-head" style={{ marginTop: 8 }}>
            <h2>المشاريع</h2>
            <span>{filteredProjects.length} مشروع</span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="project-empty-state">لا توجد مشاريع مطابقة.</div>
          ) : (
            <div className="engineering-summary-grid">
              {filteredProjects.map(({ project, relations, engineers }) => {
                const meta = getStatusMeta(project?.status);

                return (
                  <section className="engineering-summary-card" key={project.id}>
                    <div className="engineering-summary-head">
                      <div style={{ minWidth: 0 }}>
                        <h2 style={{ marginBottom: 4 }}>
                          <button
                            type="button"
                            onClick={() => openProjectDetails({ project, relations, engineers })}
                            style={{
                              border: 0,
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                              color: "inherit",
                              font: "inherit",
                              fontWeight: 800,
                              cursor: "pointer",
                              textAlign: "right",
                            }}
                          >
                            {project?.name || "-"}
                          </button>
                        </h2>

                        <span>
                          <MapPinned size={12} style={{ verticalAlign: "middle" }} />{" "}
                          {project?.location?.name || "-"}
                        </span>
                      </div>

                      <div className="row-actions">
                        <StatusBadge status={meta.label} type={meta.type} />
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => openProjectDetails({ project, relations, engineers })}
                          title="عرض تفاصيل المشروع"
                          aria-label="عرض تفاصيل المشروع"
                        >
                          <FolderSearch size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="engineering-preview-list">
                      <div className="preview-row">
                        <div>
                          <strong>الحالة</strong>
                          <p>{meta.label}</p>
                        </div>
                      </div>

                      <div className="preview-row">
                        <div>
                          <strong>الفترة</strong>
                          <p>
                            {formatDate(project?.start_date)} —{" "}
                            {project?.end_date || "مفتوح"}
                          </p>
                        </div>
                      </div>

                      <div className="preview-row">
                        <div>
                          <strong>المهندسون</strong>
                          <p>{engineers.length} مهندس</p>
                        </div>
                      </div>
                    </div>

                    <div className="engineering-preview-list" style={{ marginTop: 12 }}>
                      {engineers.slice(0, 3).map((engineer) => {
                        const engineerMeta = getStatusMeta(
                          engineer?.relation?.project?.status
                        );

                        return (
                          <div className="preview-row" key={`${project.id}-${engineer.engineerId}`}>
                            <div>
                              <strong>
                                <button
                                  type="button"
                                  onClick={() => openEngineerProjects({
                                    engineerId: engineer.engineerId,
                                    relation: engineer.relation,
                                    account: engineer.account,
                                    info: engineer.info,
                                    projects: [],
                                  })}
                                  style={{
                                    border: 0,
                                    background: "transparent",
                                    padding: 0,
                                    margin: 0,
                                    color: "inherit",
                                    font: "inherit",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    textAlign: "right",
                                  }}
                                >
                                  {engineer.account?.full_name || "-"}
                                </button>
                              </strong>

                              <p>
                                {engineer.account?.email || "-"} •{" "}
                                {engineer.account?.phone || "-"}
                              </p>
                            </div>

                            <StatusBadge
                              status={engineerMeta.label}
                              type={engineerMeta.type}
                            />
                          </div>
                        );
                      })}

                      {engineers.length > 3 ? (
                        <div className="preview-row">
                          <div>
                            <strong>المزيد</strong>
                            <p>+ {engineers.length - 3} مهندسين آخرين</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <div className="engineering-summary-head" style={{ marginTop: 20 }}>
            <h2>المهندسون</h2>
            <span>{filteredEngineers.length} مهندس</span>
          </div>

          {filteredEngineers.length === 0 ? (
            <div className="project-empty-state">لا توجد مهندسين مطابقين.</div>
          ) : (
            <div className="engineering-summary-grid">
              {filteredEngineers.map((engineerBlock) => {
                const relation = engineerBlock.relation || {};
                const meta = getStatusMeta(relation?.project?.status);
                const projects = engineerBlock.projects || [];

                return (
                  <section className="engineering-summary-card" key={engineerBlock.engineerId}>
                    <div className="engineering-summary-head">
                      <div style={{ minWidth: 0 }}>
                        <h2 style={{ marginBottom: 4 }}>
                          <button
                            type="button"
                            onClick={() => openEngineerProjects(engineerBlock)}
                            style={{
                              border: 0,
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                              color: "inherit",
                              font: "inherit",
                              fontWeight: 800,
                              cursor: "pointer",
                              textAlign: "right",
                            }}
                          >
                            {engineerBlock.account?.full_name || getEngineerName(relation)}
                          </button>
                        </h2>

                        <span>Engineer ID: {engineerBlock.engineerId}</span>
                      </div>

                      <div className="row-actions">
                        <StatusBadge status={meta.label} type={meta.type} />
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => openEngineerProjects(engineerBlock)}
                          title="عرض المشاريع"
                          aria-label="عرض المشاريع"
                        >
                          <FolderSearch size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="engineering-preview-list">
                      <div className="preview-row">
                        <div>
                          <strong>البريد</strong>
                          <p>{engineerBlock.account?.email || getEngineerEmail(relation)}</p>
                        </div>
                      </div>

                      <div className="preview-row">
                        <div>
                          <strong>الهاتف</strong>
                          <p>{engineerBlock.account?.phone || getEngineerPhone(relation)}</p>
                        </div>
                      </div>

                      <div className="preview-row">
                        <div>
                          <strong>العنوان</strong>
                          <p>{engineerBlock.account?.address || getEngineerAddress(relation)}</p>
                        </div>
                      </div>

                      <div className="preview-row">
                        <div>
                          <strong>التخصص</strong>
                          <p>{engineerBlock.info?.specialization || getEngineerSpecialization(relation)}</p>
                        </div>

                        <div>
                          <strong>الخبرة</strong>
                          <p>{engineerBlock.info?.experience_years ?? getEngineerExperience(relation)} سنة</p>
                        </div>
                      </div>

                      <div className="preview-row">
                        <div>
                          <strong>عدد المشاريع</strong>
                          <p>{projects.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="engineering-preview-list" style={{ marginTop: 12 }}>
                      {projects.slice(0, 2).map((projectBlock) => {
                        const project = projectBlock.project || {};
                        const projectMeta = getStatusMeta(project?.status);

                        return (
                          <div className="preview-row" key={`${engineerBlock.engineerId}-${project.id}`}>
                            <div>
                              <strong>
                                <button
                                  type="button"
                                  onClick={() => openProjectDetails({
                                    project,
                                    relations: projectBlock.relation ? [projectBlock.relation] : [],
                                    engineers: [{
                                      engineerId: engineerBlock.engineerId,
                                      relation: engineerBlock.relation,
                                      account: engineerBlock.account,
                                      info: engineerBlock.info,
                                    }],
                                  })}
                                  style={{
                                    border: 0,
                                    background: "transparent",
                                    padding: 0,
                                    margin: 0,
                                    color: "inherit",
                                    font: "inherit",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    textAlign: "right",
                                  }}
                                >
                                  {project?.name || "-"}
                                </button>
                              </strong>

                              <p>{project?.location?.name || "-"}</p>
                            </div>

                            <StatusBadge
                              status={projectMeta.label}
                              type={projectMeta.type}
                            />
                          </div>
                        );
                      })}

                      {projects.length > 2 ? (
                        <div className="preview-row">
                          <div>
                            <strong>المزيد</strong>
                            <p>+ {projects.length - 2} مشاريع أخرى</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="إسناد مشروع"
        description="أدخل معرف المهندس والمشروع وتاريخ البدء."
        size="lg"
      >
        <form className="engineering-form" onSubmit={handleAssign}>
          <div className="engineering-form-grid">
            <Field
              type="number"
              name="engineer_id"
              value={assignData.engineer_id}
              onChange={handleAssignChange}
              label="Engineer ID"
              iconClass="fa-solid fa-user"
              error=""
            />
            <Field
              type="number"
              name="project_id"
              value={assignData.project_id}
              onChange={handleAssignChange}
              label="Project ID"
              iconClass="fa-solid fa-folder"
              error=""
            />
            <Field
              type="date"
              name="start_date"
              value={assignData.start_date}
              onChange={handleAssignChange}
              label="Start Date"
              iconClass="fa-solid fa-calendar"
              error=""
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => setAssignOpen(false)}
            >
              إلغاء
            </Button>

            <Button type="submit" className="primary-action-btn">
              <Plus size={18} />
              <span>تعيين</span>
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={projectModalOpen}
        onClose={closeProjectModal}
        title={selectedProjectBlock?.project?.name || "تفاصيل المشروع"}
        description={
          selectedProjectBlock?.project?.location?.name
            ? `الموقع: ${selectedProjectBlock.project.location.name}`
            : ""
        }
        size="lg"
      >
        {selectedProjectBlock ? (
          <div style={{ display: "grid", gap: 14, maxHeight: "70vh", overflowY: "auto", paddingRight: 6 }}>
            <div className="engineering-summary-card" style={{ padding: 16, borderRadius: 18 }}>
              <div className="engineering-summary-head">
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 4 }}>
                    {selectedProjectBlock.project?.name || "-"}
                  </h2>
                  <span>
                    <MapPinned size={12} style={{ verticalAlign: "middle" }} />{" "}
                    {selectedProjectBlock.project?.location?.name || "-"}
                  </span>
                </div>

                <StatusBadge
                  status={getStatusMeta(selectedProjectBlock.project?.status).label}
                  type={getStatusMeta(selectedProjectBlock.project?.status).type}
                />
              </div>

              <div className="engineering-preview-list">
                <div className="preview-row">
                  <div>
                    <strong>الوصف</strong>
                    <p>{selectedProjectBlock.project?.description || "لا يوجد وصف للمشروع."}</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>الفترة</strong>
                    <p>
                      {formatDate(selectedProjectBlock.project?.start_date)} —{" "}
                      {selectedProjectBlock.project?.end_date || "مفتوح"}
                    </p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>عدد المهندسين</strong>
                    <p>{selectedProjectBlock.engineers?.length || 0}</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>عدد الربطات</strong>
                    <p>{selectedProjectBlock.relations?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="engineering-summary-card" style={{ padding: 16, borderRadius: 18 }}>
              <div className="engineering-summary-head">
                <h2 style={{ fontSize: 18 }}>المهندسون المرتبطون</h2>
                <span>{selectedProjectBlock.engineers?.length || 0} مهندس</span>
              </div>

              <div className="engineering-preview-list">
                {(selectedProjectBlock.engineers || []).map((engineer) => {
                  const engineerMeta = getStatusMeta(
                    selectedProjectBlock.project?.status
                  );

                  return (
                    <div className="preview-row" key={`${selectedProjectBlock.project.id}-${engineer.engineerId}`}>
                      <div>
                        <strong>
                          <button
                            type="button"
                            onClick={() => openEngineerProjects({
                              engineerId: engineer.engineerId,
                              relation: engineer.relation,
                              account: engineer.account,
                              info: engineer.info,
                              projects: [],
                            })}
                            style={{
                              border: 0,
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                              color: "inherit",
                              font: "inherit",
                              fontWeight: 800,
                              cursor: "pointer",
                              textAlign: "right",
                            }}
                          >
                            {engineer.account?.full_name || "-"}
                          </button>
                        </strong>
                        <p>
                          {engineer.account?.email || "-"} •{" "}
                          {engineer.account?.phone || "-"}
                        </p>
                      </div>

                      <StatusBadge
                        status={engineerMeta.label}
                        type={engineerMeta.type}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {Array.isArray(selectedProjectBlock.project?.buildings) &&
            selectedProjectBlock.project.buildings.length > 0 ? (
              <div className="engineering-summary-card" style={{ padding: 16, borderRadius: 18 }}>
                <div className="engineering-summary-head">
                  <h2 style={{ fontSize: 18 }}>المباني</h2>
                  <span>{selectedProjectBlock.project.buildings.length} مبنى</span>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {selectedProjectBlock.project.buildings.map((building) => {
                    const buildingMeta = getStatusMeta(building?.status);

                    return (
                      <div
                        key={building.id}
                        className="engineering-summary-card"
                        style={{ padding: 14, borderRadius: 16 }}
                      >
                        <div className="engineering-summary-head">
                          <div>
                            <h2 style={{ fontSize: 16, marginBottom: 4 }}>
                              {building?.building_number || "-"}
                            </h2>
                            <span>{building?.floors_count || "-"} طابق</span>
                          </div>

                          <StatusBadge
                            status={buildingMeta.label}
                            type={buildingMeta.type}
                          />
                        </div>

                        <div className="engineering-preview-list">
                          <div className="preview-row">
                            <div>
                              <strong>الوصف</strong>
                              <p>{building?.description || "لا يوجد وصف"}</p>
                            </div>
                          </div>

                          <div className="preview-row">
                            <div>
                              <strong>الربط</strong>
                              <p>{building?.project_id || selectedProjectBlock.project.id}</p>
                            </div>
                          </div>
                        </div>

                        {Array.isArray(building?.attachments) &&
                        building.attachments.length > 0 ? (
                          <div style={{ marginTop: 12 }}>
                            <div className="engineering-summary-head">
                              <h2 style={{ fontSize: 16 }}>المرفقات</h2>
                              <span>{building.attachments.length} ملف</span>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(120px, 1fr))",
                                gap: 10,
                              }}
                            >
                              {building.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "grid",
                                    gap: 8,
                                    textDecoration: "none",
                                    border: "1px solid var(--dash-line)",
                                    borderRadius: 14,
                                    padding: 10,
                                    background: "var(--dash-blank-bg)",
                                  }}
                                >
                                  {attachment.type === "image" ? (
                                    <img
                                      src={attachment.url}
                                      alt={
                                        attachment.original_name ||
                                        attachment.file_name ||
                                        "attachment"
                                      }
                                      style={{
                                        width: "100%",
                                        aspectRatio: "1 / 1",
                                        objectFit: "cover",
                                        borderRadius: 10,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "100%",
                                        aspectRatio: "1 / 1",
                                        borderRadius: 10,
                                        display: "grid",
                                        placeItems: "center",
                                        border: "1px dashed var(--dash-line)",
                                        color: "var(--dash-muted)",
                                        fontSize: 12,
                                        padding: 8,
                                        textAlign: "center",
                                      }}
                                    >
                                      <Paperclip size={18} />
                                    </div>
                                  )}

                                  <span
                                    style={{
                                      color: "var(--dash-text)",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {attachment.original_name ||
                                      attachment.file_name ||
                                      "file"}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={engineerModalOpen}
        onClose={closeEngineerModal}
        title={
          selectedEngineerBlock?.account?.full_name ||
          getEngineerName(selectedEngineerBlock?.relation || {})
        }
        description={
          selectedEngineerBlock
            ? `Engineer ID: ${selectedEngineerBlock.engineerId} • ${
                selectedEngineerBlock.info?.specialization ||
                getEngineerSpecialization(selectedEngineerBlock?.relation || {})
              }`
            : ""
        }
        size="lg"
      >
        {engineerModalLoading ? (
          <div className="project-empty-state">جاري تحميل المشاريع...</div>
        ) : selectedEngineerBlock ? (
          <div style={{ display: "grid", gap: 14, maxHeight: "70vh", overflowY: "auto", paddingRight: 6 }}>
            <div className="engineering-summary-card" style={{ padding: 16, borderRadius: 18 }}>
              <div className="engineering-summary-head">
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 4 }}>
                    {selectedEngineerBlock.account?.full_name ||
                      getEngineerName(selectedEngineerBlock.relation || {})}
                  </h2>
                  <span>Engineer ID: {selectedEngineerBlock.engineerId}</span>
                </div>

                <StatusBadge
                  status={getStatusMeta(selectedEngineerBlock.relation?.project?.status).label}
                  type={getStatusMeta(selectedEngineerBlock.relation?.project?.status).type}
                />
              </div>

              <div className="engineering-preview-list">
                <div className="preview-row">
                  <div>
                    <strong>البريد</strong>
                    <p>{selectedEngineerBlock.account?.email || getEngineerEmail(selectedEngineerBlock.relation || {})}</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>الهاتف</strong>
                    <p>{selectedEngineerBlock.account?.phone || getEngineerPhone(selectedEngineerBlock.relation || {})}</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>العنوان</strong>
                    <p>{selectedEngineerBlock.account?.address || getEngineerAddress(selectedEngineerBlock.relation || {})}</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>التخصص</strong>
                    <p>{selectedEngineerBlock.info?.specialization || getEngineerSpecialization(selectedEngineerBlock.relation || {})}</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>الخبرة</strong>
                    <p>{selectedEngineerBlock.info?.experience_years ?? getEngineerExperience(selectedEngineerBlock.relation || {})} سنة</p>
                  </div>
                </div>

                <div className="preview-row">
                  <div>
                    <strong>عدد المشاريع</strong>
                    <p>{selectedEngineerProjects.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="engineering-summary-head">
              <h2>المشاريع المرتبطة</h2>
              <span>{selectedEngineerProjects.length} مشروع</span>
            </div>

            {selectedEngineerProjects.length === 0 ? (
              <div className="project-empty-state">لا توجد مشاريع لهذا المهندس.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {selectedEngineerProjects.map(({ project, relations }) => {
                  const meta = getStatusMeta(project?.status);

                  return (
                    <div
                      key={project.id}
                      className="engineering-summary-card"
                      style={{ padding: 14, borderRadius: 16 }}
                    >
                      <div className="engineering-summary-head">
                        <div>
                          <h2 style={{ fontSize: 16, marginBottom: 4 }}>
                            <button
                              type="button"
                              onClick={() =>
                                openProjectDetails({
                                  project,
                                  relations,
                                  engineers: (relations || []).map((relation) => ({
                                    engineerId: getEngineerIdFromRelation(relation),
                                    relation,
                                    account: relation?.engineer?.account || {},
                                    info: relation?.engineer?.additional_info || {},
                                  })),
                                })
                              }
                              style={{
                                border: 0,
                                background: "transparent",
                                padding: 0,
                                margin: 0,
                                color: "inherit",
                                font: "inherit",
                                fontWeight: 800,
                                cursor: "pointer",
                                textAlign: "right",
                              }}
                            >
                              {project?.name || "-"}
                            </button>
                          </h2>
                          <span>{project?.location?.name || "-"}</span>
                        </div>

                        <div className="row-actions">
                          <StatusBadge status={meta.label} type={meta.type} />
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() =>
                              openProjectDetails({
                                project,
                                relations,
                                engineers: (relations || []).map((relation) => ({
                                  engineerId: getEngineerIdFromRelation(relation),
                                  relation,
                                  account: relation?.engineer?.account || {},
                                  info: relation?.engineer?.additional_info || {},
                                })),
                              })
                            }
                            title="عرض تفاصيل المشروع"
                            aria-label="عرض تفاصيل المشروع"
                          >
                            <FolderSearch size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="engineering-preview-list">
                        <div className="preview-row">
                          <div>
                            <strong>الفترة</strong>
                            <p>
                              {formatDate(project?.start_date)} —{" "}
                              {project?.end_date || "مفتوح"}
                            </p>
                          </div>
                        </div>

                        <div className="preview-row">
                          <div>
                            <strong>عدد الربطات</strong>
                            <p>{relations.length}</p>
                          </div>
                        </div>

                        <div className="preview-row">
                          <div>
                            <strong>الموقع</strong>
                            <p>{project?.location?.name || "-"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}