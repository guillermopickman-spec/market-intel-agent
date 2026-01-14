# JavaScript/TypeScript Code Documentation

## Overview

This is a **Next.js 15** application built with **React 18** and **TypeScript**. The app is a Market Intelligence Agent frontend that communicates with a Python FastAPI backend. It features real-time streaming, mock API support for development, and a modern UI built with Tailwind CSS.

---

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (home page)
│   ├── agent/page.tsx     # Agent terminal/chat interface
│   ├── reports/page.tsx    # Reports listing page
│   └── layout.tsx         # Root layout with navigation
├── components/            # Reusable React components
│   ├── Navigation.tsx     # Top navigation bar
│   └── ui/                # UI component library (buttons, cards, etc.)
└── lib/                   # Core utilities and API logic
    ├── api.ts             # API client (fetch wrapper)
    ├── apiTransformers.ts # Backend response transformers
    ├── queries.ts         # React hooks for data fetching
    ├── mockApi.ts         # Mock API for development
    ├── utils.ts           # Utility functions
    └── validators.ts      # Zod validation schemas
```

---

## 🔑 Key Concepts

### 1. **Next.js App Router**
- Uses the new App Router (not Pages Router)
- All pages are in the `app/` directory
- `"use client"` directive marks client components (required for React hooks)

### 2. **API Communication**
- Supports both **real API** and **mock API** modes
- Controlled by `NEXT_PUBLIC_USE_MOCK_API` environment variable
- Real API uses `NEXT_PUBLIC_API_URL` for backend connection

### 3. **Streaming Support**
- Real-time mission execution via Server-Sent Events (SSE)
- Uses `fetch` with streaming response body
- Processes NDJSON (newline-delimited JSON) format

### 4. **Type Safety**
- Full TypeScript implementation
- Zod schemas for runtime validation
- Type-safe API responses

---

## 📄 File-by-File Breakdown

### **`lib/api.ts`** - API Client

**Purpose**: Centralized API communication layer with timeout handling, error management, and streaming support.

**Key Features**:
- `get<T>(endpoint)` - GET requests with timeout
- `post<T>(endpoint, data)` - POST requests with extended timeout for long operations
- `postStream<T>(endpoint, data, onMessage, onError)` - Streaming POST requests

**Important Functions**:

```typescript
// Normalize API URL (removes trailing slashes)
const normalizeUrl = (url: string): string => {
  return url.replace(/\/+$/, "");
};

// Fetch with timeout (10 seconds default)
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  // ... handles abort and cleanup
};

// Enhanced error handling
const handleApiError = (error: unknown, endpoint: string): Error => {
  // Detects network errors, CORS issues, timeouts
  // Returns user-friendly error messages
};
```

**Streaming Implementation**:
- Uses `ReadableStream` API
- Processes NDJSON format (one JSON object per line)
- Handles partial chunks with buffer management
- Returns cleanup function for cancellation

**Usage Example**:
```typescript
const cleanup = api.postStream<StreamMessage>(
  "/execute/stream",
  { user_input: "Analyze market trends" },
  (message) => {
    // Handle each streamed message
    console.log(message);
  },
  (error) => {
    // Handle errors
    console.error(error);
  }
);

