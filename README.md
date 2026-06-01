# HireReady

> **Know before you apply.** Free, open-source job application intelligence and interview preparation tool designed for engineering and MCA freshers in India.

HireReady is a complete, applied AI engineering system that helps students make smarter career decisions. It analyzes job descriptions mathematically against their custom skills context, outlines technical and behavioral gaps, prepares STAR interview answers, tracks progress, and discovers systemic reasons behind application ghostings/rejections.

---

## ⚡ Key Capabilities

*   **Custom Developer Profile Configuration** — Set up your academic background (CGPA, graduation year), target positions, detailed projects summaries, and paste your raw resume text once.
*   **Job Description (JD) Analyser** — Paste any job description to get an honest **A-F fit grade**, weighted match score (0-100), explicit "Should Apply" advice, missing skill priorities, weeks to upskill, and direct red flags.
*   **Tailored STAR Interview Prep** — Generates customized **STAR** (Situation, Task, Action, Result) behavioral questions and fully custom example answers written specifically using your own projects (like MindCare) and skills.
*   **Staged Application Tracker** — Track every company role applied to, view active analytics, change application states (Applied, Assessment, Interview, Offer, Ghosted, Rejected), and read historic AI reports.
*   **AI Rejection Pattern scan** — Gathers and parses your applications context (requires 5+) to reveal recurrent patterns, structural action items, and suggest matching strategy pivots.

---

## 🛠️ Technology Stack

*   **Frontend UI:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.
*   **Typography:** headings loaded in `Clash Display` + paragraphs/body loaded in `DM Sans`.
*   **Aesthetics:** Modern, terminal-inspired dark tech background (`#0A0A0F`), sharp corners (`border-radius: 0px`), electric green primary accents (`#00FF88`), subtle scanline overlays, and custom glows.
*   **Backend Database:** Supabase (Auth, PostgreSQL relational engine, Edge Functions).
*   **Artificial Intelligence:** Google Gemini 2.5 Flash (securely requested strictly via Deno Edge Functions).

---

## 🚀 Quick Setup

### 1. Database and Environment Configuration
Copy the `.env.example` configurations to your local `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema Execution
Apply the initial schema migrations inside your Supabase project's SQL Editor:
```sql
-- Located in supabase/migrations/001_hireready_schema.sql
```

### 3. Deploy Edge Functions & Secrets
Set your Google Gemini API key inside your Supabase project secrets:
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```
Deploy the Edge Functions to Deno:
```bash
supabase functions deploy analyse-jd
supabase functions deploy interview-prep
supabase functions deploy rejection-analyse
```

### 4. Running Locally
Install local package dependencies and launch the Vite development server:
```bash
npm install
npm run dev
```

---

## 👤 Built By
**Bhushan Damisetti** — MCA Graduate 2026, Vignan's Institute of Information Technology.
Stack: Python, FastAPI, React, TypeScript, Node.js, PostgreSQL, Docker, AWS.
