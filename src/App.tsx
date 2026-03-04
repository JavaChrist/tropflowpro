import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import useAuth from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TripList from './pages/TripList';
import TeamManagement from './pages/TeamManagement';
import ConsolidatedReports from './pages/ConsolidatedReports';
import CreateTrip from './pages/CreateTrip';
import TripDetail from './pages/TripDetail';
import EditTrip from './pages/EditTrip';
import PaymentSuccess from './pages/PaymentSuccess';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading, userProfile } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <AuthPage />;
  if (!userProfile) return <LoadingSpinner />;

  return (
    <Router>
      <div className="App">
        <Layout>
            <Routes>
              {/* Dashboard - Page d'accueil */}
              <Route path="/" element={<Dashboard />} />

              {/* Routes Pro Entreprise */}
              <Route path="/team" element={<TeamManagement />} />
              <Route path="/reports" element={<ConsolidatedReports />} />

              {/* Routes pour les déplacements */}
              <Route path="/trips" element={<TripList />} />
              <Route path="/trips/new" element={<CreateTrip />} />
              <Route path="/trips/:id" element={<TripDetail />} />
              <Route path="/trips/:id/edit" element={<EditTrip />} />

              {/* Route pour le retour de paiement Mollie */}
              <Route path="/payment/success" element={<PaymentSuccess />} />

              {/* Redirection par défaut vers le dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
