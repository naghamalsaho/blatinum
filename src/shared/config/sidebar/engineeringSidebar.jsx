import {
  FolderKanban,
  
  Users2,
  ChartNoAxesCombined,
  
  
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
        label: "Engineers",
        icon: Users2,
        to: "/engineering/engineers",
      },
    ],
  },

  {
    
    items: [
      {
        label: "Reports",
        icon: ChartNoAxesCombined,
        to: "/engineering/reports",
      },
    ],
  },
];