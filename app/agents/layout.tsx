import type { ReactNode } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AgentHeader } from "./components/agent-header"
import { AgentSidebar } from "./components/agent-sidebar"

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-background">
        <AgentSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AgentHeader />
          <main className="flex-1 bg-muted/20 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
