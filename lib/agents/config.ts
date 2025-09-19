import type { MeetingAgentConfig } from "@/types/meetings"
import { assertEnv } from "@/lib/integrations/providers/base"

export const configForPlatform = (platform: MeetingAgentConfig["platform"]): MeetingAgentConfig => {
  switch (platform) {
    case "microsoft-teams":
      return {
        platform,
        timezone: process.env.DEFAULT_TIMEZONE ?? "Europe/Stockholm",
        locale: process.env.DEFAULT_LOCALE ?? "sv-SE",
        credentials: {
          clientId: assertEnv("MS_TEAMS_CLIENT_ID"),
          clientSecret: assertEnv("MS_TEAMS_CLIENT_SECRET"),
          tenantId: process.env.MS_TEAMS_TENANT_ID,
        },
      }
    case "zoom":
      return {
        platform,
        timezone: process.env.DEFAULT_TIMEZONE ?? "Europe/Stockholm",
        locale: process.env.DEFAULT_LOCALE ?? "sv-SE",
        credentials: {
          clientId: assertEnv("ZOOM_CLIENT_ID"),
          clientSecret: assertEnv("ZOOM_CLIENT_SECRET"),
          accountId: assertEnv("ZOOM_ACCOUNT_ID"),
        },
      }
    case "google-meet":
      return {
        platform,
        timezone: process.env.DEFAULT_TIMEZONE ?? "Europe/Stockholm",
        locale: process.env.DEFAULT_LOCALE ?? "sv-SE",
        calendarId: process.env.GOOGLE_MEET_CALENDAR_ID,
        credentials: {
          clientId: assertEnv("GOOGLE_MEET_CLIENT_ID"),
          clientSecret: assertEnv("GOOGLE_MEET_CLIENT_SECRET"),
          refreshToken: assertEnv("GOOGLE_MEET_REFRESH_TOKEN"),
        },
      }
    case "webex":
      return {
        platform,
        timezone: process.env.DEFAULT_TIMEZONE ?? "Europe/Stockholm",
        locale: process.env.DEFAULT_LOCALE ?? "sv-SE",
        credentials: {
          clientId: assertEnv("WEBEX_CLIENT_ID"),
          clientSecret: assertEnv("WEBEX_CLIENT_SECRET"),
          refreshToken: process.env.WEBEX_REFRESH_TOKEN,
          accessToken: process.env.WEBEX_ACCESS_TOKEN,
        },
      }
    default:
      throw new Error(`Okänd plattform: ${platform}`)
  }
}
