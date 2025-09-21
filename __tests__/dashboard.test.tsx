import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Dashboard from "@/app/agents/page"

// Mock the components that might cause issues in tests
jest.mock("@/app/agents/components/monitoring-dashboard", () => ({
  MonitoringDashboard: () => <div data-testid="monitoring-dashboard">Monitoring Dashboard</div>
}))

jest.mock("@/app/agents/components/slash-commands-card", () => ({
  SlashCommandsCard: () => <div data-testid="slash-commands-card">Slash Commands Card</div>
}))

jest.mock("@/app/agents/components/magic-invite-card", () => ({
  MagicInviteCard: () => <div data-testid="magic-invite-card">Magic Invite Card</div>
}))

jest.mock("@/app/agents/components/consent-card", () => ({
  ConsentCard: () => <div data-testid="consent-card">Consent Card</div>
}))

describe("Dashboard (minimal spotlight UI)", () => {
  test("renderar Spotlight-header och standardtab (Möten)", () => {
    render(<Dashboard />)
    expect(screen.getByText("Spotlight")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Möten" })).toHaveAttribute("data-state", "active")
  })

  test("kompakt läge visar 3 KPI, icke-kompakt visar 4", async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    
    // Kompakt (default): ingen "Mötesdisciplin"-KPI
    expect(screen.queryByText("Mötesdisciplin")).not.toBeInTheDocument()

    // Toggle kompakt av
    const compactSwitch = screen.getByLabelText("Kompakt läge")
    await user.click(compactSwitch)

    // Nu ska fjärde KPI:n synas
    expect(screen.getByText("Mötesdisciplin")).toBeInTheDocument()
  })

  test("kan växla till Observability och se målraderna utan JSX-fel", async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    
    const observabilityTab = screen.getByRole("tab", { name: "Observability" })
    await user.click(observabilityTab)

    // Matcha texten som innehåller `< 90s` och `< 48h`
    expect(screen.getByText(/Mål recap\s*<\s*90s: ✅/)).toBeInTheDocument()
    expect(screen.getByText(/Mål nudge\s*<\s*48h: ✅/)).toBeInTheDocument()
  })

  test("Hjälp-sheet öppnas och visar hjälptext för aktiv spotlight", async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    
    await user.click(screen.getByRole("button", { name: /Hjälp/i }))
    expect(screen.getByText(/Använd Spotlight-väljaren för att hålla fokus/)).toBeInTheDocument()
  })

  test("kan växla mellan alla spotlights utan fel", async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    const spotlights = [
      "Möten", "Beslut", "Åtgärder", "Briefs", "Regwatch", 
      "Compliance", "Observability", "Monitoring", "Slash-kommandon", 
      "Magisk inbjudan", "Samtycke"
    ]

    for (const spotlight of spotlights) {
      const tab = screen.getByRole("tab", { name: spotlight })
      await user.click(tab)
      expect(tab).toHaveAttribute("data-state", "active")
    }
  })

  test("visar korrekt KPI-data för Möten-spotlight", () => {
    render(<Dashboard />)
    
    // Kontrollera att KPI-korten finns
    expect(screen.getByText("Aktiva möten")).toBeInTheDocument()
    expect(screen.getByText("Beslut denna vecka")).toBeInTheDocument()
    expect(screen.getByText("Åtgärder att göra")).toBeInTheDocument()
  })

  test("kompakt läge påverkar layout korrekt", async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    // Kontrollera att kompakt läge är aktivt som default
    const compactSwitch = screen.getByLabelText("Kompakt läge")
    expect(compactSwitch).toBeChecked()

    // Växla till icke-kompakt läge
    await user.click(compactSwitch)
    expect(compactSwitch).not.toBeChecked()

    // Kontrollera att fjärde KPI:n nu syns
    expect(screen.getByText("Mötesdisciplin")).toBeInTheDocument()
  })

  test("spotlight-väljaren fungerar korrekt", async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    // Börja med Möten som default
    expect(screen.getByRole("tab", { name: "Möten" })).toHaveAttribute("data-state", "active")

    // Växla till Beslut
    await user.click(screen.getByRole("tab", { name: "Beslut" }))
    expect(screen.getByRole("tab", { name: "Beslut" })).toHaveAttribute("data-state", "active")
    expect(screen.getByRole("tab", { name: "Möten" })).toHaveAttribute("data-state", "inactive")

    // Växla till Åtgärder
    await user.click(screen.getByRole("tab", { name: "Åtgärder" }))
    expect(screen.getByRole("tab", { name: "Åtgärder" })).toHaveAttribute("data-state", "active")
  })

  test("rendersar alla komponenter utan fel", () => {
    render(<Dashboard />)

    // Kontrollera att huvudkomponenterna finns
    expect(screen.getByText("Spotlight")).toBeInTheDocument()
    expect(screen.getByText("Postboxen AI-kollega")).toBeInTheDocument()
    
    // Kontrollera att KPI-korten renderas
    expect(screen.getByText("Aktiva möten")).toBeInTheDocument()
    expect(screen.getByText("Beslut denna vecka")).toBeInTheDocument()
    expect(screen.getByText("Åtgärder att göra")).toBeInTheDocument()
  })
})