// Later, cancel the stream
cleanup();
```

---

### **`lib/queries.ts`** - React Hooks

**Purpose**: Custom React hooks for data fetching and state management. Provides a clean interface for components to access API data.

**Key Hooks**:

#### 1. `useMissionExecutionStream()`
**Purpose**: Handles real-time mission execution with streaming updates.

**Returns**:
```typescript
{
  executeMissionStream: (request: MissionRequest) => Promise<string>,
  cancelStream: () => void,
  isStreaming: boolean,
  currentStep: number,
  totalSteps: number,
  progressPercentage: number,
  currentThinking: string,
  toolExecutions: Array<{ tool: string; status: string; ... }>,
  actions: Array<{ action: string; status: string; ... }>,
  finalReport: string | null,
  error: Error | null
}
```

**How It Works**:
1. Calls `api.postStream()` to start streaming
2. Processes different message types (`thinking`, `tool_start`, `tool_complete`, `progress`, etc.)
3. Updates state as messages arrive
4. Resolves promise when `complete` message received

**Message Types**:
- `thinking` - Agent's current thought process
- `tool_start` - Tool execution started
- `tool_complete` - Tool execution finished
- `action_start` - Action (e.g., save to Notion) started
- `action_complete` - Action finished
- `progress` - Progress update (step X of Y)
- `complete` - Final report ready
- `error` - Error occurred

#### 2. `useHealthCheck()`
**Purpose**: Fetches system health status.

**Features**:
- Auto-refreshes every 30 seconds
- Transforms backend response format
- Supports mock mode

**Returns**:
```typescript
{
  data: HealthStatus | null,
  isLoading: boolean,
  error: Error | null
}
```

#### 3. `useMissionStats()`
**Purpose**: Fetches mission statistics (total, completed, failed, success rate).

**Features**:
- Auto-refreshes every 10 seconds
- Calculates success rate from backend data
- Transforms backend response

#### 4. `useReports()`
**Purpose**: Fetches list of generated reports.

**Returns**:
```typescript
{
  data: Report[],
  isLoading: boolean,
  error: Error | null,
  refetch: () => void  // Manual refresh function
}
```

#### 5. `useActivity()`
**Purpose**: Fetches recent activity feed.

**Features**:
- Auto-refreshes every 15 seconds
- Currently mock-only (real API not implemented)

**Mock vs Real API**:
```typescript
const useMockApi = () => {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
};

// In each hook:
if (useMockApi()) {
  return await mockApi.getHealth();
} else {
  const response = await api.get("/health");
  return transformHealthResponse(response);
}
```

---

### **`lib/apiTransformers.ts`** - Response Transformers

**Purpose**: Converts backend API response format to frontend types. The backend uses different field names and formats than the frontend expects.

**Key Functions**:

#### `transformHealthResponse(backendResponse)`
**Maps**:
- `status: "ok"` → `status: "healthy"`
- `database: "up"` → `database: "online"`
- `chromadb: "up"` → `chromadb: "online"`

#### `transformStatsResponse(backendResponse)`
**Calculates**:
- `success_rate = (completed / total) * 100`
- `in_progress = total - completed - failed`

#### `transformReportsResponse(backendReports[])`
**Transforms**:
- Backend status (`COMPLETED`, `FAILED`) → Frontend status (`completed`, `failed`)
- Extracts title from response or query
- Truncates description to 150 characters
- Formats file size from response length
- Extracts mission type from content

**Helper Functions**:
- `extractTitleFromResponse()` - Finds H1 markdown headers or first line
- `truncateText()` - Truncates text with ellipsis
- `formatSize()` - Converts bytes to human-readable format (KB, MB, GB)
- `extractMissionType()` - Detects mission type from keywords

---

### **`lib/mockApi.ts`** - Mock API

**Purpose**: Provides mock data for development and testing when backend is unavailable.

**Features**:
- Simulates network delay (50-200ms)
- Returns realistic mock data
- Same interface as real API

**Mock Data Includes**:
- Health status (always healthy)
- Mission stats (42 total, 38 completed, etc.)
- Sample reports (7 reports with various statuses)
- Recent activity (4 activity items)

**Usage**:
Set `NEXT_PUBLIC_USE_MOCK_API=true` in `.env.local` to enable mock mode.

---

### **`lib/validators.ts`** - Zod Schemas

**Purpose**: Runtime validation and type inference using Zod.

**Schemas**:
- `MissionRequestSchema` - Validates mission execution requests
- `MissionLogSchema` - Validates mission log data
- `StreamChunkSchema` - Validates streaming message types

**Usage**:
```typescript
import { MissionRequestSchema } from "@/lib/validators";

const request = MissionRequestSchema.parse({
  user_input: "Analyze market",
  conversation_id: 123
});
```

---

### **`lib/utils.ts`** - Utility Functions

**Purpose**: Common utility functions.

**Key Function**:
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage**: Combines Tailwind CSS classes with conflict resolution.
```typescript
cn("bg-blue-500", "bg-red-500") // Returns "bg-red-500" (last wins)
cn("px-4", isActive && "bg-primary") // Conditionally adds classes
```

---

### **`app/agent/page.tsx`** - Agent Terminal

**Purpose**: Main chat interface for interacting with the Market Intelligence Agent.

**Key Features**:
1. **Message History**: Displays conversation messages
2. **Real-time Streaming**: Shows live updates during mission execution
3. **Progress Tracking**: Progress bar, tool executions, actions
4. **Error Handling**: Displays errors with retry option

**State Management**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState("");
const {
  executeMissionStream,
  cancelStream,
  isStreaming,
  currentStep,
  totalSteps,
  progressPercentage,
  currentThinking,
  toolExecutions,
  actions,
  finalReport,
  error: executionError,
} = useMissionExecutionStream();
```

