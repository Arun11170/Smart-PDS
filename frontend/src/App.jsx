import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ScanDispense from './pages/ScanDispense';
import AdminDashboard from './pages/AdminDashboard';
import AddBeneficiary from './pages/AddBeneficiary'; // New Page
import Payment from './pages/Payment';


import VoiceAssistant from './components/VoiceAssistant';
import { VoiceCommandProvider } from './context/VoiceCommandContext';

// Protected Route Logic
const ProtectedRoute = ({ children, isAdmin }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // STRICT SEPARATION LOGIC

  // 1. If trying to access Admin Route...
  if (isAdmin) {
    if (user.role !== 'manager') {
      // Employee trying to access Admin -> Go to Home
      return <Navigate to="/home" replace />;
    }
  }
  // 2. If trying to access Employee Route (Home, Scan, etc.)...
  else {
    if (user.role === 'manager') {
      // Manager trying to access Employee pages -> Go to Admin
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};



function App() {
  return (
    <VoiceCommandProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
                <VoiceAssistant />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <ScanDispense />
                <VoiceAssistant />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
                <VoiceAssistant />
              </ProtectedRoute>
            } />
            <Route path="/add-beneficiary" element={
              <ProtectedRoute>
                <AddBeneficiary />
                <VoiceAssistant />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute isAdmin={true}>
                <AdminDashboard />
                <VoiceAssistant />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </VoiceCommandProvider>
  );
}

export default App;
