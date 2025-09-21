import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { enforceRateLimit } from "@/lib/security/rate-limit"
import { ApiError } from "@/lib/http/errors"
import { 
  SlashCommandSchema, 
  parseSlashCommand, 
  validateSlashCommand, 
  generateCommandResponse,
  type SlashCommandPayload 
} from "@/lib/integrations/slash-commands"
import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { createAgent } from "@/lib/agents/orchestrator"
import { configForPlatform } from "@/lib/agents/config"
import { getRegwatchHighlights } from "@/lib/agents/regwatch"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import type { MeetingPlatform } from "@/types/meetings"

// Zoom slash command handler
export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, { maxRequests: 50, windowMs: 15 * 60 * 1000 })
    
    // Parse Zoom slash command payload
    const formData = await request.formData()
    const payload: SlashCommandPayload = {
      command: formData.get("command") as string,
      text: formData.get("text") as string,
      user_id: formData.get("user_id") as string,
      user_name: formData.get("user_name") as string,
      channel_id: formData.get("channel_id") as string,
      team_id: formData.get("team_id") as string,
      response_url: formData.get("response_url") as string,
    }

    const { command, action, args } = parseSlashCommand(payload.text || "")
    
    // Validate command
    const validation = validateSlashCommand(command, action)
    if (!validation.valid) {
      return NextResponse.json({
        text: `❌ ${validation.error}\n\nAnvänd \`/postboxen help\` för hjälp.`,
        response_type: "ephemeral"
      })
    }

    // Execute command
    const result = await executeSlashCommand(command, action, args, "zoom", payload)
    
    // Generate response
    const responseText = generateCommandResponse(command, action, result, "zoom")
    
    return NextResponse.json({
      text: responseText,
      response_type: "in_channel"
    })

  } catch (error) {
    console.error("Zoom slash command error:", error)
    
    if (error instanceof ApiError) {
      return NextResponse.json({
        text: `❌ ${error.message}`,
        response_type: "ephemeral"
      }, { status: error.status })
    }
    
    return NextResponse.json({
      text: "❌ Ett fel uppstod vid bearbetning av kommandot. Försök igen senare.",
      response_type: "ephemeral"
    }, { status: 500 })
  }
}