**Message Flow**:
1. User types message and clicks "Send"
2. User message added to chat
3. Placeholder assistant message created
4. `executeMissionStream()` called
5. `useEffect` watches streaming state and updates message content
6. When complete, final report replaces placeholder message

**Streaming Updates**:
```typescript
useEffect(() => {
  if (isStreaming && streamingMessageId !== null) {
    setMessages((prev) => {
      // Update the streaming message with current state
      // Shows: thinking, tool executions, progress
    });
  } else if (!isStreaming && finalReport) {
    // Finalize message with complete report
  }
}, [isStreaming, currentThinking, toolExecutions, finalReport, ...]);
```

**UI Components**:
- Chat messages (user/assistant bubbles)
- Progress bar (step X of Y, percentage)
- Tool execution cards (with status icons)
- Action cards (Notion save, email dispatch)
- Input field with send button
- Cancel button (when streaming)

---

### **`app/page.tsx`** - Dashboard

**Purpose**: Home page showing system overview and statistics.

**Features**:
1. **Stat Cards**: 4 cards showing key metrics
   - Active Missions
   - Reports Generated
   - Success Rate
   - System Health
2. **Recent Activity**: List of recent mission activities

**Data Fetching**:
```typescript
const { data: health } = useHealthCheck();
const { data: stats } = useMissionStats();
const { data: activity } = useActivity();
```

**Time Formatting**:
```typescript
const formatTimeAgo = (timestamp: string) => {
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  // Returns "X minutes ago", "X hours ago", or "X days ago"
};
```

---

### **`app/reports/page.tsx`** - Reports Page

**Purpose**: Displays list of generated intelligence reports.

**Features**:
- Report cards with title, description, date, status
- Search input (UI only, not functional yet)
- Download button (UI only, not functional yet)
- Status badges (completed, processing, failed)

**Report Display**:
- Icon (FileText)
- Title and description
- Metadata (date, size, status)
- Color-coded status badges

---

### **`components/Navigation.tsx`** - Navigation Bar

**Purpose**: Top navigation bar with links to main pages.

**Features**:
- Active route highlighting
- Responsive design
- Icon + text labels

**Implementation**:
```typescript
const pathname = usePathname(); // Next.js hook
const isActive = pathname === item.href;
// Applies different styles based on active state
```

**Navigation Items**:
- Dashboard (`/`)
- Agent (`/agent`)
- Reports (`/reports`)

---

### **`app/layout.tsx`** - Root Layout

**Purpose**: Wraps all pages with shared layout (navigation, fonts, styles).

**Features**:
- Dark mode by default (`className="dark"`)
- Inter font from Google Fonts
- Navigation component included
- Global CSS imported

---

## 🔄 Data Flow

### Mission Execution Flow

```
User Input
    ↓
AgentPage.handleSend()
    ↓
executeMissionStream(request)
    ↓
api.postStream("/execute/stream", request)
    ↓
Backend streams NDJSON messages
    ↓
handleStreamMessage() processes each message
    ↓
State updates (currentThinking, toolExecutions, etc.)
    ↓
useEffect watches state changes
    ↓
Updates message content in UI
    ↓
Final report received
    ↓
Message finalized, reports list refreshed
```

### API Request Flow

```
Component calls hook (e.g., useHealthCheck())
    ↓
Hook checks: useMockApi()?
    ↓
If mock: mockApi.getHealth()
    ↓
If real: api.get("/health")
    ↓
Transform response (if needed)
    ↓
Update state
    ↓
Component re-renders with new data
```

---

## 🎨 UI Patterns

### **Styling**
- Uses **Tailwind CSS** for styling
- Dark mode theme
- Responsive design (mobile-first)
- Custom color scheme via CSS variables

### **Loading States**
- `Loader2` icon with `animate-spin` class
- Skeleton screens for content
- Disabled buttons during loading

### **Error States**
- Red error banners
- User-friendly error messages
- Retry/reload options

### **Status Indicators**
- Color-coded badges (green=success, yellow=processing, red=failed)
- Icons (CheckCircle2, Loader2, Circle)
- Progress bars for long operations

---

## 🔧 Environment Variables

