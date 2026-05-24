import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FolderKanban,
  Users2,
  Plus,
  Search,
  
  Building2,
  Paperclip,
  CalendarDays,
  MapPinned,
} from "lucide-react";
import { divIcon } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";

import "../styles/dashboard.css";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Modal from "@/shared/components/Modal";
import Button from "@/shared/components/Button";
import StatusBadge from "@/shared/components/StatusBadge";
import { useTheme } from "@/shared/theme/useTheme";

import {
  fetchProjectEngineers,
  fetchEngineersAllocatedToProject,
  fetchEngineersAllocatedToBuilding,
  fetchAllocatedLocationsForEngineer,
  assignEngineerProject,
} from "../features/engineerProjects/model/engineerProject.thunks";

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

function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: status || "-",
      type: "off",
    }
  );
}

function getEngineerIdFromRelation(relation = {}) {
  const accountId = relation?.engineer?.account?.id;
  const additionalId = relation?.engineer?.additional_info?.engineer_id;
  return additionalId ?? accountId ?? relation?.engineer_id ?? relation?.id;
}

function getInitials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function safeErrorText(error) {
  if (!error) return "";
  if (typeof error === "string") return error;

  if (Array.isArray(error)) {
    return error.map(safeErrorText).filter(Boolean).join(" ");
  }

  if (typeof error === "object") {
    if (typeof error.message === "string") return error.message;

    if (error.message && typeof error.message === "object") {
      return Object.entries(error.message)
        .map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
          return `${key}: ${String(value)}`;
        })
        .join(" • ");
    }

    if (error.errors && typeof error.errors === "object") {
      return Object.entries(error.errors)
        .map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
          return `${key}: ${String(value)}`;
        })
        .join(" • ");
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

function getProjectCoordinates(item = {}) {
  const coords = item?.coordinates || {};
  const lat = Number(coords.latitude);
  const lng = Number(coords.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    radius: Number(coords.radius || 500),
  };
}

function getMapCenterFromPoints(points = []) {
  const valid = points.filter(
    (p) => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng))
  );

  if (valid.length === 0) return [33.5138, 36.2765];

  const totalLat = valid.reduce((sum, item) => sum + Number(item.lat), 0);
  const totalLng = valid.reduce((sum, item) => sum + Number(item.lng), 0);

  return [totalLat / valid.length, totalLng / valid.length];
}

