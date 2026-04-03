# langTutor - Intelligent Language Learning Platform 🌍🤖

**📺 [Watch Video Presentation on Google Drive](https://drive.google.com/file/d/19SPsIoFinO-cW2GDMbHl4chFUKhpdDzk/view?usp=sharing)**

Welcome to **langTutor**, an interactive, AI-driven language learning platform! Built with modern web technologies, this platform gamifies the learning experience and adapts to users in real time. We leverage generative AI (Groq) along with Firebase to deliver a personalized, resilient, and engaging experience.

---

## 💡 Project Idea

Our core concept is to revolutionize the way people learn new languages by creating a **gamified, adaptive, and AI-driven environment**. Instead of relying on static courses and repetitive modules, langTutor uses cutting-edge generative AI to tailor lessons, conversational scenarios, and tests directly to the user's progress and skill level. The platform is exclusively focused on 5 languages: **Hindi, Telugu, Kannada, Tamil, and English**.

With engaging features like drag-and-drop mechanics, a visually stunning roadmap, and dynamic level progressions, users can actively interact with language concepts in a modern and highly responsive user interface.

---

## ✨ Features

- **Personalized Onboarding Flow:** Customizes the initial setup to determine your target language, current skill level, and specific goals.
- **AI-Generated Dynamic Content:** Direct integration with the **Groq API** to generate context-aware lesson explanations, vocabulary items, and interactive test questions natively.
- **Auto-Fallback Mechanism:** Intelligent rate-limit handling that automatically falls back to secondary AI models if the primary one is busy, ensuring zero interruptions for the user.
- **Interactive Exercises:** Engaging and fun learning methods, including Drag-and-Drop functionality powered by `@dnd-kit` to match words or build sentences correctly.
- **Gamified Roadmap & Progression:** A comprehensive, scrolling `LevelPlayer` allowing users to progress smoothly through various difficulty tiers along an animated path.
- **Dynamic Tests & Dashboard:** A dedicated dashboard for tracking progress, complete with detailed AI-evaluated challenges and personalized feedback via the Test Page.
- **Modern UI/UX:** A robust and scalable glassmorphism design aesthetic built with Tailwind CSS. Includes slick loading states, real-time toasts, dynamic popups, and celebration animations using `react-confetti`.
- **Secure User Authentication:** Encrypted and seamless signups and logins via Firebase Authentication, with user progress efficiently synced into Firestore databases.

---

## 🛠️ Setup Instructions

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following installed on your machine:
- **Node.js** (v18 or higher is recommended)
- **npm** (Node package manager, which comes with Node.js)
- A **Firebase** project setup for Authentication and Firestore.
- A **Groq API Key**.

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/thokasanjayteja014-star/TeamDynamos04.git
   cd Language
   ```

2. **Install all NPM dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a new file named `.env` in the root of the project directory (alongside `package.json`). Populate it with your API keys and Firebase config variables:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_GROQ_API_KEY=your_groq_api_key
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

5. **Open your application:**
   The terminal will provide a local link. By default, navigate to [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 💻 Tech Stack

- **Frontend Core:** React (v18), React Router
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (with utility algorithms)
- **Backend/Backend-as-a-Service:** Firebase Authentication, Cloud Firestore
- **AI Integration:** Groq SDK
- **Utilities:** `@dnd-kit/core` (Drag and Drop), `axios`, `react-confetti`, `lucide-react` (Icons)

---

## 👥 Team Details

**Team Name:** Team Dynamos

**Group Members:**
- **Thoka Sanjay Teja** (24BDS083)
- **G Dharmik** (24BDS021)
- **G Banu Vardhan Reddy** (24BDS022)
- **Mudavath Santhosh** (24BDS044)
