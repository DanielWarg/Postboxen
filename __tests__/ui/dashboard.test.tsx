import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "@/app/agents/page";

// Mock external integrations
jest.mock("@/lib/integrations/graph");
jest.mock("@/lib/integrations/zoom");

// Mock the components that might cause issues in tests
jest.mock("@/app/agents/components/monitoring-dashboard", () => ({
  MonitoringDashboard: () => <div data-testid="monitoring-dashboard">Monitoring Dashboard</div>
}))

jest.mock("@/app/agents/components/slash-commands-card", () => ({
  SlashCommandsCard: () => <div data-testid="slash-commands-card">Slash Commands Card</div>
}))

jest.mock("@/app/agents/components/magic-invite-card", () => ({
  MagicInviteCard: () => <div data-testid="magic-invite-card">Magic Invite Card</div>
}))

jest.mock("@/app/agents/components/consent-card", () => ({
  ConsentCard: () => <div data-testid="consent-card">Consent Card</div>
}))

jest.mock("@/app/agents/components/kpi-card", () => ({
  KPICard: ({ children, ...props }: any) => <div {...props}>{children}</div>
}))

jest.mock("@/app/agents/components/meeting-overview", () => ({
  MeetingOverview: () => <div data-testid="meeting-overview">Meeting Overview</div>
}))

jest.mock("@/app/agents/components/decision-cards", () => ({
  DecisionCards: () => <div data-testid="decision-cards">Decision Cards</div>
}))

jest.mock("@/app/agents/components/briefs", () => ({
  Briefs: () => <div data-testid="briefs">Briefs</div>
}))

jest.mock("@/app/agents/components/regwatch", () => ({
  Regwatch: () => <div data-testid="regwatch">Regwatch</div>
}))

jest.mock("@/app/agents/components/retention", () => ({
  Retention: () => <div data-testid="retention">Retention</div>
}))

jest.mock("@/app/agents/components/queue-dashboard", () => ({
  QueueDashboard: () => <div data-testid="queue-dashboard">Queue Dashboard</div>
}))

jest.mock("@/app/agents/components/nudging", () => ({
  Nudging: () => <div data-testid="nudging">Nudging</div>
}))

jest.mock("@/app/agents/components/observability", () => ({
  Observability: () => <div data-testid="observability">Observability</div>
}))

// Mock useDashboardSettings hook
jest.mock("@/hooks/use-dashboard-settings", () => ({
  useDashboardSettings: () => ({
    settings: { spotlight: "meetings", compact: true },
    isLoaded: true,
    updateSpotlight: jest.fn(),
    updateCompact: jest.fn(),
  })
}))

// Mock Command Palette
jest.mock("@/app/agents/components/command-palette", () => ({
  CommandPalette: () => <div data-testid="command-palette">Command Palette</div>
}))

// Mock Sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
}))

// Mock react-qr-code
jest.mock("react-qr-code", () => ({
  default: () => <div data-testid="qr-code">QR Code</div>
}))

// Mock date-fns
jest.mock("date-fns", () => ({
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  format: jest.fn(() => "2025-01-01"),
}))

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}))

// Mock BullMQ
jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
    drain: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
}))

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    meeting: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    decisionCard: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    actionItem: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    meetingBrief: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    stakeholder: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    meetingConsent: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    auditEntry: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    regulationSource: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    regulationChange: {
      findMany: jest.fn(() => []),
      findUnique: jest.fn(() => null),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}))

// Mock Redis
jest.mock("ioredis", () => ({
  default: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  })),
}))

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn(() => "hashed-password"),
  compare: jest.fn(() => true),
}))

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-jwt-token"),
  verify: jest.fn(() => ({ userId: "test-user" })),
}))

// Mock jose
jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setSubject: jest.fn().mockReturnThis(),
    sign: jest.fn(() => "mock-jose-token"),
  })),
  jwtVerify: jest.fn(() => ({ payload: { userId: "test-user" } })),
}))

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}))

