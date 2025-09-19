import type { MeetingAgentConfig } from "@/types/meetings"
import type { MeetingProvider } from "./base"

import { teamsProvider } from "./microsoft-teams"
import { zoomProvider } from "./zoom"
import { googleMeetProvider } from "./google-meet"
import { webexProvider } from "./webex"

export const resolveProvider = (config: MeetingAgentConfig): MeetingProvider => {
  switch (config.platform) {
    case "microsoft-teams":
      return teamsProvider()
    case "zoom":
      return zoomProvider()
    case "google-meet":
      return googleMeetProvider()
    case "webex":
      return webexProvider()
    default:
      throw new Error(`Okänd mötesplattform: ${config.platform}`)
  }
}
