# Doc-copilot

Doc-copilot analyserar avtal, upphandlingsunderlag och policydokument för att identifiera röda/orange/gröna ändringar med motivering och källhänvisning.

## API
`POST /api/agents/documents/analyze`

Body:
```
{
  "meetingId": "...",
  "title": "Avtalsutkast v2",
  "currentVersion": "...",
  "proposedChanges": "...",
  "documentType": "contract",
  "persona": "juridik-gunnar",
  "references": ["https://lagen.nu/..." ]
}
```

Svar: `CopilotSuggestion` (sammanfattning, diff-segment, rekommendation, citat, confidence).

## Arkitektur
- `lib/modules/documents/copilot.ts` orchestrerar AI-kal och fallback.
- `lib/modules/documents/diff.ts` ger en enkel rad-diff när AI inte finns.
- Eventuella AI-svar måste inkludera citas/data; fallback försöker gissa juridiska referenser baserat på texten.

## Vidareutveckling
- Lägg till modulkoppling så Doc-copilot kan injicera modulens egna källor (Juridik-Gunnar, Upphandling-Saga).
- Visualisera diffen i adminportalen (röd/grön). 
