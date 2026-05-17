export const engineeringEngineers = [
  {
    id: 1,
    name: "Amira Khalil",
    email: "amira.khalil@realestate.com",
    phone: "+31 6 10000008",
    specialty: "Civil Engineer",
    status: "active",
  },
  {
    id: 2,
    name: "Omar Nasser",
    email: "omar.nasser@realestate.com",
    phone: "+31 6 10000009",
    specialty: "Site Engineer",
    status: "active",
  },
  {
    id: 3,
    name: "Sara Yassin",
    email: "sara.yassin@realestate.com",
    phone: "+31 6 10000010",
    specialty: "Electrical Engineer",
    status: "inactive",
  },
];

export const engineeringProjects = [
  {
    id: "PRJ-1001",
    name: "Platinum Tower",
    client: "Platinum Group",
    status: "active",
    progress: 72,
    engineerCount: 3,
    leadEngineer: "Amira Khalil",
  },
  {
    id: "PRJ-1002",
    name: "Marina Heights",
    client: "Ocean Holdings",
    status: "paused",
    progress: 45,
    engineerCount: 2,
    leadEngineer: "Omar Nasser",
  },
  {
    id: "PRJ-1003",
    name: "Green Villas",
    client: "Eco Living",
    status: "completed",
    progress: 100,
    engineerCount: 1,
    leadEngineer: "Sara Yassin",
  },
];

export const engineeringAssignments = [
  {
    id: 1,
    engineer: "Amira Khalil",
    project: "Platinum Tower",
    role: "Supervisor",
    status: "active",
    assignedAt: "2026-05-15",
  },
  {
    id: 2,
    engineer: "Omar Nasser",
    project: "Marina Heights",
    role: "Inspector",
    status: "active",
    assignedAt: "2026-05-14",
  },
  {
    id: 3,
    engineer: "Sara Yassin",
    project: "Green Villas",
    role: "Consultant",
    status: "completed",
    assignedAt: "2026-05-10",
  },
];

export const engineeringReports = [
  {
    id: 1,
    title: "Weekly Engineering Activity",
    type: "Summary",
    date: "2026-05-16",
    status: "ready",
  },
  {
    id: 2,
    title: "Project Progress Overview",
    type: "Progress",
    date: "2026-05-15",
    status: "ready",
  },
  {
    id: 3,
    title: "Assignment Load Report",
    type: "Workload",
    date: "2026-05-14",
    status: "draft",
  },
];