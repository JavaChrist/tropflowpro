import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TripList from './pages/TripList';
import CreateTrip from './pages/CreateTrip';
import TripDetail from './pages/TripDetail';
import EditTrip from './pages/EditTrip';
import PaymentSuccess from './pages/PaymentSuccess';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, userProfile } = useAuth();

  // Afficher un spinner pendant le chargement de l'authentification
  if (isLoading) {
    return (
      <ThemeProvider>
        <LoadingSpinner />
      </ThemeProvider>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher la page d'authentification
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AuthPage />
      </ThemeProvider>
    );
  }

  // Si l'utilisateur est connecté mais que le profil n'est pas encore chargé
  if (!userProfile) {
    return (
      <ThemeProvider>
        <LoadingSpinner />
      </ThemeProvider>
    );
  }

  // Si l'utilisateur est connecté, afficher l'application principale
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Layout>
            <Routes>
              {/* Dashboard - Page d'accueil */}
              <Route path="/" element={<Dashboard />} />

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
    </ThemeProvider>
  );
}

export default App;
