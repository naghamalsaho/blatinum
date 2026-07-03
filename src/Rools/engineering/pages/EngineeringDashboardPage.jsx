import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FolderKanban,
  Users2,
  Plus,
  Search,
  Building2,
  CalendarDays,
  MapPinned,
  Paperclip,
 
} from "lucide-react";
import { divIcon } from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, LayersControl, useMap } from "react-leaflet";
import PropTypes from "prop-types";
import "../styles/dashboard.css";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Modal from "@/shared/components/Modal";
import Button from "@/shared/components/Button";
import StatusBadge from "@/shared/components/StatusBadge";


import {
  fetchProjectEngineers,
  fetchEngineersAllocatedToProject,
  fetchEngineersAllocatedToBuilding,
  fetchAllocatedLocationsForEngineer,
  assignEngineerProject,
  fetchAllProjects,
  fetchAllBuildings,
  fetchAllEngineers
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

function createMapPinIcon(kind = "project") {
  const isBuilding = kind === "building";

  return divIcon({
    // إسناد كلاس مخصص يلغي افتراضيات Leaflet وكلاس فرعي لتحديد النوع
    className: isBuilding ? "building-pin-marker" : "project-pin-marker",
    // تمرير البنية الهيكلية فقط وتطبيق التنسيق الداخلي عبر كلاس map-pin-inner
    html: `<div class="map-pin-inner">${isBuilding ? "B" : "P"}</div>`,
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
  const rawName =
    item?.account?.full_name ||
    item?.relation?.engineer?.account?.full_name ||
    item?.engineer?.account?.full_name ||
    `${item?.account?.first_name || ""} ${item?.account?.last_name || ""}`.trim() ||
    "-";
  
  return parseLocalized(rawName); // حماية الاسم
}

function getEngineerDisplaySpecialization(item = {}) {
  const rawSpec =
    item?.info?.specialization ||
    item?.relation?.engineer?.additional_info?.specialization ||
    item?.engineer?.additional_info?.specialization ||
    "-";

  return parseLocalized(rawSpec); // حماية التخصص (المتهم الأول في الـ ar)
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

function parseLocalized(value) {
  if (value == null) {
    return "-";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(parseLocalized).join(", ");
  }

  if (typeof value === "object") {
    const candidate = value.ar ?? value.en ?? Object.values(value)[0];
    return parseLocalized(candidate);
  }

  return String(value);
}
function getEngineerDisplayExperience(item = {}) {
  return (
    item?.info?.experience_years ??
    item?.relation?.engineer?.additional_info?.experience_years ??
    item?.engineer?.additional_info?.experience_years ??
    "-"
  );
}
// 🌐 مكون التحكم الذكي بحركة كاميرا الخريطة (FlyTo)

function MapController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [target, map]);
  return null;
}
MapController.propTypes = {
  target: PropTypes.arrayOf(PropTypes.number),
};
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

  const systemProjects = useMemo(
    () => engineerState.projects || [],
    [engineerState.projects]
  );
  const systemBuildings = useMemo(
    () => engineerState.buildings || [],
    [engineerState.buildings]
  );

  const loading = engineerState.loading;
  const error = engineerState.error;

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignData, setAssignData] = useState({
    engineer_id: "",
    project_id: "",
    start_date: "",
    building_id: "",
  });
useEffect(() => {
  dispatch(fetchAllEngineers());
}, [dispatch]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
// الحالة الجديدة لتحديد بؤرة التركيز الجغرافي الفوري
  const [mapCenterTarget, setMapCenterTarget] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectBlock, setSelectedProjectBlock] = useState(null);
  const [selectedProjectEngineers, setSelectedProjectEngineers] = useState([]);
  const [projectEngineersLoading, setProjectEngineersLoading] = useState(false);

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [selectedBuildingBlock, setSelectedBuildingBlock] = useState(null);
  const [selectedBuildingEngineers, setSelectedBuildingEngineers] = useState([]);
  const [buildingEngineersLoading, setBuildingEngineersLoading] = useState(false);
// في أعلى المكون مع باقي الـ States

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

      // 2. جلب المشاريع والأبنية العموميين من الراوتين الجدد
      await Promise.allSettled([
        dispatch(fetchAllProjects()),
        dispatch(fetchAllBuildings()),
      ]);

      if (baseResult && baseResult.length > 0) {
        // 3. استخراج معرفات المشاريع الفريدة
        const uniqueProjectIds = Array.from(
          new Set(baseResult.map((item) => item.project_id || item.project?.id).filter(Boolean))
        );

        // 4. جلب تفاصيل المهندسين لكل مشروع بالتوازي من الراوت الغني
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
    () => (systemProjects.length ? systemProjects : groupedProjects.map((item) => item.project)),
    [systemProjects, groupedProjects]
  );

  const rawProjectBlocks = useMemo(
    () => systemProjects.map((project) => ({ project, relations: [], engineers: [] })),
    [systemProjects]
  );

  const {
  engineers: allEngineers = [],
} = useSelector((state) => state.projectEngineer);

  const selectedProject = useMemo(() => {
    return (
      systemProjects.find((project) => Number(project.id) === Number(assignData.project_id)) ||
      availableProjects.find(
        (project) => Number(project.id) === Number(assignData.project_id)
      )
    );
  }, [availableProjects, assignData.project_id, systemProjects]);

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


  const rawFilteredProjects = useMemo(() => {
    if (!rawProjectBlocks.length) return [];

    const q = normalizeText(searchTerm);

    return rawProjectBlocks.filter(({ project }) => {
      const matchesStatus =
        statusFilter === "all" || project?.status === statusFilter;

      const searchable = [
        project?.name,
        project?.description,
        project?.location?.name,
        project?.status,
        project?.coordinates?.latitude,
        project?.coordinates?.longitude,
      ]
        .map(normalizeText)
        .join(" ");

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [rawProjectBlocks, searchTerm, statusFilter]);

  const effectiveFilteredProjects =
    rawFilteredProjects.length > 0 ? rawFilteredProjects : filteredProjects;

  const rawBuildingPoints = useMemo(
    () =>
      systemBuildings
        .map((building) => {
          const coords = getProjectCoordinates(building);
          if (!coords) return null;

          const project =
            building.project ||
            (building.project_id
              ? {
                  id: building.project_id,
                  name: building.project_name || "مشروع مرتبطة",
                }
              : null);

          return {
            key: `raw-building-${building.id}`,
            type: "building",
            lat: coords.lat,
            lng: coords.lng,
            radius: coords.radius || 100,
            label: building.building_number || building.name || `Building #${building.id}`,
            sublabel: building.description || project?.name || "-",
            status: building.status,
            project,
            building,
          };
        })
        .filter(Boolean),
    [systemBuildings]
  );

  const totalRelations = items.length;
  const totalEngineers = groupedEngineers.length;
  const totalProjects = systemProjects.length || groupedProjects.length;
  const activeProjects = systemProjects.length
    ? systemProjects.filter((project) => project?.status === "in_progress").length
    : groupedProjects.filter((item) => item?.project?.status === "in_progress").length;

  const projectsToShow = effectiveFilteredProjects;

  const dashboardMapPoints = useMemo(() => {
    const projectPoints = buildDashboardMapPoints(effectiveFilteredProjects);
    const uniqueBuildings = rawBuildingPoints.filter(
      (point) =>
        !projectPoints.some(
          (existing) =>
            existing.building?.id && point.building?.id &&
            existing.building.id === point.building.id
        )
    );

    return [...projectPoints, ...uniqueBuildings];
  }, [effectiveFilteredProjects, rawBuildingPoints]);

  const projectsWithCoords = useMemo(
    () => effectiveFilteredProjects.filter((block) => getProjectCoordinates(block.project)),
    [effectiveFilteredProjects]
  );

  const dashboardMapCenter = useMemo(
    () => getMapCenterFromPoints(dashboardMapPoints),
    [dashboardMapPoints]
  );

  const selectedProjectEngineersGrouped = useMemo(() => {
    return groupEngineersForProjectModal(
      selectedProjectEngineers || [],
      selectedProjectBlock?.project || null
    );
  }, [selectedProjectEngineers, selectedProjectBlock]);

  

  

  const selectedBuildingEngineersGrouped = useMemo(
    () => groupEngineersForBuildingModal(selectedBuildingEngineers || []),
    [selectedBuildingEngineers]
  );


  
  const selectedEngineerProjectsGrouped = useMemo(
    () => groupProjectsFromAllocations(selectedEngineerAllocations || []),
    [selectedEngineerAllocations]
  );

  const showInitialLoading = loading && items.length === 0;
  const displayError = safeErrorText(error);

 const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignData((prev) => {
      if (name === "project_id") {
        return {
          ...prev,
          project_id: value,
          building_id: "", // تصغير المشاكل: تصفير المبنى فور تغيير المشروع لتجنب تداخل البيانات
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };
const handleSubmitAssign = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول الأساسية المطلوبة
    if (!assignData.engineer_id || !assignData.project_id || !assignData.start_date) {
      alert("الرجاء ملء جميع الحقول الإلزامية (المهندس، المشروع، وتاريخ البدء)");
      return;
    }

    // بناء الـ Payload المطهّر لمنع كراش الـ Backend
    const payload = {
      engineer_id: Number(assignData.engineer_id),
      project_id: Number(assignData.project_id),
      start_date: assignData.start_date,
      // إذا كان الحقل فارغاً أو لم يتم اختيار مبنى، يتم إرساله كـ null بدلاً من نص فارغ ""
      building_id: assignData.building_id && assignData.building_id !== "" 
        ? Number(assignData.building_id) 
        : null
    };

    try {
      // إطلاق عملية الحفظ عبر الـ Thunk
      await dispatch(assignEngineerProject(payload)).unwrap();
      
      // إغلاق الديالوغ وتصفير البيانات فور النجاح
      setAssignOpen(false);
      setAssignData({
        engineer_id: "",
        project_id: "",
        start_date: "",
        building_id: "",
      });
      
      // إعادة تحميل البيانات لتحديث الخريطة والقوائم فوراً
      dispatch(fetchProjectEngineers());
    } catch (err) {
      console.error("فشل إسناد المهندس:", err);
    }
  };
 
 

  const openProjectSidePanel = async (projectBlock) => {
    const coords = getProjectCoordinates(projectBlock.project);
    if (coords) setMapCenterTarget([coords.lat, coords.lng]);
    setSelectedProjectBlock(projectBlock);
    setProjectModalOpen(false);
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
const openBuildingSidePanel = async (building, projectContext) => {
  const coords = getProjectCoordinates(building);
  if (coords) setMapCenterTarget([coords.lat, coords.lng]);
  
  setSelectedBuildingBlock({
    building,
    project: projectContext || selectedProjectBlock?.project || null,
  });
  
  // 🎯 التحكم بالحالات: نغلق الديالوغات ونعرض الشريط الجانبي فقط
  setBuildingModalOpen(false); 
  setProjectModalOpen(false);
  setEngineerModalOpen(false);
  setSelectedProjectBlock(null);
  setSelectedEngineerBlock(null);
  setSelectedBuildingEngineers([]);
  setBuildingEngineersLoading(true);

  try {
    const result = await dispatch(fetchEngineersAllocatedToBuilding(building.id));
    if (fetchEngineersAllocatedToBuilding.fulfilled.match(result)) {
      setSelectedBuildingEngineers(Array.isArray(result.payload) ? result.payload : []);
    } else {
      setSelectedBuildingEngineers([]);
    }
  } finally {
    setBuildingEngineersLoading(false);
  }
};
  const openProjectDetails = async (projectBlock) => {
    const coords = getProjectCoordinates(projectBlock.project);
    if (coords) setMapCenterTarget([coords.lat, coords.lng]);
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
    const coords = getProjectCoordinates(building);
    if (coords) setMapCenterTarget([coords.lat, coords.lng]);
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
        const payloadData = Array.isArray(result.payload) ? result.payload : [];
        setSelectedEngineerAllocations(payloadData);
        
        // 💡 أضيفي هذا الشرط هنا للانتقال لأول موقع تابع للمهندس
        if (payloadData.length > 0) {
          const firstAlloc = payloadData[0];
          const targetObj = firstAlloc.allocation_type === "specific_building" ? firstAlloc.building : firstAlloc.project;
          const coords = getProjectCoordinates(targetObj);
          if (coords) setMapCenterTarget([coords.lat, coords.lng]);
        }
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
             onClick={() => {
    console.log("CLICK");
    setAssignOpen(true);
  }}
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
        <div className="project-empty-state project-empty-state--error">
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

            <div className="engineering-map-real engineering-map-real--overlay">
              <MapContainer center={dashboardMapCenter} zoom={12} className="engineering-map-container">
                {/* لوحة التحكم بتبديل المظهر وقمر صناعي Esri */}
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="قمر صناعي (Satellite View)">
                    <TileLayer
                      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="خريطة الشوارع العادية">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>

                {/* تفعيل متحكم حركة كاميرا الخريطة الفوري */}
               <MapController target={mapCenterTarget} />

{dashboardMapPoints.map((point) => (
  <div key={point.key}>
    <Marker
      position={[point.lat, point.lng]}
      // إزالة الـ theme لتجنب مشاكل المتغيرات غير المستخدمة
      icon={createMapPinIcon(point.type)} 
      eventHandlers={{
  click: () => {
    setMapCenterTarget([point.lat, point.lng]);
    if (point.type === "project") {
      openProjectSidePanel(point);
    } else {
      // 🎯 استدعاء شريط الأبنية الجانبي هنا بدلاً من الديالوغ المباشر
      openBuildingSidePanel(point.building, point.project); 
    }
  }
}}
    />
    <Circle
      center={[point.lat, point.lng]}
      radius={point.radius}
      // 🎯 الاعتماد الكلي على كلاسات CSS للتحكم بالألوان والخصائص
      pathOptions={{
        className: point.type === "building" ? "map-building-circle" : "map-project-circle"
      }}
    />
  </div>
))}
              </MapContainer>

              {selectedProjectBlock && (
                <div className="google-maps-side-panel">
                  <div className="google-maps-side-panel-header">
                    <div className="google-maps-side-panel-header-content">
                      <h3 className="google-maps-side-panel-title">{selectedProjectBlock.project?.name}</h3>
                      <div className="google-maps-side-panel-subtitle">
                        {parseLocalized(selectedProjectBlock.project?.location?.name) || "-"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProjectBlock(null)}
                      aria-label="اغلاق لوحة التفاصيل"
                      className="google-maps-side-panel-close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="google-maps-side-panel-body">
                    <div className="google-maps-side-panel-image-shell">
                      <img
                        src={selectedProjectBlock.project?.image_url || "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=800"}
                        alt={selectedProjectBlock.project?.name}
                        className="google-maps-side-panel-image"
                      />
                    </div>

                    <div className="google-maps-side-panel-content">
                      <div className="google-maps-side-panel-meta-row">
                        <div className="google-maps-side-panel-meta-label">
                          {selectedProjectBlock.project?.category || "مشروع هندسي"}
                        </div>
                        <div
                          className={
                            selectedProjectBlock.project?.status === "active"
                              ? "google-maps-side-panel-status google-maps-side-panel-status--active"
                              : "google-maps-side-panel-status google-maps-side-panel-status--inactive"
                          }
                        >
                          {getStatusMeta(selectedProjectBlock.project?.status).label}
                        </div>
                      </div>

                      <div className="google-maps-side-panel-actions">
                        <button
                          type="button"
                          onClick={() => {
                            const coords = getProjectCoordinates(selectedProjectBlock.project);
                            if (coords) setMapCenterTarget([coords.lat, coords.lng]);
                          }}
                          className="btn-ghost google-maps-side-panel-action-btn"
                        >
                          📍 تحديد الموقع
                        </button>

                        <button
                          type="button"
                          onClick={() => openProjectDetails(selectedProjectBlock)}
                          className="btn-ghost google-maps-side-panel-action-btn"
                        >
                          📊 التقرير الكامل
                        </button>
                      </div>

                      <hr className="google-maps-side-panel-divider" />

                      <div className="google-maps-side-panel-section">
                        <strong>الموقع</strong>
                        <div className="google-maps-side-panel-section-text">
                          {parseLocalized(selectedProjectBlock.project?.location?.name) || "-"}
                        </div>

                        <div className="google-maps-side-panel-section-block">
                          <strong>الفترة</strong>
                          <div className="google-maps-side-panel-section-text">
                            {formatDate(selectedProjectBlock.project?.start_date)} — {selectedProjectBlock.project?.end_date || "مفتوح"}
                          </div>
                        </div>

                        <div className="google-maps-side-panel-section-block">
                          <strong>الوصف</strong>
                          <p className="google-maps-side-panel-section-text">
                            {selectedProjectBlock.project?.description || "لا يوجد وصف للمشروع."}
                          </p>
                        </div>

                        <div className="google-maps-side-panel-section-block">
                          <strong>المهندسون</strong>
                          <div className="google-maps-side-panel-section-text">
                            {selectedProjectEngineersGrouped.length} مهندس
                          </div>
                        </div>

                        <div className="google-maps-side-panel-section-block">
                          <strong>الأبنية</strong>
                          <div className="google-maps-side-panel-section-text">
                            {selectedProjectBlock.project?.buildings?.length || 0} مبنى
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
{/* 🏢 🎯 شريط الأبنية الجانبي الجديد (بنفس أسلوب كرت المشروع تماماً) */}
{selectedBuildingBlock && !buildingModalOpen && (
  <div className="google-maps-side-panel">
    <div className="google-maps-side-panel-header">
      <div className="google-maps-side-panel-header-content">
        <h3 className="google-maps-side-panel-title">
          بناء رقم: {selectedBuildingBlock.building?.building_number || "-"}
        </h3>
        <div className="google-maps-side-panel-subtitle">
          المشروع: {selectedBuildingBlock.project?.name || "-"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSelectedBuildingBlock(null)}
        aria-label="إغلاق لوحة تفاصيل البناء"
        className="google-maps-side-panel-close"
      >
        ✕
      </button>
    </div>

    <div className="google-maps-side-panel-body">
      <div className="google-maps-side-panel-image-shell">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800"
          alt={selectedBuildingBlock.building?.building_number}
          className="google-maps-side-panel-image"
        />
      </div>

      <div className="google-maps-side-panel-content">
        <div className="google-maps-side-panel-meta-row">
          <div className="google-maps-side-panel-meta-label">
            {selectedBuildingBlock.building?.floors_count || "-"} طوابق
          </div>
          <div className="google-maps-side-panel-status google-maps-side-panel-status--active">
            {getStatusMeta(selectedBuildingBlock.building?.status).label}
          </div>
        </div>

        <div className="google-maps-side-panel-actions">
          <button
            type="button"
            onClick={() => {
              const coords = getProjectCoordinates(selectedBuildingBlock.building);
              if (coords) setMapCenterTarget([coords.lat, coords.lng]);
            }}
            className="btn-ghost google-maps-side-panel-action-btn"
          >
            📍 تحديد الموقع
          </button>

          {/* عند ضغط هذا الزر، يفتح الديالوغ الشامل فوراً مع بقاء البيانات المخزنة */}
          <button
            type="button"
            onClick={() =>
              openBuildingDetails(
                selectedBuildingBlock.building,
                selectedBuildingBlock.project
              )
            }
            className="btn-ghost google-maps-side-panel-action-btn"
          >
            📊 التقرير الكامل
          </button>
        </div>

        <hr className="google-maps-side-panel-divider" />

        <div className="google-maps-side-panel-section">
          <strong>الوصف والتفاصيل</strong>
          <p className="google-maps-side-panel-section-text">
            {selectedBuildingBlock.building?.description || "لا يوجد وصف مسجل لهذا البناء."}
          </p>

          <div className="google-maps-side-panel-section-block">
            <strong>المهندسون المرتبطون</strong>
            <div className="google-maps-side-panel-section-text">
              {buildingEngineersLoading
                ? "جاري تحميل قائمة المهندسين..."
                : `${selectedBuildingEngineersGrouped.length} مهندس مسند بالبناء حلياً`}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
            </div>
          </section>

          <section className="engineering-engineers-section">
            <div className="engineering-section-head engineering-section-head--compact">
              <div>
                <h2>المشاريع المرتبطة</h2>
              </div>
              <span>{projectsToShow.length} مشروع</span>
            </div>

            {projectsToShow.length === 0 ? (
              <div className="project-empty-state">لا توجد مشاريع مطابقة.</div>
            ) : (
              <div className="project-modal-engineer-projects">
                {projectsToShow.map((block) => {
                  const meta = getStatusMeta(block.project?.status);

                  return (
                    <article className="engineer-project-card" key={block.project.id}>
                      <div className="mini-project-card-head">
                        <div>
                          <div className="project-card-action-row">
                            <Button
                              className="dashboard-inline-btn dashboard-inline-btn--ghost"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const coords = getProjectCoordinates(block.project);
                                if (coords) setMapCenterTarget([coords.lat, coords.lng]);
                              }}
                            >
                              تحديد موقع
                            </Button>

                            <Button className="dashboard-inline-btn dashboard-inline-btn--primary" size="sm" onClick={() => openProjectSidePanel(block)}>
                              تفاصيل
                            </Button>
                          </div>
                          <button
                            type="button"
                            className="project-title-btn project-title-btn--small"
                            onClick={() => openProjectSidePanel(block)}
                          >
                            {block.project?.name || "-"}
                          </button>

                          <p className="project-location-line">
                            <MapPinned size={14} />
                            <span>{parseLocalized(block.project?.location?.name) || "-"}</span>
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

                      <div className="project-chip-row project-chip-row--spaced">
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

      {/* ديالوغ إسناد مهندس جديد - بتصميم مطور بالكامل */}
      <Modal 
        open={assignOpen} 
        onClose={() => setAssignOpen(false)} 
        title="إسناد مهندس لموقع عمل جديد"
      >
        <form onSubmit={handleSubmitAssign} className="modern-form-container">
          <p className="form-subtitle-desc">
            قم بتعبئة البيانات أدناه لربط المهندس بالمشروع وتحديد نطاق الصلاحية الجغرافية بدقة.
          </p>

          <div className="form-grid-layout">
            
            {/* حقل اختيار المهندس */}
            <div className="form-group-field">
              <label htmlFor="engineer_id">
                <Users2 size={16} /> المهندس المسؤول <span className="required-star">*</span>
              </label>
              <div className="select-input-wrapper">
                <select
                  id="engineer_id"
                  name="engineer_id"
                  value={assignData.engineer_id}
                  onChange={handleAssignChange}
                  required
                >
                  <option value="">-- اختر المهندس المطلوب --</option>
                  {allEngineers.map((eng)  => (
                    <option
  key={eng.additional_info.engineer_id}
  value={eng.additional_info.engineer_id}
>
  {eng.account.full_name}
  {" - "}
  {eng.additional_info.specialization}
</option>
                  ))}
                </select>
              </div>
            </div>

            {/* حقل اختيار المشروع */}
            <div className="form-group-field">
              <label htmlFor="project_id">
                <FolderKanban size={16} /> المشروع المستهدف <span className="required-star">*</span>
              </label>
              <div className="select-input-wrapper">
                <select
                  id="project_id"
                  name="project_id"
                  value={assignData.project_id}
                  onChange={handleAssignChange}
                  required
                >
                  <option value="">-- اختر المشروع --</option>
                  {availableProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} {proj.location?.name ? `[${proj.location.name}]` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* حقل اختيار البناء (يظهر أو يتفعل بشكل ديناميكي بناءً على المشروع المختار) */}
            <div className={`form-group-field ${!assignData.project_id ? "disabled-opacity" : ""}`}>
              <label htmlFor="building_id">
                <Building2 size={16} /> نطاق العمل (بناء محدد أو شامل)
              </label>
              <div className="select-input-wrapper">
                <select
                  id="building_id"
                  name="building_id"
                  value={assignData.building_id}
                  onChange={handleAssignChange}
                  disabled={!assignData.project_id}
                >
                  <option value="">على مستوى المشروع بالكامل (عام)</option>
                  {availableBuildings.map((bld) => (
                    <option key={bld.id} value={bld.id}>
                      {bld.building_number} {bld.description ? `- ${bld.description}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <span className="field-hint-text">
                {!assignData.project_id 
                  ? "يرجى اختيار المشروع أولاً لتظهر الأبنية التابعة له." 
                  : "اتركه فارغاً إذا كنت تريد إسناد المهندس لكامل إحداثيات المشروع."}
              </span>
            </div>

            {/* حقل تاريخ البدء */}
            <div className="form-group-field">
              <label htmlFor="start_date">
                <CalendarDays size={16} /> تاريخ مباشرة العمل <span className="required-star">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={assignData.start_date}
                onChange={handleAssignChange}
                required
                className="modern-date-picker"
              />
            </div>

          </div>

          {/* شريط أزرار التحكم السفلي */}
          <div className="form-actions-footer">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setAssignOpen(false)}
            >
              إلغاء الأمر
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={loading}
            >
              {loading ? "جاري الحفظ..." : "تأكيد الإسناد الموقعي"}
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
                                openProjectSidePanel({
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