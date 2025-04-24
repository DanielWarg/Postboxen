import { Menu } from "lucide-react"
import { Button } from "./button"

interface HamburgerProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Hamburger({ activeTab, setActiveTab }: HamburgerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-gray-300 hover:text-white"
      onClick={() => setActiveTab(activeTab === "menu" ? "generator" : "menu")}
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
} 