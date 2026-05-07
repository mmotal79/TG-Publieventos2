/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Factory, 
  Wallet, 
  LogOut, 
  Menu,
  X,
  BookOpen,
  Settings,
  CreditCard,
  Scissors,
  Shirt,
  Palette,
  Layers,
  Calculator,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentRole = profile?.role ?? 4;
  const isAdminOrManager = currentRole === 0 || currentRole === 1;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clients', icon: Users },
    { name: 'Presupuestos', path: '/budgets', icon: FileText },
    { name: 'Transacciones', path: '/transactions', icon: CreditCard },
    { name: 'Producción', path: '/production', icon: Factory },
    { name: 'Nómina', path: '/payroll', icon: Wallet },
    { name: 'Seguridad', path: '/security', icon: ShieldAlert },
  ];

  const catalogItems = [
    { name: 'Telas', path: '/catalogs/telas', icon: Layers, show: true },
    { name: 'Modelos', path: '/catalogs/modelos', icon: Shirt, show: true },
    { name: 'Cortes', path: '/catalogs/cortes', icon: Scissors, show: true },
    { name: 'Personalización', path: '/catalogs/personalizacion', icon: Palette, show: true },
    { name: 'Acabados', path: '/catalogs/acabados', icon: BookOpen, show: true },
    { name: 'Fases Producción', path: '/catalogs/fases-produccion', icon: Settings, show: true },
    { name: 'Estructura de Costos', path: '/catalogs/estructura-costos', icon: Calculator, show: isAdminOrManager },
    { name: 'Usuarios', path: '/catalogs/usuarios', icon: Users, show: isAdminOrManager },
    { name: 'Configuración', path: '/catalogs/configuracion', icon: Settings, show: isAdminOrManager },
  ];

  const handleLogout = () => {
    // TODO: Implement Firebase logout
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-xl text-primary">TG-Publieventos</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block">
          <h1 className="font-bold text-2xl text-primary">TG-Publieventos</h1>
          <p className="text-xs text-muted-foreground mt-1">Gestión Textil Integral</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 mt-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {isAdminOrManager && (
            <Accordion type="single" collapsible className="w-full mt-2">
              <AccordionItem value="catalogos" className="border-b-0">
                <AccordionTrigger className="px-3 py-2 text-muted-foreground hover:text-foreground hover:no-underline rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} />
                    <span>Catálogos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <div className="flex flex-col space-y-1 pl-9 pr-2">
                    {catalogItems.filter(item => item.show).map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                          )}
                        >
                          <Icon size={16} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

        <div className="p-4 border-t mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
