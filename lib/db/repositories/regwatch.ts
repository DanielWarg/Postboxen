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

  async list() {
    return prisma.regulationSource.findMany({
      include: { changes: true },
      orderBy: { title: "asc" },
    })
  },
}
