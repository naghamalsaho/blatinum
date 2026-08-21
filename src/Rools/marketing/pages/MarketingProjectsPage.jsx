import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  Home,
  MapPin,
  Layers3,
  Plus,
  Search,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Coins,
  PencilLine,
  Trash2,
  Eye,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import Field from "@/shared/components/Field";
import ErrorMessage from "@/shared/ui/ErrorMessage";

import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../features/projects/model/project.thunks";
import {
  fetchBuildings,
  fetchBuildingsByProject,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from "../features/buildings/model/building.thunks";
import {
  fetchUnits,
  fetchUnitsByBuilding,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../features/units/model/unit.thunks";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../features/locations/model/location.thunks";

import { validateProjectForm } from "../features/projects/validation/project.validation";
import { validateBuildingForm } from "../features/buildings/validation/building.validation";
import { validateUnitForm } from "../features/units/validation/unit.validation";
import { validateLocationForm } from "../features/locations/validation/location.validation";

import "../styles/marketing-projects.css";

const PROJECT_STATUS_LABELS = {
  in_progress: "قيد التنفيذ",
  planned: "مخطط",
  completed: "مكتمل",
  pending: "قيد الانتظار",
  cancelled: "ملغي",
  stopped: "متوقف",
};

const UNIT_STATUS_LABELS = {
  available: "متاح",
  reserved: "محجوز",
  sold: "مباع",
  maintenance: "صيانة",
  inactive: "غير متاح",
};

const UNIT_TYPE_LABELS = {
  vip: "VIP",
  social: "اجتماعي",
  commercial: "تجاري",
  office: "مكتبي",
};

const EMPTY_PROJECT_FORM = {
  name: "",
  description: "",
  location_id: "",
  latitude: "",
  longitude: "",
  radius_meters: "",
  status: "in_progress",
  start_date: "",
  attachment: null,
};

const EMPTY_BUILDING_FORM = {
  project_id: "",
  building_number: "",
  floors_count: "",
  status: "in_progress",
  display_name: "",
  description: "",
  latitude: "",
  longitude: "",
  start_date: "",
  radius_meters: "",
  attachment: null,
};

const EMPTY_UNIT_FORM = {
  building_id: "",
  unit_number: "",
  floor: "",
  area: "",
  type: "social",
  price: "",
  status: "available",
  attachment: null,
};

const EMPTY_LOCATION_FORM = {
  name: "",
  type: "city",
  parent_id: "",
};

function extractName(value) {
  if (Array.isArray(value)) {
    return (
      value.find((item) => item.ar)?.ar ||
      value.find((item) => item.en)?.en ||
      "-"
    );
  }
  return value || "-";
}

function getLocationLabel(location) {
  if (!location) return "-";
  const currentName = extractName(location.name);
  const parentName = extractName(location.parent?.name);
  return `${currentName} / ${parentName}`;
}

function isImageFile(urlOrName = "") {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(urlOrName);
}

// 🎨 دالة تحديد كلاس الشارة (Status Badge) لتطبيق نفس تصميم الخدمات
function getStatusBadgeClass(status) {
  switch (status) {
    case "in_progress":
    case "available":
    case "active":
      return "status-badge status-in_progress";
    case "completed":
    case "reserved":
    case "vip":
      return "status-badge status-completed";
    case "planned":
    case "pending":
    case "office":
    case "social":
      return "status-badge status-planned";
    case "stopped":
    case "cancelled":
    case "inactive":
    case "maintenance":
      return "status-badge status-stopped";
    case "sold":
    case "commercial":
      return "status-badge status-sold";
    default:
      return "status-badge status-planned";
  }
}

function AttachmentViewer({ attachment, title = "المرفق" }) {
  if (!attachment || !attachment.url) return null;

  const isImg = isImageFile(attachment.url || attachment.name);

  if (isImg) {
    return (
      <div className="details-hero-image">
        <img src={attachment.url} alt={title} />
      </div>
    );
  }

  return (
    <div className="attachment-file-card">
      <div className="attachment-file-info">
        <FileText size={28} className="file-icon" />
        <div>
          <span className="file-name">{attachment.name || title || "ملف مرفق"}</span>
          <span className="file-type">مستند / ملف تنفيذي</span>
        </div>
      </div>
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="attachment-download-btn"
      >
        <ExternalLink size={16} />
        عرض / تحميل الملف
      </a>
    </div>
  );
}

export default function MarketingProjectsPage() {
  const dispatch = useDispatch();

  const { projects, loading: projectsLoading, creating: creatingProject } =
    useSelector((state) => state.projects);

  const {
    buildings,
    projectBuildings,
    loading: buildingsLoading,
    projectLoading,
  } = useSelector((state) => state.buildings);

  const {
    units,
    buildingUnits,
    loading: unitsLoading,
    buildingLoading: buildingUnitsLoading,
  } = useSelector((state) => state.units);

  const {
    locations,
    loading: locationsLoading,
    creating: creatingLocation,
    updating: updatingLocation,
  } = useSelector((state) => state.locations);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  const [showAllBuildings, setShowAllBuildings] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);

  const [viewingDetails, setViewingDetails] = useState({
    type: null,
    data: null,
  });

  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openBuildingModal, setOpenBuildingModal] = useState(false);
  const [openUnitModal, setOpenUnitModal] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);

  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
  const [buildingForm, setBuildingForm] = useState(EMPTY_BUILDING_FORM);
  const [unitForm, setUnitForm] = useState(EMPTY_UNIT_FORM);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION_FORM);

  const [projectErrors, setProjectErrors] = useState({});
  const [buildingErrors, setBuildingErrors] = useState({});
  const [unitErrors, setUnitErrors] = useState({});
  const [locationErrors, setLocationErrors] = useState({});

  const activeProjectId = selectedProjectId ?? projects[0]?.id ?? null;

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [projects, activeProjectId]
  );

  const currentBuildings = showAllBuildings ? buildings : projectBuildings;

  const activeBuildingId =
    selectedBuildingId &&
    currentBuildings.some((building) => building.id === selectedBuildingId)
      ? selectedBuildingId
      : currentBuildings[0]?.id ?? null;

  const selectedBuilding = useMemo(
    () => currentBuildings.find((building) => building.id === activeBuildingId),
    [currentBuildings, activeBuildingId]
  );

  const currentUnits = showAllUnits ? units : buildingUnits;

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchBuildings());
    dispatch(fetchUnits());
    dispatch(fetchLocations());
  }, [dispatch]);

  useEffect(() => {
    if (activeProjectId && !showAllBuildings) {
      dispatch(fetchBuildingsByProject(activeProjectId));
    }
  }, [activeProjectId, showAllBuildings, dispatch]);

  useEffect(() => {
    if (activeBuildingId && !showAllUnits) {
      dispatch(fetchUnitsByBuilding(activeBuildingId));
    }
  }, [activeBuildingId, showAllUnits, dispatch]);

  const stats = useMemo(() => {
    const totalBuildingsFromProjects = projects.reduce(
      (sum, project) => sum + (project.buildings?.length || 0),
      0
    );

    const activeProjects = projects.filter(
      (project) => project.status === "in_progress"
    ).length;

    const buildingsCount = buildings.length || totalBuildingsFromProjects;

    return {
      projectsCount: projects.length,
      buildingsCount,
      unitsCount: units.length || 0,
      activeProjects,
    };
  }, [projects, buildings, units]);

  const unitCountsByBuilding = useMemo(() => {
    const map = new Map();
    units.forEach((unit) => {
      const buildingId = unit.building_id || unit.building?.id;
      if (!buildingId) return;
      map.set(buildingId, (map.get(buildingId) || 0) + 1);
    });
    return map;
  }, [units]);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((project) => {
      const locationName = project.location?.name || "";
      return [project.name, project.description, locationName, project.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [projects, searchTerm]);

  const filteredUnits = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return currentUnits;

    return currentUnits.filter((unit) => {
      const buildingName = unit.building?.building_number || "";
      const projectName = unit.building?.project?.name || "";

      const searchable = [
        unit.unit_number,
        unit.description,
        unit.type,
        unit.status,
        unit.floor,
        unit.area,
        unit.rooms_count,
        unit.price,
        buildingName,
        projectName,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [currentUnits, searchTerm]);

  const filteredLocations = useMemo(() => {
    const q = locationSearchTerm.trim().toLowerCase();
    if (!q) return locations;

    return locations.filter((location) => {
      const label = [
        extractName(location.name),
        location.type,
        extractName(location.parent?.name),
        location.parent_id,
      ]
        .join(" ")
        .toLowerCase();

      return label.includes(q);
    });
  }, [locations, locationSearchTerm]);

  const formatProjectStatus = (status) =>
    PROJECT_STATUS_LABELS[status] || status || "-";

  const formatUnitStatus = (status) =>
    UNIT_STATUS_LABELS[status] || status || "-";

  const formatUnitType = (type) => UNIT_TYPE_LABELS[type] || type || "-";

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedBuildingId(null);
    setShowAllBuildings(false);
    setShowAllUnits(false);
  };

  const handleBuildingSelect = (buildingId) => {
    setSelectedBuildingId(buildingId);
    setShowAllUnits(false);
    dispatch(fetchUnitsByBuilding(buildingId));
  };

  const handleShowAllBuildings = () => {
    setShowAllBuildings(true);
    setSelectedBuildingId(null);
    dispatch(fetchBuildings());
  };

  const handleShowAllUnits = () => {
    setShowAllUnits(true);
    setSelectedBuildingId(null);
    dispatch(fetchUnits());
  };

  const handleProjectFormChange = (field, value) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }));
    setProjectErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBuildingFormChange = (field, value) => {
    setBuildingForm((prev) => ({ ...prev, [field]: value }));
    setBuildingErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleUnitFormChange = (field, value) => {
    setUnitForm((prev) => ({ ...prev, [field]: value }));
    setUnitErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleLocationFormChange = (field, value) => {
    setLocationForm((prev) => ({ ...prev, [field]: value }));
    setLocationErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const resetProjectForm = () => {
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectErrors({});
  };

  const resetBuildingForm = () => {
    setBuildingForm(EMPTY_BUILDING_FORM);
    setBuildingErrors({});
  };

  const resetUnitForm = () => {
    setUnitForm(EMPTY_UNIT_FORM);
    setUnitErrors({});
  };

  const resetLocationForm = () => {
    setLocationForm(EMPTY_LOCATION_FORM);
    setLocationErrors({});
  };

  const handleFileChange = (file) => {
    setProjectForm((prev) => ({ ...prev, attachment: file || null }));
    setProjectErrors((prev) => ({ ...prev, attachment: "" }));
  };

  const handleBuildingFileChange = (file) => {
    setBuildingForm((prev) => ({ ...prev, attachment: file || null }));
    setBuildingErrors((prev) => ({ ...prev, attachment: "" }));
  };

  const handleUnitFileChange = (file) => {
    setUnitForm((prev) => ({ ...prev, attachment: file || null }));
    setUnitErrors((prev) => ({ ...prev, attachment: "" }));
  };

  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    resetProjectForm();
    setOpenProjectModal(true);
  };

  const openEditProjectModal = (project) => {
    setEditingProjectId(String(project.id));
    setProjectForm({
      name: project.name || "",
      description: project.description || "",
      location_id: String(project.location?.id || ""),
      latitude: String(project.coordinates?.latitude ?? ""),
      longitude: String(project.coordinates?.longitude ?? ""),
      radius_meters: String(project.coordinates?.radius ?? ""),
      status: project.status || "in_progress",
      start_date: project.start_date || "",
      attachment: null,
    });
    setProjectErrors({});
    setOpenProjectModal(true);
  };

  const closeProjectModal = () => {
    setOpenProjectModal(false);
    setEditingProjectId(null);
    resetProjectForm();
  };

  const openCreateBuildingModal = () => {
    setEditingBuildingId(null);
    setBuildingForm({
      ...EMPTY_BUILDING_FORM,
      project_id: String(activeProjectId || ""),
    });
    setBuildingErrors({});
    setOpenBuildingModal(true);
  };

  const openEditBuildingModal = (building) => {
    setEditingBuildingId(String(building.id));
    setBuildingForm({
      project_id: String(building.project_id || ""),
      building_number: building.building_number || "",
      floors_count: String(building.floors_count ?? ""),
      status: building.status || "in_progress",
      display_name: "",
      description: building.description || "",
      latitude: String(building.coordinates?.latitude ?? ""),
      longitude: String(building.coordinates?.longitude ?? ""),
      start_date: building.start_date || "",
      radius_meters: String(building.coordinates?.radius ?? ""),
      attachment: null,
    });
    setBuildingErrors({});
    setOpenBuildingModal(true);
  };

  const closeBuildingModal = () => {
    setOpenBuildingModal(false);
    setEditingBuildingId(null);
    resetBuildingForm();
  };

  const openCreateUnitModal = () => {
    setEditingUnitId(null);
    setUnitForm({
      ...EMPTY_UNIT_FORM,
      building_id: String(activeBuildingId || ""),
    });
    setUnitErrors({});
    setOpenUnitModal(true);
  };

  const openEditUnitModal = (unit) => {
    setEditingUnitId(String(unit.id));
    setUnitForm({
      building_id: String(unit.building_id || unit.building?.id || ""),
      unit_number: unit.unit_number || "",
      floor: String(unit.floor ?? ""),
      area: String(unit.area ?? ""),
      type: unit.type || "social",
      price: String(unit.price ?? ""),
      status: unit.status || "available",
      attachment: null,
    });
    setUnitErrors({});
    setOpenUnitModal(true);
  };

  const closeUnitModal = () => {
    setOpenUnitModal(false);
    setEditingUnitId(null);
    resetUnitForm();
  };

  const openCreateLocationModal = () => {
    setEditingLocationId(null);
    resetLocationForm();
    setOpenLocationModal(true);
  };

  const openEditLocationModal = (location) => {
    setEditingLocationId(String(location.id));
    setLocationForm({
      name: extractName(location.name),
      type: location.type || "city",
      parent_id: String(location.parent_id || ""),
    });
    setLocationErrors({});
    setOpenLocationModal(true);
  };

  const closeLocationModal = () => {
    setOpenLocationModal(false);
    setEditingLocationId(null);
    resetLocationForm();
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();

    const errors = validateProjectForm(
      projectForm,
      editingProjectId ? "edit" : "create"
    );

    setProjectErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingProjectId) {
      const payload = {
        name: projectForm.name,
        status: projectForm.status,
        latitude: Number(projectForm.latitude || 0),
        longitude: Number(projectForm.longitude || 0),
        radius_meters: Number(projectForm.radius_meters || 0),
      };

      const result = await dispatch(
        updateProject({
          id: Number(editingProjectId),
          payload,
        })
      );

      if (updateProject.fulfilled.match(result)) {
        closeProjectModal();
        dispatch(fetchProjects());
      }
      return;
    }

    const fd = new FormData();
    fd.append("name", projectForm.name);
    fd.append("description", projectForm.description);
    fd.append("location_id", projectForm.location_id);
    fd.append("latitude", projectForm.latitude);
    fd.append("longitude", projectForm.longitude);
    fd.append("radius_meters", projectForm.radius_meters);
    fd.append("status", projectForm.status);
    fd.append("start_date", projectForm.start_date);

    if (projectForm.attachment) {
      fd.append("attachments[0][file]", projectForm.attachment);
    }

    const result = await dispatch(createProject(fd));

    if (createProject.fulfilled.match(result)) {
      closeProjectModal();
      dispatch(fetchProjects());
    }
  };

  const handleDeleteProject = async (id) => {
    const ok = window.confirm("هل تريدين حذف المشروع؟");
    if (!ok) return;

    const result = await dispatch(deleteProject(id));
    if (deleteProject.fulfilled.match(result)) {
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setSelectedBuildingId(null);
        setShowAllBuildings(false);
        setShowAllUnits(false);
      }
      dispatch(fetchProjects());
      dispatch(fetchBuildings());
      dispatch(fetchUnits());
    }
  };

  const handleSubmitBuilding = async (e) => {
    e.preventDefault();

    const errors = validateBuildingForm(
      buildingForm,
      editingBuildingId ? "edit" : "create"
    );

    setBuildingErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const fd = new FormData();
    fd.append("project_id", buildingForm.project_id);
    fd.append("building_number", buildingForm.building_number);
    fd.append("floors_count", buildingForm.floors_count);
    fd.append("status", buildingForm.status);
    fd.append("description", buildingForm.description);
    fd.append("latitude", buildingForm.latitude);
    fd.append("longitude", buildingForm.longitude);
    fd.append("start_date", buildingForm.start_date);
    fd.append("radius_meters", buildingForm.radius_meters);

    if (buildingForm.attachment) {
      fd.append("attachments[0][file]", buildingForm.attachment);
      fd.append(
        "attachments[0][custom_properties][display_name]",
        buildingForm.display_name || buildingForm.attachment.name
      );
    }

    if (editingBuildingId) {
      const result = await dispatch(
        updateBuilding({
          id: Number(editingBuildingId),
          payload: fd,
        })
      );

      if (updateBuilding.fulfilled.match(result)) {
        closeBuildingModal();
        dispatch(fetchBuildings());
        dispatch(fetchBuildingsByProject(Number(buildingForm.project_id)));
      }
      return;
    }

    const result = await dispatch(createBuilding(fd));

    if (createBuilding.fulfilled.match(result)) {
      closeBuildingModal();
      dispatch(fetchBuildings());
      dispatch(fetchBuildingsByProject(Number(buildingForm.project_id)));
    }
  };

  const handleDeleteBuilding = async (id) => {
    const ok = window.confirm("هل تريدين حذف البناء؟");
    if (!ok) return;

    const result = await dispatch(deleteBuilding(id));
    if (deleteBuilding.fulfilled.match(result)) {
      if (selectedBuildingId === id) {
        setSelectedBuildingId(null);
        setShowAllUnits(false);
      }
      dispatch(fetchBuildings());
      dispatch(fetchUnits());
    }
  };

  const handleSubmitUnit = async (e) => {
    e.preventDefault();

    const errors = validateUnitForm(unitForm);
    setUnitErrors(errors);
    if (Object.keys(errors).length > 0) return;

    let payload;
    if (unitForm.attachment) {
      const fd = new FormData();
      fd.append("building_id", unitForm.building_id);
      fd.append("unit_number", unitForm.unit_number);
      fd.append("floor", unitForm.floor || 0);
      fd.append("area", unitForm.area || 0);
      fd.append("type", unitForm.type);
      fd.append("price", unitForm.price || 0);
      fd.append("status", unitForm.status);
      fd.append("attachments[0][file]", unitForm.attachment);
      payload = fd;
    } else {
      payload = {
        building_id: Number(unitForm.building_id),
        unit_number: unitForm.unit_number,
        floor: Number(unitForm.floor || 0),
        area: Number(unitForm.area || 0),
        type: unitForm.type,
        price: Number(unitForm.price || 0),
        status: unitForm.status,
      };
    }

    if (editingUnitId) {
      const result = await dispatch(
        updateUnit({
          id: Number(editingUnitId),
          payload,
        })
      );

      if (updateUnit.fulfilled.match(result)) {
        closeUnitModal();
        dispatch(fetchUnits());
        dispatch(fetchUnitsByBuilding(Number(unitForm.building_id)));
      }
      return;
    }

    const result = await dispatch(createUnit(payload));

    if (createUnit.fulfilled.match(result)) {
      closeUnitModal();
      dispatch(fetchUnits());
      dispatch(fetchUnitsByBuilding(Number(unitForm.building_id)));
    }
  };

  const handleDeleteUnit = async (id) => {
    const ok = window.confirm("هل تريدين حذف الوحدة؟");
    if (!ok) return;

    const result = await dispatch(deleteUnit(id));
    if (deleteUnit.fulfilled.match(result)) {
      dispatch(fetchUnits());
    }
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();

    const errors = validateLocationForm(locationForm);
    setLocationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: [
        { ar: locationForm.name },
        { en: locationForm.name },
      ],
      type: locationForm.type,
      parent_id: Number(locationForm.parent_id),
    };

    if (editingLocationId) {
      const result = await dispatch(
        updateLocation({
          id: Number(editingLocationId),
          payload,
        })
      );

      if (updateLocation.fulfilled.match(result)) {
        closeLocationModal();
        dispatch(fetchLocations());
      }
      return;
    }

    const result = await dispatch(createLocation(payload));

    if (createLocation.fulfilled.match(result)) {
      closeLocationModal();
      dispatch(fetchLocations());
    }
  };

  const handleDeleteLocation = async (id) => {
    const ok = window.confirm("هل تريدين حذف الموقع؟");
    if (!ok) return;

    const result = await dispatch(deleteLocation(id));
    if (deleteLocation.fulfilled.match(result)) {
      dispatch(fetchLocations());
    }
  };

  return (
    <div className="projects-page" dir="rtl">
      {/* شبكة الإحصائيات - مطابقة تماماً لوجهة الخدمات */}
      <section className="legal-stats-grid">
        <StatCard title="المشاريع" value={String(stats.projectsCount)} icon={Layers3} />
        <StatCard title="الأبنية" value={String(stats.buildingsCount)} icon={Building2} />
        <StatCard title="الوحدات" value={String(stats.unitsCount)} icon={Home} />
       
      </section>

      <section className="projects-layout">
        <article className="projects-panel projects-list-panel">
          <div className="projects-panel-head">
            <div>
              <h2>المشاريع</h2>
              <p>اضغط على أي مشروع لعرض أبنيته ووحداته</p>
            </div>

            <Button
              className="projects-secondary-btn"
              onClick={openCreateProjectModal}
            >
              <Plus size={16} />
              إضافة مشروع
            </Button>
          </div>

          <div className="projects-toolbar">
            <div className="projects-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث عن مشروع أو بناء أو وحدة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="projects-cards-scroll">
            <div className="projects-cards-list">
              {projectsLoading ? (
                <div className="projects-empty">جاري تحميل المشاريع...</div>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const isActive = project.id === activeProjectId;
                  const buildingsCount = project.buildings?.length || 0;

                  return (
                    <article
                      key={project.id}
                      className={`project-card ${isActive ? "active" : ""}`}
                      onClick={() => handleProjectSelect(project.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="project-card-top">
                        <div>
                          <h3>{project.name}</h3>
                          <p>{project.description || "لا يوجد وصف"}</p>
                        </div>

                        <div
                          className="project-card-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="card-icon-btn"
                            onClick={() =>
                              setViewingDetails({
                                type: "project",
                                data: project,
                              })
                            }
                            title="عرض تفاصيل المشروع"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className="card-icon-btn"
                            onClick={() => openEditProjectModal(project)}
                            title="تعديل المشروع"
                          >
                            <PencilLine size={15} />
                          </button>

                          <button
                            type="button"
                            className="card-icon-btn danger"
                            onClick={() => handleDeleteProject(project.id)}
                            title="حذف المشروع"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="project-card-meta">
                        <span>{extractName(project.location?.name) || "-"}</span>
                        <span>{buildingsCount} بناء</span>
                        <span className={getStatusBadgeClass(project.status)}>
                          {formatProjectStatus(project.status)}
                        </span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="projects-empty">لا توجد مشاريع مطابقة للبحث</div>
              )}
            </div>
          </div>
        </article>

        <div className="projects-column-stack">
          <article className="projects-panel buildings-panel">
            <div className="projects-panel-head">
              <div>
                <h2>الأبنية</h2>
                <p>
                  {showAllBuildings
                    ? "عرض كل الأبنية"
                    : selectedProject
                    ? `أبنية المشروع: ${selectedProject.name}`
                    : "اختر مشروعاً لعرض أبنيته"}
                </p>
              </div>

              <div className="projects-panel-actions">
                <Button
                  className="projects-secondary-btn"
                  onClick={openCreateBuildingModal}
                >
                  <Plus size={16} />
                  إضافة بناء
                </Button>

                <Button
                  className={`projects-secondary-btn ${
                    showAllBuildings ? "is-active" : ""
                  }`}
                  onClick={handleShowAllBuildings}
                >
                  كل الأبنية
                </Button>

                <Button
                  className={`projects-secondary-btn ${
                    !showAllBuildings ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setShowAllBuildings(false);
                    setSelectedBuildingId(null);
                  }}
                >
                  أبنية المشروع
                </Button>
              </div>
            </div>

            <div className="buildings-scroll">
              <div className="buildings-grid">
                {projectLoading || buildingsLoading ? (
                  <div className="projects-empty">جاري تحميل الأبنية...</div>
                ) : currentBuildings.length > 0 ? (
                  currentBuildings.map((building) => {
                    const isActive = building.id === selectedBuildingId;
                    const buildingUnitsCount =
                      unitCountsByBuilding.get(building.id) || 0;
                    const firstAttach = building.attachments?.[0];

                    return (
                      <article
                        key={building.id}
                        className={`building-card ${isActive ? "active" : ""}`}
                        onClick={() => handleBuildingSelect(building.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="building-card-visual">
                          {firstAttach?.url ? (
                            isImageFile(firstAttach.url) ? (
                              <img
                                src={firstAttach.url}
                                alt={building.building_number}
                              />
                            ) : (
                              <FileText size={28} />
                            )
                          ) : (
                            <ImageIcon size={26} />
                          )}
                        </div>

                        <div className="building-card-body">
                          <div className="building-card-head">
                            <div>
                              <h3>{building.building_number}</h3>
                              <p>
                                {building.project?.name ||
                                  selectedProject?.name ||
                                  "-"}
                              </p>
                            </div>

                            <div
                              className="building-card-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="card-icon-btn"
                                onClick={() =>
                                  setViewingDetails({
                                    type: "building",
                                    data: building,
                                  })
                                }
                                title="عرض تفاصيل البناء"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                type="button"
                                className="card-icon-btn"
                                onClick={() => openEditBuildingModal(building)}
                                title="تعديل البناء"
                              >
                                <PencilLine size={15} />
                              </button>

                              <button
                                type="button"
                                className="card-icon-btn danger"
                                onClick={() => handleDeleteBuilding(building.id)}
                                title="حذف البناء"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <p className="building-desc">
                            {building.description || "لا يوجد وصف لهذا البناء."}
                          </p>

                          <div className="building-meta">
                            <span>{building.floors_count} طابق</span>
                            <span>{buildingUnitsCount} وحدة</span>
                            <span className={getStatusBadgeClass(building.status)}>
                              {formatProjectStatus(building.status)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="projects-empty">لا توجد أبنية لعرضها</div>
                )}
              </div>
            </div>
          </article>

          <article className="projects-panel units-panel">
            <div className="projects-panel-head">
              <div>
                <h2>الوحدات</h2>
                <p>
                  {showAllUnits
                    ? "عرض كل الوحدات"
                    : selectedBuilding
                    ? `وحدات البناء: ${selectedBuilding.building_number}`
                    : "اختر بناء لعرض وحداته"}
                </p>
              </div>

              <div className="projects-panel-actions">
                <Button
                  className="projects-secondary-btn"
                  onClick={openCreateUnitModal}
                >
                  <Plus size={16} />
                  إضافة وحدة
                </Button>

                <Button
                  className={`projects-secondary-btn ${
                    showAllUnits ? "is-active" : ""
                  }`}
                  onClick={handleShowAllUnits}
                >
                  كل الوحدات
                </Button>

                <Button
                  className={`projects-secondary-btn ${
                    !showAllUnits ? "is-active" : ""
                  }`}
                  onClick={() => setShowAllUnits(false)}
                >
                  وحدات البناء
                </Button>
              </div>
            </div>

            <div className="units-scroll">
              <div className="units-grid">
                {unitsLoading || buildingUnitsLoading ? (
                  <div className="projects-empty">جاري تحميل الوحدات...</div>
                ) : filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => (
                    <article key={unit.id} className="unit-card">
                      <div className="unit-card-head">
                        <div>
                          <h3>{unit.unit_number}</h3>
                          <p>
                            {unit.building?.building_number || "-"} ·{" "}
                            {unit.building?.project?.name || "-"}
                          </p>
                        </div>

                        <div
                          className="unit-card-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="card-icon-btn"
                            onClick={() =>
                              setViewingDetails({
                                type: "unit",
                                data: unit,
                              })
                            }
                            title="عرض تفاصيل الوحدة"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className="card-icon-btn"
                            onClick={() => openEditUnitModal(unit)}
                            title="تعديل الوحدة"
                          >
                            <PencilLine size={15} />
                          </button>

                          <button
                            type="button"
                            className="card-icon-btn danger"
                            onClick={() => handleDeleteUnit(unit.id)}
                            title="حذف الوحدة"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p className="unit-desc">
                        {unit.description || "لا يوجد وصف لهذه الوحدة."}
                      </p>

                      <div className="unit-tags">
                        <span className={getStatusBadgeClass(unit.status)}>
                          {formatUnitStatus(unit.status)}
                        </span>
                        <span className={getStatusBadgeClass(unit.type)}>
                          {formatUnitType(unit.type)}
                        </span>
                        <span>طابق {unit.floor}</span>
                        <span>{unit.area} م²</span>
                      </div>

                      <div className="unit-footer">
                        <div className="unit-price">
                          <Coins size={14} />
                          <strong>{Number(unit.price || 0).toLocaleString()}</strong>
                        </div>

                        <div className="unit-extra">
                          <span>
                            {unit.building?.floors_count || "-"} طابق في البناء
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="projects-empty">لا توجد وحدات لعرضها</div>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="projects-panel locations-panel">
        <div className="projects-panel-head">
          <div>
            <h2>المواقع</h2>
            <p>عرض المواقع المسجلة مع تعديل مباشر</p>
          </div>

          <Button
            className="projects-secondary-btn"
            onClick={openCreateLocationModal}
          >
            <Plus size={16} />
            إضافة موقع
          </Button>
        </div>

        <div className="projects-toolbar">
          <div className="projects-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ابحث عن موقع..."
              value={locationSearchTerm}
              onChange={(e) => setLocationSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="locations-scroll">
          <div className="locations-grid">
            {locationsLoading ? (
              <div className="projects-empty">جاري تحميل المواقع...</div>
            ) : filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <article key={location.id} className="location-card">
                  <div className="location-card-head">
                    <div>
                      <h3>{extractName(location.name)}</h3>
                      <p>{location.type}</p>
                    </div>

                    <div className="location-card-actions">
                      <button
                        type="button"
                        className="card-icon-btn"
                        onClick={() => openEditLocationModal(location)}
                        title="تعديل الموقع"
                      >
                        <PencilLine size={15} />
                      </button>

                      <button
                        type="button"
                        className="card-icon-btn danger"
                        onClick={() => handleDeleteLocation(location.id)}
                        title="حذف الموقع"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="location-meta">
                    <span>Parent: {location.parent_id || "-"}</span>
                    <span>{extractName(location.parent?.name)}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="projects-empty">لا توجد مواقع لعرضها</div>
            )}
          </div>
        </div>
      </section>

      {/* 👁️ مودال التفاصيل الشامل الذكي */}
      <Modal
        open={Boolean(viewingDetails.type && viewingDetails.data)}
        title={
          viewingDetails.type === "project"
            ? `تفاصيل المشروع: ${viewingDetails.data?.name || ""}`
            : viewingDetails.type === "building"
            ? `تفاصيل البناء: ${viewingDetails.data?.building_number || ""}`
            : viewingDetails.type === "unit"
            ? `تفاصيل الوحدة: ${viewingDetails.data?.unit_number || ""}`
            : "التفاصيل"
        }
        description="عرض كامل ومُنسّق لكافة البيانات والمعلومات المسجلة والمرفقات"
        onClose={() => setViewingDetails({ type: null, data: null })}
        footer={
          <div className="projects-modal-actions">
            <Button
              className="projects-secondary-btn"
              onClick={() => setViewingDetails({ type: null, data: null })}
            >
              إغلاق
            </Button>
          </div>
        }
      >
        <div className="details-modal-container">
          {/* ===================== تفاصيل المشروع ===================== */}
          {viewingDetails.type === "project" && viewingDetails.data && (
            <>
              <AttachmentViewer
                attachment={viewingDetails.data.attachments?.[0]}
                title={viewingDetails.data.name}
              />

              <div className="details-grid">
                <div className="details-card">
                  <span className="details-label">اسم المشروع</span>
                  <span className="details-value">{viewingDetails.data.name}</span>
                </div>

                <div className="details-card">
                  <span className="details-label">الحالة</span>
                  <span className="details-value">
                    <span className={getStatusBadgeClass(viewingDetails.data.status)}>
                      {formatProjectStatus(viewingDetails.data.status)}
                    </span>
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">الموقع</span>
                  <span className="details-value">
                    {extractName(viewingDetails.data.location?.name)}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">تاريخ البداية</span>
                  <span className="details-value">
                    {viewingDetails.data.start_date || "-"}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">الإحداثيات</span>
                  <span className="details-value">
                    {viewingDetails.data.coordinates?.latitude ?? "-"} ,{" "}
                    {viewingDetails.data.coordinates?.longitude ?? "-"}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">نصف القطر (متر)</span>
                  <span className="details-value">
                    {viewingDetails.data.coordinates?.radius ?? "-"} م
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">عدد الأبنية التابعة</span>
                  <span className="details-value highlight">
                    {viewingDetails.data.buildings?.length || 0} أبنية
                  </span>
                </div>
              </div>

              <div className="details-card full-width">
                <span className="details-label">الوصف التفصيلي</span>
                <p className="details-value desc-text">
                  {viewingDetails.data.description || "لا يوجد وصف مسجل لهذا المشروع."}
                </p>
              </div>
            </>
          )}

          {/* ===================== تفاصيل البناء ===================== */}
          {viewingDetails.type === "building" && viewingDetails.data && (
            <>
              <AttachmentViewer
                attachment={viewingDetails.data.attachments?.[0]}
                title={viewingDetails.data.building_number}
              />

              <div className="details-grid">
                <div className="details-card">
                  <span className="details-label">رقم البناء</span>
                  <span className="details-value">
                    {viewingDetails.data.building_number}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">المشروع التابع له</span>
                  <span className="details-value">
                    {viewingDetails.data.project?.name || selectedProject?.name || "-"}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">عدد الطوابق</span>
                  <span className="details-value">
                    {viewingDetails.data.floors_count} طوابق
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">عدد الوحدات المسجلة</span>
                  <span className="details-value highlight">
                    {unitCountsByBuilding.get(viewingDetails.data.id) || 0} وحدات
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">الحالة</span>
                  <span className="details-value">
                    <span className={getStatusBadgeClass(viewingDetails.data.status)}>
                      {formatProjectStatus(viewingDetails.data.status)}
                    </span>
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">تاريخ البداية</span>
                  <span className="details-value">
                    {viewingDetails.data.start_date || "-"}
                  </span>
                </div>

                <div className="details-card full-width">
                  <span className="details-label">الإحداثيات</span>
                  <span className="details-value">
                    Latitude: {viewingDetails.data.coordinates?.latitude ?? "-"} | Longitude: {viewingDetails.data.coordinates?.longitude ?? "-"}
                  </span>
                </div>
              </div>

              <div className="details-card full-width">
                <span className="details-label">الوصف</span>
                <p className="details-value desc-text">
                  {viewingDetails.data.description || "لا يوجد وصف مسجل لهذا البناء."}
                </p>
              </div>
            </>
          )}

          {/* ===================== تفاصيل الوحدة ===================== */}
          {viewingDetails.type === "unit" && viewingDetails.data && (
            <>
              <AttachmentViewer
                attachment={viewingDetails.data.attachments?.[0]}
                title={viewingDetails.data.unit_number}
              />

              <div className="details-grid">
                <div className="details-card">
                  <span className="details-label">رقم الوحدة</span>
                  <span className="details-value">
                    {viewingDetails.data.unit_number}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">البناء / المشروع</span>
                  <span className="details-value">
                    {viewingDetails.data.building?.building_number || "-"} (
                    {viewingDetails.data.building?.project?.name || "-"})
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">النوع</span>
                  <span className="details-value">
                    <span className={getStatusBadgeClass(viewingDetails.data.type)}>
                      {formatUnitType(viewingDetails.data.type)}
                    </span>
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">الحالة</span>
                  <span className="details-value">
                    <span className={getStatusBadgeClass(viewingDetails.data.status)}>
                      {formatUnitStatus(viewingDetails.data.status)}
                    </span>
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">الطابق</span>
                  <span className="details-value">
                    الطابق {viewingDetails.data.floor}
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">المساحة</span>
                  <span className="details-value">
                    {viewingDetails.data.area} م²
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">عدد الغرف</span>
                  <span className="details-value">
                    {viewingDetails.data.rooms_count || "-"} غرف
                  </span>
                </div>

                <div className="details-card">
                  <span className="details-label">السعر</span>
                  <span className="details-value price-text">
                    {Number(viewingDetails.data.price || 0).toLocaleString()} ل.س
                  </span>
                </div>
              </div>

              <div className="details-card full-width">
                <span className="details-label">الوصف</span>
                <p className="details-value desc-text">
                  {viewingDetails.data.description || "لا يوجد وصف مسجل لهذه الوحدة."}
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* مودال إنشاء / تعديل مشروع */}
      <Modal
        open={openProjectModal}
        title={editingProjectId ? "تعديل مشروع" : "إضافة مشروع"}
        description={
          editingProjectId
            ? "عدّلي الحقول الأساسية للمشروع ثم احفظي التعديل"
            : "أدخلي بيانات المشروع وارفعي المرفق (صورة أو ملف مستند) إن وجد"
        }
        onClose={closeProjectModal}
        footer={
          <div className="projects-modal-actions">
            <Button className="projects-secondary-btn" onClick={closeProjectModal}>
              إلغاء
            </Button>

            <Button
              type="button"
              className="projects-primary-btn"
              onClick={handleSubmitProject}
              disabled={creatingProject}
            >
              <Plus size={16} />
              {editingProjectId ? "حفظ التعديل" : "حفظ المشروع"}
            </Button>
          </div>
        }
      >
        <form className="project-form" onSubmit={handleSubmitProject}>
          {editingProjectId ? (
            <div className="project-form-grid">
              <div className="project-native-field">
                <Field
                  type="text"
                  name="name"
                  label="اسم المشروع"
                  value={projectForm.name}
                  onChange={(e) =>
                    handleProjectFormChange("name", e.target.value)
                  }
                  iconClass="fa-solid fa-folder"
                />
                <ErrorMessage message={projectErrors.name} />
              </div>

              <div className="project-native-field">
                <Field
                  type="number"
                  name="latitude"
                  label="Latitude"
                  value={projectForm.latitude}
                  onChange={(e) =>
                    handleProjectFormChange("latitude", e.target.value)
                  }
                  iconClass="fa-solid fa-location-crosshairs"
                />
                <ErrorMessage message={projectErrors.latitude} />
              </div>

              <div className="project-native-field">
                <Field
                  type="number"
                  name="longitude"
                  label="Longitude"
                  value={projectForm.longitude}
                  onChange={(e) =>
                    handleProjectFormChange("longitude", e.target.value)
                  }
                  iconClass="fa-solid fa-location-crosshairs"
                />
                <ErrorMessage message={projectErrors.longitude} />
              </div>

              <div className="project-native-field">
                <Field
                  type="number"
                  name="radius_meters"
                  label="Radius Meters"
                  value={projectForm.radius_meters}
                  onChange={(e) =>
                    handleProjectFormChange("radius_meters", e.target.value)
                  }
                  iconClass="fa-solid fa-ruler"
                />
                <ErrorMessage message={projectErrors.radius_meters} />
              </div>

              <div className="project-native-field">
                <label>الحالة</label>
                <select
                  value={projectForm.status}
                  onChange={(e) =>
                    handleProjectFormChange("status", e.target.value)
                  }
                >
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="planned">مخطط</option>
                  <option value="completed">مكتمل</option>
                  <option value="stopped">متوقف</option>
                </select>
                <ErrorMessage message={projectErrors.status} />
              </div>
            </div>
          ) : (
            <div className="project-form-grid">
              <div className="project-native-field">
                <Field
                  type="text"
                  name="name"
                  label="اسم المشروع"
                  value={projectForm.name}
                  onChange={(e) =>
                    handleProjectFormChange("name", e.target.value)
                  }
                  iconClass="fa-solid fa-folder"
                />
                <ErrorMessage message={projectErrors.name} />
              </div>

              <div className="project-native-field">
                <Field
                  type="text"
                  name="description"
                  label="الوصف"
                  value={projectForm.description}
                  onChange={(e) =>
                    handleProjectFormChange("description", e.target.value)
                  }
                  iconClass="fa-solid fa-align-left"
                />
                <ErrorMessage message={projectErrors.description} />
              </div>

              <div className="project-native-field">
                <label>الموقع</label>
                <select
                  value={projectForm.location_id}
                  onChange={(e) =>
                    handleProjectFormChange("location_id", e.target.value)
                  }
                >
                  <option value="">
                    {locationsLoading ? "جاري تحميل المواقع..." : "اختاري الموقع"}
                  </option>

                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {getLocationLabel(location)}
                    </option>
                  ))}
                </select>
                <ErrorMessage message={projectErrors.location_id} />
              </div>

              <div className="project-native-field">
                <Field
                  type="date"
                  name="start_date"
                  label="تاريخ البداية"
                  value={projectForm.start_date}
                  onChange={(e) =>
                    handleProjectFormChange("start_date", e.target.value)
                  }
                  iconClass="fa-solid fa-calendar"
                />
                <ErrorMessage message={projectErrors.start_date} />
              </div>

              <div className="project-native-field">
                <Field
                  type="number"
                  name="latitude"
                  label="Latitude"
                  value={projectForm.latitude}
                  onChange={(e) =>
                    handleProjectFormChange("latitude", e.target.value)
                  }
                  iconClass="fa-solid fa-location-crosshairs"
                />
                <ErrorMessage message={projectErrors.latitude} />
              </div>

              <div className="project-native-field">
                <Field
                  type="number"
                  name="longitude"
                  label="Longitude"
                  value={projectForm.longitude}
                  onChange={(e) =>
                    handleProjectFormChange("longitude", e.target.value)
                  }
                  iconClass="fa-solid fa-location-crosshairs"
                />
                <ErrorMessage message={projectErrors.longitude} />
              </div>

              <div className="project-native-field">
                <Field
                  type="number"
                  name="radius_meters"
                  label="Radius Meters"
                  value={projectForm.radius_meters}
                  onChange={(e) =>
                    handleProjectFormChange("radius_meters", e.target.value)
                  }
                  iconClass="fa-solid fa-ruler"
                />
                <ErrorMessage message={projectErrors.radius_meters} />
              </div>

              <div className="project-native-field">
                <label>الحالة</label>
                <select
                  value={projectForm.status}
                  onChange={(e) =>
                    handleProjectFormChange("status", e.target.value)
                  }
                >
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="planned">مخطط</option>
                  <option value="completed">مكتمل</option>
                  <option value="stopped">متوقف</option>
                </select>
                <ErrorMessage message={projectErrors.status} />
              </div>
            </div>
          )}

          {!editingProjectId ? (
            <div className="project-file-field">
              <label>ملف / مرفق المشروع (صورة، PDF، مستند)</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <ErrorMessage message={projectErrors.attachment} />
            </div>
          ) : null}
        </form>
      </Modal>

      {/* مودال إنشاء / تعديل بناء */}
      <Modal
        open={openBuildingModal}
        title={editingBuildingId ? "تعديل بناء" : "إضافة بناء"}
        description={
          editingBuildingId
            ? "عدّلي بيانات البناء ثم احفظي"
            : "أدخلي بيانات البناء وارفعي المرفق (صورة أو ملف) إن وجد"
        }
        onClose={closeBuildingModal}
        footer={
          <div className="projects-modal-actions">
            <Button className="projects-secondary-btn" onClick={closeBuildingModal}>
              إلغاء
            </Button>

            <Button
              type="button"
              className="projects-primary-btn"
              onClick={handleSubmitBuilding}
            >
              <Plus size={16} />
              {editingBuildingId ? "حفظ التعديل" : "حفظ البناء"}
            </Button>
          </div>
        }
      >
        <form className="project-form" onSubmit={handleSubmitBuilding}>
          <div className="project-form-grid">
            <div className="project-native-field">
              <label>المشروع</label>
              <select
                value={buildingForm.project_id}
                onChange={(e) =>
                  handleBuildingFormChange("project_id", e.target.value)
                }
              >
                <option value="">اختاري المشروع</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ErrorMessage message={buildingErrors.project_id} />
            </div>

            <div className="project-native-field">
              <Field
                type="text"
                name="building_number"
                label="رقم البناء"
                value={buildingForm.building_number}
                onChange={(e) =>
                  handleBuildingFormChange("building_number", e.target.value)
                }
                iconClass="fa-solid fa-building"
              />
              <ErrorMessage message={buildingErrors.building_number} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="floors_count"
                label="عدد الطوابق"
                value={buildingForm.floors_count}
                onChange={(e) =>
                  handleBuildingFormChange("floors_count", e.target.value)
                }
                iconClass="fa-solid fa-layer-group"
              />
              <ErrorMessage message={buildingErrors.floors_count} />
            </div>

            <div className="project-native-field">
              <Field
                type="text"
                name="display_name"
                label="اسم الملف / المرفق"
                value={buildingForm.display_name}
                onChange={(e) =>
                  handleBuildingFormChange("display_name", e.target.value)
                }
                iconClass="fa-solid fa-file"
              />
              <ErrorMessage message={buildingErrors.display_name} />
            </div>

            <div className="project-native-field">
              <Field
                type="text"
                name="description"
                label="الوصف"
                value={buildingForm.description}
                onChange={(e) =>
                  handleBuildingFormChange("description", e.target.value)
                }
                iconClass="fa-solid fa-align-left"
              />
              <ErrorMessage message={buildingErrors.description} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="latitude"
                label="Latitude"
                value={buildingForm.latitude}
                onChange={(e) =>
                  handleBuildingFormChange("latitude", e.target.value)
                }
                iconClass="fa-solid fa-location-crosshairs"
              />
              <ErrorMessage message={buildingErrors.latitude} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="longitude"
                label="Longitude"
                value={buildingForm.longitude}
                onChange={(e) =>
                  handleBuildingFormChange("longitude", e.target.value)
                }
                iconClass="fa-solid fa-location-crosshairs"
              />
              <ErrorMessage message={buildingErrors.longitude} />
            </div>

            <div className="project-native-field">
              <Field
                type="date"
                name="start_date"
                label="تاريخ البداية"
                value={buildingForm.start_date}
                onChange={(e) =>
                  handleBuildingFormChange("start_date", e.target.value)
                }
                iconClass="fa-solid fa-calendar"
              />
              <ErrorMessage message={buildingErrors.start_date} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="radius_meters"
                label="Radius Meters"
                value={buildingForm.radius_meters}
                onChange={(e) =>
                  handleBuildingFormChange("radius_meters", e.target.value)
                }
                iconClass="fa-solid fa-ruler"
              />
              <ErrorMessage message={buildingErrors.radius_meters} />
            </div>

            <div className="project-native-field">
              <label>الحالة</label>
              <select
                value={buildingForm.status}
                onChange={(e) =>
                  handleBuildingFormChange("status", e.target.value)
                }
              >
                <option value="in_progress">قيد التنفيذ</option>
                <option value="planned">مخطط</option>
                <option value="completed">مكتمل</option>
                <option value="stopped">متوقف</option>
              </select>
              <ErrorMessage message={buildingErrors.status} />
            </div>

            <div className="project-file-field">
              <label>ملف / مرفق البناء (صورة، PDF، مستند)</label>
              <input
                type="file"
                onChange={(e) =>
                  handleBuildingFileChange(e.target.files?.[0] || null)
                }
              />
              <ErrorMessage message={buildingErrors.attachment} />
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال إنشاء / تعديل وحدة */}
      <Modal
        open={openUnitModal}
        title={editingUnitId ? "تعديل وحدة" : "إضافة وحدة"}
        description={
          editingUnitId
            ? "عدّلي بيانات الوحدة ثم احفظي"
            : "أدخلي بيانات الوحدة مع ملف مرفق إن وجد ثم احفظي"
        }
        onClose={closeUnitModal}
        footer={
          <div className="projects-modal-actions">
            <Button className="projects-secondary-btn" onClick={closeUnitModal}>
              إلغاء
            </Button>

            <Button
              type="button"
              className="projects-primary-btn"
              onClick={handleSubmitUnit}
            >
              <Plus size={16} />
              {editingUnitId ? "حفظ التعديل" : "حفظ الوحدة"}
            </Button>
          </div>
        }
      >
        <form className="project-form" onSubmit={handleSubmitUnit}>
          <div className="project-form-grid">
            <div className="project-native-field">
              <label>البناء</label>
              <select
                value={unitForm.building_id}
                onChange={(e) =>
                  handleUnitFormChange("building_id", e.target.value)
                }
              >
                <option value="">اختاري البناء</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.building_number} / {building.project?.name || "-"}
                  </option>
                ))}
              </select>
              <ErrorMessage message={unitErrors.building_id} />
            </div>

            <div className="project-native-field">
              <Field
                type="text"
                name="unit_number"
                label="رقم الوحدة"
                value={unitForm.unit_number}
                onChange={(e) =>
                  handleUnitFormChange("unit_number", e.target.value)
                }
                iconClass="fa-solid fa-house"
              />
              <ErrorMessage message={unitErrors.unit_number} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="floor"
                label="الطابق"
                value={unitForm.floor}
                onChange={(e) => handleUnitFormChange("floor", e.target.value)}
                iconClass="fa-solid fa-stairs"
              />
              <ErrorMessage message={unitErrors.floor} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="area"
                label="المساحة"
                value={unitForm.area}
                onChange={(e) => handleUnitFormChange("area", e.target.value)}
                iconClass="fa-solid fa-ruler-combined"
              />
              <ErrorMessage message={unitErrors.area} />
            </div>

            <div className="project-native-field">
              <label>النوع</label>
              <select
                value={unitForm.type}
                onChange={(e) => handleUnitFormChange("type", e.target.value)}
              >
                <option value="vip">VIP</option>
                <option value="social">اجتماعي</option>
                <option value="commercial">تجاري</option>
                <option value="office">مكتبي</option>
              </select>
              <ErrorMessage message={unitErrors.type} />
            </div>

            <div className="project-native-field">
              <Field
                type="number"
                name="price"
                label="السعر"
                value={unitForm.price}
                onChange={(e) => handleUnitFormChange("price", e.target.value)}
                iconClass="fa-solid fa-coins"
              />
              <ErrorMessage message={unitErrors.price} />
            </div>

            <div className="project-native-field">
              <label>الحالة</label>
              <select
                value={unitForm.status}
                onChange={(e) => handleUnitFormChange("status", e.target.value)}
              >
                <option value="available">متاح</option>
                <option value="reserved">محجوز</option>
                <option value="sold">مباع</option>
                <option value="maintenance">صيانة</option>
                <option value="inactive">غير متاح</option>
              </select>
              <ErrorMessage message={unitErrors.status} />
            </div>

            <div className="project-file-field">
              <label>ملف / مرفق الوحدة (صورة، PDF، مخطط)</label>
              <input
                type="file"
                onChange={(e) =>
                  handleUnitFileChange(e.target.files?.[0] || null)
                }
              />
              <ErrorMessage message={unitErrors.attachment} />
            </div>
          </div>
        </form>
      </Modal>

      {/* مودال إنشاء / تعديل موقع */}
      <Modal
        open={openLocationModal}
        title={editingLocationId ? "تعديل موقع" : "إضافة موقع"}
        description={
          editingLocationId
            ? "عدّلي بيانات الموقع ثم احفظي التعديل"
            : "أدخلي اسم الموقع واختاري المنطقة الأب"
        }
        onClose={closeLocationModal}
        footer={
          <div className="projects-modal-actions">
            <Button className="projects-secondary-btn" onClick={closeLocationModal}>
              إلغاء
            </Button>

            <Button
              type="button"
              className="projects-primary-btn"
              onClick={handleSubmitLocation}
              disabled={creatingLocation || updatingLocation}
            >
              <Plus size={16} />
              {editingLocationId
                ? "حفظ التعديل"
                : creatingLocation
                ? "جاري الحفظ..."
                : "حفظ الموقع"}
            </Button>
          </div>
        }
      >
        <form className="project-form" onSubmit={handleSubmitLocation}>
          <div className="project-form-grid">
            <div className="project-native-field">
              <Field
                type="text"
                name="name"
                label="اسم الموقع"
                value={locationForm.name}
                onChange={(e) => handleLocationFormChange("name", e.target.value)}
                iconClass="fa-solid fa-location-dot"
              />
              <ErrorMessage message={locationErrors.name} />
            </div>

            <div className="project-native-field">
              <label>النوع</label>
              <select
                value={locationForm.type}
                onChange={(e) => handleLocationFormChange("type", e.target.value)}
              >
                <option value="city">city</option>
                <option value="district">district</option>
                <option value="area">area</option>
                <option value="village">village</option>
              </select>
              <ErrorMessage message={locationErrors.type} />
            </div>

            <div className="project-native-field">
              <label>المنطقة الأب</label>
              <select
                value={locationForm.parent_id}
                onChange={(e) =>
                  handleLocationFormChange("parent_id", e.target.value)
                }
              >
                <option value="">اختاري المنطقة الأب</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {extractName(location.name)} / {extractName(location.parent?.name)}
                  </option>
                ))}
              </select>
              <ErrorMessage message={locationErrors.parent_id} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}