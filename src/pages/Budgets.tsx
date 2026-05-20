/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import BudgetForm from '@/components/BudgetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Search, Loader2, Printer, Eye, MessageSquare, Mail, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/services/budgetService';
import BudgetPreviewDialog from '@/components/BudgetPreviewDialog';
import BudgetStatusModal from '@/components/BudgetStatusModal';
import BudgetPaymentModal from '@/components/BudgetPaymentModal';
import { CircleDollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Budgets: React.FC = () => {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewingBudget, setPreviewingBudget] = useState<any | null>(null);
  const [statusEditingBudget, setStatusEditingBudget] = useState<any | null>(null);
  const [payEditingBudget, setPayEditingBudget] = useState<any | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchBudgets();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(Array.isArray(data) ? data[0] : data);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
        
        setPayEditingBudget((prev: any) => prev ? data.find((b: any) => b._id === prev._id) || prev : prev);
        setStatusEditingBudget((prev: any) => prev ? data.find((b: any) => b._id === prev._id) || prev : prev);
        setPreviewingBudget((prev: any) => prev ? data.find((b: any) => b._id === prev._id) || prev : prev);
      }
    } catch (e) {
      console.error("Error fetching budgets:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este presupuesto?")) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBudgets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBudgets = budgets
    .filter(b => {
      const currentRole = profile?.role ?? 2;
      const userEmail = profile?.email;
      
      // RBAC Filtering rules:
      // 1. Sellers (Role 2) see only their own budgets
      if (currentRole === 2) {
        return b.creatorEmail === userEmail;
      }
      // 2. Managers (Role 1) see all except Admin (Role 0) budgets
      if (currentRole === 1) {
        return b.creatorRole !== 0;
      }
      // 3. Admins (Role 0) see everything
      return true;
    })
    .filter(b => 
      b.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientId?.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.fecha || a.createdAt).getTime();
      const dateB = new Date(b.fecha || b.createdAt).getTime();
      return dateB - dateA;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceptado_con_abono': return <Badge className="bg-blue-500 hover:bg-blue-600">Aceptado con Abono</Badge>;
      case 'en_proceso': return <Badge className="bg-indigo-500 hover:bg-indigo-600">En Proceso</Badge>;
      case 'culminado': return <Badge className="bg-purple-500 hover:bg-purple-600">Culminado</Badge>;
      case 'entregado_y_pagado': return <Badge className="bg-green-500 hover:bg-green-600">Entregado y Pagado</Badge>;
      case 'anulado': return <Badge variant="destructive">Anulado</Badge>;
      default: return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 uppercase text-[9px] font-black tracking-widest">Pendiente</Badge>;
    }
  };

  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setActiveTab('new');
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="px-1 md:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Presupuestos</h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Gestione y cree presupuestos técnicos para sus clientes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="list" className="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-tight">Lista de Presupuestos</TabsTrigger>
          <TabsTrigger value="new" className="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-tight">
            {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="border-none shadow-none bg-transparent md:bg-white md:border md:shadow-sm">
            <CardHeader className="px-1 md:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-xl font-black uppercase tracking-tight italic">Historial</CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar presupuesto..." 
                    className="pl-10 h-11 bg-white border-slate-200 rounded-xl font-medium shadow-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-20 flex justify-center items-center flex-col gap-3 text-slate-400">
                  <Loader2 className="animate-spin" size={40} />
                  <p className="text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando datos...</p>
                </div>
              ) : filteredBudgets.length === 0 ? (
                <div className="p-16 text-center text-slate-400 border-2 border-dashed mx-4 md:mx-6 rounded-[2rem] bg-white md:bg-slate-50/30">
                  <Search size={56} className="mx-auto mb-6 opacity-10" />
                  <p className="font-black text-xl uppercase tracking-tighter text-slate-300">Sin resultados</p>
                  <p className="text-xs mt-2 font-medium opacity-60">Intenta con otros términos de búsqueda.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto text-sm">
                    <Table>
                      <TableHeader className="bg-slate-50 border-y border-slate-100">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Fecha</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Cliente</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Descripción</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5 text-right">Total ($)</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5 text-right pl-4">Estado</TableHead>
                          <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBudgets.map((b) => (
                          <TableRow key={b._id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                            <TableCell className="font-bold text-slate-500">
                              {new Date(b.fecha || b.createdAt).toLocaleDateString('es-VE')}
                            </TableCell>
                            <TableCell>
                              <div className="font-black text-slate-900 group-hover:text-primary transition-colors leading-tight uppercase tabular-nums">
                                {b.clientId?.razonSocial || 'Desconocido'}
                              </div>
                              <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">RIF: {b.clientId?.rif || '-'}</div>
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              <span className="text-slate-500 font-bold italic">"{b.description}"</span>
                            </TableCell>
                            <TableCell className="font-black text-slate-900 text-right text-base">
                              {formatCurrency(b.totalCost)}
                            </TableCell>
                            <TableCell className="pl-4">{getStatusBadge(b.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900" onClick={() => setPreviewingBudget(b)} title="Imprimir"><Printer size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-500 hover:text-amber-700 hover:bg-amber-50" onClick={() => setStatusEditingBudget(b)} title="Cambiar Estado"><Settings size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setPayEditingBudget(b)} title="Registrar Pago"><CircleDollarSign size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => handleEdit(b)} title="Editar"><Pencil size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(b._id)} title="Eliminar"><Trash2 size={16} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile "Ficha" View */}
                  <div className="md:hidden space-y-4 px-1 pb-10">
                    {filteredBudgets.map((b) => (
                      <Card key={b._id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white active:scale-[0.98] transition-transform">
                        <div className="p-6 space-y-5">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                {new Date(b.fecha || b.createdAt).toLocaleDateString('es-VE')}
                              </span>
                              <div className="text-[9px] font-black text-primary uppercase ml-1">#{b._id?.toString().slice(-6).toUpperCase()}</div>
                            </div>
                            {getStatusBadge(b.status)}
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="font-black text-slate-900 leading-[1.1] uppercase tracking-tighter text-lg">
                              {b.clientId?.razonSocial || 'Desconocido'}
                            </h3>
                            <div className="flex flex-col">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {b.clientId?.contacto || b.clientId?.personaContacto || 'Sin contacto'}
                              </p>
                              <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                                {b.clientId?.celular || b.clientId?.telefono || '-'}
                              </p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2">
                               <p className="text-xs font-semibold italic text-slate-600">"{b.description}"</p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-end bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                                <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">Inversión Total</span>
                                <span className="font-black text-rose-600 text-2xl tracking-tighter leading-none">{formatCurrency(b.totalCost)}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Abonado</div>
                                  <div className="font-black text-blue-600 text-sm">{formatCurrency(b.montoAbonado || 0)}</div>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
                                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Pagar</div>
                                  <div className="font-black text-white text-sm">{formatCurrency(Math.max(0, b.totalCost - (b.montoAbonado || 0)))}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 justify-center mt-6 pt-6 border-t border-slate-100">
                              <Button 
                                variant="outline" 
                                size="lg" 
                                className="w-[45%] h-12 rounded-xl border-slate-200 text-slate-900"
                                onClick={() => setPreviewingBudget(b)}
                              >
                                <Printer size={16} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="lg" 
                                className="w-[45%] h-12 rounded-xl border-amber-200 text-amber-600"
                                onClick={() => setStatusEditingBudget(b)}
                              >
                                <Settings size={16} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="lg" 
                                className="w-[45%] h-12 rounded-xl border-emerald-200 text-emerald-600"
                                onClick={() => setPayEditingBudget(b)}
                              >
                                <CircleDollarSign size={16} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="lg" 
                                className="w-[45%] h-12 rounded-xl border-rose-200 text-rose-500"
                                onClick={() => handleDelete(b._id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="lg" 
                                className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/20 mt-2"
                                onClick={() => handleEdit(b)}
                              >
                                <Pencil size={14} className="mr-3" />
                                Editar Proyecto
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <BudgetPreviewDialog 
            budget={previewingBudget} 
            isOpen={!!previewingBudget} 
            onClose={() => setPreviewingBudget(null)} 
          />

          <BudgetStatusModal
            budget={statusEditingBudget}
            isOpen={!!statusEditingBudget}
            onClose={() => setStatusEditingBudget(null)}
            onUpdate={() => {
              setStatusEditingBudget(null);
              fetchBudgets();
            }}
          />

          <BudgetPaymentModal
            budget={payEditingBudget}
            isOpen={!!payEditingBudget}
            onClose={() => setPayEditingBudget(null)}
            onUpdate={() => {
              fetchBudgets();
              // Don't close immediately so they can see the payment in the history list if they want,
              // or they can add another.
            }}
          />
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingBudget(null);
                    setActiveTab('list');
                  }}
                  className="text-slate-600 border-slate-300 hover:bg-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                  {editingBudget ? 'Salir de edición' : 'Salir y volver a lista'}
                </Button>
                <CardTitle className="text-xl">{editingBudget ? `Editando Presupuesto: ${editingBudget.description}` : 'Crear Presupuesto'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <BudgetForm initialData={editingBudget} onCancel={() => {
                setEditingBudget(null);
                setActiveTab('list');
              }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Budgets;

