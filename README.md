# AutoSentience - AI-Powered Vehicle Predictive Maintenance

![AutoSentience](https://img.shields.io/badge/AI-Powered-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Groq](https://img.shields.io/badge/Groq-Llama%203.1-orange)

A production-ready web application for intelligent vehicle predictive maintenance powered by AI. AutoSentience uses Groq AI (Llama 3.1 70B) with a multi-agent system to analyze vehicle sensor data, detect faults, and provide actionable insights through a modern web dashboard and voice interface.

## 🎯 Features

### Core Functionality
- **Real-time Sensor Monitoring** - Live dashboard with temperature, RPM, battery, and fuel metrics
- **AI-Powered Diagnosis** - 6-agent system for intelligent fault detection and analysis
- **Predictive Alerts** - Rule-based + AI detection with severity classification
- **Voice Interface** - Browser-based voice queries with natural language responses
- **Service Booking** - Integrated appointment scheduling system
- **Root Cause Analysis** - Automated RCA reports with CAPA recommendations
- **Security Monitoring** - UEBA agent for anomaly detection

### AI Agent System
1. **Master Agent** - Orchestrates all sub-agents and makes high-level decisions
2. **Diagnosis Agent** - Analyzes sensor data and provides fault diagnosis
3. **Engagement Agent** - Handles user communication and notifications
4. **Scheduling Agent** - Manages service appointment booking
5. **RCA Agent** - Generates root cause analysis reports
6. **UEBA Security Agent** - Detects anomalous behavior patterns

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN UI
- **Backend**: Next.js API Routes (Node.js)
- **Database**: Supabase (PostgreSQL with Realtime)
- **AI Engine**: Groq API (Llama 3.1 70B)
- **Charts**: Recharts
- **Voice**: Web Speech API
- **Deployment**: Vercel + Supabase Cloud

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Groq API key (free tier available)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd d:\EY\autosentience
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the schema from `supabase/schema.sql`
4. Verify all 6 tables are created

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

The application uses 6 main tables:

1. **sensor_readings** - Vehicle telemetry data
2. **alerts** - System-generated alerts with AI diagnosis
3. **bookings** - Service appointment scheduling
4. **voice_logs** - Voice interaction history
5. **agent_logs** - AI agent decision traces
6. **ueba_logs** - Security monitoring events

## 🔌 API Routes

### Data Ingestion
- `POST /api/ingest` - Receive vehicle sensor data
- `GET /api/ingest?vehicle_id=XXX` - Retrieve sensor readings

### Prediction & Analysis
- `POST /api/predict` - Run predictive analysis on sensor data
- `POST /api/agent` - Master Agent orchestration
- `GET /api/agent` - Fetch agent decision logs

### Alert Management
- `GET /api/alerts` - Fetch alerts with filtering
- `POST /api/alerts` - Create new alert
- `PATCH /api/alerts` - Update alert status
- `DELETE /api/alerts` - Archive alert

### Service Booking
- `GET /api/book` - Fetch bookings
- `POST /api/book` - Create service booking
- `PATCH /api/book` - Update booking status

### Analysis & Reports
- `POST /api/rca` - Generate RCA report
- `GET /api/rca` - Fetch RCA reports

### Voice Interface
- `POST /api/voice` - Handle voice queries
- `GET /api/voice` - Fetch voice interaction history

## 🎨 Dashboard Pages

1. **Dashboard** (`/dashboard`) - Real-time metrics, charts, and voice interface
2. **Alerts** (`/alerts`) - Alert management with filtering
3. **Service** (`/service`) - Booking form and history
4. **RCA** (`/rca`) - Root cause analysis reports
5. **Security** (`/security`) - UEBA security monitoring
6. **Agent Logs** (`/agent-logs`) - AI decision traces

## 🗣 Voice Interface Usage

The dashboard includes a browser-based voice assistant:

1. Click the "Start Voice Query" button
2. Allow microphone access when prompted
3. Ask questions like:
   - "What's my engine temperature?"
   - "Do I have any alerts?"
   - "How's my battery?"
4. The system will respond with voice and text

## 🧪 Testing the System

### 1. Ingest Sample Data

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "DEMO-VEH-001",
    "engine_temp": 115,
    "engine_rpm": 3500,
    "battery_voltage": 12.6,
    "fuel_level": 45,
    "speed": 65
  }'
```

### 2. Run Prediction

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "DEMO-VEH-001"}'
```

### 3. Check Dashboard

Navigate to http://localhost:3000/dashboard to see the results.

## 🌐 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run schema from `supabase/schema.sql`
3. Copy project URL and keys to `.env.local`
4. Enable Realtime for sensor_readings and alerts tables

## 🔑 Getting API Keys

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → API
4. Copy `URL`, `anon key`, and `service_role key`

### Groq
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free account
3. Navigate to API Keys
4. Create new API key

## 📁 Project Structure

```
autosentience/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard page
│   ├── alerts/           # Alerts page
│   ├── service/          # Service booking page
│   ├── rca/              # RCA page
│   ├── security/         # Security page
│   ├── agent-logs/       # Agent logs page
│   └── layout.tsx        # Root layout
├── components/
│   └── ui/               # ShadCN components
├── lib/
│   ├── agents/           # AI agent implementations
│   ├── supabase/         # Database clients
│   ├── groq/             # Groq API client
│   └── rules/            # Rule-based detector
├── types/                # TypeScript types
└── supabase/
    └── schema.sql        # Database schema
```

## 🤝 Contributing

This is a production-ready demo for the EY Techathon. For improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🆘 Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check if RLS policies are properly configured
- Ensure tables are created from schema.sql

### Groq API Errors
- Verify API key is valid
- Check rate limits (free tier has limits)
- Review error messages in browser console

### Voice Interface Not Working
- Ensure HTTPS or localhost (required for microphone access)
- Check browser compatibility (Chrome/Edge recommended)
- Allow microphone permissions when prompted

## 📧 Support

For issues or questions:
- Check the documentation above
- Review API route implementations
- Examine agent system logic in `lib/agents/`

---

**Built for intelligent vehicle maintenance**
