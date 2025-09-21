"use client"

import { useState, useEffect } from "react"

interface DashboardSettings {
  spotlight: string
  compact: boolean
}

const DEFAULT_SETTINGS: DashboardSettings = {
  spotlight: "meetings",
  compact: true
}

const STORAGE_KEY = "postboxen-dashboard-settings"

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardSettings
        setSettings(parsed)
      }
    } catch (error) {
      console.warn("Failed to load dashboard settings from localStorage:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (error) {
        console.warn("Failed to save dashboard settings to localStorage:", error)
      }
    }
  }, [settings, isLoaded])

  const updateSpotlight = (spotlight: string) => {
    setSettings(prev => ({ ...prev, spotlight }))
  }

  const updateCompact = (compact: boolean) => {
    setSettings(prev => ({ ...prev, compact }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return {
    settings,
    isLoaded,
    updateSpotlight,
    updateCompact,
    resetSettings
  }
}
