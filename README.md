# Language Learning Platform

An intelligent and interactive Language Learning Platform built with React, Vite, and tailwind CSS. It leverages the power of generative AI (Google Gemini / Groq) to provide dynamic content, personalized lessons, and interactive challenges. The project utilizes Firebase for seamless user authentication and data storage.

## Project Idea

The core concept is to provide a gamified, adaptive, and AI-driven environment for learning new languages. Instead of static courses, the platform uses generative AI to tailor lessons, scenarios, and tests to the user's progress. With features like drag-and-drop exercises and leveled progression, users can actively practice language concepts in a modern and interactive UI.

## Features

- **User Authentication**: Secure signup and login using Firebase Auth, with user data and progress persisted in Firestore.
- **Onboarding Flow**: Personalized initial setup to determine the user's target language, current skill level, and goals.
- **AI-Generated Content**: Direct integration with Google Gemini / Groq APIs to dynamically generate lesson explanations, vocabulary items, and interactive test questions based on the user's level.
- **Interactive Exercises**: Engaging learning methods including Drag-and-Drop questions (powered by `@dnd-kit`) to build sentences or match words.
- **Progressive Levels**: A structured `LevelPlayer` allowing users to progress through various difficulty tiers and topics.
- **Dynamic Dashboard & Testing**: A comprehensive dashboard showing progress, and detailed AI-evaluated challenges via the Test Page.
- **Modern UI/UX**: Fully responsive, aesthetic design using Tailwind CSS, complete with loading spinners, toasts, popups, and celebration animations (`react-confetti`).

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Firebase project for authentication and database
- Google Gemini API Key and/or Groq API Key

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd Language
   ```

2. **Install dependencies**:
   Make sure you install the necessary node modules.
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your API keys and Firebase configuration parameters.
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id

   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```
   *(Ensure you match the exact variable names expected by your `src/firebase.js` and `src/gemini.js` files.)*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5173` (or the URL provided in your terminal).

## Tech Stack

- **Frontend**: React (v18), Vite, React Router, Tailwind CSS
- **Backend / BaaS**: Firebase (Auth, Firestore)
- **AI Integration**: Google Generative AI SDK, Groq SDK
- **Utilities**: `@dnd-kit` (Drag and Drop), `axios`, `react-confetti`, `react-use`
