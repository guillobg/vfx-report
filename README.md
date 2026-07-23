# VFX Weekly Status Report System

A web application for VFX coordinators at production companies to submit weekly status reports digitally, replacing the Excel + email workflow. Data flows directly into Airtable.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Coordinator    │────▶│  Next.js App     │────▶│  Airtable   │
│  (Browser)      │     │  (API Routes)    │     │  Base       │
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │
                        ┌─────┴─────┐
                        │ NextAuth  │
                        │ (Auth)    │
                        └───────────┘
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod v4 validation
- **Backend**: Next.js API Routes → Airtable REST API
- **Auth**: NextAuth.js v4 (Credentials provider)

## Features

- ✅ Multi-step form (8 steps) matching the Excel structure
- ✅ Dynamic repeater fields (episodes, assets, hero shots)
- ✅ Project selection from Airtable
- ✅ WBR Summary with live 30-40 word counter
- ✅ Finance totals with variance calculation
- ✅ Shot tracking with % complete auto-calculation
- ✅ Review step before submission
- ✅ Historical submissions dashboard
- ✅ Admin view for all submissions
- ✅ Mobile-responsive design
- ✅ Spanish UI with English field names

## Getting Started

### Prerequisites

- Node.js 18+
- An Airtable account with the base `apptvkS16dWwoi7kR`

### Setup

1. Clone and install:
   ```bash
   cd vfx-report
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Airtable token
   ```

3. Create the required Airtable tables (see below)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role        | Email                    | Password |
|-------------|--------------------------|----------|
| Coordinator | coordinator@example.com  | demo123  |
| Admin       | admin@amazon.com         | admin123 |

## Airtable Setup

The app writes to these tables in base `apptvkS16dWwoi7kR`:

### Existing Table
- **Track Projects** (`tblEfY5scIch7ki07`) — already exists

### New Tables to Create

1. **Weekly Reports** — Links to Track Projects via `Project` field
2. **Shot Tracking** — Links to Weekly Reports
3. **Finance Tracking** — Links to Weekly Reports
4. **Asset Tracking** — Links to Weekly Reports
5. **Hero Shots** — Links to Weekly Reports

See the full schema in the project specification document.

## Form Flow

```
Login → Dashboard → New Report →
  Step 1: Project + Week Ending + Currency
  Step 2: Finance Tracking (per episode + assets + overheads)
  Step 3: Shot Tracking (per episode with status breakdown)
  Step 4: Asset Tracking (repeater)
  Step 5: Hero Shots (repeater)
  Step 6: Narrative (5 text sections)
  Step 7: WBR Summary (30-40 words, English)
  Step 8: Review & Submit
→ Dashboard (confirmation)
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # Auth endpoint
│   │   ├── projects/route.ts             # GET active projects
│   │   └── reports/
│   │       ├── route.ts                  # POST new report
│   │       └── history/route.ts          # GET past reports
│   ├── dashboard/page.tsx                # Submission history
│   ├── login/page.tsx                    # Login screen
│   ├── report/new/page.tsx               # Report form
│   ├── layout.tsx                        # Root layout
│   └── page.tsx                          # Redirect to dashboard
├── components/
│   ├── steps/                            # Form step components
│   │   ├── StepMetadata.tsx
│   │   ├── StepFinance.tsx
│   │   ├── StepShots.tsx
│   │   ├── StepAssets.tsx
│   │   ├── StepHeroShots.tsx
│   │   ├── StepNarrative.tsx
│   │   ├── StepWbrSummary.tsx
│   │   └── StepReview.tsx
│   ├── ReportForm.tsx                    # Main multi-step form
│   ├── Stepper.tsx                       # Progress indicator
│   └── Providers.tsx                     # Session provider
├── lib/
│   ├── airtable.ts                       # Airtable service layer
│   ├── schemas.ts                        # Zod validation schemas
│   └── utils.ts                          # Helper functions
└── types/
    └── next-auth.d.ts                    # Auth type augmentation
```

## Deployment (Vercel)

1. Push to a Git repository
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Key Constraints

- Different projects have different episode counts (dynamic repeaters)
- Currency defaults to EUR, supports USD
- Cut Status: `Shooting Script | Assembly | AC1 | AC2 | AC3 | Fine Cut | Picture Lock`
- Asset/Shot Status: `Not Started | In Progress | Final | Omit | On Hold`
- WBR Summary: enforced 30-40 word count
- Week Ending: defaults to most recent Friday
- Reports immutable after 48 hours
- Airtable rate limit: 5 requests/second (batching included)
