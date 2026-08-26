import {
  CalendarClock,
  FolderOpen,
  Grid2X2,
  LayoutDashboard,
  Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  short?: string;
  match?: (pathname: string) => boolean;
}

export const primaryNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/vault",
    label: "Vault",
    icon: FolderOpen,
    match: (p) => p === "/vault" || p.startsWith("/vault/"),
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Grid2X2,
    match: (p) => p.startsWith("/categories"),
  },
  {
    href: "/collections",
    label: "Collections",
    icon: Library,
    match: (p) => p.startsWith("/collections"),
  },
  {
    href: "/reminders",
    label: "Expiring",
    icon: CalendarClock,
    match: (p) => p.startsWith("/reminders"),
  },
];
