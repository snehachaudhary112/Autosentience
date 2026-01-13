# AutoSentience Agentic AI Architecture

## Overview
AutoSentience is powered by a **Multi-Agent System (MAS)** where specialized AI agents collaborate to manage vehicle health. Unlike a single chatbot, these agents have distinct roles, responsibilities, and "personalities," allowing them to handle complex workflows autonomously.

## The Agent Team

### 1. The Orchestrator: Master Agent 🧠
*   **Role:** The "Brain" of the operation.
*   **Function:** It receives all sensor data and decides *who* needs to be involved. It doesn't fix the engine itself; it knows *which expert* to call.
*   **Logic:** "If engine temp is high -> Call Diagnosis Agent. If risk is high -> Call Engagement Agent."

### 2. The Analyst: Data Analysis Agent 📊
*   **Role:** The Pattern Spotter.
*   **Function:** Looks at raw numbers (telematics) to find subtle anomalies that simple rules might miss.
*   **Capability:** Can predict future maintenance needs based on trends (e.g., "Battery voltage is dropping faster than normal").

### 3. The Mechanic: Diagnosis Agent 🔧
*   **Role:** The Technical Expert.
*   **Function:** Analyzes specific fault codes and sensor readings to determine the root cause.
*   **Output:** Provides a technical diagnosis, estimated repair cost, and severity level.

### 4. The Communicator: Engagement Agent 💬
*   **Role:** The Customer Service Rep.
*   **Function:** Translates technical jargon into friendly, understandable messages for the user.
*   **Logic:** Decides the "tone" of the message (Urgent for safety risks, Informative for maintenance).

### 5. The Scheduler: Scheduling Agent 📅
*   **Role:** The Logistics Manager.
*   **Function:** Checks calendar availability and books appointments at service centers.
*   **Capability:** Matches the specific fault (e.g., "Tire replacement") with the right service slot.

### 6. The Guardian: UEBA Security Agent 🛡️
*   **Role:** The Security Guard.
*   **Function:** Monitors the *behavior* of the vehicle and the other agents.
*   **Logic:** "Why did the temperature jump 40 degrees in 1 second? That's physically impossible. This might be a sensor hack." (Cyber-Physical Attack Detection).

### 7. The Engineer: Manufacturing Insights Agent 🏭
*   **Role:** The Quality Improver.
*   **Function:** Takes field data (failures) and sends feedback to the factory to improve future car designs.
*   **Output:** CAPA (Corrective and Preventive Action) reports.

---

## How They Work Together (The Workflow)

When a "Simulate Overheat" command is triggered, this chain reaction happens instantly:

1.  **Sensing:** The **Telematics System** reports `Engine Temp: 125°C`.
2.  **Orchestration:** The **Master Agent** sees this critical violation.
3.  **Diagnosis:** The **Master Agent** activates the **Diagnosis Agent**, which confirms "Coolant system failure."
4.  **Security Check:** Simultaneously, the **UEBA Agent** analyzes the data spike. It flags it as "Suspicious" because it happened too fast (Potential Attack).
5.  **Action:**
    *   The **Engagement Agent** drafts an urgent warning: "STOP THE VEHICLE."
    *   The **Scheduling Agent** pre-books a priority service slot.
    *   The **Manufacturing Agent** logs a "Radiator Failure" for future quality review.
6.  **Result:** The user sees a Red Alert, a Security Warning, and a Service Appointment all at once.

## Technology Stack
*   **Brain:** Large Language Models (LLM) via Groq (Llama 3.3 70B).
*   **Communication:** JSON-structured prompting ensures agents speak a "computer-readable" language to each other.
*   **Memory:** Supabase database acts as the shared memory where agents read/write logs.
