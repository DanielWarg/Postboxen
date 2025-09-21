import { z } from "zod"
import type { MeetingPlatform } from "@/types/meetings"

// Slash command schemas
export const SlashCommandSchema = z.object({
  command: z.string(),
  text: z.string().optional(),
  user_id: z.string(),
  user_name: z.string(),
  channel_id: z.string().optional(),
  team_id: z.string().optional(),
  response_url: z.string().optional(),
})

export type SlashCommandPayload = z.infer<typeof SlashCommandSchema>

// Available slash commands
export const AVAILABLE_COMMANDS = {
  "/postboxen": {
    description: "Huvudkommando för Postboxen AI-kollega",
    usage: "/postboxen [action] [options]",
    actions: {
      "schedule": "Schemalägg ett möte med AI-kollega",
      "status": "Kontrollera status för pågående möten",
      "summary": "Hämta sammanfattning av senaste möte",
      "help": "Visa hjälp och tillgängliga kommandon",
    }
  },
  "/meeting": {
    description: "Snabbkommando för möteshantering",
    usage: "/meeting [action]",
    actions: {
      "start": "Starta AI-kollega för pågående möte",
      "stop": "Stoppa AI-kollega",
      "summary": "Hämta sammanfattning",
      "decisions": "Visa beslut från mötet",
      "actions": "Visa åtgärder från mötet",
    }
  },
  "/brief": {
    description: "Hantera briefing-funktioner",
    usage: "/brief [action]",
    actions: {
      "pre": "Generera pre-brief för kommande möte",
      "post": "Generera post-brief för avslutat möte",
      "status": "Kontrollera briefing-status",
    }
  },
  "/regwatch": {
    description: "Regelverksövervakning",
    usage: "/regwatch [action]",
    actions: {
      "check": "Kontrollera senaste regelverksändringar",
      "alerts": "Visa aktiva varningar",
      "subscribe": "Prenumerera på regelverksuppdateringar",
    }
  }
} as const

export type CommandName = keyof typeof AVAILABLE_COMMANDS
export type CommandAction = string

// Command parser
export function parseSlashCommand(text: string): {
  command: string
  action?: string
  args: string[]
} {
  const parts = text.trim().split(/\s+/)
  const command = parts[0]?.toLowerCase()
  const action = parts[1]?.toLowerCase()
  const args = parts.slice(2)

  return { command, action, args }
}

// Command validator
export function validateSlashCommand(
  command: string,
  action?: string
): { valid: boolean; error?: string } {
  if (!(command in AVAILABLE_COMMANDS)) {
    return { valid: false, error: `Okänt kommando: ${command}` }
  }

  const commandDef = AVAILABLE_COMMANDS[command as CommandName]
  
  if (action && !(action in commandDef.actions)) {
    return { 
      valid: false, 
      error: `Okänd åtgärd för ${command}: ${action}. Tillgängliga: ${Object.keys(commandDef.actions).join(", ")}` 
    }
  }

  return { valid: true }
}

// Generate help text
export function generateHelpText(platform: MeetingPlatform): string {
  const platformName = platform === "microsoft-teams" ? "Teams" : 
                       platform === "zoom" ? "Zoom" : 
                       platform === "google-meet" ? "Google Meet" : "Webex"

  let help = `🤖 *Postboxen AI-kollega för ${platformName}*\n\n`
  help += `*Tillgängliga kommandon:*\n\n`

  Object.entries(AVAILABLE_COMMANDS).forEach(([command, def]) => {
    help += `*${command}* - ${def.description}\n`
    help += `Användning: \`${def.usage}\`\n`
    
    if (Object.keys(def.actions).length > 0) {
      help += `Åtgärder:\n`
      Object.entries(def.actions).forEach(([action, desc]) => {
        help += `  • \`${action}\` - ${desc}\n`
      })
    }
    help += `\n`
  })

  help += `*Exempel:*\n`
  help += `• \`/postboxen schedule "Projektmöte" 2024-01-15 14:00\`\n`
  help += `• \`/meeting start\`\n`
  help += `• \`/brief pre\`\n`
  help += `• \`/regwatch check\`\n\n`
  help += `💡 *Tips:* Använd \`/postboxen help\` för detaljerad hjälp!`

  return help
}

