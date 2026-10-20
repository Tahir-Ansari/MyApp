import {
  Award,
  BookOpen,
  Boxes,
  Container,
  LayoutDashboard,
  Settings,
  SquareTerminal,
  Swords,
  Library,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string;
  icon: LucideIcon;
  /** False while the route doesn't exist yet: rendered as a disabled "Soon" item, never as a link. */
  ready: boolean;
  /** Shown in the mobile bottom bar (only honoured when `ready`). */
  mobile?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Single source of truth for app navigation. Flip `ready` once a route ships. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, ready: true, mobile: true },
      { href: "/learn", label: "Learning paths", shortLabel: "Learn", icon: BookOpen, ready: true, mobile: true },
    ],
  },
  {
    label: "Tracks",
    items: [
      { href: "/learn/docker", label: "Docker", icon: Container, ready: true, mobile: true },
      { href: "/learn/kubernetes", label: "Kubernetes", shortLabel: "K8s", icon: Boxes, ready: true, mobile: true },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/playground", label: "Playground", icon: SquareTerminal, ready: false },
      { href: "/challenges", label: "Challenges", icon: Swords, ready: false },
      { href: "/achievements", label: "Achievements", icon: Award, ready: false },
      { href: "/glossary", label: "Glossary", icon: Library, ready: false },
    ],
  },
  {
    label: "App",
    items: [{ href: "/settings", label: "Settings", icon: Settings, ready: true, mobile: true }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((i) => i.ready && i.mobile);

/**
 * The single nav item that best matches `pathname`: exact match for "/", otherwise the longest
 * ready href that is a path prefix. So /learn/docker/x activates "Docker", not "Learning paths".
 */
export function activeHref(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === "/") return "/";
  let best: string | null = null;
  for (const item of NAV_ITEMS) {
    if (!item.ready || item.href === "/") continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}
