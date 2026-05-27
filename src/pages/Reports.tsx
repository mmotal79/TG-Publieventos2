/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  X, 
  FileText, 
  Lock, 
  TrendingUp,
  Image as ImageIcon 
} from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';
import { toPng } from 'html-to-image';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ReportBudget {
  _id: string;
  clientId?: {
    _id: string;
    razonSocial: string;
    nombre?: string;
    apellido?: string;
    rif?: string;
    cedula?: string;
    contacto?: string;
    personaContacto?: string;
  };
  description: string;
  totalCost: number;
  montoAbonado: number;
  creatorName?: string;
  creatorEmail: string;
  creatorRole: number;
  status: string;
  fecha: string;
  createdAt: string;
  updatedAt: string;
  payments?: Array<{
    amount: number;
    amountUSD: number;
    date: string;
  }>;
}

const Reports: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // States
  const [budgets, setBudgets] = useState<ReportBudget[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting state: default is original production order, but user can click to sort
  const [sortColumn, setSortColumn] = useState<string>('fechaProduccion');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modal visibility
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  
  const printPreviewRef = useRef<HTMLDivElement>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // 1. Role Verification
  const currentRole = profile?.role ?? 4;
  const isAuthorized = currentRole <= 2; // Role 0, 1, 2 have reports access

  // Fetch Budgets, System Config & Registered Users
  useEffect(() => {
    if (profile && isAuthorized) {
      fetchBudgets();
      fetchConfig();
      fetchUsers();
    }
  }, [profile, isAuthorized]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error("Error cargando usuarios registrados:", e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSystemConfig(data[0]);
        else setSystemConfig(data);
      }
    } catch (e) {
      console.error("Error cargando configuración del sistema:", e);
    }
  };

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const userEmail = profile?.email;
      const emailQuery = userEmail ? `?creatorEmail=${encodeURIComponent(userEmail)}&role=${profile?.role}` : '';
      const res = await fetch(`/api/budgets${emailQuery}`);
      if (res.ok) {
        const data = await res.json();
        
        // Allowed statuses representing approved budgets that have entered or passed production
        const approvedProductionStatuses = [
          'aceptado_con_abono',
          'en_proceso',
          'in_production',
          'en_produccion',
          'en_producción',
          'culminado',
          'completado',
          'completed',
          'entregado_y_pagado',
          'delivered',
          'approved'
        ];

        // Filter out budgets that are not approved, have not entered production, or are in pending/void states
        const productionBudgets = data.filter((b: any) => {
          if (!b.status) return false;
          const statusLower = b.status.toLowerCase().trim();
          return approvedProductionStatuses.includes(statusLower);
        });
        
        setBudgets(productionBudgets);
      } else {
        toast({
          title: 'Error de Red',
          description: 'No se pudieron cargar los datos de presupuestos para el reporte.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error("Error de petición:", e);
      toast({
        title: 'Error de Conexión',
        description: 'Error al conectar dinámicamente con el servidor de informes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to extract first payment date / production timestamp
  const getProductionDate = (b: ReportBudget): Date => {
    if (b.payments && b.payments.length > 0) {
      const sorted = [...b.payments].sort(
        (p1, p2) => new Date(p1.date).getTime() - new Date(p2.date).getTime()
      );
      return new Date(sorted[0].date);
    }
    return new Date(b.updatedAt || b.createdAt || b.fecha);
  };

  const getStatusLabelAndStyles = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'aceptado_con_abono': 
      case 'approved':
        return { label: 'Aceptado con Abono', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'en_proceso': 
      case 'in_production':
      case 'en_produccion':
      case 'en_producción':
        return { label: 'En Producción', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'culminado': 
      case 'completado':
      case 'completed':
        return { label: 'Completado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'entregado_y_pagado': 
      case 'delivered':
        return { label: 'Entregado y Pagado', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
      default: 
        const formatted = status.toUpperCase().replace('_', ' ');
        return { label: formatted, classes: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const formatEmisor = (b: ReportBudget) => {
    const emailLower = (b.creatorEmail || '').toLowerCase().trim();
    if (emailLower) {
      const foundUser = usersList.find(u => (u.email || '').toLowerCase().trim() === emailLower);
      if (foundUser && foundUser.nombre) {
        return foundUser.nombre;
      }
    }
    return b.creatorName && !b.creatorName.includes('@') 
      ? b.creatorName 
      : (b.creatorEmail ? b.creatorEmail.split('@')[0].split('.').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Asesor de Ventas');
  };

  const formatVendedor = formatEmisor;

  const handleSearchSubmit = () => {
    setSearchTerm(localSearchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
  };

  // 2. Filter Logic (React Hot Filtering)
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      if (!b) return false;

      // Date Range Filter logic
      const prodDate = getProductionDate(b);
      prodDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (prodDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (prodDate > end) return false;
      }

      // Search Search filter (Multi-Criteria / Case-Insensitive / Crash-Proof)
      if (searchTerm.trim() !== '') {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;

        const budgetIdStr = (b._id || '').toString();
        const numPresupuesto = `pres-${budgetIdStr.slice(-6)}`.toLowerCase();
        const numPedido = `op-${budgetIdStr.slice(-6)}`.toLowerCase();
        const rawId = budgetIdStr.toLowerCase();

        const clientName = (b.clientId?.razonSocial || b.clientId?.nombre || '').toLowerCase();
        const clientLastName = (b.clientId?.apellido || '').toLowerCase();
        const clientTaxId = (b.clientId?.rif || b.clientId?.cedula || b.clientId?.contacto || '').toLowerCase();

        const desc = (b.description || '').toLowerCase();
        const emisorName = (formatEmisor(b) || '').toLowerCase();
        const vEmail = (b.creatorEmail || '').toLowerCase();
        
        // Estatus format matches the label shown in the rows (e.g. "Al taller de costura", "Completo", "En Producción", etc.)
        const statusInfo = getStatusLabelAndStyles(b.status || '');
        const statusLabelText = (statusInfo?.label || '').toLowerCase();

        // Formatted production date for search matches (e.g., "12/05/2026")
        const prodDateString = prodDate.toLocaleDateString('es-VE', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }).toLowerCase();

        // Currency values matching displayed text (e.g., "$150.00" or simple numbers)
        const totalVal = (b.totalCost || 0).toString();
        const totalValFixed = (b.totalCost || 0).toFixed(2);
        const paidVal = (b.montoAbonado || 0).toString();
        const paidValFixed = (b.montoAbonado || 0).toFixed(2);
        const pendingVal = ((b.totalCost || 0) - (b.montoAbonado || 0)).toString();
        const pendingValFixed = ((b.totalCost || 0) - (b.montoAbonado || 0)).toFixed(2);

        const matchesSearch = 
          numPresupuesto.includes(search) ||
          numPedido.includes(search) ||
          rawId.includes(search) ||
          clientName.includes(search) ||
          clientLastName.includes(search) ||
          clientTaxId.includes(search) ||
          desc.includes(search) ||
          emisorName.includes(search) ||
          vEmail.includes(search) ||
          statusLabelText.includes(search) ||
          prodDateString.includes(search) ||
          totalVal.includes(search) ||
          totalValFixed.includes(search) ||
          paidVal.includes(search) ||
          paidValFixed.includes(search) ||
          pendingVal.includes(search) ||
          pendingValFixed.includes(search);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [budgets, searchTerm, startDate, endDate, usersList]);

  // 3. Sorting Logic
  const sortedAndFilteredBudgets = useMemo(() => {
    const sorted = [...filteredBudgets];
    
    sorted.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortColumn) {
        case 'noPresupuesto':
          valA = a._id?.toString().slice(-6).toUpperCase() || '';
          valB = b._id?.toString().slice(-6).toUpperCase() || '';
          break;
        case 'noPedido':
          valA = a._id?.toString().slice(-6).toUpperCase() || '';
          valB = b._id?.toString().slice(-6).toUpperCase() || '';
          break;
        case 'fechaProduccion':
          valA = getProductionDate(a).getTime();
          valB = getProductionDate(b).getTime();
          break;
        case 'cliente':
          valA = (a.clientId?.razonSocial || a.clientId?.nombre || '').toLowerCase();
          valB = (b.clientId?.razonSocial || b.clientId?.nombre || '').toLowerCase();
          break;
        case 'montoPresupuesto':
          valA = a.totalCost || 0;
          valB = b.totalCost || 0;
          break;
        case 'totalAbonado':
          valA = a.montoAbonado || 0;
          valB = b.montoAbonado || 0;
          break;
        case 'pendientePago':
          valA = (a.totalCost || 0) - (a.montoAbonado || 0);
          valB = (b.totalCost || 0) - (b.montoAbonado || 0);
          break;
        case 'vendedor':
          valA = formatEmisor(a).toLowerCase();
          valB = formatEmisor(b).toLowerCase();
          break;
        case 'estatus':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          valA = getProductionDate(a).getTime();
          valB = getProductionDate(b).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredBudgets, sortColumn, sortDirection, usersList]);

  // 4. Dynamic Totals
  const totals = useMemo(() => {
    return sortedAndFilteredBudgets.reduce(
      (acc, curr) => {
        const cost = curr.totalCost || 0;
        const paid = curr.montoAbonado || 0;
        const pending = cost - paid;
        return {
          totalCost: acc.totalCost + cost,
          montoAbonado: acc.montoAbonado + paid,
          pendientePago: acc.pendientePago + pending,
        };
      },
      { totalCost: 0, montoAbonado: 0, pendientePago: 0 }
    );
  }, [sortedAndFilteredBudgets]);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Native Print API Configuration (A4/Letter friendly layout)
  const handleNativePrint = () => {
    const printContent = printPreviewRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Bloqueador de ventanas activado',
        description: 'Por favor, habilite las ventanas emergentes para ver el archivo de impresión.',
        variant: 'destructive'
      });
      return;
    }

    // Capture CSS styles to inject in printing container
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    const rawLogo = systemConfig?.logoBase64 || '';
    const name = systemConfig?.nombreComercial || 'TG-Publieventos';
    const email = systemConfig?.emailCorporativo || 'info@tg-publieventos.com';
    const phone = systemConfig?.telefonoCorporativo || '+58 412-1234567';

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte_de_Produccion_${name.replace(/\s+/g, '_')}</title>
          ${styles}
          <style>
            @page {
              size: Letter landscape;
              margin: 1cm;
            }
            body { 
              margin: 0; 
              padding: 0;
              background: white;
              color: #0f172a;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .print-table th {
              background-color: #0fa5e9; /* Light theme header or solid color to be premium */
              background-color: #18181b !important; /* Zinc-900 background matching header */
              color: white !important;
              font-size: 8.5px;
              font-weight: bold;
              padding: 6px 8px;
              text-align: left;
              border: 1px solid #e2e8f0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-table td {
              font-size: 8px;
              padding: 5px 8px;
              border: 1px solid #e2e8f0;
            }
            .print-exact-color {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              .no-print { display: none !important; }
              body { background: white; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div style="width: 100%; max-width: 1120px; margin: 0 auto; background: white; box-sizing: border-box;">
            
            <!-- Document Header (similar to budget) -->
            <div style="position: relative; height: 112px; background-color: #18181b; overflow: hidden; display: flex; align-items: center; border-bottom: 6px solid #e11d48; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; margin-bottom: 24px; border-radius: 4px;">
              <!-- Diagonal red skew -->
              <div style="position: absolute; top: 0; right: 0; width: 75%; height: 100%; background-color: #e11d48; transform: skewX(-25deg) translateX(128px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); z-index: 1; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
              
              <!-- Header content -->
              <div style="position: relative; z-index: 10; width: 100%; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                <!-- Logo and Commercial Name -->
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="height: 64px; width: 64px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box;">
                    ${rawLogo ? `<img src="${rawLogo}" style="height: 100%; width: 100%; object-fit: contain; padding: 4px;" />` : `<span style="color: #e11d48; font-weight: 900; font-size: 28px; font-style: italic; font-family: sans-serif;">G</span>`}
                  </div>
                  <div style="color: white; text-align: left;">
                    <h1 style="font-size: 28px; font-weight: 900; font-style: italic; letter-spacing: -0.05em; line-height: 1; margin: 0 0 4px 0; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); font-family: sans-serif;">${name}</h1>
                    <p style="font-size: 9px; font-weight: 500; letter-spacing: 0.2em; opacity: 0.9; text-transform: uppercase; font-style: italic; margin: 0; font-family: sans-serif;">MÁS FÁCIL ES HACERLO BIEN</p>
                  </div>
                </div>
                
                <!-- Metadata / Badge on Right -->
                <div style="color: white; text-align: right;">
                  <div style="background: rgba(24, 24, 27, 0.45); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center; min-width: 180px; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box;">
                    <p style="font-size: 8px; font-weight: 900; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.25em; margin: 0 0 2px 0; font-style: italic; color: #f4f4f5;">REPORTE DE PRODUCCIÓN</p>
                    <p style="font-size: 16px; font-weight: 900; margin: 0; font-family: sans-serif; color: #ffffff;">${new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    <p style="font-size: 7.5px; font-weight: 700; text-transform: uppercase; opacity: 0.8; margin: 4px 0 0 0; font-style: italic; color: #e4e4e7;">Operador: ${profile?.displayName || profile?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metadata Box -->
            <div style="background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 8px; padding: 12px 18px; margin-bottom: 24px; font-size: 10px; line-height: 1.5; font-family: sans-serif;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div><strong>Rango Seleccionado:</strong> ${startDate || endDate ? `${startDate || 'Inicio'}  al  ${endDate || 'Hoy'}` : 'Histórico Total'}</div>
                <div><strong>Criterio de Búsqueda:</strong> ${searchTerm ? `"${searchTerm}"` : 'Sin filtros de búsqueda'}</div>
                <div><strong>Registros de Producción:</strong> ${sortedAndFilteredBudgets.length} órdenes encontradas</div>
              </div>
            </div>

            <!-- Print Data Table -->
            <table class="print-table">
              <thead>
                <tr>
                  <th>N° PRESUP.</th>
                  <th>N° PEDIDO</th>
                  <th>FECHA PROD.</th>
                  <th>CLIENTE</th>
                  <th style="text-align: right;">MONTO PPTO. (USD)</th>
                  <th style="text-align: right;">TOTAL ABONADO (USD)</th>
                  <th style="text-align: right;">PENDIENTE PAGO (USD)</th>
                  <th>EMISOR</th>
                  <th>ESTATUS</th>
                </tr>
              </thead>
              <tbody>
                ${sortedAndFilteredBudgets.map(b => {
                  const pending = b.totalCost - b.montoAbonado;
                  const statusInfo = getStatusLabelAndStyles(b.status);
                  const prodDateString = getProductionDate(b).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return `
                    <tr style="white-space: nowrap;">
                      <td style="font-family: monospace; font-weight: bold; white-space: nowrap;">PRES-${b._id?.toString().slice(-6).toUpperCase()}</td>
                      <td style="font-family: monospace; font-weight: bold; color: #1e3a8a; white-space: nowrap;">OP-${b._id?.toString().slice(-6).toUpperCase()}</td>
                      <td style="white-space: nowrap;">${prodDateString}</td>
                      <td style="font-weight: 600; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.clientId?.razonSocial || 'Desconocido'}</td>
                      <td style="text-align: right; font-family: monospace; font-weight: bold; white-space: nowrap;">$${(b.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="text-align: right; font-family: monospace; font-weight: bold; color: #059669; white-space: nowrap;">$${(b.montoAbonado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="text-align: right; font-family: monospace; font-weight: bold; color: ${pending > 0.01 ? '#dc2626' : '#059669'}; white-space: nowrap;">$${(pending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formatEmisor(b)}</td>
                      <td style="white-space: nowrap;">
                        <span style="font-size: 7px; font-weight: bold; text-transform: uppercase;">
                          ${statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                <!-- Totals Row -->
                <tr style="background-color: #f8fafc; font-weight: bold; white-space: nowrap;">
                  <td colspan="4" style="text-align: right; font-size: 8.5px; padding: 6px 8px; border: 1px solid #e2e8f0;">TOTAL GENERAL</td>
                  <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: #0f172a; border: 1px solid #e2e8f0;">$${totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: #059669; border: 1px solid #e2e8f0;">$${totals.montoAbonado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: ${totals.pendientePago > 0.01 ? '#dc2626' : '#059669'}; border: 1px solid #e2e8f0;">$${totals.pendientePago.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td colspan="2" style="border: 1px solid #e2e8f0;"></td>
                </tr>
              </tbody>
            </table>

            <!-- Confidential Metadata & Credits -->
            <div style="margin-top: 40px; margin-bottom: 24px; font-family: sans-serif; text-align: center;">
              <p style="margin: 0; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">DOCUMENTO INTERNO CONFIDENCIAL - REGISTRO DE CONTROL DE GESTIÓN PRODUCTIVA - ${name.toUpperCase()}</p>
              <p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8; font-weight: 500;">Tecnología desarrollada para el control seguro de operaciones textiles. Teléfono: ${phone} | Correo: ${email}</p>
              <p style="margin: 4px 0 0 0; font-size: 8px; color: #cbd5e1; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase;">DOCUMENTO NO VÁLIDO COMO FACTURA FISCAL</p>
            </div>

            <!-- Footer (similar to budget) -->
            <div style="background-color: #e11d48; height: 40px; width: 100%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 -5px 10px rgba(225, 29, 72, 0.2); -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; border-radius: 4px;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background-color: rgba(255,255,255,0.2); -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
              <p style="color: white; font-weight: 900; font-size: 11px; letter-spacing: 0.6em; text-transform: uppercase; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); z-index: 10; font-style: italic; font-family: sans-serif; text-align: center; padding-left: 0.6em;">
                @${name.replace(/\s+/g, '').toUpperCase()}
              </p>
              <div style="position: absolute; bottom: -32px; right: -32px; width: 96px; height: 96px; background-color: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(15px); -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
            </div>

          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export as Image using toPng (html-to-image)
  const handleDownloadAsImage = async () => {
    if (!printPreviewRef.current) return;
    setIsExportingImage(true);
    try {
      const dataUrl = await toPng(printPreviewRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          transform: 'none',
          boxShadow: 'none',
          margin: '0',
          padding: '24px'
        }
      });
      const link = document.createElement('a');
      link.download = `Reporte_Produccion_TG_Publieventos_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast({
        title: 'Reporte de Imagen Descargado',
        description: 'La hoja de reporte ha sido convertida e indexada como PNG de alta resolución.',
      });
    } catch (err) {
      console.error('Error al generar imagen:', err);
      toast({
        title: 'Error de Renderizado',
        description: 'No se pudo generar el formato visual del archivo de imagen del reporte.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingImage(false);
    }
  };

  // Loading indicator for authorization check
  if (authLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Authorization Gate (Role <= 2 only)
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border shadow-xl shadow-slate-100 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
          <Lock size={30} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-md">
          Su cuenta cuenta con limitaciones de privilegios (Rol: {currentRole}). La sección de informes analíticos consolidados corporativos de producción se encuentra restringida para personal directivo, gerencial o de ventas autorizado.
        </p>
        <div className="mt-6">
          <Button variant="default" onClick={() => window.location.href = '/'}>
            Regresar al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* 2. Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 md:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-[#0f172a] h-8 w-8 md:h-12 md:w-12" />
            Reportes Analíticos
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
            Registro consolidado de pedidos a taller de costura, estatus financiero, abonos y deudas.
          </p>
        </div>
      </div>

      {/* 3. Section Upper Controls & Search Filters Panel */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden transition-all">
        <CardContent className="p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            
            {/* Search Input Box */}
            <div className="lg:col-span-6 space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 pl-1 select-none">Búsqueda por Clave</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Escriba filtro y presione enter o el botón"
                    value={localSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalSearchTerm(val);
                      if (val.trim() === '') {
                        setSearchTerm('');
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 h-10 border-slate-200 focus-visible:ring-slate-900 hover:border-slate-300 text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 transition-colors"
                  />
                  {localSearchTerm && (
                    <button 
                      onClick={handleClearSearch} 
                      type="button"
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none animate-in fade-in duration-200"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <Button 
                  onClick={handleSearchSubmit}
                  type="button"
                  className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 rounded-xl shrink-0 gap-1.5 transition-all active:scale-95"
                >
                  <Search size={14} />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
              </div>
            </div>

            {/* Date Picker Start */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 pl-1 select-none flex items-center gap-1">
                <Calendar size={10} /> Desde (F. Prod)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 border-slate-200 focus-visible:ring-slate-900 text-xs select-auto text-slate-800 cursor-pointer"
              />
            </div>

            {/* Date Picker End */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 pl-1 select-none flex items-center gap-1">
                <Calendar size={10} /> Hasta (F. Prod)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 border-slate-200 focus-visible:ring-slate-900 text-xs select-auto text-slate-800 cursor-pointer"
              />
            </div>

            {/* Print Trigger Button */}
            <div className="lg:col-span-2">
              <Button 
                onClick={() => setIsPreviewOpen(true)}
                className="w-full h-10 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs gap-2 rounded-xl border border-slate-900 tracking-wide uppercase transition-all shadow-md active:scale-98"
              >
                <Download size={14} /> Descargar Reporte
              </Button>
            </div>
          </div>

          {/* Quick Active Filters Labels */}
          {(searchTerm || startDate || endDate) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-1 select-none">Filtros Activos:</span>
              {searchTerm && (
                <Badge variant="outline" className="text-[10px] py-1 px-2.5 font-semibold bg-stone-50 border-stone-200 text-stone-700 flex items-center gap-1.5">
                  Filtro: "{searchTerm}"
                  <X size={12} className="cursor-pointer hover:text-rose-600 transition-colors" onClick={handleClearSearch} />
                </Badge>
              )}
              {(startDate || endDate) && (
                <Badge variant="outline" className="text-[10px] py-1 px-2.5 font-semibold bg-stone-50 border-stone-200 text-stone-700 flex items-center gap-1.5 animate-fade-in">
                  Rango: {startDate || 'Inicio'} a {endDate || 'Fin'}
                  <X size={12} className="cursor-pointer hover:text-rose-600 transition-colors" onClick={() => { setStartDate(''); setEndDate(''); }} />
                </Badge>
              )}
              <button 
                onClick={() => { handleClearSearch(); setStartDate(''); setEndDate(''); }}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase underline tracking-wider pl-1 ml-auto"
              >
                Limpiar Todo
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Main Responsive Report Table Section */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Indexando base de datos de producción...</p>
            </div>
          ) : sortedAndFilteredBudgets.length === 0 ? (
            <div className="text-center py-20 px-6 text-slate-500 space-y-2">
              <FileText className="h-12 w-12 mx-auto text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800">No se encontraron registros</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No existen pedidos pasados a producción que cumplan con los parámetros de búsqueda o rango de fechas aplicados. Intente ajustar el filtro.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-slate-900/4 border-b">
                  <TableRow className="hover:bg-transparent">
                    
                    {/* Presupuesto */}
                    <TableHead 
                      onClick={() => handleSort('noPresupuesto')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-4 px-5 transition-colors group"
                    >
                      <div className="flex items-center gap-1 bg-transparent hover:text-slate-900 transition-colors">
                        N° Presupuesto
                        {sortColumn === 'noPresupuesto' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800 ml-0.5" /> : <ArrowDown size={12} className="text-slate-800 ml-0.5" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100 text-slate-400 ml-0.5" />
                        )}
                      </div>
                    </TableHead>

                    {/* Pedido */}
                    <TableHead 
                      onClick={() => handleSort('noPedido')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 transition-colors group"
                    >
                      <div className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        N° Pedido
                        {sortColumn === 'noPedido' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800" /> : <ArrowDown size={12} className="text-slate-800" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Fecha de producción */}
                    <TableHead 
                      onClick={() => handleSort('fechaProduccion')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 transition-colors group"
                    >
                      <div className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        Fecha en Prod.
                        {sortColumn === 'fechaProduccion' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800" /> : <ArrowDown size={12} className="text-slate-800" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Cliente */}
                    <TableHead 
                      onClick={() => handleSort('cliente')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 transition-colors group"
                    >
                      <div className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        Cliente
                        {sortColumn === 'cliente' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800" /> : <ArrowDown size={12} className="text-slate-800" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Monto Presupuesto */}
                    <TableHead 
                      onClick={() => handleSort('montoPresupuesto')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 text-right transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1 hover:text-slate-900 transition-colors">
                        Monto Ppto (USD)
                        {sortColumn === 'montoPresupuesto' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800 text-right" /> : <ArrowDown size={12} className="text-slate-800 text-right" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Total Abonado */}
                    <TableHead 
                      onClick={() => handleSort('totalAbonado')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 text-right transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1 hover:text-slate-900 transition-colors">
                        Total Abonado (USD)
                        {sortColumn === 'totalAbonado' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800 text-right" /> : <ArrowDown size={12} className="text-slate-800 text-right" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Pendiente de pago */}
                    <TableHead 
                      onClick={() => handleSort('pendientePago')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 text-right transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1 hover:text-slate-900 transition-colors">
                        Pendiente Pago (USD)
                        {sortColumn === 'pendientePago' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800 text-right" /> : <ArrowDown size={12} className="text-slate-800 text-right" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Emisor */}
                    <TableHead 
                      onClick={() => handleSort('vendedor')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 transition-colors group"
                    >
                      <div className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        Emisor
                        {sortColumn === 'vendedor' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800" /> : <ArrowDown size={12} className="text-slate-800" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>

                    {/* Estatus */}
                    <TableHead 
                      onClick={() => handleSort('estatus')}
                      className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-slate-600 py-3 px-4 transition-colors group text-center"
                    >
                      <div className="flex items-center justify-center gap-1 hover:text-slate-900 transition-colors">
                        Estatus Producción
                        {sortColumn === 'estatus' ? (
                          sortDirection === 'asc' ? <ArrowUp size={12} className="text-slate-800" /> : <ArrowDown size={12} className="text-slate-800" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {sortedAndFilteredBudgets.map((job) => {
                    const pending = job.totalCost - job.montoAbonado;
                    const statusInfo = getStatusLabelAndStyles(job.status);
                    const prodDate = getProductionDate(job);
                    
                    return (
                      <TableRow key={job._id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors group">
                        
                        {/* PRES NO */}
                        <TableCell className="py-4 px-5">
                          <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                            PRES-{job._id?.toString().slice(-6).toUpperCase()}
                          </span>
                        </TableCell>

                        {/* ORDER NO */}
                        <TableCell className="py-3 px-4">
                          <span className="font-mono text-xs font-black text-blue-800 uppercase bg-blue-50 py-1 px-2.5 rounded-md border border-blue-100">
                            OP-{job._id?.toString().slice(-6).toUpperCase()}
                          </span>
                        </TableCell>

                        {/* PROD DATE */}
                        <TableCell className="py-3 px-4 font-semibold text-xs text-slate-700">
                          {prodDate.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </TableCell>

                        {/* CLIENT */}
                        <TableCell className="py-3 px-4 text-xs font-extrabold text-[#0f172a]">
                          {job.clientId?.razonSocial || 'Cliente Desconocido'}
                        </TableCell>

                        {/* MONTO PPTO */}
                        <TableCell className="py-3 px-4 text-right font-mono text-xs font-bold text-[#0f172a]">
                          {formatCurrency(job.totalCost)}
                        </TableCell>

                        {/* MONTO ABONADO */}
                        <TableCell className="py-3 px-4 text-right font-mono text-xs font-extrabold text-emerald-600">
                          {formatCurrency(job.montoAbonado || 0)}
                        </TableCell>

                        {/* PENDIENTE PAGO */}
                        <TableCell className={`py-3 px-4 text-right font-mono text-xs font-extrabold ${pending > 0.01 ? 'text-rose-600' : 'text-emerald-600 bg-emerald-50/20'}`}>
                          {formatCurrency(pending)}
                        </TableCell>

                        {/* EMISOR */}
                        <TableCell className="py-3 px-4 text-xs font-semibold text-slate-600">
                          {formatEmisor(job)}
                        </TableCell>

                        {/* STATUS BADGE */}
                        <TableCell className="py-3 px-4 text-center">
                          <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-extrabold select-none py-1 px-2 my-0.5", statusInfo.classes)}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* 5. Totals Footer Row */}
                  <TableRow className="bg-[#fcfaf5] hover:bg-[#fcfaf5] border-t border-slate-200 font-black">
                    <TableCell colSpan={4} className="text-right text-[11px] font-bold text-slate-700 py-5 px-4 uppercase tracking-wider select-none font-sans border-r">
                      Total Consolidado General (Registros: {sortedAndFilteredBudgets.length})
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-extrabold text-slate-900 drop-shadow-sm/5 border-r">
                      {formatCurrency(totals.totalCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-extrabold text-emerald-600 drop-shadow-sm/5 border-r">
                      {formatCurrency(totals.montoAbonado)}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs font-extrabold drop-shadow-sm/5 border-r ${totals.pendientePago > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(totals.pendientePago)}
                    </TableCell>
                    <TableCell colSpan={2} className="bg-white/40"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Lateral Print & PDF Export Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-slate-800 text-white w-full max-w-5xl h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300">
            
            {/* Modal Top Control Bar */}
            <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center z-10 select-none">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-400" size={20} />
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">Previsualización de Impresión (PDF)</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Print button */}
                <Button 
                  onClick={handleNativePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold gap-1.5 h-9 rounded-lg"
                >
                  <Printer size={14} /> Imprimir / PDF
                </Button>
                {/* Image download */}
                <Button 
                  onClick={handleDownloadAsImage}
                  disabled={isExportingImage}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 text-white hover:text-white border-slate-600 text-xs font-extrabold gap-1.5 h-9 rounded-lg"
                >
                  {isExportingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  Exportar PNG
                </Button>
                {/* Close Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 w-9"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Simulated Sheet Area (Fitted Paper) */}
            <div className="flex-1 overflow-y-auto bg-slate-700 p-4 sm:p-8 flex items-start justify-center">
              <div 
                ref={printPreviewRef}
                className="w-full max-w-[850px] bg-white text-slate-900 p-0 rounded-xs shadow-xl min-h-[1100px] flex flex-col justify-between overflow-hidden relative"
              >
                {/* Simulated Header (similar to budget) */}
                <div className="relative h-28 bg-zinc-900 overflow-hidden flex items-center border-b-[6px] border-rose-600 print-exact-color">
                  <div className="absolute top-0 right-0 w-3/4 h-full bg-rose-600 transform -skew-x-[25deg] translate-x-32 shadow-2xl print-exact-color"></div>
                  <div className="relative z-10 w-full px-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-xl overflow-hidden print-exact-color">
                        {systemConfig?.logoBase64 ? (
                          <img src={systemConfig.logoBase64} alt="Logo" className="h-full w-full object-contain p-1" />
                        ) : (
                          <span className="text-rose-600 font-black text-3xl italic">G</span>
                        )}
                      </div>
                      <div className="text-white text-left font-sans">
                        <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter leading-none mb-1 drop-shadow-lg print-exact-color">
                          {systemConfig?.nombreComercial || 'TG-Publieventos'}
                        </h1>
                        <p className="text-[9px] sm:text-[10px] font-medium tracking-[0.2em] opacity-90 uppercase italic print-exact-color">MÁS FÁCIL ES HACERLO BIEN</p>
                      </div>
                    </div>
                    <div className="text-white text-right">
                       <div className="bg-zinc-900/40 backdrop-blur-md p-2 rounded-lg border border-white/10 text-center min-w-[150px] print-exact-color">
                         <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-0.5 italic print-exact-color">REPORTE DE PRODUCCIÓN</p>
                         <p className="text-sm font-black print-exact-color">{new Date().toLocaleDateString('es-VE')}</p>
                         <p className="text-[8px] font-bold uppercase tracking-tight opacity-80 mt-0.5 print-exact-color italic">Operador: {profile?.displayName || profile?.email}</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="px-10 py-2 border-b border-slate-100 bg-slate-50/30">
                   <h2 className="text-xs font-black text-zinc-900 text-center uppercase tracking-[0.5em] italic">REPORTE ANALÍTICO DE PRODUCCIÓN</h2>
                </div>

                {/* Sub-container containing padding for content */}
                <div className="px-10 py-6 pb-12 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Active Metadata Specifications */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 mb-6 font-sans text-[10px] leading-relaxed select-none">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-slate-500 uppercase tracking-widest text-[9px] block">Criterio de Búsqueda</strong>
                          <span className="font-semibold text-slate-800">{searchTerm ? `"${searchTerm}"` : 'Completo (General)'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-500 uppercase tracking-widest text-[9px] block">Rango de Producción</strong>
                          <span className="font-semibold text-slate-800">
                            {startDate || endDate ? `${startDate || 'Inicial'} al ${endDate || 'Hoy'}` : 'Todo el Historial'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Formatted Sheet Table (Zinc-900 Header matching budgets) */}
                    <div className="overflow-hidden border border-slate-200 rounded-xs mb-8">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900 text-white font-sans text-[8px] uppercase tracking-wider print-exact-color">
                            <th className="py-2 px-2.5 font-black">N° PRESUP.</th>
                            <th className="py-2 px-2.5 font-black">N° Pedido</th>
                            <th className="py-2 px-2.5 font-black">FECHA PROD.</th>
                            <th className="py-2 px-2.5 font-black">Cliente</th>
                            <th className="py-2 px-2.5 font-black text-right">Monto (USD)</th>
                            <th className="py-2 px-2.5 font-black text-right">Abonado (USD)</th>
                            <th className="py-2 px-2.5 font-black text-right">Pendiente (USD)</th>
                            <th className="py-2 px-2.5 font-black col-span-2">Emisor / Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedAndFilteredBudgets.map((b) => {
                            const pending = b.totalCost - b.montoAbonado;
                            const statusInfo = getStatusLabelAndStyles(b.status);
                            return (
                              <tr key={b._id} className="hover:bg-transparent whitespace-nowrap">
                                <td className="py-1.5 px-2.5 font-mono text-[8px] text-slate-500">PRES-{b._id?.toString().slice(-6).toUpperCase()}</td>
                                <td className="py-1.5 px-2.5 font-mono text-[8px] font-bold text-slate-900">OP-{b._id?.toString().slice(-6).toUpperCase()}</td>
                                <td className="py-1.5 px-2.5 text-[8px] text-slate-700">{getProductionDate(b).toLocaleDateString('es-VE')}</td>
                                <td className="py-1.5 px-2.5 text-[8px] font-semibold text-slate-900 truncate max-w-[150px]">{b.clientId?.razonSocial || 'Desconocido'}</td>
                                <td className="py-1.5 px-2.5 text-[8px] text-right font-mono font-bold">${b.totalCost.toFixed(2)}</td>
                                <td className="py-1.5 px-2.5 text-[8px] text-right font-mono font-bold text-emerald-600">${b.montoAbonado.toFixed(2)}</td>
                                <td className="py-1.5 px-2.5 text-[8px] text-right font-mono font-bold text-rose-600">${pending.toFixed(2)}</td>
                                <td className="py-1.5 px-2.5 text-[8px] text-slate-600 font-semibold truncate max-w-[160px]">
                                  {formatEmisor(b)} | <span className="uppercase text-[7px] font-black">{statusInfo.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Summary totals row */}
                          <tr className="bg-slate-50 font-black border-t border-slate-300 whitespace-nowrap">
                            <td colSpan={4} className="py-2 px-2.5 text-right text-[8px] uppercase font-bold text-slate-700 border-r">
                              Total General
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-[8px] border-r">${totals.totalCost.toFixed(2)}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-[8px] text-emerald-600 border-r">${totals.montoAbonado.toFixed(2)}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-[8px] text-rose-600 border-r">${totals.pendientePago.toFixed(2)}</td>
                            <td className="bg-transparent col-span-2"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confidential Metadata & Credits */}
                  <div className="border-t border-slate-200 pt-5 text-center mt-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      DOCUMENTO CONFIDENCIAL INTRA-SISTEMA - CONTROL EXCLUSIVO DE REGISTROS DE TALLER - {systemConfig?.nombreComercial?.toUpperCase() || 'TG-PUBLIEVENTOS'}
                    </p>
                    <p className="text-[8.5px] font-bold text-slate-500 mt-2">
                      Teléfono: {systemConfig?.telefonoCorporativo || '+58 412-1234567'} | Correo: {systemConfig?.emailCorporativo || 'info@tg-publieventos.com'}
                    </p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-1">
                      Documento no válido como factura fiscal
                    </p>
                  </div>
                </div>

                {/* Bottom Red Banner Ribbon similar to budget footer */}
                <div className="print-footer bg-rose-600 h-10 w-full relative overflow-hidden flex items-center justify-center shadow-[0_-5px_10px_rgba(225,29,72,0.2)] print-exact-color mt-auto">
                   <div className="absolute top-0 left-0 w-full h-1 bg-white/20 print-exact-color"></div>
                   <p className="text-white font-black text-xs tracking-[0.6em] uppercase drop-shadow-md z-10 italic print-exact-color pl-[0.6em]">
                     {systemConfig?.nombreComercial ? `@${systemConfig.nombreComercial.replace(/\s+/g, '').toUpperCase()}` : '@GEOS'}
                   </p>
                   <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl print-exact-color"></div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