// Generate command response
export function generateCommandResponse(
  command: string,
  action: string,
  result: any,
  platform: MeetingPlatform
): string {
  const platformName = platform === "microsoft-teams" ? "Teams" : 
                       platform === "zoom" ? "Zoom" : 
                       platform === "google-meet" ? "Google Meet" : "Webex"

  switch (command) {
    case "/postboxen":
      switch (action) {
        case "schedule":
          return `✅ *Möte schemalagt med AI-kollega*\n\n` +
                 `📅 **${result.title}**\n` +
                 `🕐 ${new Date(result.startTime).toLocaleString("sv-SE")}\n` +
                 `🔗 ${result.joinUrl}\n\n` +
                 `🤖 AI-kollega kommer att:\n` +
                 `• Dokumentera mötet automatiskt\n` +
                 `• Skapa beslutskort\n` +
                 `• Routa åtgärder\n` +
                 `• Leverera sammanfattning\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "status":
          return `📊 *Status för AI-kollega*\n\n` +
                 `🟢 **Aktivt**: ${result.activeMeetings} möten\n` +
                 `📝 **Bearbetar**: ${result.processingMeetings} möten\n` +
                 `✅ **Klara**: ${result.completedMeetings} möten\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "summary":
          return `📋 *Sammanfattning från senaste möte*\n\n` +
                 `**${result.title}**\n` +
                 `🕐 ${new Date(result.startTime).toLocaleString("sv-SE")}\n\n` +
                 `**Sammanfattning:**\n${result.summary}\n\n` +
                 `**Beslut:**\n${result.decisions.map((d: any) => `• ${d.headline}`).join("\n")}\n\n` +
                 `**Åtgärder:**\n${result.actions.map((a: any) => `• ${a.title} (${a.owner})`).join("\n")}\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "help":
          return generateHelpText(platform)

        default:
          return `❓ *Okänd åtgärd för /postboxen*\n\n${generateHelpText(platform)}`
      }

    case "/meeting":
      switch (action) {
        case "start":
          return `🚀 *AI-kollega startad*\n\n` +
                 `🤖 AI-kollega är nu aktiv för detta möte och kommer att:\n` +
                 `• Dokumentera automatiskt\n` +
                 `• Fånga beslut och åtgärder\n` +
                 `• Skapa sammanfattning\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "stop":
          return `⏹️ *AI-kollega stoppad*\n\n` +
                 `🤖 AI-kollega har stoppats för detta möte.\n` +
                 `📋 Sammanfattning kommer att levereras inom 5 minuter.\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "summary":
          return `📋 *Mötesammanfattning*\n\n` +
                 `**${result.title}**\n` +
                 `🕐 ${new Date(result.startTime).toLocaleString("sv-SE")}\n\n` +
                 `**Sammanfattning:**\n${result.summary}\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "decisions":
          return `🎯 *Beslut från mötet*\n\n` +
                 `${result.decisions.map((d: any) => 
                   `**${d.headline}**\n` +
                   `👤 Ansvarig: ${d.owner}\n` +
                   `📅 Beslutat: ${new Date(d.decidedAt).toLocaleString("sv-SE")}\n` +
                   `💡 Rekommendation: ${d.recommendation}\n\n`
                 ).join("")}` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "actions":
          return `✅ *Åtgärder från mötet*\n\n` +
                 `${result.actions.map((a: any) => 
                   `**${a.title}**\n` +
                   `👤 Ansvarig: ${a.owner}\n` +
                   `📅 Deadline: ${a.dueDate ? new Date(a.dueDate).toLocaleString("sv-SE") : "Ej angiven"}\n` +
                   `📝 Beskrivning: ${a.description}\n\n`
                 ).join("")}` +
                 `*Postboxen AI-kollega för ${platformName}*`

        default:
          return `❓ *Okänd åtgärd för /meeting*\n\nAnvänd: start, stop, summary, decisions, actions`
      }

    case "/brief":
      switch (action) {
        case "pre":
          return `📋 *Pre-brief genererad*\n\n` +
                 `**${result.subject}**\n` +
                 `🕐 ${new Date(result.generatedAt).toLocaleString("sv-SE")}\n\n` +
                 `**Nyckelpunkter:**\n${result.keyPoints.map((kp: any) => `• ${kp}`).join("\n")}\n\n` +
                 `**Nästa steg:**\n${result.nextSteps.map((ns: any) => `• ${ns}`).join("\n")}\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "post":
          return `📋 *Post-brief genererad*\n\n` +
                 `**${result.subject}**\n` +
                 `🕐 ${new Date(result.generatedAt).toLocaleString("sv-SE")}\n\n` +
                 `**Sammanfattning:**\n${result.content}\n\n` +
                 `**Beslut:**\n${result.decisions.map((d: any) => `• ${d}`).join("\n")}\n\n` +
                 `**Risker:**\n${result.risks.map((r: any) => `• ${r}`).join("\n")}\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "status":
          return `📊 *Briefing-status*\n\n` +
                 `🟢 **Pre-brief**: ${result.preBrief ? "Genererad" : "Ej genererad"}\n` +
                 `🟢 **Post-brief**: ${result.postBrief ? "Genererad" : "Ej genererad"}\n` +
                 `📅 **Senaste**: ${result.lastGenerated ? new Date(result.lastGenerated).toLocaleString("sv-SE") : "Ej tillgänglig"}\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        default:
          return `❓ *Okänd åtgärd för /brief*\n\nAnvänd: pre, post, status`
      }

    case "/regwatch":
      switch (action) {
        case "check":
          return `🔍 *Regelverkskontroll*\n\n` +
                 `📅 **Senaste kontroll**: ${new Date(result.lastCheck).toLocaleString("sv-SE")}\n` +
                 `📊 **Källor övervakade**: ${result.sourcesMonitored}\n` +
                 `⚠️ **Ändringar denna vecka**: ${result.changesThisWeek}\n\n` +
                 `${result.changes.length > 0 ? 
                   `**Senaste ändringar:**\n${result.changes.map((c: any) => 
                     `• ${c.title} (${c.severity})\n  ${c.summary}\n`
                   ).join("\n")}\n\n` : 
                   `✅ Inga nya ändringar denna vecka.\n\n`
                 }` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "alerts":
          return `⚠️ *Aktiva regelverksvarningar*\n\n` +
                 `${result.alerts.length > 0 ? 
                   result.alerts.map((a: any) => 
                     `**${a.title}**\n` +
                     `🚨 ${a.severity}\n` +
                     `📅 ${new Date(a.createdAt).toLocaleString("sv-SE")}\n` +
                     `📝 ${a.description}\n\n`
                   ).join("") :
                   `✅ Inga aktiva varningar.\n\n`
                 }` +
                 `*Postboxen AI-kollega för ${platformName}*`

        case "subscribe":
          return `📧 *Prenumeration aktiverad*\n\n` +
                 `✅ Du kommer nu att få notifieringar om:\n` +
                 `• AI Act-ändringar\n` +
                 `• GDPR-uppdateringar\n` +
                 `• LOU-förändringar\n` +
                 `• Andra relevanta regelverksändringar\n\n` +
                 `📧 Notifieringar skickas till: ${result.email}\n\n` +
                 `*Postboxen AI-kollega för ${platformName}*`

        default:
          return `❓ *Okänd åtgärd för /regwatch*\n\nAnvänd: check, alerts, subscribe`
      }

    default:
      return `❓ *Okänt kommando*\n\n${generateHelpText(platform)}`
  }
}