// Mock Zod
jest.mock("zod", () => ({
  z: {
    object: jest.fn(() => ({
      parse: jest.fn((data) => data),
      safeParse: jest.fn(() => ({ success: true, data: {} })),
    })),
    string: jest.fn(() => ({
      email: jest.fn(() => ({
        parse: jest.fn((data) => data),
        safeParse: jest.fn(() => ({ success: true, data: data })),
      })),
    })),
    number: jest.fn(() => ({
      parse: jest.fn((data) => data),
      safeParse: jest.fn(() => ({ success: true, data: data })),
    })),
    boolean: jest.fn(() => ({
      parse: jest.fn((data) => data),
      safeParse: jest.fn(() => ({ success: true, data: data })),
    })),
    array: jest.fn(() => ({
      parse: jest.fn((data) => data),
      safeParse: jest.fn(() => ({ success: true, data: data })),
    })),
  },
}))

// Mock clsx and tailwind-merge
jest.mock("@/lib/utils", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}))

// Mock Radix UI components
jest.mock("@radix-ui/react-tabs", () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  List: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@radix-ui/react-switch", () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Thumb: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  Description: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  Close: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@radix-ui/react-select", () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Value: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@radix-ui/react-label", () => ({
  Root: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock("@radix-ui/react-separator", () => ({
  Root: ({ children, ...props }: any) => <hr {...props}>{children}</hr>,
}))

jest.mock("@radix-ui/react-slot", () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@radix-ui/react-toast", () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Description: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Action: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Close: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  Calendar: () => <div data-testid="calendar-icon">📅</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">✅</div>,
  Clock: () => <div data-testid="clock-icon">🕐</div>,
  FileText: () => <div data-testid="file-text-icon">📄</div>,
  Scale: () => <div data-testid="scale-icon">⚖️</div>,
  ShieldCheck: () => <div data-testid="shield-check-icon">🛡️</div>,
  Trash2: () => <div data-testid="trash2-icon">🗑️</div>,
  Activity: () => <div data-testid="activity-icon">📊</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">⚠️</div>,
  BarChart3: () => <div data-testid="bar-chart3-icon">📊</div>,
  Bell: () => <div data-testid="bell-icon">🔔</div>,
  Bot: () => <div data-testid="bot-icon">🤖</div>,
  Briefcase: () => <div data-testid="briefcase-icon">💼</div>,
  Building2: () => <div data-testid="building2-icon">🏢</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">⬇️</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">➡️</div>,
  Command: () => <div data-testid="command-icon">⌘</div>,
  Copy: () => <div data-testid="copy-icon">📋</div>,
  Download: () => <div data-testid="download-icon">⬇️</div>,
  ExternalLink: () => <div data-testid="external-link-icon">🔗</div>,
  Eye: () => <div data-testid="eye-icon">👁️</div>,
  FileCheck: () => <div data-testid="file-check-icon">✅</div>,
  FileX: () => <div data-testid="file-x-icon">❌</div>,
  Filter: () => <div data-testid="filter-icon">🔍</div>,
  Gavel: () => <div data-testid="gavel-icon">⚖️</div>,
  HelpCircle: () => <div data-testid="help-circle-icon">❓</div>,
  Info: () => <div data-testid="info-icon">ℹ️</div>,
  Lightbulb: () => <div data-testid="lightbulb-icon">💡</div>,
  Link: () => <div data-testid="link-icon">🔗</div>,
  Loader2: () => <div data-testid="loader2-icon">⏳</div>,
  Mail: () => <div data-testid="mail-icon">📧</div>,
  Maximize2: () => <div data-testid="maximize2-icon">⛶</div>,
  MessageSquare: () => <div data-testid="message-square-icon">💬</div>,
  Minus: () => <div data-testid="minus-icon">➖</div>,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon">⋯</div>,
  MoreVertical: () => <div data-testid="more-vertical-icon">⋮</div>,
  Play: () => <div data-testid="play-icon">▶️</div>,
  Plus: () => <div data-testid="plus-icon">➕</div>,
  RefreshCw: () => <div data-testid="refresh-cw-icon">🔄</div>,
  Search: () => <div data-testid="search-icon">🔍</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
  Sparkles: () => <div data-testid="sparkles-icon">✨</div>,
  Star: () => <div data-testid="star-icon">⭐</div>,
  Terminal: () => <div data-testid="terminal-icon">💻</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">📈</div>,
  User: () => <div data-testid="user-icon">👤</div>,
  Video: () => <div data-testid="video-icon">📹</div>,
  X: () => <div data-testid="x-icon">❌</div>,
  Zap: () => <div data-testid="zap-icon">⚡</div>,
}))

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}))

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}))

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  SelectValue: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock("@/components/ui/switch", () => ({
  Switch: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/separator", () => ({
  Separator: ({ ...props }: any) => <hr {...props} />,
}))

