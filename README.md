# GreenRoute AI 🌿

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

GreenRoute AI is a world-class ClimateTech platform that uses AI and Machine Learning to optimize route plans, slash vehicle carbon footprints, and gamify sustainable commuting. The platform includes a dynamic, premium web dashboard packed with animations, interactive maps, forecast models, explainable AI chains, and personalized advice powered by Google Gemini.

---

## 🚀 Key Features

*   **Premium Interactive Route Planner**: Display real road paths on leaf-based map (Leaflet) centered with bounds fitting. Features custom geocoding via Nominatim, vehicle models moving along paths, and 3 distinct route options (Fastest, Shortest, and Greenest).
*   **AI Sustainability Assistant**: High-fidelity advice cards powered by **Gemini 1.5 Flash** providing structured, actionable route summaries, sustainability stats, and eco tips.
*   **Carbon Emission Engine**: Detailed calculations across 6 vehicle types (Petrol/Diesel cars, motorcycles, buses, trucks, and EVs) with tree absorption equivalents.
*   **EcoScore Gauge (0–100)**: Evaluates routes based on distance, predicted congestion, fuel burn, and idle timings.
*   **Traffic & Savings Forecasting**: Standalone MLP time-series models predicting traffic intensities and emission levels from 1 hour to 90 days.
*   **Mobility Digital Twin**: Compare current fleet routing policies (Scenario A) against optimized path selections (Scenario B) over 7/30/90 days.
*   **Explainable AI (XAI)**: Understand AI decisions through feature importance charts, visual confidence intervals, and step-by-step reasoning chains.
*   **Gamified Milestones**: Track progress across 16 sustainability achievements with XP levels and a community leaderboard.
*   **PDF PDF generator**: Create downloadable, publication-grade trip analysis reports.

---

## 🛠️ Technology Stack

### Frontend
*   **Core**: React (Vite build system)
*   **Styling**: Tailwind CSS & Glassmorphism Custom UI
*   **Animations**: Framer Motion & CSS Keyframe Effects
*   **Charts**: Recharts (Area, Line, Bar, Radar, Pie charts)
*   **Maps**: Leaflet & React-Leaflet (Carto Positron Tiles)
*   **State Management**: Zustand (local persistent session tracking)

### Backend
*   **Framework**: FastAPI (Python 3.10+)
*   **ORM / Database**: SQLAlchemy / SQLite
*   **ML Engine**: Scikit-Learn (Random Forest & MLP Regressor models)
*   **Generative AI**: Google Generative AI (`google-generativeai` SDK)
*   **PDF Generation**: ReportLab Graphics
*   **Auth**: JWT (python-jose, passlib bcrypt hashes)

---

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)

### Setup Instructions

#### 1. Setup Backend
1. Navigate to the backend directory:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3. Set up environment variables by copying `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
    *Add your `GEMINI_API_KEY` to enable Gemini AI Route Advisor suggestions. (The system runs on intelligent static fallbacks if the key is empty).*
4. Train the ML models (Random Forest Classifier & MLP Forecaster):
    ```bash
    python train_models.py
    ```
5. Run the FastAPI development server:
    ```bash
    uvicorn main:app --reload
    ```
    *The API will be available at [http://localhost:8000](http://localhost:8000) and Swagger Docs at [http://localhost:8000/docs](http://localhost:8000/docs).*

#### 2. Setup Frontend
1. Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2. Install npm packages:
    ```bash
    npm install
    ```
3. Launch the Vite development server:
    ```bash
    npm run dev
    ```
    *The web application will open at [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Demo Account
A default demo profile is seeded in the database automatically during startup:
*   **Email**: `demo@greenroute.ai`
*   **Password**: `demo123`

Use these credentials on the Auth card to skip registration and access the full-featured dashboard.

---

## 📁 File Structure

```
GreenRoute AI/
├── backend/
│   ├── main.py                     # App lifespan entry, CORS, mounted routers
│   ├── database.py                 # SQLite engine & SessionLocal dependencies
│   ├── requirements.txt
│   ├── train_models.py             # Synthetic data generators & ML training script
│   ├── ml_models/                  # Serialized joblib weights & Scalers
│   ├── models/                     # SQLAlchemy Models (User, Trip, Fleet, Achievements)
│   ├── routers/                    # API Routers (Auth, Routes, Analytics, AI, Reports)
│   └── services/                   # Service Layer (Gemini, OSRM Route Engine, PDF)
│
└── frontend/
    ├── package.json, vite.config.js, tailwind.config.js, index.html
    └── src/
        ├── App.jsx                 # Routes & protected layouts wrapper
        ├── index.css               # Base styles & glassmorphism configurations
        ├── store/useStore.js       # Zustand authentication & profile store
        ├── components/             # Reusable UI elements (Map, Gauge, Achievements)
        └── pages/                  # Route pages (Landing, RoutePlanner, Dashboards)
```
