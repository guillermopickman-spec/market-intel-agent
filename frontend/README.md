# Market Intelligence Agent - Frontend

Modern Next.js 15 frontend for the Market Intelligence Agent, featuring real-time dashboard statistics, interactive agent terminal with streaming responses, and comprehensive reports management.

## Features

- **Dashboard**: Real-time system health monitoring and mission statistics
- **Agent Terminal**: Interactive chat interface with streaming ReAct loop visualization
- **Reports**: Comprehensive mission log viewer with export functionality
- **Dark Industrial Theme**: Slate/Zinc color palette optimized for technical workflows

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - High-quality component library
- **React Query (TanStack Query)** - Server state management
- **Zod** - Schema validation
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:8000)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, set this to your Render backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (Render deployment) | Yes |

### Example `.env.local`

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (Vercel)
NEXT_PUBLIC_API_URL=https://market-intel-agent.onrender.com
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard
│   ├── agent/             # Agent Terminal
│   └── reports/           # Reports page
├── components/            # React components
│   ├── ui/                # Shadcn UI components
│   ├── dashboard/         # Dashboard components
│   ├── agent/             # Agent terminal components
│   └── reports/           # Reports components
├── lib/                   # Utilities
│   ├── api.ts             # API client
│   ├── queries.ts         # React Query hooks
│   ├── validators.ts      # Zod schemas
│   └── utils.ts           # Helper functions
└── public/                # Static assets
```

## Deployment to Vercel

### Step 1: Push to GitHub

Ensure your frontend code is in a GitHub repository.

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the `frontend` directory as the root (or configure it in settings)

### Step 3: Configure Environment Variables

In Vercel project settings, add:

- `NEXT_PUBLIC_API_URL` = `https://your-render-backend.onrender.com`

### Step 4: Deploy

Vercel will automatically:
- Detect Next.js
- Install dependencies
- Build the project
- Deploy to production

### Step 5: Update Backend CORS

In your Render backend `.env`, add your Vercel domain:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

Or use the wildcard pattern (already configured):
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### API Integration

The frontend communicates with the FastAPI backend via:

- **Health Check**: `GET /health`
- **Mission Execution**: `POST /execute`
- **Streaming Execution**: `POST /execute/stream`
- **Reports**: `GET /reports`

See `lib/api.ts` for the API client implementation.

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure:
1. `NEXT_PUBLIC_API_URL` is correctly set
2. Backend CORS configuration includes your Vercel domain
3. Backend is running and accessible

### Streaming Not Working

If streaming responses don't work:
1. Check browser console for errors
2. Verify `/execute/stream` endpoint is accessible
3. Ensure backend supports Server-Sent Events (SSE)

### Build Errors

If build fails:
1. Ensure all dependencies are installed: `npm install`
2. Check TypeScript errors: `npm run build`
3. Verify environment variables are set

## License

MIT
