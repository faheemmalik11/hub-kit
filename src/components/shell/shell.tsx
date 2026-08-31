import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, X, type LucideIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Separator } from "../../ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "../../ui/sidebar";
import { Toaster } from "../../ui/sonner";
import { TooltipProvider } from "../../ui/tooltip";
import { cn } from "../../lib/class-names";
import { buildCrumbs } from "./breadcrumbs";
import {
  isShellGroup,
  type ShellBadge,
  type ShellNavEntry,
  type ShellNavGroup,
  type ShellNavLink,
} from "./types";

const ShellLeafLabelContext = createContext<(label: string | null) => void>(() => {});

export function useShellLeafLabel(label: string | null) {
  const set = useContext(ShellLeafLabelContext);
  useEffect(() => {
    set(label);
    return () => set(null);
  }, [set, label]);
}

export interface ShellProps {
  nav: ShellNavEntry[];
  logo: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  badges?: Record<string, ShellBadge>;
  homeLabel: string;
  staticLeafLabels?: Record<string, string>;
  breadcrumbAriaLabel?: string;
  closeLabel?: string;
  children: ReactNode;
}

export function ShellFooterGroup({
  label,
  icon: Icon,
  items,
  active,
}: {
  label: string;
  icon: LucideIcon;
  items: ShellNavLink[];
  active: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const groupRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <ShellRailMenu label={label} icon={Icon} items={items} active={active} align="end" />
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      {/* Opens upward. This group is pinned to the bottom of the sidebar, so growing downward
          like the nav groups above would push its items past the screen edge, which reads as a
          click that did nothing. The content renders BEFORE the trigger so it stacks above it. */}
      <SidebarMenuItem ref={groupRef} className="flex flex-col">
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          {/* Styled as the SAME card the collapsed rail shows, not as an inline sub-list: this
              group reads as one panel in both sidebar states, so the surface, rounding, border,
              primary left accent and shadow are carried over from ShellRailMenu's popover. */}
          <SidebarMenuSub className="mx-1 mb-1 gap-0.5 rounded-md border border-l-4 border-border border-l-primary bg-popover p-1 shadow-xl">
            {items.map((child) => {
              const childActive =
                child.to === "/" ? pathname === "/" : pathname.startsWith(child.to);
              return (
                <SidebarMenuSubItem key={child.key}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <Link
                      to={child.to}
                      aria-current={childActive ? "page" : undefined}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <child.icon className="size-4" />
                      <span>{child.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
        <CollapsibleTrigger asChild>
          {/* No isActive on the trigger: like the other nav groups, only the child that IS the
              current page carries the highlight. */}
          <SidebarMenuButton>
            <Icon />
            <span>{label}</span>
            {/* Same chevron behaviour as the nav groups above: down while closed, flipped up
                once open. Consistency with the rest of the sidebar beats hinting the direction
                the panel happens to grow in. */}
            <ChevronDown className="ml-auto size-4 shrink-0 opacity-60 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function ShellRailMenu({
  label,
  icon: Icon,
  items,
  active,
  align = "start",
}: {
  label: string;
  icon: LucideIcon;
  items: ShellNavLink[];
  active: boolean;
  align?: "start" | "end";
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton isActive={active}>
          <Icon />
          <span>{label}</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "top" : "right"}
        align={isMobile ? "start" : align}
        sideOffset={isMobile ? 8 : 10}
        collisionPadding={12}
        className={cn(
          "min-w-52 max-w-[calc(100vw-2rem)] overflow-visible border-l-4 border-l-primary shadow-xl",
          "relative before:absolute before:h-0 before:w-0 before:content-['']",
          "data-[side=right]:before:-left-2 data-[side=right]:before:border-y-8 data-[side=right]:before:border-r-8 data-[side=right]:before:border-y-transparent data-[side=right]:before:border-r-primary",
          "data-[side=right]:data-[align=start]:before:top-4 data-[side=right]:data-[align=end]:before:bottom-4",
          "data-[side=top]:before:-bottom-2 data-[side=top]:before:left-5 data-[side=top]:before:border-x-8 data-[side=top]:before:border-t-8 data-[side=top]:before:border-x-transparent data-[side=top]:before:border-t-primary",
        )}
      >
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {items.map((child) => {
          const childActive = child.to === "/" ? pathname === "/" : pathname.startsWith(child.to);
          return (
            <DropdownMenuItem key={child.key} asChild>
              <Link
                to={child.to}
                aria-current={childActive ? "page" : undefined}
                onClick={() => isMobile && setOpenMobile(false)}
                className={cn("cursor-pointer", childActive && "font-medium text-brand")}
              >
                <child.icon className="size-4" />
                {child.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Shell({
  nav,
  logo,
  footer,
  headerActions,
  badges,
  homeLabel,
  staticLeafLabels,
  breadcrumbAriaLabel,
  closeLabel,
  children,
}: ShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [leafLabel, setLeafLabel] = useState<string | null>(null);
  const crumbs = useMemo(() => {
    const built = buildCrumbs({ nav, pathname, homeLabel, staticLeafLabels });
    if (leafLabel && built.length > 1) {
      built[built.length - 1] = { ...built[built.length - 1], label: leafLabel };
    }
    return built;
  }, [nav, pathname, homeLabel, staticLeafLabels, leafLabel]);

  return (
    <TooltipProvider delayDuration={200}>
      <ShellLeafLabelContext.Provider value={setLeafLabel}>
        <SidebarProvider>
          <ShellSidebar
            nav={nav}
            logo={logo}
            footer={footer}
            badges={badges}
            closeLabel={closeLabel}
          />
          <SidebarInset className="min-w-0 bg-brand-wash">
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-header/90 px-4 backdrop-blur-sm">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator orientation="vertical" className="mr-1 h-4 shrink-0" />
              <Breadcrumb aria-label={breadcrumbAriaLabel} className="min-w-0">
                <BreadcrumbList className="flex-nowrap sm:hidden">
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">
                      {crumbs[crumbs.length - 1]?.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>

                <BreadcrumbList className="hidden flex-nowrap sm:flex">
                  {crumbs.map((crumb, i) => {
                    const last = i === crumbs.length - 1;
                    return (
                      <BreadcrumbItem key={`${crumb.label}-${i}`} className="min-w-0">
                        {last ? (
                          <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                        ) : crumb.to ? (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.to} className="truncate">
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        ) : (
                          <span className="truncate text-muted-foreground">{crumb.label}</span>
                        )}
                        {!last && <BreadcrumbSeparator className="shrink-0" />}
                      </BreadcrumbItem>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
              {headerActions && (
                <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">{headerActions}</div>
              )}
            </header>
            <main className="w-full min-w-0 px-4 py-4 sm:px-6">{children}</main>
            <Toaster position="bottom-right" />
          </SidebarInset>
        </SidebarProvider>
      </ShellLeafLabelContext.Provider>
    </TooltipProvider>
  );
}

function ShellSidebar({
  nav,
  logo,
  footer,
  badges,
  closeLabel,
}: Pick<ShellProps, "nav" | "logo" | "footer" | "badges" | "closeLabel">) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const railCollapsed = state === "collapsed" && !isMobile;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center justify-between px-3">
        {logo}
        {isMobile && (
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            aria-label={closeLabel}
            className="-mr-1 shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.map((item) => {
              const badge = badges?.[item.key];
              const showBadge = !!badge && badge.count > 0;

              if (!isShellGroup(item)) {
                const active = isActive(item.to);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={item.to}
                        aria-current={active ? "page" : undefined}
                        onClick={closeOnMobile}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {showBadge && <ShellBadgePill badge={badge} />}
                  </SidebarMenuItem>
                );
              }

              const groupActive = item.items.some((c) => isActive(c.to));

              if (railCollapsed) {
                return (
                  <SidebarMenuItem key={item.key}>
                    <ShellRailMenu
                      label={item.label}
                      icon={item.icon}
                      items={item.items}
                      active={groupActive}
                    />
                    {showBadge && <ShellBadgePill badge={badge} />}
                  </SidebarMenuItem>
                );
              }

              return (
                <ShellNavGroupItem
                  key={item.key}
                  item={item}
                  groupActive={groupActive}
                  isActive={isActive}
                  closeOnMobile={closeOnMobile}
                  badge={showBadge ? badge : undefined}
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {footer && <SidebarFooter className="gap-2">{footer}</SidebarFooter>}

      <SidebarRail />
    </Sidebar>
  );
}

function ShellNavGroupItem({
  item,
  groupActive,
  isActive,
  closeOnMobile,
  badge,
}: {
  item: ShellNavGroup;
  groupActive: boolean;
  isActive: (to: string) => boolean;
  closeOnMobile: () => void;
  badge?: ShellBadge;
}) {
  const [open, setOpen] = useState(groupActive);
  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <item.icon />
            <span>{item.label}</span>
            <ChevronDown className="ml-auto size-4 shrink-0 opacity-60 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {badge && <ShellBadgePill badge={badge} className="right-8" />}
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub>
            {item.items.map((child) => (
              <SidebarMenuSubItem key={child.key}>
                <SidebarMenuSubButton asChild isActive={isActive(child.to)}>
                  <Link
                    to={child.to}
                    aria-current={isActive(child.to) ? "page" : undefined}
                    onClick={closeOnMobile}
                  >
                    <child.icon className="size-4" />
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function ShellBadgePill({ badge, className }: { badge: ShellBadge; className?: string }) {
  return (
    <SidebarMenuBadge
      title={badge.title}
      className={cn("pointer-events-none bg-amber-500 text-white", className)}
    >
      {badge.count}
    </SidebarMenuBadge>
  );
}
