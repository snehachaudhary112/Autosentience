# AutoSentience - Complete Setup & How It Works Guide

## 📖 Table of Contents
1. [What is AutoSentience?](#what-is-autosentience)
2. [How the System Works](#how-the-system-works)
3. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
4. [Testing the Application](#testing-the-application)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 What is AutoSentience?

AutoSentience is an **AI-powered vehicle predictive maintenance system** that:
- Monitors vehicle sensor data in real-time
- Detects potential issues before they become serious
- Uses AI agents to diagnose problems and recommend actions
- Provides a web dashboard for monitoring
- Includes voice interface for hands-free interaction

**No mobile app needed** - everything runs through the web browser!

---

## 🔄 How the System Works

### Architecture Overview

```
Vehicle Sensors → Data Ingestion → Rule Detection → AI Analysis → Dashboard Display
                                          ↓
                                    Alert Creation
                                          ↓
                                  Service Booking
```

### Step-by-Step Data Flow

#### 1. **Data Collection**
- Vehicle sensors send data (temperature, RPM, battery, etc.)
- Data is sent to `/api/ingest` endpoint
- Stored in Supabase `sensor_readings` table

#### 2. **Rule-Based Detection**
- System checks sensor values against thresholds
- Example: Engine temp > 110°C = HIGH severity
- If violations found, proceed to AI analysis

#### 3. **AI Agent System** (6 Agents)

**Master Agent** (Orchestrator)
- Receives sensor data and rule violations
- Decides what actions to take
- Coordinates all other agents

**Diagnosis Agent**
- Analyzes the sensor anomalies
- Provides technical diagnosis
- Estimates repair costs
- Uses Groq AI (Llama 3.1 70B)

**Engagement Agent**
- Creates user-friendly messages
- Determines if user should be contacted
- Handles voice bot conversations

**Scheduling Agent**
- Recommends service appointments
- Suggests available dates
- Estimates service duration

**RCA Agent**
- Performs root cause analysis
- Identifies contributing factors
- Provides CAPA recommendations

**UEBA Security Agent**
- Monitors for anomalous behavior
- Detects security threats
- Flags suspicious patterns

#### 4. **Alert Creation**
- If fault detected, alert is created in database
- Alert includes: severity, diagnosis, recommended action
- Displayed on dashboard in real-time

#### 5. **User Interaction**
- Dashboard shows live metrics and charts
- Voice interface allows hands-free queries
- Service booking for scheduling repairs

---

## 🚀 Step-by-Step Setup Guide

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Internet connection
- ✅ Web browser (Chrome/Edge recommended)

### Step 1: Get Supabase Account (5 minutes)

**Why?** Supabase is our database - it stores all sensor data, alerts, and bookings.

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Click **"New Project"**
5. Fill in:
   - **Name**: AutoSentience
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to you
6. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Set Up Database Schema

**Why?** This creates the tables where data will be stored.

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open the file: `d:\EY\autosentience\supabase\schema.sql`
4. Copy ALL the content (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. You should see: "Success. No rows returned"

**What this created:**
- `sensor_readings` - Vehicle data storage
- `alerts` - System alerts
- `bookings` - Service appointments
- `voice_logs` - Voice interaction history
- `agent_logs` - AI decision traces
- `ueba_logs` - Security monitoring

### Step 3: Get Supabase API Keys

**Why?** These keys allow the app to connect to your database.

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. You'll see three important values:

**Copy these:**
- **Project URL** (looks like: `https://abcdefgh.supabase.co`)
- **anon public** key (long string starting with `eyJ...`)
- **service_role** key (another long string starting with `eyJ...`)

⚠️ **IMPORTANT**: Keep the service_role key secret!

### Step 4: Get Groq API Key (2 minutes)

**Why?** Groq provides the AI brain (Llama 3.1) for diagnosis and analysis.

1. Go to [console.groq.com](https://console.groq.com)
2. Click **"Sign up"** (use Google/GitHub)
3. After login, click **"API Keys"** (left sidebar)
4. Click **"Create API Key"**
5. Give it a name: "AutoSentience"
6. Click **"Submit"**
7. **Copy the key** (starts with `gsk_...`)

⚠️ **Save this key** - you can't see it again!

**Free Tier Limits:**
- 30 requests/minute
- 14,400 requests/day
- Perfect for development!

### Step 5: Configure Environment Variables

**Why?** This tells the app how to connect to Supabase and Groq.

1. Open the file: `d:\EY\autosentience\.env.local`
2. Replace the placeholder values with your actual keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here

# Groq AI Configuration
GROQ_API_KEY=gsk_your_actual_groq_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**CRITICAL RULES:**
- ❌ NO quotes around values
- ❌ NO spaces before/after the `=` sign
- ✅ Use actual keys, not placeholders
- ✅ Save the file (Ctrl+S)

**Example of CORRECT format:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcxyz123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY3h5ejEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.abcdefghijklmnopqrstuvwxyz123456789
```

### Step 6: Install Dependencies

**Why?** This downloads all the code libraries the app needs.

1. Open terminal in `d:\EY\autosentience`
2. Run:
```bash
npm install
```

Wait for it to complete (~1-2 minutes)

### Step 7: Start the Development Server

**Why?** This runs the application locally.

1. In the same terminal, run:
```bash
npm run dev
```

2. You should see:
```
▲ Next.js 16.0.7 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env.local
```

3. **Keep this terminal open!** The server needs to stay running.

### Step 8: Verify Environment Variables

**Why?** Make sure the app can read your API keys.

1. Open browser: http://localhost:3000/test-env
2. You should see:
   - ✅ NEXT_PUBLIC_SUPABASE_URL: Set
   - ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set
   - ✅ GROQ_API_KEY: Set

**If you see ❌ Missing:**
- Stop the server (Ctrl+C in terminal)
- Double-check `.env.local` file has correct values
- Make sure file is saved
- Restart: `npm run dev`

### Step 9: Open the Dashboard

**Why?** This is your main interface!

1. Open browser: http://localhost:3000
2. You'll be redirected to: http://localhost:3000/dashboard
3. You should see:
   - 4 metric cards (Engine Temp, RPM, Battery, Alerts)
   - Charts showing sensor trends
   - Voice interface button
   - Recent alerts section

---

## 🧪 Testing the Application

### Test 1: Ingest Sample Data

**What this does:** Sends fake vehicle sensor data to the system.

Open a **new terminal** (keep the dev server running) and run:

```bash
curl -X POST http://localhost:3000/api/ingest -H "Content-Type: application/json" -d "{\"vehicle_id\":\"DEMO-VEH-001\",\"engine_temp\":115,\"engine_rpm\":3500,\"battery_voltage\":12.6,\"fuel_level\":45,\"speed\":65}"
```

**Expected result:**
```json
{
  "success": true,
  "message": "Sensor data ingested successfully"
}
```

**What happened:**
- Data was stored in `sensor_readings` table
- Dashboard will update automatically (refresh if needed)

### Test 2: Run Prediction (Trigger AI)

**What this does:** Analyzes the sensor data and creates alerts if issues found.

```bash
curl -X POST http://localhost:3000/api/predict -H "Content-Type: application/json" -d "{\"vehicle_id\":\"DEMO-VEH-001\"}"
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "anomalies_detected": true,
    "violations": [...],
    "diagnosis": {...},
    "alerts_created": [...]
  }
}
```

**What happened:**
1. System checked sensor values against thresholds
2. Found engine_temp = 115°C (above 110°C threshold)
3. Master Agent was triggered
4. Diagnosis Agent analyzed the issue using Groq AI
5. Alert was created in database
6. Dashboard updated with new alert

### Test 3: Check the Dashboard

1. Refresh: http://localhost:3000/dashboard
2. You should now see:
   - **Engine Temp**: 115°C (in red/orange)
   - **Active Alerts**: 1
   - Chart showing the temperature spike
   - Alert in "Recent Alerts" section

### Test 4: View Alert Details

1. Go to: http://localhost:3000/alerts
2. You should see the alert with:
   - Severity: HIGH or CRITICAL
   - Title: "ENGINE_TEMP Detected" or similar
   - Diagnosis from AI
   - Recommended action
   - Estimated cost (if provided)

### Test 5: Voice Interface

1. Go back to: http://localhost:3000/dashboard
2. Click **"Start Voice Query"** button
3. Allow microphone access when prompted
4. Say: "What's my engine temperature?"
5. The system will:
   - Convert your speech to text
   - Process the query
   - Respond with current temperature
   - Speak the response back to you

### Problem: Environment variables not loading

**Symptoms:**
- Test page shows ❌ Missing
- Dashboard shows 500 error
- Error: "Missing Supabase environment variables"

**Solutions:**

1. **Check file name**: Must be `.env.local` (not `.env`)
2. **Check variable names**: Must be exact:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`

3. **Check format**:
   ```env
   # ❌ WRONG
   NEXT_PUBLIC_SUPABASE_URL="https://abc.supabase.co"
   NEXT_PUBLIC_SUPABASE_URL = https://abc.supabase.co
   
   # ✅ CORRECT
   NEXT_PUBLIC_SUPABASE_URL=https://abc.supabase.co
   ```

4. **Restart server**:
   - Stop: Ctrl+C
   - Start: `npm run dev`

5. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Problem: Database connection error

**Symptoms:**
- API calls fail
- Error: "Failed to fetch"
- Supabase errors in console

**Solutions:**

1. **Verify Supabase project is running**:
   - Go to supabase.com dashboard
   - Check project status (should be green)

2. **Check API keys are correct**:
   - Copy fresh keys from Supabase Settings → API
   - Update `.env.local`
   - Restart server

3. **Verify database schema was created**:
   - Go to Supabase → Table Editor
   - You should see 6 tables
   - If not, re-run the schema.sql

### Problem: Groq API errors

**Symptoms:**
- Prediction works but no AI diagnosis
- Error: "Groq API failed"

**Solutions:**

1. **Check API key**:
   - Go to console.groq.com
   - Verify key is active
   - Copy fresh key if needed

2. **Check rate limits**:
   - Free tier: 30 requests/minute
   - Wait a minute and try again

3. **Check fallback**:
   - System should still work with basic rule-based detection
   - AI diagnosis will be simpler

### Problem: Charts not showing data

**Symptoms:**
- Dashboard loads but charts are empty
- No sensor data visible

**Solutions:**

1. **Ingest sample data**:
   ```bash
   curl -X POST http://localhost:3000/api/ingest -H "Content-Type: application/json" -d "{\"vehicle_id\":\"DEMO-VEH-001\",\"engine_temp\":95,\"engine_rpm\":2500,\"battery_voltage\":12.6,\"fuel_level\":75,\"speed\":55}"
   ```

2. **Check database**:
   - Go to Supabase → Table Editor
   - Open `sensor_readings` table
   - Verify data is there

3. **Refresh dashboard**: Hard refresh (Ctrl+Shift+R)

### Problem: Voice interface not working

**Symptoms:**
- Microphone button doesn't work
- No speech recognition

**Solutions:**

1. **Check browser compatibility**:
   - Use Chrome or Edge (best support)
   - Safari has limited support

2. **Check permissions**:
   - Allow microphone access when prompted
   - Check browser settings → Privacy → Microphone

3. **Check HTTPS**:
   - Voice API requires HTTPS or localhost
   - localhost:3000 should work fine

---

## 📊 Understanding the Dashboard

### Main Dashboard (`/dashboard`)

**Top Cards:**
- **Engine Temp**: Current temperature (normal: 85-95°C)
- **Engine RPM**: Current RPM (idle: 800-1000)
- **Battery**: Voltage (healthy: 12.4-12.8V)
- **Active Alerts**: Number of open issues

**Charts:**
- Shows last 10 sensor readings
- Updates in real-time
- Three lines: Temperature, RPM, Battery

**Voice Interface:**
- Click microphone to start
- Speak your question
- Get spoken response

**Recent Alerts:**
- Last 5 open alerts
- Color-coded by severity
- Click for details

### Alerts Page (`/alerts`)

**Features:**
- Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- Filter by status (OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED)
- Update alert status with buttons
- View full diagnosis and recommendations

### Service Page (`/service`)

**Booking Form:**
- Service type (e.g., "Oil Change")
- Date and time picker
- Customer information
- Issue description

**Booking History:**
- All past and upcoming appointments
- Status tracking
- Confirmation numbers

### Agent Logs (`/agent-logs`)

**What you see:**
- Every decision made by AI agents
- Reasoning behind decisions
- Confidence scores
- Execution time

**Useful for:**
- Understanding why alerts were created
- Debugging AI behavior
- Seeing the "thought process"

---

## 🎓 Key Concepts

### Rule-Based Detection
- **What**: Checks sensor values against thresholds
- **When**: Every time data is ingested
- **Example**: If temp > 110°C → HIGH severity
- **Why**: Fast, reliable, no AI needed

### AI Diagnosis
- **What**: Groq AI analyzes anomalies
- **When**: After rule violations detected
- **Example**: "Possible coolant leak causing overheating"
- **Why**: Provides context and recommendations

### Master Agent
- **What**: Orchestrates all other agents
- **When**: Triggered by prediction API
- **Example**: Decides to create alert, notify user, book service
- **Why**: Coordinates complex workflows

### Real-time Updates
- **What**: Dashboard updates automatically
- **When**: New data arrives
- **How**: Supabase Realtime subscriptions
- **Why**: Always see latest information

---

## 🚀 Next Steps

**For Development:**
1. Add more sensor types
2. Customize alert thresholds
3. Add email notifications
4. Integrate with real vehicle APIs

**For Production:**
1. Deploy to Vercel
2. Set up custom domain
3. Add authentication
4. Configure production Supabase

**For Learning:**
1. Explore the code in `lib/agents/`
2. Modify agent prompts
3. Add new AI agents
4. Customize the dashboard

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Groq Docs**: https://console.groq.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project README**: `d:\EY\autosentience\README.md`

---

**Need Help?**
- Check the troubleshooting section above
- Review the error messages carefully
- Verify all environment variables are set
- Make sure database schema is created

**Happy monitoring! 🚗💨**
