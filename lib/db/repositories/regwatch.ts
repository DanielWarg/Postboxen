import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db/client"
import type { RegulationWatchResult } from "@/types/regwatch"

export const regwatchRepository = {
  async save(result: RegulationWatchResult) {
    await prisma.regulationSource.upsert({
      where: { id: result.source.id },
      create: {
        id: result.source.id,
        title: result.source.title,
        jurisdiction: result.source.jurisdiction,
        url: result.source.url,
        version: result.source.version,
        publishedAt: new Date(result.source.publishedAt),
        changes: {
          create: result.changes.map((change) => ({
            section: change.section,
            previousText: change.previousText,
            newText: change.newText,
            effectiveDate: change.effectiveDate ? new Date(change.effectiveDate) : null,
            summary: change.summary,
            impactAreas: change.impactAreas,
            severity: change.severity,
          })),
        },
      },
      update: {
        title: result.source.title,
        jurisdiction: result.source.jurisdiction,
        url: result.source.url,
        version: result.source.version,
        publishedAt: new Date(result.source.publishedAt),
        changes: {
          deleteMany: {},
          create: result.changes.map((change) => ({
            section: change.section,
            previousText: change.previousText,
            newText: change.newText,
            effectiveDate: change.effectiveDate ? new Date(change.effectiveDate) : null,
            summary: change.summary,
            impactAreas: change.impactAreas,
            severity: change.severity,
          })),
        },
      },
    })
  },

  async list(options: {
    limit?: number
    severity?: "info" | "warning" | "critical"
    jurisdiction?: string
    query?: string
  } = {}) {
    const { limit = 50, severity, jurisdiction, query } = options

    const where: Prisma.RegulationSourceWhereInput = {}

    if (jurisdiction) {
      where.jurisdiction = jurisdiction
    }

    const changeFilters: Prisma.RegulationChangeWhereInput[] = []

    if (severity) {
      changeFilters.push({ severity })
    }

    if (query) {
      where.title = { contains: query, mode: "insensitive" }
      changeFilters.push({ summary: { contains: query, mode: "insensitive" } })
    }

    if (changeFilters.length) {
      where.changes = { some: { OR: changeFilters } }
    }

    const sources = await prisma.regulationSource.findMany({
      where,
      include: {
        changes: {
          where: changeFilters.length
            ? { OR: changeFilters }
            : undefined,
          take: limit,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return sources
  },
}