function createMapPinIcon(kind = "project", theme = "light") {
  const isBuilding = kind === "building";

  const fill = isBuilding
    ? theme === "dark"
      ? "#f59e0b"
      : "#d97706"
    : theme === "dark"
    ? "#00d4ff"
    : "#008fb3";

  const glow = isBuilding
    ? "rgba(245, 158, 11, 0.18)"
    : "rgba(0, 212, 255, 0.18)";

  return divIcon({
    className: "",
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: ${fill};
        box-shadow: 0 0 0 7px ${glow};
        border: 2px solid rgba(255,255,255,0.85);
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
      ">
        ${isBuilding ? "B" : "P"}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

function groupProjects(assignments = []) {
  const map = new Map();

  assignments.forEach((relation) => {
    const project = relation?.project;
    if (!project?.id) return;

    // تخطي السجل فوراً إذا لم يكن كائن المهندس الحقيقي موجوداً
    if (!relation?.engineer?.account?.full_name) return;

    const engineerId = relation?.engineer_id || relation?.engineer?.engineer_id || relation?.id;
    const account = relation.engineer.account;
    const additional = relation?.engineer?.additional_info || {};

    // تجنب إضافة الحسابات الوهمية أو المجهولة الاسم
    if (account.full_name.includes("مهندس #")) return;

    if (!map.has(project.id)) {
      map.set(project.id, {
        project: {
          ...project,
          buildings: project.buildings || [] 
        },
        relations: [],
        engineers: [],
      });
    }

    const bucket = map.get(project.id);
    bucket.relations.push(relation);

    if (relation.building && !bucket.project.buildings.some(b => b.id === relation.building.id)) {
      bucket.project.buildings.push(relation.building);
    }

    const exists = bucket.engineers.some((eng) => eng.engineerId === engineerId);
    if (!exists) {
      bucket.engineers.push({
        engineerId,
        relation,
        account,
        info: additional,
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
    // استخراج معرف المهندس بشكل مرن بناءً على البيانات المتاحة بالراوت
    const engineerId = getEngineerIdFromRelation(relation) || relation?.engineer_id || relation?.id;
    if (!engineerId) return;

    const project = relation?.project || {
      id: relation?.project_id,
      name: relation?.project_name || "مشروع غير مسمى",
      status: relation?.status || "in_progress"
    };

    // تخصيص تفاصيل الإسناد لإظهار الأبنية بدقة في حال وجودها
    const allocationDetail = relation.allocation_type === "specific_building" && relation.building_number
      ? `[بناء: ${relation.building_number}]`
      : "[على مستوى المشروع]";

    const account = relation?.engineer?.account || {
      id: engineerId,
      full_name: `مهندس #${engineerId} ${allocationDetail}`,
    };
    
    const additional = relation?.engineer?.additional_info || {};

    if (!map.has(engineerId)) {
      map.set(engineerId, {
        engineerId,
        relation,
        projects: [],
        account,
        info: additional,
      });
    }

    const bucket = map.get(engineerId);
    bucket.relation = relation;
    bucket.account = bucket.account?.full_name && !bucket.account.full_name.includes("مهندس #") ? bucket.account : account;
    bucket.info = additional;

    const exists = bucket.projects.some((p) => p.project?.id === project.id);

    if (!exists) {
      bucket.projects.push({
        relationId: relation.id,
        project,
        relation,
      });
    }
  });

  return Array.from(map.values())
    .map((bucket) => ({
      engineerId: bucket.engineerId,
      relation: bucket.relation || {},
      account: bucket.account || {},
      info: bucket.info || {},
      projects: bucket.projects.sort((a, b) =>
        String(a?.project?.name || "").localeCompare(
          String(b?.project?.name || "")
        )
      ),
    }))
    .sort((a, b) =>
      String(a?.account?.full_name || "").localeCompare(
        String(b?.account?.full_name || "")
      )
    );
}

function groupEngineersForProjectModal(allocations = [], projectContext = null) {
  const map = new Map();

  allocations.forEach((item) => {
    const engineer = item?.engineer || {};
    const account = engineer?.account || item?.account || {};
    const additional = engineer?.additional_info || item?.info || {};

    const engineerId =
      additional?.engineer_id ??
      item?.engineer_id ??
      account?.id ??
      item?.id ??
      null;

    if (!engineerId) return;

    const building =
      item?.building ||
      projectContext?.buildings?.find(
        (b) => Number(b.id) === Number(item?.building_id)
      ) ||
      null;

    if (!map.has(engineerId)) {
      map.set(engineerId, {
        engineerId,
        account,
        info: additional,
        allocations: [],
      });
    }

    const bucket = map.get(engineerId);
    bucket.account = bucket.account?.full_name ? bucket.account : account;
    bucket.info = bucket.info?.specialization ? bucket.info : additional;
    bucket.allocations.push({
      id: item?.id,
      allocation_type:
        item?.allocation_type ||
        (item?.building_id || item?.building
          ? "specific_building"
          : "project_wide"),
      building,
      project: item?.project || projectContext || null,
      start_date: item?.start_date,
      end_date: item?.end_date,
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a?.account?.full_name || "").localeCompare(
      String(b?.account?.full_name || "")
    )
  );
}

function groupEngineersForBuildingModal(allocations = []) {
  const map = new Map();

  allocations.forEach((item) => {
    const engineer = item?.engineer || {};
    const account = engineer?.account || item?.account || {};
    const additional = engineer?.additional_info || item?.info || {};

    const engineerId =
      additional?.engineer_id ??
      item?.engineer_id ??
      account?.id ??
      item?.id ??
      null;

    if (!engineerId) return;

    if (!map.has(engineerId)) {
      map.set(engineerId, {
        engineerId,
        account,
        info: additional,
        allocations: [],
      });
    }

    const bucket = map.get(engineerId);
    bucket.account = bucket.account?.full_name ? bucket.account : account;
    bucket.info = bucket.info?.specialization ? bucket.info : additional;
    bucket.allocations.push(item);
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a?.account?.full_name || "").localeCompare(
      String(b?.account?.full_name || "")
    )
  );
}

function groupProjectsFromAllocations(allocations = []) {
  const map = new Map();

  allocations.forEach((item) => {
    const project = item?.project;
    if (!project?.id) return;

    if (!map.has(project.id)) {
      map.set(project.id, {
        project,
        relations: [],
      });
    }

    const bucket = map.get(project.id);
    bucket.relations.push(item);
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a?.project?.name || "").localeCompare(String(b?.project?.name || ""))
  );
}

function buildDashboardMapPoints(projectBlocks = []) {
  const points = [];

  projectBlocks.forEach((block) => {
    const project = block?.project;
    if (!project?.id) return;

    const projectCoords = getProjectCoordinates(project);

    if (projectCoords) {
      points.push({
        key: `project-${project.id}`,
        type: "project",
        lat: projectCoords.lat,
        lng: projectCoords.lng,
        radius: projectCoords.radius || 500,
        label: project?.name || "-",
        sublabel: project?.location?.name || "-",
        status: project?.status,
        project,
        building: null,
      });
    }

    (project?.buildings || []).forEach((building) => {
      const buildingCoords = getProjectCoordinates(building);
      if (!buildingCoords) return;

      points.push({
        key: `building-${building.id}`,
        type: "building",
        lat: buildingCoords.lat,
        lng: buildingCoords.lng,
        radius: buildingCoords.radius || 100,
        label: building?.building_number || `Building #${building.id}`,
        sublabel: building?.description || "-",
        status: building?.status,
        project,
        building,
      });
    });
  });

  return points;
}

function buildProjectMapPoints(project = {}) {
  if (!project?.id) return [];

  const points = [];
  const projectCoords = getProjectCoordinates(project);

  if (projectCoords) {
    points.push({
      key: `project-${project.id}`,
      type: "project",
      lat: projectCoords.lat,
      lng: projectCoords.lng,
      radius: projectCoords.radius || 500,
      label: project?.name || "-",
      sublabel: project?.location?.name || "-",
      status: project?.status,
      project,
      building: null,
    });
  }

  (project?.buildings || []).forEach((building) => {
    const coords = getProjectCoordinates(building);
    if (!coords) return;

    points.push({
      key: `building-${building.id}`,
      type: "building",
      lat: coords.lat,
      lng: coords.lng,
      radius: coords.radius || 100,
      label: building?.building_number || `Building #${building.id}`,
      sublabel: building?.description || "-",
      status: building?.status,
      project,
      building,
    });
  });

  return points;
}

function buildAllocationMapPoints(allocations = []) {
  const points = [];

  allocations.forEach((allocation) => {
    const project = allocation?.project || {};
    const building = allocation?.building || null;

    if (allocation?.allocation_type === "specific_building" && building) {
      const coords = getProjectCoordinates(building);
      if (!coords) return;

      points.push({
        key: `allocation-building-${allocation.id}`,
        type: "building",
        lat: coords.lat,
        lng: coords.lng,
        radius: Number(allocation?.allowed_radius || coords.radius || 100),
        label: building?.building_number || allocation?.target_name || "-",
        sublabel: building?.description || "بناء محدد",
        status: building?.status,
        allocationType: allocation?.allocation_type || "specific_building",
        allocation,
        project,
        building,
      });
      return;
    }

    const coords = getProjectCoordinates(project);
    if (!coords) return;

    points.push({
      key: `allocation-project-${allocation.id}`,
      type: "project",
      lat: coords.lat,
      lng: coords.lng,
      radius: Number(allocation?.allowed_radius || coords.radius || 500),
      label: project?.name || "-",
      sublabel: project?.location?.name || "مشروع كامل",
      status: project?.status,
      allocationType: allocation?.allocation_type || "project_wide",
      allocation,
      project,
      building: null,
    });
  });

  return points;
}

function getAllocationTypeLabel(type) {
  if (type === "specific_building") return "إسناد بناء محدد";
  if (type === "project_wide") return "إسناد على مستوى المشروع";
  return type || "-";
}

function formatAllocationLabel(allocation = {}) {
  const typeLabel = getAllocationTypeLabel(allocation?.allocation_type);
  const buildingLabel = allocation?.building?.building_number
    ? ` • ${allocation.building.building_number}`
    : "";

  return `${typeLabel}${buildingLabel}`;
}

function getEngineerDisplayName(item = {}) {
  return (
    item?.account?.full_name ||
    item?.relation?.engineer?.account?.full_name ||
    item?.engineer?.account?.full_name ||
    `${item?.account?.first_name || ""} ${item?.account?.last_name || ""}`.trim() ||
    `${item?.relation?.engineer?.account?.first_name || ""} ${
      item?.relation?.engineer?.account?.last_name || ""
    }`.trim() ||
    "-"
  );
}

function getEngineerDisplayEmail(item = {}) {
  return (
    item?.account?.email ||
    item?.relation?.engineer?.account?.email ||
    item?.engineer?.account?.email ||
    "-"
  );
}

function getEngineerDisplayPhone(item = {}) {
  return (
    item?.account?.phone ||
    item?.relation?.engineer?.account?.phone ||
    item?.engineer?.account?.phone ||
    "-"
  );
}

function getEngineerDisplayAddress(item = {}) {
  return (
    item?.account?.address ||
    item?.relation?.engineer?.account?.address ||
    item?.engineer?.account?.address ||
    "-"
  );
}

function getEngineerDisplaySpecialization(item = {}) {
  return (
    item?.info?.specialization ||
    item?.relation?.engineer?.additional_info?.specialization ||
    item?.engineer?.additional_info?.specialization ||
    "-"
  );
}

function getEngineerDisplayExperience(item = {}) {
  return (
    item?.info?.experience_years ??
    item?.relation?.engineer?.additional_info?.experience_years ??
    item?.engineer?.additional_info?.experience_years ??
    "-"
  );
}

export default function EngineeringDashboardPage() {
  const dispatch = useDispatch();
  const { theme } = useTheme();

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
    building_id: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectBlock, setSelectedProjectBlock] = useState(null);
  const [selectedProjectEngineers, setSelectedProjectEngineers] = useState([]);
  const [projectEngineersLoading, setProjectEngineersLoading] = useState(false);

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [selectedBuildingBlock, setSelectedBuildingBlock] = useState(null);
  const [selectedBuildingEngineers, setSelectedBuildingEngineers] = useState([]);
  const [buildingEngineersLoading, setBuildingEngineersLoading] = useState(false);

  const [engineerModalOpen, setEngineerModalOpen] = useState(false);
  const [selectedEngineerBlock, setSelectedEngineerBlock] = useState(null);
  const [selectedEngineerAllocations, setSelectedEngineerAllocations] = useState(
    []
  );
 const [engineerAllocationsLoading, setEngineerAllocationsLoading] = useState(false);
const [enrichedItems, setEnrichedItems] = useState([]);

useEffect(() => {
  const loadDashboardData = async () => {
    setEngineerAllocationsLoading(true);
    try {
      // 1. جلب السجلات الأساسية للمشاريع
      const baseResult = await dispatch(fetchProjectEngineers()).unwrap();
      
      if (baseResult && baseResult.length > 0) {
        // 2. استخراج معرفات المشاريع الفريدة
        const uniqueProjectIds = Array.from(
          new Set(baseResult.map((item) => item.project_id || item.project?.id).filter(Boolean))
        );

        // 3. جلب تفاصيل المهندسين لكل مشروع بالتوازي من الراوت الغني
        const deepResultsArray = await Promise.all(
          uniqueProjectIds.map(async (projectId) => {
            try {
              return await dispatch(fetchEngineersAllocatedToProject(projectId)).unwrap();
            } catch (err) {
              console.error(`Error fetching engineers for project ${projectId}:`, err);
              return [];
            }
          })
        );

        const allEnrichedAllocations = deepResultsArray.flat().filter(Boolean);

        // 4. الدمج الذكي والفلترة الصارمة:
        const mergedData = baseResult.map((baseItem) => {
          // البحث عن السجل المطابق في راوت المهندسين
          const matchingEnriched = allEnrichedAllocations.find(
            (enrichedItem) => enrichedItem.id === baseItem.id
          );

          // إذا لم نجد مهندساً حقيقياً قادماً من راوت التفاصيل، نضع علم للفلترة
          if (!matchingEnriched?.engineer?.account?.full_name) {
            return null; 
          }

          return {
            ...baseItem,
            engineer: matchingEnriched.engineer
          };
        }).filter(Boolean); // حذف كل السجلات المجهولة التي لا تملك مهندساً حقيقياً

        // إذا كانت القائمة المفلترة فارغة، نحتفظ بالبيانات الأساسية لكي لا يختفي المشروع
        setEnrichedItems(mergedData.length > 0 ? mergedData : baseResult);
      }
    } catch (error) {
      console.error("Error loading deep project engineers data:", error);
    } finally {
      setEngineerAllocationsLoading(false);
    }
  };

  loadDashboardData();
}, [dispatch]);

  const groupedProjects = useMemo(() => groupProjects(enrichedItems), [enrichedItems]);
  const groupedEngineers = useMemo(() => groupEngineers(enrichedItems), [enrichedItems]);

  const availableProjects = useMemo(
    () => groupedProjects.map((item) => item.project),
    [groupedProjects]
  );

  const availableEngineers = useMemo(() => groupedEngineers, [groupedEngineers]);

  const selectedProject = useMemo(() => {
    return availableProjects.find(
      (project) => Number(project.id) === Number(assignData.project_id)
    );
  }, [availableProjects, assignData.project_id]);

  const availableBuildings = selectedProject?.buildings || [];

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
        project?.coordinates?.latitude,
        project?.coordinates?.longitude,
        ...engineers.flatMap((eng) => [
          eng?.account?.full_name,
          eng?.account?.email,
          eng?.account?.phone,
          eng?.info?.specialization,
        ]),
      ]
        .map(normalizeText)
        .join(" ");

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [groupedProjects, searchTerm, statusFilter]);

  // const filteredEngineers = useMemo(() => {
  //   const q = normalizeText(searchTerm);

  //   return groupedEngineers.filter(({ relation, projects, account, info }) => {
  //     const engineerStatusMatch =
  //       statusFilter === "all" ||
  //       projects.some((p) => p?.project?.status === statusFilter);

  //     const searchable = [
  //       account?.full_name,
  //       account?.email,
  //       account?.phone,
  //       account?.address,
  //       info?.specialization,
  //       info?.experience_years,
  //       ...projects.flatMap((p) => [
  //         p?.project?.name,
  //         p?.project?.description,
  //         p?.project?.location?.name,
  //         p?.project?.status,
  //       ]),
  //       relation?.project?.status,
  //     ]
  //       .map(normalizeText)
  //       .join(" ");

  //     return engineerStatusMatch && (!q || searchable.includes(q));
  //   });
  // }, [groupedEngineers, searchTerm, statusFilter]);

  const totalRelations = items.length;
  const totalEngineers = groupedEngineers.length;
  const totalProjects = groupedProjects.length;
  const activeProjects = groupedProjects.filter(
    (item) => item?.project?.status === "in_progress"
  ).length;

  const dashboardMapPoints = useMemo(
    () => buildDashboardMapPoints(filteredProjects),
    [filteredProjects]
  );

  const projectsWithCoords = useMemo(
    () => filteredProjects.filter((block) => getProjectCoordinates(block.project)),
    [filteredProjects]
  );

  const dashboardMapCenter = useMemo(
    () => getMapCenterFromPoints(dashboardMapPoints),
    [dashboardMapPoints]
  );

  const selectedProjectMapPoints = useMemo(
    () => buildProjectMapPoints(selectedProjectBlock?.project || {}),
    [selectedProjectBlock]
  );

  const selectedProjectMapCenter = useMemo(
    () => getMapCenterFromPoints(selectedProjectMapPoints),
    [selectedProjectMapPoints]
  );

  const selectedProjectEngineersGrouped = useMemo(() => {
    return groupEngineersForProjectModal(
      selectedProjectEngineers || [],
      selectedProjectBlock?.project || null
    );
  }, [selectedProjectEngineers, selectedProjectBlock]);

  const selectedBuildingMapPoints = useMemo(
    () => buildProjectMapPoints(selectedBuildingBlock?.project || {}),
    [selectedBuildingBlock]
  );

  const selectedBuildingMapCenter = useMemo(
    () => getMapCenterFromPoints(selectedBuildingMapPoints),
    [selectedBuildingMapPoints]
  );

  const selectedBuildingEngineersGrouped = useMemo(
    () => groupEngineersForBuildingModal(selectedBuildingEngineers || []),
    [selectedBuildingEngineers]
  );

  const selectedEngineerMapPoints = useMemo(
    () => buildAllocationMapPoints(selectedEngineerAllocations || []),
    [selectedEngineerAllocations]
  );

  const selectedEngineerMapCenter = useMemo(
    () => getMapCenterFromPoints(selectedEngineerMapPoints),
    [selectedEngineerMapPoints]
  );

  const selectedEngineerProjectsGrouped = useMemo(
    () => groupProjectsFromAllocations(selectedEngineerAllocations || []),
    [selectedEngineerAllocations]
  );

  const showInitialLoading = loading && items.length === 0;
  const displayError = safeErrorText(error);

  const handleAssignChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAssignData((prev) => {
      if (name === "project_id") {
        return {
          ...prev,
          project_id: value,
          building_id: "",
        };
      }

      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };

  const handleBuildingChange = (e) => {
    setAssignData((prev) => ({
      ...prev,
      building_id: e.target.value,
    }));
  };

  const handleAssign = async (e) => {
    e.preventDefault();

    const payload = {
      engineer_id: Number(assignData.engineer_id),
      project_id: Number(assignData.project_id),
      start_date: assignData.start_date,
    };

    if (assignData.building_id) {
      payload.building_id = Number(assignData.building_id);
    }

    const result = await dispatch(assignEngineerProject(payload));

    if (assignEngineerProject.fulfilled.match(result)) {
      setAssignOpen(false);
      setAssignData({
        engineer_id: "",
        project_id: "",
        start_date: "",
        building_id: "",
      });
      dispatch(fetchProjectEngineers());
    }
  };

  const openProjectDetails = async (projectBlock) => {
    setSelectedProjectBlock(projectBlock);
    setProjectModalOpen(true);
    setBuildingModalOpen(false);
    setEngineerModalOpen(false);
    setSelectedBuildingBlock(null);
    setSelectedEngineerBlock(null);
    setSelectedProjectEngineers([]);
    setProjectEngineersLoading(true);

    try {
      const result = await dispatch(
        fetchEngineersAllocatedToProject(projectBlock.project.id)
      );

      if (fetchEngineersAllocatedToProject.fulfilled.match(result)) {
        setSelectedProjectEngineers(
          Array.isArray(result.payload) ? result.payload : []
        );
      } else {
        setSelectedProjectEngineers([]);
      }
    } finally {
      setProjectEngineersLoading(false);
    }
  };

  const openBuildingDetails = async (building, projectContext) => {
    setSelectedBuildingBlock({
      building,
      project: projectContext || selectedProjectBlock?.project || null,
    });
    setBuildingModalOpen(true);
    setProjectModalOpen(false);
    setEngineerModalOpen(false);
    setSelectedProjectBlock(null);
    setSelectedEngineerBlock(null);
    setSelectedBuildingEngineers([]);
    setBuildingEngineersLoading(true);

    try {
      const result = await dispatch(fetchEngineersAllocatedToBuilding(building.id));

      if (fetchEngineersAllocatedToBuilding.fulfilled.match(result)) {
        setSelectedBuildingEngineers(
          Array.isArray(result.payload) ? result.payload : []
        );
      } else {
        setSelectedBuildingEngineers([]);
      }
    } finally {
      setBuildingEngineersLoading(false);
    }
  };

  const openEngineerProjects = async (engineerBlock) => {
    setSelectedEngineerBlock(engineerBlock);
    setEngineerModalOpen(true);
    setProjectModalOpen(false);
    setBuildingModalOpen(false);
    setSelectedProjectBlock(null);
    setSelectedBuildingBlock(null);
    setSelectedEngineerAllocations([]);
    setEngineerAllocationsLoading(true);

    try {
      const result = await dispatch(
        fetchAllocatedLocationsForEngineer(engineerBlock.engineerId)
      );

      if (fetchAllocatedLocationsForEngineer.fulfilled.match(result)) {
        setSelectedEngineerAllocations(
          Array.isArray(result.payload) ? result.payload : []
        );
      } else {
        setSelectedEngineerAllocations([]);
      }
    } finally {
      setEngineerAllocationsLoading(false);
    }
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setSelectedProjectBlock(null);
    setSelectedProjectEngineers([]);
  };

  const closeBuildingModal = () => {
    setBuildingModalOpen(false);
    setSelectedBuildingBlock(null);
    setSelectedBuildingEngineers([]);
  };

  const closeEngineerModal = () => {
    setEngineerModalOpen(false);
    setSelectedEngineerBlock(null);
    setSelectedEngineerAllocations([]);
  };

  return (
    <div className="engineering-page engineering-map-page">
      <PageHeader
        kicker="القسم الهندسي"
        title="خريطة المشاريع"
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

      <div className="engineering-toolbar engineering-toolbar--map">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="ابحث باسم المشروع أو المهندس أو الموقع..."
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
      ) : displayError ? (
        <div className="project-empty-state" style={{ color: "red" }}>
          {displayError}
        </div>
      ) : (
        <div className="engineering-map-shell">
          <section className="engineering-map-board engineering-map-board--compact">
            <div className="engineering-map-board-header">
              <div>
                <h2>الخريطة الرئيسية</h2>
              </div>
              <span>{projectsWithCoords.length} على الخريطة</span>
            </div>

            <div className="engineering-map-real">
              <MapContainer
                key={`main-map-${theme}-${filteredProjects.length}`}
                center={
                  dashboardMapPoints.length > 0
                    ? dashboardMapCenter
                    : [33.5138, 36.2765]
                }
                zoom={15}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url={
                    theme === "dark"
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                />

                {dashboardMapPoints.map((point) => (
                  <Marker
                    key={point.key}
                    position={[point.lat, point.lng]}
                    icon={createMapPinIcon(point.type, theme)}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h3>{point.label}</h3>
                        <p>
                          <MapPinned size={13} />
                          <span>{point.sublabel}</span>
                        </p>
                        <p>
                          {point.type === "building" ? "بناء" : "مشروع"} •{" "}
                          {getStatusMeta(point.status).label}
                        </p>

                        <button
                          type="button"
                          className="popup-details-btn"
                          onClick={() => {
                            if (point.type === "building") {
                              openBuildingDetails(point.building, point.project);
                            } else {
                              openProjectDetails({ project: point.project });
                            }
                          }}
                        >
                          عرض التفاصيل
                        </button>
                      </div>
                    </Popup>

                    <Circle
                      center={[point.lat, point.lng]}
                      radius={Number(point.radius || 500)}
                    />
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>

          <section className="engineering-engineers-section">
            <div className="engineering-section-head engineering-section-head--compact">
              <div>
                <h2>المشاريع المرتبطة</h2>
              </div>
              <span>{filteredProjects.length} مشروع</span>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="project-empty-state">لا توجد مشاريع مطابقة.</div>
            ) : (
              <div className="project-modal-engineer-projects">
                {filteredProjects.map((block) => {
                  const meta = getStatusMeta(block.project?.status);

                  return (
                    <article className="engineer-project-card" key={block.project.id}>
                      <div className="mini-project-card-head">
                        <div>
                          <button
                            type="button"
                            className="project-title-btn project-title-btn--small"
                            onClick={() => openProjectDetails(block)}
                          >
                            {block.project?.name || "-"}
                          </button>

                          <p className="project-location-line">
                            <MapPinned size={14} />
                            <span>{block.project?.location?.name || "-"}</span>
                          </p>
                        </div>

                        <StatusBadge status={meta.label} type={meta.type} />
                      </div>

                      <p className="building-description">
                        {block.project?.description || "لا يوجد وصف للمشروع."}
                      </p>

                      <div className="project-chip-row">
                        <span className="project-chip">
                          البداية: {formatDate(block.project?.start_date)}
                        </span>
                        <span className="project-chip">
                          النهاية: {formatDate(block.project?.end_date) || "مفتوح"}
                        </span>
                        <span className="project-chip">الربطات: {block.relations.length}</span>
                      </div>

                      <div className="project-chip-row" style={{ marginTop: 8 }}>
                        {(block.engineers || []).slice(0, 4).map((eng) => (
                          <button
                            key={eng.engineerId}
                            type="button"
                            className="project-chip"
                            onClick={() => openEngineerProjects(eng)}
                          >
                            {getEngineerDisplayName(eng)}
                          </button>
                        ))}

                        {(block.engineers || []).length > 4 ? (
                          <span className="project-chip">
                            +{block.engineers.length - 4} مهندس إضافي
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="إسناد مشروع لمهندس"
        description="اختر المهندس والمشروع وحدد البناء فقط إذا رغبت."
        size="xl"
      >
        <form className="engineering-form engineering-form--modal" onSubmit={handleAssign}>
          <div className="engineering-form-grid">
            <div className="assign-select-wrapper">
              <label className="assign-label">المهندس</label>
              <select
                name="engineer_id"
                value={assignData.engineer_id}
                onChange={handleAssignChange}
                className="assign-select"
                required
              >
                <option value="">اختر مهندس</option>
                {availableEngineers.map((engineer) => (
                  <option key={engineer.engineerId} value={engineer.engineerId}>
                    {getEngineerDisplayName(engineer)} —{" "}
                    {getEngineerDisplaySpecialization(engineer)}
                  </option>
                ))}
              </select>
            </div>

            <div className="assign-select-wrapper">
              <label className="assign-label">المشروع</label>
              <select
                name="project_id"
                value={assignData.project_id}
                onChange={handleAssignChange}
                className="assign-select"
                required
              >
                <option value="">اختر مشروع</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="assign-select-wrapper">
              <label className="assign-label">تاريخ البدء</label>
              <input
                type="date"
                name="start_date"
                value={assignData.start_date}
                onChange={handleAssignChange}
                className="assign-select"
                required
              />
            </div>
          </div>

         {selectedProject && Array.isArray(availableBuildings) && availableBuildings.length > 0 ? (
  <div className="assign-buildings-section" style={{ animation: "fadeIn 0.2s ease" }}>
    <div className="assign-buildings-head">
      <h3>أبنية المشروع</h3>
      <span style={{ fontSize: "12px", color: "var(--text-muted, #888)" }}>
        {availableBuildings.length > 1 
          ? "• يحتوي المشروع على عدة أبنية (اختياري: يمكنك تعيين المهندس لبناء محدد أو تركه للمشروع كاملاً)" 
          : "• يحتوي المشروع على بناء واحد فقط (سيتم الإسناد تلقائياً)"}
      </span>
    </div>

    {/* القائمة المنسدلة: يتم قفلها وتثبيتها إذا كان هناك بناء واحد فقط، وتفعيلها إذا تعددت الأبنية */}
    <div className="assign-select-wrapper" style={{ marginTop: 12 }}>
      <label className="assign-label">نطاق التعيين الهندسي</label>
      <select
        value={assignData.building_id}
        onChange={handleBuildingChange}
        className="assign-select"
        disabled={availableBuildings.length <= 1} 
      >
        <option value="">إسناد على المشروع كاملًا (كل الأبنية)</option>
        {availableBuildings.map((building) => (
          <option key={building.id} value={building.id}>
            البناء #{building.building_number || building.id} — {building.floors_count || "-"} طابق
          </option>
        ))}
      </select>
    </div>

    {/* عرض الكروت: تظهر فقط عند وجود أكثر من بناء ليتنقل المهندس بينها بحرية واختيارية */}
    {availableBuildings.length > 1 && (
      <div className="assign-buildings-grid" style={{ marginTop: 16 }}>
        {availableBuildings.map((building) => {
          const selected = Number(assignData.building_id) === Number(building.id);

          return (
            <button
              type="button"
              key={building.id}
              className={`assign-building-card ${selected ? "active" : ""}`}
              onClick={() =>
                setAssignData((prev) => ({
                  ...prev,
                  building_id: selected ? "" : String(building.id), // كبس الكرت مرة أخرى يلغي التحديد ليعود للمشروع كاملاً
                }))
              }
            >
              <div>
                <h4>البناء #{building.building_number || building.id}</h4>
                <p>{building.floors_count || "-"} طابق</p>
              </div>

              <StatusBadge
                status={getStatusMeta(building?.status).label}
                type={getStatusMeta(building?.status).type}
              />
            </button>
          );
        })}
      </div>
    )}
  </div>
) : null}

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
              <span>تأكيد الإسناد</span>
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
          <div className="project-modal-layout project-modal-layout--map">
            <div className="project-modal-hero">
              <MapContainer
                key={`project-modal-map-${selectedProjectBlock?.project?.id || "x"}-${theme}`}
                center={
                  selectedProjectMapPoints.length > 0
                    ? selectedProjectMapCenter
                    : [
                        Number(selectedProjectBlock.project?.coordinates?.latitude || 33.5138),
                        Number(selectedProjectBlock.project?.coordinates?.longitude || 36.2765),
                      ]
                }
                zoom={17}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url={
                    theme === "dark"
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                />

                {selectedProjectMapPoints.map((point) => (
                  <Marker
                    key={point.key}
                    position={[point.lat, point.lng]}
                    icon={createMapPinIcon(point.type, theme)}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h3>{point.label}</h3>
                        <p>
                          <MapPinned size={13} />
                          {point.sublabel}
                        </p>
                        <p>
                          {point.type === "building" ? "بناء" : "مشروع"} •{" "}
                          {getStatusMeta(point.status).label}
                        </p>

                        {point.type === "building" ? (
                          <button
                            type="button"
                            className="popup-details-btn"
                            onClick={() =>
                              openBuildingDetails(point.building, point.project)
                            }
                          >
                            عرض تفاصيل البناء
                          </button>
                        ) : null}
                      </div>
                    </Popup>

                    <Circle
                      center={[point.lat, point.lng]}
                      radius={Number(point.radius || 500)}
                    />
                  </Marker>
                ))}
              </MapContainer>

              <div className="project-modal-hero-overlay">
                <StatusBadge
                  status={getStatusMeta(selectedProjectBlock.project?.status).label}
                  type={getStatusMeta(selectedProjectBlock.project?.status).type}
                />
                <div className="project-modal-hero-chip">
                  {selectedProjectEngineersGrouped.length ||
                    selectedProjectBlock.engineers?.length ||
                    0}{" "}
                  مهندس
                </div>
              </div>
            </div>

            <div className="project-modal-grid">
              <section className="project-modal-panel">
                <div className="engineering-summary-head">
                  <h2>معلومات المشروع</h2>
                  <span>{selectedProjectBlock.relations?.length || 0} ربط</span>
                </div>

                <div className="project-modal-info-grid">
                  <div className="project-modal-info-card">
                    <strong>الوصف</strong>
                    <p>
                      {selectedProjectBlock.project?.description ||
                        "لا يوجد وصف للمشروع."}
                    </p>
                  </div>

                  <div className="project-modal-info-card">
                    <strong>الفترة</strong>
                    <p>
                      {formatDate(selectedProjectBlock.project?.start_date)} —{" "}
                      {selectedProjectBlock.project?.end_date || "مفتوح"}
                    </p>
                  </div>

                  <div className="project-modal-info-card">
                    <strong>الموقع</strong>
                    <p>{selectedProjectBlock.project?.location?.name || "-"}</p>
                  </div>

                  <div className="project-modal-info-card">
                    <strong>الإحداثيات</strong>
                    <p>
                      {selectedProjectBlock.project?.coordinates?.latitude ?? "-"},{" "}
                      {selectedProjectBlock.project?.coordinates?.longitude ?? "-"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="project-modal-panel">
                <div className="engineering-summary-head">
                  <h2>المهندسون المرتبطون</h2>
                  <span>{selectedProjectEngineersGrouped.length} مهندس</span>
                </div>

                {projectEngineersLoading ? (
                  <div className="project-empty-state">جاري تحميل المهندسين...</div>
                ) : selectedProjectEngineersGrouped.length === 0 ? (
                  <div className="project-empty-state">
                    لا توجد مهندسين مرتبطين بهذا المشروع.
                  </div>
                ) : (
                  <div className="project-modal-engineer-list">
                    {selectedProjectEngineersGrouped.map((engineer) => (
                      <button
                        type="button"
                        key={`${selectedProjectBlock.project.id}-${engineer.engineerId}`}
                        className="modal-engineer-row"
                        onClick={() =>
                          openEngineerProjects({
                            engineerId: engineer.engineerId,
                            relation: {
                              engineer: {
                                account: engineer.account,
                                additional_info: engineer.info,
                              },
                            },
                            account: engineer.account,
                            info: engineer.info,
                            projects: [],
                          })
                        }
                      >
                        <div className="modal-engineer-badge">
                          {getInitials(getEngineerDisplayName(engineer))}
                        </div>

                        <div className="modal-engineer-info">
                          <strong>{getEngineerDisplayName(engineer)}</strong>
                          <p>
                            {getEngineerDisplayEmail(engineer)} •{" "}
                            {getEngineerDisplayPhone(engineer)}
                          </p>
                          <span>{getEngineerDisplaySpecialization(engineer)}</span>
                        </div>

                        <StatusBadge
                          status={getStatusMeta(selectedProjectBlock.project?.status).label}
                          type={getStatusMeta(selectedProjectBlock.project?.status).type}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {Array.isArray(selectedProjectBlock.project?.buildings) &&
            selectedProjectBlock.project.buildings.length > 0 ? (
              <section className="project-modal-panel">
                <div className="engineering-summary-head">
                  <h2>المباني</h2>
                  <span>{selectedProjectBlock.project.buildings.length} مبنى</span>
                </div>

                <div className="building-card-grid">
                  {selectedProjectBlock.project.buildings.map((building) => {
                    const buildingMeta = getStatusMeta(building?.status);

                    return (
                      <article className="building-card" key={building.id}>
                        <div className="building-card-head">
                          <div>
                            <button
                              type="button"
                              className="project-title-btn project-title-btn--small"
                              onClick={() =>
                                openBuildingDetails(
                                  building,
                                  selectedProjectBlock.project
                                )
                              }
                            >
                              {building?.building_number || "-"}
                            </button>
                            <p>{building?.floors_count || "-"} طابق</p>
                          </div>

                          <StatusBadge
                            status={buildingMeta.label}
                            type={buildingMeta.type}
                          />
                        </div>

                        <p className="building-description">
                          {building?.description || "لا يوجد وصف"}
                        </p>

                        <div className="project-chip-row">
                          <span className="project-chip">
                            Project ID:{" "}
                            {building?.project_id || selectedProjectBlock.project.id}
                          </span>
                          <span className="project-chip">
                            المرفقات: {building?.attachments?.length || 0}
                          </span>
                        </div>

                        {Array.isArray(building?.attachments) &&
                        building.attachments.length > 0 ? (
                          <div className="attachment-grid">
                            {building.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="attachment-card"
                              >
                                {attachment.type === "image" ? (
                                  <img
                                    src={attachment.url}
                                    alt={
                                      attachment.original_name ||
                                      attachment.file_name ||
                                      "attachment"
                                    }
                                    className="attachment-thumb"
                                  />
                                ) : (
                                  <div className="attachment-thumb attachment-thumb--file">
                                    <Paperclip size={18} />
                                  </div>
                                )}

                                <span className="attachment-name">
                                  {attachment.original_name ||
                                    attachment.file_name ||
                                    "file"}
                                </span>
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={buildingModalOpen}
        onClose={closeBuildingModal}
        title={selectedBuildingBlock?.building?.building_number || "تفاصيل البناء"}
        description={
          selectedBuildingBlock?.project?.name
            ? `المشروع: ${selectedBuildingBlock.project.name}`
            : ""
        }
        size="lg"
      >
        {buildingEngineersLoading ? (
          <div className="project-empty-state">جاري تحميل تفاصيل البناء...</div>
        ) : selectedBuildingBlock ? (
          <div className="engineer-modal-layout">
            <section className="project-modal-panel engineer-profile-card">
              <div className="engineer-profile-header">
                <div className="engineer-profile-avatar">
                  <Building2 size={24} />
                </div>

                <div>
                  <h2 className="engineer-profile-name">
                    {selectedBuildingBlock.building?.building_number || "-"}
                  </h2>
                  <p className="engineer-profile-sub">
                    {selectedBuildingBlock.project?.name || "-"}
                  </p>
                </div>

                <StatusBadge
                  status={getStatusMeta(selectedBuildingBlock.building?.status).label}
                  type={getStatusMeta(selectedBuildingBlock.building?.status).type}
                />
              </div>

              <div className="project-modal-info-grid">
                <div className="project-modal-info-card">
                  <strong>الوصف</strong>
                  <p>{selectedBuildingBlock.building?.description || "لا يوجد وصف."}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>الطوابق</strong>
                  <p>{selectedBuildingBlock.building?.floors_count || "-"} طابق</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>الموقع</strong>
                  <p>{selectedBuildingBlock.project?.location?.name || "-"}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>الإحداثيات</strong>
                  <p>
                    {selectedBuildingBlock.building?.coordinates?.latitude ?? "-"},{" "}
                    {selectedBuildingBlock.building?.coordinates?.longitude ?? "-"}
                  </p>
                </div>

                <div className="project-modal-info-card">
                  <strong>المرفقات</strong>
                  <p>{selectedBuildingBlock.building?.attachments?.length || 0}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>المهندسون</strong>
                  <p>{selectedBuildingEngineersGrouped.length}</p>
                </div>
              </div>
            </section>

            <section className="project-modal-panel">
              <div className="engineering-summary-head">
                <h2>المهندسون المرتبطون بالبناء</h2>
                <span>{selectedBuildingEngineersGrouped.length} مهندس</span>
              </div>

              {selectedBuildingEngineersGrouped.length === 0 ? (
                <div className="project-empty-state">
                  لا يوجد مهندسون مرتبطون بهذا البناء.
                </div>
              ) : (
                <div className="project-modal-engineer-list">
                  {selectedBuildingEngineersGrouped.map((engineer) => (
                    <button
                      type="button"
                      key={engineer.engineerId}
                      className="modal-engineer-row"
                      onClick={() =>
                        openEngineerProjects({
                          engineerId: engineer.engineerId,
                          relation: {
                            engineer: {
                              account: engineer.account,
                              additional_info: engineer.info,
                            },
                            project: selectedBuildingBlock.project,
                            building: selectedBuildingBlock.building,
                          },
                          account: engineer.account,
                          info: engineer.info,
                          projects: [],
                        })
                      }
                    >
                      <div className="modal-engineer-badge">
                        {getInitials(getEngineerDisplayName(engineer))}
                      </div>

                      <div className="modal-engineer-info">
                        <strong>{getEngineerDisplayName(engineer)}</strong>
                        <p>
                          {getEngineerDisplayEmail(engineer)} •{" "}
                          {getEngineerDisplayPhone(engineer)}
                        </p>
                        <span>{getEngineerDisplaySpecialization(engineer)}</span>
                      </div>

                      <StatusBadge
                        status={getStatusMeta(selectedBuildingBlock.building?.status).label}
                        type={getStatusMeta(selectedBuildingBlock.building?.status).type}
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="project-modal-panel">
              <div className="engineering-summary-head">
                <h2>موقع البناء على الخريطة</h2>
                <span>{selectedBuildingMapPoints.length} نقطة</span>
              </div>

              <div className="project-modal-hero" style={{ height: 260 }}>
                <MapContainer
                  key={`building-modal-map-${selectedBuildingBlock?.building?.id || "x"}-${theme}`}
                  center={
                    selectedBuildingMapPoints.length > 0
                      ? selectedBuildingMapCenter
                      : [
                          Number(
                            selectedBuildingBlock.building?.coordinates?.latitude ||
                              33.5138
                          ),
                          Number(
                            selectedBuildingBlock.building?.coordinates?.longitude ||
                              36.2765
                          ),
                        ]
                  }
                  zoom={17}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url={
                      theme === "dark"
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                  />

                  {selectedBuildingMapPoints.map((point) => (
                    <Marker
                      key={point.key}
                      position={[point.lat, point.lng]}
                      icon={createMapPinIcon(point.type, theme)}
                    >
                      <Popup>
                        <div className="map-popup">
                          <h3>{point.label}</h3>
                          <p>
                            <MapPinned size={13} />
                            {point.sublabel}
                          </p>
                          <p>
                            {point.type === "building" ? "بناء" : "مشروع"} •{" "}
                            {getStatusMeta(point.status).label}
                          </p>
                        </div>
                      </Popup>

                      <Circle
                        center={[point.lat, point.lng]}
                        radius={Number(point.radius || 500)}
                      />
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={engineerModalOpen}
        onClose={closeEngineerModal}
        title={getEngineerDisplayName(selectedEngineerBlock) || "تفاصيل المهندس"}
        description={
          selectedEngineerBlock
            ? `Engineer ID: ${selectedEngineerBlock.engineerId} • ${getEngineerDisplaySpecialization(
                selectedEngineerBlock
              )}`
            : ""
        }
        size="lg"
      >
        {engineerAllocationsLoading ? (
          <div className="project-empty-state">جاري تحميل التفاصيل...</div>
        ) : selectedEngineerBlock ? (
          <div className="engineer-modal-layout">
            <section className="project-modal-panel engineer-profile-card">
              <div className="engineer-profile-header">
                <div className="engineer-profile-avatar">
                  {getInitials(getEngineerDisplayName(selectedEngineerBlock))}
                </div>

                <div>
                  <h2 className="engineer-profile-name">
                    {getEngineerDisplayName(selectedEngineerBlock)}
                  </h2>
                  <p className="engineer-profile-sub">
                    Engineer ID: {selectedEngineerBlock.engineerId}
                  </p>
                </div>

                <StatusBadge
                  status={getStatusMeta(
                    selectedEngineerBlock?.relation?.project?.status
                  ).label}
                  type={getStatusMeta(
                    selectedEngineerBlock?.relation?.project?.status
                  ).type}
                />
              </div>

              <div className="project-modal-info-grid">
                <div className="project-modal-info-card">
                  <strong>البريد</strong>
                  <p>{getEngineerDisplayEmail(selectedEngineerBlock)}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>الهاتف</strong>
                  <p>{getEngineerDisplayPhone(selectedEngineerBlock)}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>العنوان</strong>
                  <p>{getEngineerDisplayAddress(selectedEngineerBlock)}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>التخصص</strong>
                  <p>{getEngineerDisplaySpecialization(selectedEngineerBlock)}</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>الخبرة</strong>
                  <p>{getEngineerDisplayExperience(selectedEngineerBlock)} سنة</p>
                </div>

                <div className="project-modal-info-card">
                  <strong>عدد المشاريع</strong>
                  <p>{selectedEngineerProjectsGrouped.length}</p>
                </div>
              </div>
            </section>

            <section className="project-modal-panel">
              <div className="engineering-summary-head">
                <h2>مواقع الإسناد</h2>
                <span>{selectedEngineerMapPoints.length} موقع</span>
              </div>

              <div className="project-modal-hero" style={{ marginBottom: 14 }}>
                {selectedEngineerMapPoints.length > 0 ? (
                  <MapContainer
                    key={`engineer-map-${selectedEngineerBlock?.engineerId || "x"}-${theme}`}
                    center={
                      selectedEngineerMapPoints.length > 0
                        ? selectedEngineerMapCenter
                        : [33.5138, 36.2765]
                    }
                    zoom={17}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url={
                        theme === "dark"
                          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      }
                    />

                    {selectedEngineerMapPoints.map((point) => (
                      <Marker
                        key={point.key}
                        position={[point.lat, point.lng]}
                        icon={createMapPinIcon(point.type, theme)}
                      >
                        <Popup>
                          <div className="map-popup">
                            <h3>{point.label}</h3>
                            <p>
                              <MapPinned size={13} />
                              {point.sublabel}
                            </p>
                            <p>{getAllocationTypeLabel(point.allocationType)}</p>
                            <p>🟢 {getStatusMeta(point.status).label}</p>
                          </div>
                        </Popup>

                        <Circle
                          center={[point.lat, point.lng]}
                          radius={Number(point.radius || 500)}
                        />
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="project-modal-hero-map">
                    <MapPinned size={30} />
                    <span>لا توجد مواقع إسناد لهذا المهندس</span>
                  </div>
                )}
              </div>

              <div className="engineering-summary-head">
                <h2>المشاريع المرتبطة</h2>
                <span>{selectedEngineerProjectsGrouped.length} مشروع</span>
              </div>

              {selectedEngineerProjectsGrouped.length === 0 ? (
                <div className="project-empty-state">
                  لا توجد مشاريع لهذا المهندس.
                </div>
              ) : (
                <div className="project-modal-engineer-projects">
                  {selectedEngineerProjectsGrouped.map(({ project, relations }) => {
                    const meta = getStatusMeta(project?.status);

                    return (
                      <article className="engineer-project-card" key={project.id}>
                        <div className="mini-project-card-head">
                          <div>
                            <button
                              type="button"
                              className="project-title-btn project-title-btn--small"
                              onClick={() =>
                                openProjectDetails({
                                  project,
                                  relations,
                                  engineers: [],
                                })
                              }
                            >
                              {project?.name || "-"}
                            </button>

                            <p className="project-location-line">
                              <MapPinned size={14} />
                              <span>{project?.location?.name || "-"}</span>
                            </p>
                          </div>

                          <StatusBadge status={meta.label} type={meta.type} />
                        </div>

                        <p className="building-description">
                          {project?.description || "لا يوجد وصف للمشروع."}
                        </p>

                        <div className="project-chip-row">
                          <span className="project-chip">
                            البداية: {formatDate(project?.start_date)}
                          </span>
                          <span className="project-chip">
                            النهاية: {formatDate(project?.end_date) || "مفتوح"}
                          </span>
                          <span className="project-chip">
                            الربطات: {relations.length}
                          </span>
                        </div>

                        <div className="project-chip-row" style={{ marginTop: 8 }}>
                          {relations.map((relation) => (
                            <span className="project-chip" key={relation.id}>
                              {formatAllocationLabel(relation)}
                            </span>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}