Required in `.env.local`:

```bash
# Backend API URL (required for real API mode)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Use mock API instead of real backend (for development)
NEXT_PUBLIC_USE_MOCK_API=false
```

---

## 📦 Dependencies

**Core**:
- `next` (^15.0.0) - React framework
- `react` (^18.3.0) - UI library
- `typescript` (^5.5.0) - Type safety

**Styling**:
- `tailwindcss` (^3.4.0) - CSS framework
- `clsx` (^2.1.1) - Conditional class names
- `tailwind-merge` (^2.5.0) - Merge Tailwind classes

**Icons**:
- `lucide-react` (^0.400.0) - Icon library

**Validation** (if used):
- `zod` - Runtime validation (not in package.json but used in validators.ts)

---

## 🚀 Key Patterns & Best Practices

### 1. **Client Components**
All interactive components use `"use client"` directive because they use React hooks.

### 2. **Type Safety**
- All API responses are typed
- Zod schemas for runtime validation
- Type inference from Zod schemas

### 3. **Error Handling**
- Try-catch blocks in all async operations
- User-friendly error messages
- Error state in hooks

### 4. **Loading States**
- `isLoading` state in all data-fetching hooks
- Loading indicators in UI
- Disabled inputs during operations

### 5. **Streaming**
- Uses `ReadableStream` API
- Buffer management for partial chunks
- Cleanup functions for cancellation
- NDJSON parsing

### 6. **Mock vs Real API**
- Single source of truth: `useMockApi()` function
- Same interface for both modes
- Easy switching via environment variable

### 7. **Auto-refresh**
- Health check: 30 seconds
- Stats: 10 seconds
- Activity: 15 seconds
- Uses `setInterval` in `useEffect` with cleanup

---

## 💡 Code Snippets You Can Copy

### **Basic API Call**
```typescript
import { api } from "@/lib/api";

const data = await api.get<MyType>("/endpoint");
```

### **Streaming API Call**
```typescript
import { api } from "@/lib/api";

const cleanup = api.postStream<StreamMessage>(
  "/execute/stream",
  { user_input: "Analyze market" },
  (message) => {
    console.log("Received:", message);
  },
  (error) => {
    console.error("Error:", error);
  }
);

// Cancel stream
cleanup();
```

### **Using a Data Hook**
```typescript
import { useHealthCheck } from "@/lib/queries";

function MyComponent() {
  const { data, isLoading, error } = useHealthCheck();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;
  
  return <div>{data.status}</div>;
}
```

### **Mission Execution**
```typescript
import { useMissionExecutionStream } from "@/lib/queries";

function AgentPage() {
  const { executeMissionStream, isStreaming, finalReport } = useMissionExecutionStream();
  
  const handleSend = async () => {
    await executeMissionStream({
      user_input: "Analyze NVIDIA Blackwell"
    });
  };
  
  return (
    <div>
      {isStreaming && <div>Processing...</div>}
      {finalReport && <div>{finalReport}</div>}
    </div>
  );
}
```

### **Combining Classes**
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "bg-card border rounded-lg",
  isActive && "bg-primary",
  isLoading && "opacity-50"
)}>
```

### **Time Formatting**
```typescript
const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};
```

---

## 🐛 Common Issues & Solutions

### **Issue: API calls failing**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check CORS configuration on backend
- Look for timeout errors (increase timeout if needed)

### **Issue: Streaming not working**
- Verify backend supports `/execute/stream` endpoint
- Check browser console for errors
- Ensure response is NDJSON format
- Verify `AbortController` is supported (modern browsers)

### **Issue: Mock API not working**
- Set `NEXT_PUBLIC_USE_MOCK_API=true` in `.env.local`
- Restart Next.js dev server after changing env vars
- Check console for mock API logs

### **Issue: Types not matching**
- Check `apiTransformers.ts` for transformation logic
- Verify backend response format matches expected types
- Use TypeScript errors to identify mismatches

---

## 📝 Summary

This frontend is a **modern, type-safe Next.js application** with:

✅ **Real-time streaming** for mission execution  
✅ **Mock API support** for development  
✅ **Type-safe API calls** with TypeScript  
✅ **Auto-refreshing data** hooks  
✅ **Error handling** throughout  
✅ **Responsive UI** with Tailwind CSS  
✅ **Clean architecture** with separation of concerns  

The codebase follows React best practices and is well-structured for maintainability and scalability.
