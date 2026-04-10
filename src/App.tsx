/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Payroll from './pages/Payroll';
import Clients from './pages/Clients';
import Production from './pages/Production';
import Login from './pages/Login';
import Transactions from './pages/Transactions';
import TelasCatalog from './pages/catalogs/TelasCatalog';
import UsuariosCatalog from './pages/catalogs/UsuariosCatalog';
import ModelosCatalog from './pages/catalogs/ModelosCatalog';
import CortesCatalog from './pages/catalogs/CortesCatalog';
import AcabadosCatalog from './pages/catalogs/AcabadosCatalog';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/production" element={<Production />} />
          <Route path="/payroll" element={<Payroll />} />
          
          {/* Catalogs */}
          <Route path="/catalogs/telas" element={<TelasCatalog />} />
          <Route path="/catalogs/modelos" element={<ModelosCatalog />} />
          <Route path="/catalogs/cortes" element={<CortesCatalog />} />
          <Route path="/catalogs/personalizacion" element={<div>Catálogo de Personalización (Próximamente)</div>} />
          <Route path="/catalogs/acabados" element={<AcabadosCatalog />} />
          <Route path="/catalogs/usuarios" element={<UsuariosCatalog />} />
          <Route path="/catalogs/configuracion" element={<div>Configuración Global (Próximamente)</div>} />
          
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
