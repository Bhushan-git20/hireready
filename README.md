# Placement Prospect AI 🎓📈

An intelligent, AI-powered platform designed to revolutionize the way students prepare for their careers, while giving universities and recruiters deep, predictive insights into candidate readiness and market demands.

---

## 🚀 Vision & Key Highlights

- **Predictive Job Fit Scoring**: Uses AI to analyze a student's profile and predict their success probability for specific roles.
- **Real-Time Market Intelligence**: Leverages Gemini AI to scan and predict current and future industry demands, helping students stay ahead of the curve.
- **Smart Resume Parsing**: Automatically extracts skills, experience, and educational background from PDF resume uploads using advanced AI Named Entity Recognition (NER).
- **Personalized AI Career Coach**: Features an interactive, streaming AI chatbot that provides tailored career guidance, interview tips, and pathway recommendations.

---

## ✨ Comprehensive Feature Suite

### 📊 Placement Readiness Tracking
- Multi-dimensional scoring matrix evaluating academics, technical skills, and soft skills.
- Collaborative career recommendations based on historical peer success data.

### 🧠 Intelligence Layer
- **Gemini 1.5 Flash**: Native integration for lightning-fast inference on job fit analysis and market trend predictions.
- **Supabase Edge Functions**: Serverless runtime executing the AI logic securely via Deno.

### 💻 Modern Frontend Experience
- Built with React 18 and Vite for exceptional performance.
- Styled using Tailwind CSS and shadcn/ui for a highly polished, accessible user interface.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React + TypeScript + Vite |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Storage) |
| **Serverless Compute** | Supabase Edge Functions (Deno) |
| **AI Integration** | Google Gemini 1.5 Flash |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase CLI installed
- Google Gemini API Key

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Bhushan-git20/placement-prospect-ai.git
cd placement-prospect-ai
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Supabase & AI
Set up your Gemini API key in the Supabase secrets manager so the Edge Functions can access it securely:
```bash
supabase secrets set GEMINI_API_KEY=your_actual_key_here
```

Deploy the serverless Edge Functions:
```bash
supabase functions deploy
```

### 4️⃣ Start Local Development
```bash
npm run dev
```
Open your browser to `http://localhost:8080`.

---

## 📜 License
Educational and personal use. © 2026 Bhushan Damisetti.
