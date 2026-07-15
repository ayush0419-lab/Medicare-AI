# 🏥 MediCare-AI

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Three.js](https://img.shields.io/badge/three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)

**MediCare-AI** is a premium, secure, and AI-powered clinical portal designed to unify patient data, predictive health analytics, and clinical operations. Built with a futuristic dark-theme interface, it utilizes a 3D interactive core and Google's Gemini AI to offer clinical insights, smart scheduling suggestions, and health risk predictions under a secure, HIPAA-ready framework.

---

## ✨ Features

### 🧠 Google Gemini AI Integration
* **MediChat Assistant:** Role-based conversation patterns. Patients receive friendly health guidance, while doctors receive precise clinical insights and differential diagnosis advice.
* **Predictive Health Risk Scoring:** Analyzes patient conditions and notes to predict risk levels (`Low`, `Moderate`, `High`, or `Critical`) dynamically.
* **AI Clinical Summarizer:** distills raw visit records and medical history into 3 clear, actionable summary bullet points.
* **Smart Appointment Suggesting:** Assesses the patient's described symptoms to automatically recommend the optimal appointment duration (15 to 60 minutes) and format (virtual vs. in-person).

### 🌐 Interactive 3D WebGL Scene
* Built using **React Three Fiber (Three.js)** and **Framer Motion**.
* Features a real-time rotating 3D DNA Double Helix, orbit rings, capsule clusters, and floating holographic panels representing telemetry data.
* Dynamic response to mouse movements (pointer tracking) and responsive theme adjustments based on user roles (`doctor`, `patient`, `admin`, etc.).

### 🔒 Military-Grade Security & Vault
* Powered by **Supabase PostgreSQL** with comprehensive **Row-Level Security (RLS)**.
* Strict clinical access control: Patients can only view their own files, while Doctors and Admins can view designated patient cohorts.
* Database triggers for real-time notifications on updates or status changes.

### 💼 Clinical Dashboard
* **Patient Management:** Full electronic health record (EHR) entry, condition tags, and medical history trackers.
* **Appointment Manager:** Create, update, and organize appointments with smart AI duration recommendations.
* **Real-time Metrics:** High-level metrics showing Total Patients, High-Risk cases, and today's schedule at a glance.
* **Settings Portal:** Access profile updates, notification preferences, security logs, and light/dark theme switches.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, Vite, Tailwind CSS, React Router DOM v7
* **Database & Auth:** Supabase (PostgreSQL, Auth, Storage, RLS)
* **3D Visuals:** Three.js, React Three Fiber, React Three Drei
* **Artificial Intelligence:** `@google/generative-ai` (Gemini 1.5 Flash)
* **Animations:** Framer Motion
* **Testing:** Vitest, React Testing Library, jsdom
* **Email OTP Verification:** Resend API integration (optional)

---

## 📂 Project Structure

```text
├── supabase/                   # Supabase database config & SQL migrations
│   └── migrations/             # DB schema, storage, RLS & triggers
├── src/
│   ├── assets/                 # Static assets & logos
│   ├── components/
│   │   ├── ai/                 # MediChat AI component
│   │   ├── auth/               # Protected route validation
│   │   ├── three/              # WebGL 3D Medical Scene & Helix
│   │   └── ui/                 # Reusable UI component libraries
│   ├── context/                # Theme and Auth context providers
│   ├── hooks/                  # Custom React hooks (patients, appointments, etc.)
│   ├── layouts/                # Dashboard sidebar and structure
│   ├── lib/                    # Gemini AI client & Supabase client initialization
│   ├── pages/
│   │   ├── dashboard/          # Dashboard (Overview, Patients, Appointments, Settings)
│   │   ├── Landing.jsx         # Premium landing home page
│   │   └── Login.jsx / Signup  # Authentication entry pages
│   ├── routes/                 # Client-side routing logic
│   ├── index.css               # Styling & Tailwind core setup
│   └── App.jsx                 # Entry mounting file
├── .env.example                # Template configuration for environment variables
├── vite.config.js              # Vite configuration
└── package.json                # Project dependencies and script declarations
```

---

## 🚀 Getting Started

### 📋 Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* A [Supabase](https://supabase.com/) account & project
* A [Google Gemini API Key](https://aistudio.google.com/)

### 🔧 Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shivshukla2006/Medicare-AI.git
   cd Medicare-AI
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the keys from your Supabase project and Gemini console (refer to `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
   Fill in the variables:
   * `VITE_SUPABASE_URL`: Your Supabase API URL.
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   * `VITE_GEMINI_API_KEY`: Your Google Gemini API Key.
   * `RESEND_API_KEY`: (Optional) Key for sending verification emails.
   * `SITE_URL`: Redirect URL (defaults to `http://localhost:5173`).

4. **Initialize Supabase Database:**
   Apply the SQL migrations located in `supabase/migrations/` sequentially using the Supabase SQL Editor or CLI to set up schemas, triggers, storage, and RLS policies.

5. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

To run automated unit and component tests:
```bash
npm run test
```

---

## 📄 License
This project is licensed under the MIT License.