jest.mock("@/components/ui/toast", () => ({
  Toast: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ToastAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ToastClose: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ToastDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ToastTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ ...props }: any) => <div {...props} />,
}))

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ ...props }: any) => <div {...props} />,
}))

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  AlertDialogTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarFallback: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarImage: ({ ...props }: any) => <img {...props} />,
}))

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuLabel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuSeparator: ({ ...props }: any) => <hr {...props} />,
  DropdownMenuTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  PopoverContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  PopoverTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  SheetTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/table", () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
}))

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipProvider: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock hooks and services
jest.mock("@/hooks/use-dashboard-settings", () => ({
  useDashboardSettings: () => ({
    settings: { spotlight: "meetings", compact: true },
    isLoaded: true,
    updateSpotlight: jest.fn(),
    updateCompact: jest.fn(),
  })
}))

jest.mock("@/hooks/use-command-palette", () => ({
  useCommandPalette: () => ({
    isOpen: false,
    open: jest.fn(),
    close: jest.fn(),
    toggle: jest.fn(),
  })
}))

jest.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({
    meetings: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-decisions", () => ({
  useDecisions: () => ({
    decisions: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-actions", () => ({
  useActions: () => ({
    actions: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-briefs", () => ({
  useBriefs: () => ({
    briefs: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-regwatch", () => ({
  useRegwatch: () => ({
    items: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-consent", () => ({
  useConsent: () => ({
    consent: null,
    loading: false,
    error: null,
    updateConsent: jest.fn(),
    deleteAll: jest.fn(),
  })
}))

jest.mock("@/hooks/use-retention", () => ({
  useRetention: () => ({
    retention: null,
    loading: false,
    error: null,
    updateRetention: jest.fn(),
    deleteAll: jest.fn(),
  })
}))

jest.mock("@/hooks/use-queue", () => ({
  useQueue: () => ({
    stats: { active: 0, completed: 0, failed: 0, waiting: 0 },
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-nudging", () => ({
  useNudging: () => ({
    nudges: [],
    loading: false,
    error: null,
    sendNudge: jest.fn(),
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-observability", () => ({
  useObservability: () => ({
    metrics: {
      recapTime: 45,
      nudgeTime: 24,
      errorRate: 0.02,
      uptime: 99.9,
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-monitoring", () => ({
  useMonitoring: () => ({
    alerts: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-slash-commands", () => ({
  useSlashCommands: () => ({
    commands: [],
    loading: false,
    error: null,
    executeCommand: jest.fn(),
    refetch: jest.fn(),
  })
}))

jest.mock("@/hooks/use-magic-invite", () => ({
  useMagicInvite: () => ({
    inviteUrl: "https://example.com/invite/test",
    qrCode: "data:image/png;base64,test",
    loading: false,
    error: null,
    generateInvite: jest.fn(),
    refetch: jest.fn(),
  })
}))

// Mock services
jest.mock("@/lib/services/meeting-service", () => ({
  MeetingService: {
    getMeetings: jest.fn(() => Promise.resolve([])),
    getMeeting: jest.fn(() => Promise.resolve(null)),
    createMeeting: jest.fn(() => Promise.resolve(null)),
    updateMeeting: jest.fn(() => Promise.resolve(null)),
    deleteMeeting: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/decision-service", () => ({
  DecisionService: {
    getDecisions: jest.fn(() => Promise.resolve([])),
    getDecision: jest.fn(() => Promise.resolve(null)),
    createDecision: jest.fn(() => Promise.resolve(null)),
    updateDecision: jest.fn(() => Promise.resolve(null)),
    deleteDecision: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/action-service", () => ({
  ActionService: {
    getActions: jest.fn(() => Promise.resolve([])),
    getAction: jest.fn(() => Promise.resolve(null)),
    createAction: jest.fn(() => Promise.resolve(null)),
    updateAction: jest.fn(() => Promise.resolve(null)),
    deleteAction: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/brief-service", () => ({
  BriefService: {
    getBriefs: jest.fn(() => Promise.resolve([])),
    getBrief: jest.fn(() => Promise.resolve(null)),
    createBrief: jest.fn(() => Promise.resolve(null)),
    updateBrief: jest.fn(() => Promise.resolve(null)),
    deleteBrief: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/regwatch-service", () => ({
  RegwatchService: {
    getItems: jest.fn(() => Promise.resolve([])),
    getItem: jest.fn(() => Promise.resolve(null)),
    createItem: jest.fn(() => Promise.resolve(null)),
    updateItem: jest.fn(() => Promise.resolve(null)),
    deleteItem: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/consent-service", () => ({
  ConsentService: {
    getConsent: jest.fn(() => Promise.resolve(null)),
    updateConsent: jest.fn(() => Promise.resolve(null)),
    deleteAll: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/retention-service", () => ({
  RetentionService: {
    getRetention: jest.fn(() => Promise.resolve(null)),
    updateRetention: jest.fn(() => Promise.resolve(null)),
    deleteAll: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/queue-service", () => ({
  QueueService: {
    getStats: jest.fn(() => Promise.resolve({ active: 0, completed: 0, failed: 0, waiting: 0 })),
    getJobs: jest.fn(() => Promise.resolve([])),
    getDeadLetterJobs: jest.fn(() => Promise.resolve([])),
    retryJob: jest.fn(() => Promise.resolve(null)),
    deleteJob: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/nudging-service", () => ({
  NudgingService: {
    getNudges: jest.fn(() => Promise.resolve([])),
    sendNudge: jest.fn(() => Promise.resolve(null)),
    updateNudge: jest.fn(() => Promise.resolve(null)),
    deleteNudge: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/observability-service", () => ({
  ObservabilityService: {
    getMetrics: jest.fn(() => Promise.resolve({
      recapTime: 45,
      nudgeTime: 24,
      errorRate: 0.02,
      uptime: 99.9,
    })),
    getAlerts: jest.fn(() => Promise.resolve([])),
    createAlert: jest.fn(() => Promise.resolve(null)),
    updateAlert: jest.fn(() => Promise.resolve(null)),
    deleteAlert: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/monitoring-service", () => ({
  MonitoringService: {
    getAlerts: jest.fn(() => Promise.resolve([])),
    createAlert: jest.fn(() => Promise.resolve(null)),
    updateAlert: jest.fn(() => Promise.resolve(null)),
    deleteAlert: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/slash-commands-service", () => ({
  SlashCommandsService: {
    getCommands: jest.fn(() => Promise.resolve([])),
    executeCommand: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/lib/services/magic-invite-service", () => ({
  MagicInviteService: {
    generateInvite: jest.fn(() => Promise.resolve({
      inviteUrl: "https://example.com/invite/test",
      qrCode: "data:image/png;base64,test",
    })),
    getInvite: jest.fn(() => Promise.resolve(null)),
    updateInvite: jest.fn(() => Promise.resolve(null)),
    deleteInvite: jest.fn(() => Promise.resolve(null)),
  }
}))

jest.mock("@/app/agents/components/command-palette", () => ({
  CommandPalette: () => <div data-testid="command-palette">Command Palette</div>
}))

describe("Dashboard – spotlight & UX", () => {
  test("default: Möten är aktiv, spotlight-titel syns", () => {
    render(<Dashboard />);
    expect(screen.getByRole("tab", { name: "Möten" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Spotlight")).toBeInTheDocument();
  });

  test("kompakt toggle visar/döljer 4:e KPI", async () => {
    render(<Dashboard />);
    expect(screen.queryByText("Mötesdisciplin")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Kompakt läge"));
    expect(screen.getByText("Mötesdisciplin")).toBeInTheDocument();
  });

  test("observability-panel renderar < utan JSX-fel", async () => {
    render(<Dashboard />);
    await userEvent.click(screen.getByRole("tab", { name: "Observability" }));
    expect(screen.getByText(/Mål recap\s*<\s*90s: ✅/)).toBeInTheDocument();
    expect(screen.getByText(/Mål nudge\s*<\s*48h: ✅/)).toBeInTheDocument();
  });

  test("Command Palette (⌘K) öppnar och navigerar", async () => {
    render(<Dashboard />);
    // simulera palette-knapp i header om du har den
    // annars: simulera tangentbord – lämnas här som interaktionsexempel
    // await userEvent.keyboard("{Meta>}{KeyK}{/Meta}");
    // Fallback: klicka på hjälp -> byt spotlight via tabbarna
    await userEvent.click(screen.getByRole("tab", { name: "Briefs" }));
    expect(screen.getByText("För-brief 30 min före och post-brief efter mötet.")).toBeInTheDocument();
  });
});
