import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { OnboardingProvider } from './hooks/useOnboardingStore';
import { AuthProvider } from './contexts/AuthContext';
import ParticleGrid from './components/ParticleGrid';
import SkeletonLoader from './components/SkeletonLoader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfileComplete = lazy(() => import('./pages/ProfileComplete'));

// Onboarding Pages
const AgePage = lazy(() => import('./pages/onboarding/AgePage'));
const GenderPage = lazy(() => import('./pages/onboarding/GenderPage'));
const HeightPage = lazy(() => import('./pages/onboarding/HeightPage'));
const WeightPage = lazy(() => import('./pages/onboarding/WeightPage'));
const HealthPage = lazy(() => import('./pages/onboarding/HealthPage'));
const AllergiesPage = lazy(() => import('./pages/onboarding/AllergiesPage'));
const GoalsPage = lazy(() => import('./pages/onboarding/GoalsPage'));
const ActivityPage = lazy(() => import('./pages/onboarding/ActivityPage'));
const DietPage = lazy(() => import('./pages/onboarding/DietPage'));
const AlternativesPage = lazy(() => import('./pages/onboarding/AlternativesPage'));

// Dashboard Pages
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scan = lazy(() => import('./pages/Scan'));
const Chat = lazy(() => import('./pages/Chat'));
const History = lazy(() => import('./pages/History'));
const CompareProducts = lazy(() => import('./pages/CompareProducts'));
const InsightsDashboard = lazy(() => import('./pages/InsightsDashboard'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const pageTransition = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        {...pageTransition}
        style={{ minHeight: '100vh' }}
      >
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><SkeletonLoader /></div>}>
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile-complete" element={<ProfileComplete />} />
            
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/chat/:scanId" element={<Chat />} />
              <Route path="/history" element={<History />} />
              <Route path="/compare" element={<CompareProducts />} />
              <Route path="/insights" element={<InsightsDashboard />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/onboarding/age" element={<AgePage />} />
            <Route path="/onboarding/gender" element={<GenderPage />} />
            <Route path="/onboarding/height" element={<HeightPage />} />
            <Route path="/onboarding/weight" element={<WeightPage />} />
            <Route path="/onboarding/health" element={<HealthPage />} />
            <Route path="/onboarding/allergies" element={<AllergiesPage />} />
            <Route path="/onboarding/goals" element={<GoalsPage />} />
            <Route path="/onboarding/activity" element={<ActivityPage />} />
            <Route path="/onboarding/diet" element={<DietPage />} />
            <Route path="/onboarding/alternatives" element={<AlternativesPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <ParticleGrid />
          <AnimatedRoutes />
          <SpeedInsights />
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
