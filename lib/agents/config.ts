import type { MeetingAgentConfig } from "@/types/meetings"
import { env } from "@/lib/config"

const requireValue = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Miljövariabeln ${name} saknas – kontrollera konfigurationen`)
  }
  return value
}

export const configForPlatform = (platform: MeetingAgentConfig["platform"]): MeetingAgentConfig => {
  switch (platform) {
    case "microsoft-teams":
      return {
        platform,
        timezone: env.DEFAULT_TIMEZONE,
        locale: env.DEFAULT_LOCALE,
        credentials: {
          clientId: requireValue(env.MS_TEAMS_CLIENT_ID, "MS_TEAMS_CLIENT_ID"),
          clientSecret: requireValue(env.MS_TEAMS_CLIENT_SECRET, "MS_TEAMS_CLIENT_SECRET"),
          tenantId: env.MS_TEAMS_TENANT_ID,
        },
      }
    case "zoom":
      return {
        platform,
        timezone: env.DEFAULT_TIMEZONE,
        locale: env.DEFAULT_LOCALE,
        credentials: {
          clientId: requireValue(env.ZOOM_CLIENT_ID, "ZOOM_CLIENT_ID"),
          clientSecret: requireValue(env.ZOOM_CLIENT_SECRET, "ZOOM_CLIENT_SECRET"),
          accountId: requireValue(env.ZOOM_ACCOUNT_ID, "ZOOM_ACCOUNT_ID"),
        },
      }
    case "google-meet":
      return {
        platform,
        timezone: env.DEFAULT_TIMEZONE,
        locale: env.DEFAULT_LOCALE,
        calendarId: env.GOOGLE_MEET_CALENDAR_ID,
        credentials: {
          clientId: requireValue(env.GOOGLE_MEET_CLIENT_ID, "GOOGLE_MEET_CLIENT_ID"),
          clientSecret: requireValue(env.GOOGLE_MEET_CLIENT_SECRET, "GOOGLE_MEET_CLIENT_SECRET"),
          refreshToken: requireValue(env.GOOGLE_MEET_REFRESH_TOKEN, "GOOGLE_MEET_REFRESH_TOKEN"),
        },
      }
    case "webex":
      return {
        platform,
        timezone: env.DEFAULT_TIMEZONE,
        locale: env.DEFAULT_LOCALE,
        credentials: {
          clientId: requireValue(env.WEBEX_CLIENT_ID, "WEBEX_CLIENT_ID"),
          clientSecret: requireValue(env.WEBEX_CLIENT_SECRET, "WEBEX_CLIENT_SECRET"),
          refreshToken: env.WEBEX_REFRESH_TOKEN,
          accessToken: env.WEBEX_ACCESS_TOKEN,
        },
      }
    default:
      throw new Error(`Okänd plattform: ${platform}`)
  }
}
