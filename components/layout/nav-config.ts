import {
  Award,
  BookOpen,
  Box,
  LayoutDashboard,
  Map,
  Settings,
  Ship,
  Target,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/learn", label: "Learning path", icon: Map },
      { href: "/learn/docker", label: "Docker", icon: Box },
      { href: "/learn/kubernetes", label: "Kubernetes", icon: Ship },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/playground", label: "Playground", icon: Terminal },
      { href: "/challenges", label: "Challenges", icon: Target },
      { href: "/glossary", label: "Glossary", icon: BookOpen },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/achievements", label: "Achievements", icon: Award },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: Map },
  { href: "/playground", label: "Playground", icon: Terminal },
  { href: "/challenges", label: "Challenges", icon: Target },
];

const ALL_HREFS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));

/** Returns the nav href that best matches the current path (longest prefix wins). */
export function activeHref(pathname: string): string | null {
  if (pathname.startsWith("/lesson/")) return "/learn";
  let best: string | null = null;
  for (const href of ALL_HREFS) {
    const match = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (match && (!best || href.length > best.length)) best = href;
  }
  return best;
}
