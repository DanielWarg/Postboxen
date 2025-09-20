"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { agentNavItems } from "./nav-items"

export function AgentSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/agents" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
            PB
          </span>
          <span className={cn("flex flex-col leading-tight", state === "collapsed" && "hidden")}
          >
            <span className="text-sm font-semibold text-sidebar-foreground">Postboxen</span>
            <span className="text-xs text-muted-foreground">Agentpanelen</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Navigering
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agentNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/agents" && pathname.startsWith(`${item.href}/`))
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href} className="flex flex-1 items-center gap-3">
                        <Icon className="size-4" />
                        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden text-left">
                          <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                          <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            GA
          </span>
          <div className={cn("flex flex-col", state === "collapsed" && "hidden")}>
            <span className="text-sm font-medium text-sidebar-foreground">General availability</span>
            <Badge variant="outline" className="mt-1 w-fit border-primary/40 bg-transparent text-[11px] uppercase tracking-wide text-primary">
              Pilot
            </Badge>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
