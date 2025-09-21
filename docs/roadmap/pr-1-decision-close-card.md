# Decision-Close Card: Adaptive Card + Planner/Jira Integration

## 🎯 Mål
När mötet stängs: "Sista chansen"-kort med ägare+deadline för alla öppna beslut.
Auto-create i Planner/Jira/Trello + kvittens i tråden.

## 📋 Acceptance Criteria
- [ ] Adaptive Card visas när mötet stängs med öppna beslut
- [ ] "Sista chansen"-kort visar ägare+deadline för alla öppna beslut
- [ ] Auto-create i Planner/Jira/Trello fungerar
- [ ] Kvittens skickas i mötestråden
- [ ] 100% beslut har ägare+deadline före mötesslut

## 🔧 Implementation Plan

### 1. Adaptive Card Component
```typescript
// app/agents/components/decision-close-card.tsx
interface DecisionCloseCardProps {
  openDecisions: Decision[];
  onAssignOwner: (decisionId: string, owner: string) => void;
  onSetDeadline: (decisionId: string, deadline: Date) => void;
  onCreateInPlanner: (decision: Decision) => void;
}
```

### 2. Planner/Jira Integration
```typescript
// lib/integrations/planner.ts
export class PlannerIntegration {
  async createTask(decision: Decision): Promise<string>;
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
}

// lib/integrations/jira.ts
export class JiraIntegration {
  async createIssue(decision: Decision): Promise<string>;
  async updateIssue(issueId: string, updates: Partial<Issue>): Promise<void>;
}
```

### 3. API Endpoints
```typescript
// app/api/agents/decisions/close/route.ts
export async function POST(request: NextRequest) {
  // Handle decision closing with owner assignment
}

// app/api/agents/decisions/planner/route.ts
export async function POST(request: NextRequest) {
  // Create task in Planner/Jira
}
```

### 4. Database Schema Updates
```sql
-- Add owner and deadline fields to decisions
ALTER TABLE "DecisionCard" ADD COLUMN "ownerEmail" TEXT;
ALTER TABLE "DecisionCard" ADD COLUMN "deadline" TIMESTAMP;
ALTER TABLE "DecisionCard" ADD COLUMN "externalTaskId" TEXT;
ALTER TABLE "DecisionCard" ADD COLUMN "externalPlatform" TEXT;
```

## 🧪 Tests
- [ ] Unit tests för DecisionCloseCard component
- [ ] Integration tests för Planner/Jira APIs
- [ ] E2E test för decision closing flow
- [ ] Mock tests för external integrations

## 📊 Success Metrics
- Decision coverage: % beslut med ägare+deadline
- Auto-creation success rate: % beslut som skapas i externa system
- Time to close: tid från mötesslut till alla beslut stängda

## 🔗 Related Issues
- Decision tracking improvements
- External system integrations
- Meeting closure automation
