# Regelförändringsvakt

Systemet bevakar viktiga svenska och EU-källor (AI Act, GDPR, LOU). Resultat nås via `GET /api/agents/regwatch`.

## Output
```
{
  "sources": [
    {
      "source": { "id": "eu-ai-act", "version": "2024", ... },
      "changes": [
        {
          "section": "Artikel 9 riskhantering",
          "previousText": "...",
          "newText": "...",
          "effectiveDate": "2026-06-01",
          "summary": "Riskhanteringskraven skärps ...",
          "impactAreas": ["AI-system", "Risk"],
          "severity": "warning"
        }
      ],
      "recommendation": "Etablera kvartalsvisa riskgenomgångar"
    }
  ]
}
```

## Arkitektur
- `lib/modules/regwatch/index.ts` hämtar förändringar via AI-endpoint eller fallback och publicerar `regulation.change` events.
- Standardkällor sparade i `DEFAULT_SOURCES`; kan utökas med kundspecifika.

## Nästa steg
- Förvara resultat i persistent store (t.ex. Prisma + Postgres) för historik.
- Lägg till webhooks notifieringar + UI med diff-vy.
