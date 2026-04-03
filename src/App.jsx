import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Component Imports
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';
import BasicsPage from './components/BasicsPage';
import Dashboard from './components/Dashboard';
import TestPage from './components/TestPage';
import LevelPlayer from './components/LevelPlayer';
import QuestPage from './components/QuestPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if user has completed onboarding (exists in Firestore)
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setHasOnboarded(true);
        } else {
          setHasOnboarded(false);
        }
      } else {
        setUser(null);
        setHasOnboarded(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f1a]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            !user ? <AuthPage /> : (hasOnboarded ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />)
          }
        />
        <Route
          path="/login"
          element={!user ? <AuthPage /> : <Navigate to="/" />}
        />
        <Route
          path="/onboarding"
          element={user && !hasOnboarded ? <Onboarding setHasOnboarded={setHasOnboarded} /> : <Navigate to="/" />}
        />
        <Route
          path="/basics"
          element={user && hasOnboarded ? <BasicsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/dashboard"
          element={user && hasOnboarded ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/test"
          element={user && hasOnboarded ? <TestPage /> : <Navigate to="/" />}
        />
        <Route
          path="/level/:levelId"
          element={user && hasOnboarded ? <LevelPlayer /> : <Navigate to="/" />}
        />
        <Route
          path="/quest/:questId"
          element={user && hasOnboarded ? <QuestPage /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
