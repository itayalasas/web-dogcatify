import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentFailure from './components/PaymentFailure';
import PaymentPending from './components/PaymentPending';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/terminos" element={<TermsOfService />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pago-exitoso" element={<PaymentSuccess />} />
          <Route path="/pago-fallido" element={<PaymentFailure />} />
          <Route path="/pago-pendiente" element={<PaymentPending />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;