// Execute slash command logic (same as Teams but for Zoom)
async function executeSlashCommand(
  command: string,
  action: string,
  args: string[],
  platform: MeetingPlatform,
  payload: SlashCommandPayload
): Promise<any> {
  ensureAgentBootstrap()
  const agent = createAgent(configForPlatform(platform))
  const meetingRepo = meetingRepository

  switch (command) {
    case "/postboxen":
      switch (action) {
        case "schedule":
          if (args.length < 3) {
            throw new ApiError("Användning: /postboxen schedule \"Titel\" \"YYYY-MM-DD HH:MM\" \"Slut-tid\"", 400)
          }
          
          const [title, startTime, endTime] = args
          const scheduleRequest = {
            title,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            organizerEmail: payload.user_name,
            attendees: [], // Zoom will populate this
            agenda: `AI-kollega möte schemalagt via slash command`,
            meetingId: `zoom-${Date.now()}`,
          }
          
          const result = await agent.schedule(scheduleRequest)
          return {
            title,
            startTime: scheduleRequest.startTime,
            joinUrl: result.joinUrl,
          }

        case "status":
          const meetings = await meetingRepo.findByOrganizer(payload.user_name)
          const now = new Date()
          
          return {
            activeMeetings: meetings.filter(m => new Date(m.startTime) <= now && new Date(m.endTime) >= now).length,
            processingMeetings: meetings.filter(m => !m.summary).length,
            completedMeetings: meetings.filter(m => m.summary).length,
          }

        case "summary":
          const recentMeetings = await meetingRepo.findByOrganizer(payload.user_name)
          const latestMeeting = recentMeetings
            .filter(m => m.summary)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
          
          if (!latestMeeting) {
            throw new ApiError("Inga slutförda möten hittades", 404)
          }
          
          return {
            title: latestMeeting.title,
            startTime: latestMeeting.startTime,
            summary: latestMeeting.summary?.highlights || "Ingen sammanfattning tillgänglig",
            decisions: latestMeeting.decisions || [],
            actions: latestMeeting.actionItems || [],
          }

        case "help":
          return null // Will be handled by generateCommandResponse

        default:
          throw new ApiError(`Okänd åtgärd: ${action}`, 400)
      }

    case "/meeting":
      switch (action) {
        case "start":
          return { status: "started" }

        case "stop":
          return { status: "stopped" }

        case "summary":
          const meetings = await meetingRepo.findByOrganizer(payload.user_name)
          const latestMeeting = meetings
            .filter(m => m.summary)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
          
          if (!latestMeeting) {
            throw new ApiError("Inga slutförda möten hittades", 404)
          }
          
          return {
            title: latestMeeting.title,
            startTime: latestMeeting.startTime,
            summary: latestMeeting.summary?.highlights || "Ingen sammanfattning tillgänglig",
          }

        case "decisions":
          const decisionMeetings = await meetingRepo.findByOrganizer(payload.user_name)
          const latestDecisionMeeting = decisionMeetings
            .filter(m => m.decisions && m.decisions.length > 0)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
          
          if (!latestDecisionMeeting) {
            throw new ApiError("Inga beslut hittades", 404)
          }
          
          return {
            decisions: latestDecisionMeeting.decisions || [],
          }

        case "actions":
          const actionMeetings = await meetingRepo.findByOrganizer(payload.user_name)
          const latestActionMeeting = actionMeetings
            .filter(m => m.actionItems && m.actionItems.length > 0)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
          
          if (!latestActionMeeting) {
            throw new ApiError("Inga åtgärder hittades", 404)
          }
          
          return {
            actions: latestActionMeeting.actionItems || [],
          }

        default:
          throw new ApiError(`Okänd åtgärd: ${action}`, 400)
      }

    case "/brief":
      switch (action) {
        case "pre":
          const upcomingMeetings = await meetingRepo.findByOrganizer(payload.user_name)
          const nextMeeting = upcomingMeetings
            .filter(m => new Date(m.startTime) > new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
          
          if (!nextMeeting) {
            throw new ApiError("Inga kommande möten hittades", 404)
          }
          
          return {
            subject: `Pre-brief: ${nextMeeting.title}`,
            generatedAt: new Date().toISOString(),
            keyPoints: [
              "Mötesmål och agenda",
              "Deltagare och roller",
              "Förväntade resultat",
              "Förberedelser krävs"
            ],
            nextSteps: [
              "Kontrollera tekniska förutsättningar",
              "Förbered relevanta dokument",
              "Planera för följduppgifter"
            ]
          }

        case "post":
          const completedMeetings = await meetingRepo.findByOrganizer(payload.user_name)
          const lastMeeting = completedMeetings
            .filter(m => m.summary)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
          
          if (!lastMeeting) {
            throw new ApiError("Inga slutförda möten hittades", 404)
          }
          
          return {
            subject: `Post-brief: ${lastMeeting.title}`,
            generatedAt: new Date().toISOString(),
            content: lastMeeting.summary?.highlights || "Ingen sammanfattning tillgänglig",
            decisions: lastMeeting.decisions?.map((d: any) => d.headline) || [],
            risks: lastMeeting.summary?.risks || [],
          }

        case "status":
          const allMeetings = await meetingRepo.findByOrganizer(payload.user_name)
          const hasPreBrief = allMeetings.some(m => m.briefs?.some(b => b.type === "pre"))
          const hasPostBrief = allMeetings.some(m => m.briefs?.some(b => b.type === "post"))
          const lastGenerated = allMeetings
            .filter(m => m.briefs && m.briefs.length > 0)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
            ?.briefs?.[0]?.generatedAt
          
          return {
            preBrief: hasPreBrief,
            postBrief: hasPostBrief,
            lastGenerated: lastGenerated || null,
          }

        default:
          throw new ApiError(`Okänd åtgärd: ${action}`, 400)
      }

    case "/regwatch":
      switch (action) {
        case "check":
          const highlights = await getRegwatchHighlights(5)
          return {
            lastCheck: new Date().toISOString(),
            sourcesMonitored: 5,
            changesThisWeek: highlights.length,
            changes: highlights,
          }

        case "alerts":
          return {
            alerts: [],
          }

        case "subscribe":
          return {
            email: payload.user_name,
          }

        default:
          throw new ApiError(`Okänd åtgärd: ${action}`, 400)
      }

    default:
      throw new ApiError(`Okänt kommando: ${command}`, 400)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}
