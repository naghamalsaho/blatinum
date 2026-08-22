import {
  FolderKanban,
  Users2,
  FileText,
  Sparkles,
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
    items: [
      {
        label: "المهندسون",
        icon: Users2,
        to: "/engineering/engineers",
      },
    ],
  },
  {
    items: [
      {
        label: "التقارير",
        icon: FileText,
        to: "/engineering/reports",
      },
    ],
  },
  {
    items: [
      {
        label: "استوديو الذكاء الاصطناعي",
        icon: Sparkles,
        to: "/engineering/ai-design",
        badge: "جديد",
      },
    ],
  },
];