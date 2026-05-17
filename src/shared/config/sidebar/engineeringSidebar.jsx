import {
  FolderKanban,
  BriefcaseBusiness,
  Users2,
  ChartNoAxesCombined,
  FolderSearch,
  Settings2,
} from "lucide-react";

export const engineeringSidebar = [
  {
    title: "القسم الهندسي",
    items: [
      {
        label: "لوحة القسم الهندسي",
        icon: FolderKanban,
        to: "/engineering",
        end: true,
      },
    ],
  },

  {
    title: "Engineering Project",
    items: [
      {
        label: "Assign",
        icon: BriefcaseBusiness,
        to: "/engineering/projects/assign",
      },
      {
        label: "Update",
        icon: Settings2,
        to: "/engineering/projects/update",
      },
      {
        label: "Read projects with engs",
        icon: FolderSearch,
        to: "/engineering/projects/with-engineers",
      },
      {
        label: "Read projects for eng",
        icon: Users2,
        to: "/engineering/projects/for-engineer",
      },
      {
        label: "Get eng in project",
        icon: ChartNoAxesCombined,
        to: "/engineering/projects/project-engineers",
      },
    ],
  },

  {
    title: "Engineer",
    items: [
      {
        label: "Create",
        icon: Users2,
        to: "/engineering/engineers/create",
      },
      {
        label: "Read all",
        icon: Users2,
        to: "/engineering/engineers",
      },
      {
        label: "Delete",
        icon: Users2,
        to: "/engineering/engineers/delete",
      },
    ],
  },

  {
    title: "Reports",
    items: [
      {
        label: "Read all",
        icon: ChartNoAxesCombined,
        to: "/engineering/reports",
      },
    ],
  },
];