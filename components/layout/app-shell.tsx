"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container, HardDrive, Menu } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV, NAV_GROUPS, activeHref } from "./nav-config";
import { SidebarLevel } from "./sidebar-level";
import { Toaster } from "./toaster";
import { StorageNotice } from "./storage-notice";
import { MotionPreferences } from "./motion-preferences";
import { InstallButton } from "@/components/pwa/install-button";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg">
      <span className="flex size-8 items-center justify-center rounded-lg border border-accent-border bg-accent-soft text-accent-strong">
        <Container className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-semibold text-foreground">DevOps Quest</span>
        <span className="block text-xs text-subtle">Docker &amp; Kubernetes</span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = activeHref(pathname);
  return (
    <nav aria-label="Main" className="flex flex-col">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = current === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                      active
                        ? "bg-accent-soft font-medium text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent-strong"
                        : "text-muted hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", active ? "text-accent-strong" : "text-subtle")} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-3 border-t border-border p-3">
      <SidebarLevel />
      <p className="flex items-center gap-2 px-1 text-xs text-subtle">
        <HardDrive className="size-3.5" aria-hidden />
        Progress saved on this device
      </p>
    </div>
  );
}

function MobileTopBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-border bg-background-2/90 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1">
        <InstallButton />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <Menu className="size-5" aria-hidden />
            </Button>
          </DialogTrigger>
          <DialogContent side="left" className="flex flex-col p-0">
            <div className="p-4 pb-0">
              <DialogTitle className="sr-only">Navigation</DialogTitle>
              <DialogDescription className="sr-only">Jump to any section of DevOps Quest.</DialogDescription>
              <Logo />
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter />
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const current = activeHref(pathname);
  return (
    <nav
      aria-label="Quick"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background-2 lg:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {BOTTOM_NAV.map((item) => {
          const active =
            current === item.href || (item.href === "/learn" && (current === "/learn/docker" || current === "/learn/kubernetes"));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[11px]",
                  active
                    ? "text-accent-strong before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-accent-strong"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionPreferences>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface-2 px-4 py-2 text-sm text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background-2 lg:flex">
          <div className="p-4">
            <Logo />
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
            <NavList />
          </div>
          <SidebarFooter />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <MobileTopBar />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] outline-none sm:px-6 sm:py-10 lg:px-10 lg:pb-10"
          >
            <StorageNotice />
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <Toaster />
    </MotionPreferences>
  );
}
