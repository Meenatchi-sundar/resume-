# ✦ ResumeInsight – AI-Powered Resume Analyzer

A full-stack web application that analyzes resumes for ATS compatibility, keyword optimization, skills gaps, and provides AI-powered improvement suggestions.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Routing | React Router DOM |
| File Upload | react-dropzone |
| Backend | Node.js + Express |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| File Handling | multer |

---

## 📁 Project Structure

```
resume analyzer/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Hero, upload section, features
│   │   │   ├── AnalysisPage.jsx     # Full ATS report with tabs
│   │   │   └── SampleReport.jsx    # Demo report page
│   │   ├── components/
│   │   │   ├── ScoreRing.jsx        # Animated circular score
│   │   │   ├── ScoreBar.jsx         # Horizontal progress bar
│   │   │   ├── KeywordChips.jsx     # Keyword pill chips
│   │   │   └── SuggestionCard.jsx   # Expandable suggestion cards
│   │   ├── data/
│   │   │   └── sampleData.js        # Demo report data
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Global styles + design system
│   ├── index.html
│   └── vite.config.js
│
├── backend/                  # Node.js + Express backend
│   ├── server.js             # API server
│   ├── analyzer.js           # NLP analysis engine
│   └── package.json
│
└── package.json              # Root convenience scripts
```

---

## ⚡ Running the App

### 1. Start the Backend (Terminal 1)
```bash
cd backend
node server.js
# or for auto-reload:
node --watch server.js
```
Backend runs at: **http://localhost:5000**

### 2. Start the Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## 📡 API Endpoints

### `POST /api/analyze`
Analyze a resume file.

**Request** (multipart/form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | File | ✅ | PDF or DOCX file |
| `jobTitle` | string | ❌ | Target job title |
| `jobDescription` | string | ❌ | Job description for tailored scoring |

**Response** (JSON):
```json
{
  "overallScore": 78,
  "atsScore": 82,
  "keywordScore": 74,
  "skillsScore": 85,
  "experienceScore": 76,
  "educationScore": 90,
  "formatScore": 88,
  "candidateName": "John Doe",
  "email": "john@example.com",
  "matchedKeywords": ["React", "Node.js"],
  "missingKeywords": ["AWS", "Kubernetes"],
  "skills": [{ "name": "React.js", "type": "technical" }],
  "strengths": ["Strong technical profile"],
  "weaknesses": ["Missing cloud skills"],
  "suggestions": [{
    "icon": "☁️",
    "title": "Add Cloud Skills",
    "description": "...",
    "priority": "high",
    "example": "..."
  }],
  "jobRoleMatches": [{
    "title": "Full Stack Developer",
    "match": 82,
    "missingFor": ["AWS"]
  }]
}
```

### `GET /api/health`
Health check endpoint.

---

## 🎨 Features

### Landing Page
- 🌟 Animated hero section with ATS score stats
- 📂 Drag-and-drop file upload (PDF/DOCX)
- 🎯 Optional job description for tailored scoring
- 📖 Features grid, How-It-Works steps
- Glassmorphism dark theme UI

### Analysis Report (6 Tabs)
1. **Overview** – Score breakdown bars, strengths/weaknesses, candidate profile, red flags
2. **Keywords** – Matched vs missing ATS keywords, power words
3. **Skills** – Technical skills, soft skills, skills gap analysis
4. **Experience** – Parsed work experience and education timeline
5. **Suggestions** – AI-powered actionable improvements with examples (expandable cards)
6. **Job Match** – Role compatibility scores across 8 job categories

---

## 🧠 Analysis Engine

The NLP analyzer (`backend/analyzer.js`) performs:
- **Text extraction** from PDF (pdf-parse) and DOCX (mammoth)
- **Named entity extraction** – name, email, phone, location, LinkedIn
- **Skill detection** – 80+ technical skills matched against database
- **Keyword matching** – 30+ ATS-critical keywords scored
- **Multi-dimensional scoring** – ATS, Keywords, Skills, Experience, Education, Format
- **Job role matching** – 8 role profiles with match percentage
- **Suggestion generation** – Context-aware improvement tips with examples
