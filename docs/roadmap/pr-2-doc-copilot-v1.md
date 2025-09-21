# Doc-Copilot v1: Diff + Källor + "Infoga i dokument"

## 🎯 Mål
Sidopanel för anbud/avtal: "Ersätt X → Y" med paragrafhänvisning + diff.
"Infoga i dokument" med ett klick.

## 📋 Acceptance Criteria
- [ ] Sidopanel för dokumentanalys (anbud/avtal)
- [ ] Diff-motor som visar "Ersätt X → Y" med paragrafhänvisning
- [ ] Källcitering för alla förslag med hänvisning till regelverk
- [ ] "Infoga i dokument" med ett klick
- [ ] Versionering av dokumentändringar

## 🔧 Implementation Plan

### 1. Document Analysis Engine
```typescript
// lib/modules/doc-copilot/analyzer.ts
export class DocumentAnalyzer {
  async analyzeDocument(content: string): Promise<AnalysisResult>;
  async generateDiff(original: string, suggested: string): Promise<DiffResult>;
  async findCitations(text: string): Promise<Citation[]>;
}

interface AnalysisResult {
  suggestions: DocumentSuggestion[];
  citations: Citation[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface DocumentSuggestion {
  originalText: string;
  suggestedText: string;
  reason: string;
  citation: Citation;
  paragraph: string;
  lineNumber: number;
}
```

### 2. Diff Engine
```typescript
// lib/modules/doc-copilot/diff-engine.ts
export class DiffEngine {
  generateDiff(original: string, modified: string): DiffSegment[];
  highlightChanges(diff: DiffSegment[]): string;
  generateMarkdown(diff: DiffSegment[]): string;
}

interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
  paragraph: string;
}
```

### 3. Citation Engine
```typescript
// lib/modules/doc-copilot/citation-engine.ts
export class CitationEngine {
  async findRelevantRegulations(text: string): Promise<Regulation[]>;
  async generateCitation(regulation: Regulation, context: string): Promise<Citation>;
  async validateCitation(citation: Citation): Promise<boolean>;
}

interface Citation {
  regulation: string;
  article: string;
  paragraph: string;
  url: string;
  relevance: number;
  context: string;
}
```

### 4. UI Components
```typescript
// app/agents/components/doc-copilot-panel.tsx
interface DocCopilotPanelProps {
  documentContent: string;
  onApplySuggestion: (suggestion: DocumentSuggestion) => void;
  onInsertToDocument: (text: string) => void;
}

// app/agents/components/document-diff.tsx
interface DocumentDiffProps {
  original: string;
  suggested: string;
  citations: Citation[];
  onAccept: (diff: DiffSegment[]) => void;
  onReject: () => void;
}
```

### 5. API Endpoints
```typescript
// app/api/agents/documents/analyze/route.ts
export async function POST(request: NextRequest) {
  // Analyze document and return suggestions
}

// app/api/agents/documents/diff/route.ts
export async function POST(request: NextRequest) {
  // Generate diff between original and suggested
}

// app/api/agents/documents/citations/route.ts
export async function POST(request: NextRequest) {
  // Find relevant citations for text
}
```

### 6. Database Schema
```sql
-- Document analysis results
CREATE TABLE "DocumentAnalysis" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "originalContent" TEXT NOT NULL,
  "suggestedContent" TEXT,
  "analysisResult" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document suggestions
CREATE TABLE "DocumentSuggestion" (
  "id" TEXT PRIMARY KEY,
  "analysisId" TEXT NOT NULL,
  "originalText" TEXT NOT NULL,
  "suggestedText" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "citationId" TEXT,
  "paragraph" TEXT,
  "lineNumber" INTEGER,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Citations
CREATE TABLE "Citation" (
  "id" TEXT PRIMARY KEY,
  "regulation" TEXT NOT NULL,
  "article" TEXT NOT NULL,
  "paragraph" TEXT,
  "url" TEXT,
  "relevance" DECIMAL(3,2),
  "context" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Tests
- [ ] Unit tests för DocumentAnalyzer
- [ ] Unit tests för DiffEngine
- [ ] Unit tests för CitationEngine
- [ ] Integration tests för document analysis API
- [ ] E2E tests för doc-copilot panel
- [ ] Performance tests för stora dokument

## 📊 Success Metrics
- Dokumentanalys precision: % korrekta förslag
- Citation accuracy: % korrekta hänvisningar
- Time to analyze: tid för dokumentanalys
- User adoption: % användare som använder doc-copilot

## 🔗 Related Issues
- Document versioning
- Citation management
- Diff visualization
- Document insertion workflow
