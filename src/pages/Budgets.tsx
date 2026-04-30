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
import { Pencil, Trash2, Search, Loader2, Printer, Eye, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/services/budgetService';
import BudgetPreviewDialog from '@/components/BudgetPreviewDialog';

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewingBudget, setPreviewingBudget] = useState<any | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        setBudgets(await res.json());
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
      case 'approved': return <Badge className="bg-green-500">Aprobado</Badge>;
      case 'rejected': return <Badge variant="destructive">Rechazado</Badge>;
      case 'in_production': return <Badge className="bg-blue-500">Producción</Badge>;
      default: return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setActiveTab('new');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Presupuestos</h2>
        <p className="text-muted-foreground">Gestione y cree presupuestos técnicos para sus clientes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Presupuestos</TabsTrigger>
          <TabsTrigger value="new">{editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <CardTitle>Historial de Presupuestos</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar presupuesto..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 flex justify-center items-center flex-col gap-3 text-slate-400">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-sm font-medium animate-pulse">Cargando historial...</p>
                </div>
              ) : filteredBudgets.length === 0 ? (
                <div className="p-20 text-center text-slate-400 border-2 border-dashed m-6 rounded-2xl">
                  <Search size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg italic">No se encontraron presupuestos</p>
                  <p className="text-sm mt-1">Intenta con otros términos de búsqueda.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto text-sm">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500 py-4">Fecha</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500 py-4">Cliente</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500 py-4">Descripción</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500 py-4">Monto ($)</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500 py-4">Estado</TableHead>
                          <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest text-slate-500 py-4">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBudgets.map((b) => (
                          <TableRow key={b._id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                            <TableCell className="font-medium text-slate-600">
                              {new Date(b.fecha || b.createdAt).toLocaleDateString('es-VE')}
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {b.clientId?.razonSocial || 'Desconocido'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase">RIF: {b.clientId?.rif || '-'}</div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <span className="text-zinc-600 font-medium">"{b.description}"</span>
                            </TableCell>
                            <TableCell className="font-black text-slate-900">
                              {formatCurrency(b.totalCost)}
                            </TableCell>
                            <TableCell>{getStatusBadge(b.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-primary hover:bg-primary/10"
                                  onClick={() => setPreviewingBudget(b)}
                                  title="Ver/Imprimir"
                                >
                                  <Printer size={15} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(b)}>
                                  <Pencil size={15} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(b._id)}>
                                  <Trash2 size={15} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
                    {filteredBudgets.map((b) => (
                      <Card key={b._id} className="border-slate-200 overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                              {new Date(b.fecha || b.createdAt).toLocaleDateString('es-VE')}
                            </span>
                            {getStatusBadge(b.status)}
                          </div>
                          
                          <div>
                            <h3 className="font-black text-slate-900 leading-tight uppercase tracking-tight text-sm">
                              {b.clientId?.razonSocial || 'Desconocido'}
                            </h3>
                            <div className="flex flex-col mt-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                {b.clientId?.contacto || b.clientId?.personaContacto || 'Sin contacto'}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">
                                {b.clientId?.celular || b.clientId?.telefono || '-'}
                              </p>
                            </div>
                            <p className="text-xs italic text-slate-500 mt-2">"{b.description}"</p>
                          </div>

                          <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Estimado</p>
                              <p className="text-lg font-black text-rose-600">{formatCurrency(b.totalCost)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 border-slate-200 text-slate-600 shadow-sm text-[10px] font-bold px-2"
                                onClick={() => setPreviewingBudget(b)}
                              >
                                <Printer size={14} className="mr-1" /> VER
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 border-green-200 text-green-600 shadow-sm text-[10px] font-bold px-2"
                                onClick={() => {
                                  const empresa = 'GEOS'; // Se podría obtener de config si estuviera disponible aquí
                                  const contacto = b.clientId?.contacto || b.clientId?.personaContacto || 'Estimado Cliente';
                                  const razonSocial = b.clientId?.razonSocial || '';
                                  
                                  const texto = `*¡Hola! Es un gusto saludarle, ${contacto}* (${razonSocial}) 🌟%0A%0A` +
                                    `Espero que se encuentre excelente. En respuesta a su amable solicitud, le envío adjunto el *Presupuesto #${b._id?.toString().slice(-6).toUpperCase()}* detallado por *${b.description}*.%0A%0A` +
                                    `*Monto Total:* ${formatCurrency(b.totalCost)}%0A%0A` +
                                    `En nuestra empresa, nos apasiona materializar sus ideas con la más alta calidad y atención al detalle. Estamos convencidos de que este proyecto superará sus expectativas y será el inicio de una gran alianza.%0A%0A` +
                                    `_Agradecería mucho si pudiera confirmarme la recepción del mismo. Quedo atento a cualquier duda o comentario para dar inicio a su producción._%0A%0A` +
                                    `*¡Más fácil es hacerlo bien!*%0A%0A` +
                                    `Atentamente,%0A*Asesor de Ventas*%0A${empresa}`;
                                  
                                  window.open(`https://wa.me/${b.clientId?.celular?.replace(/\D/g, '') || ''}?text=${texto}`, '_blank');
                                }}
                              >
                                <MessageSquare size={14} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 border-blue-200 text-blue-600 shadow-sm text-[10px] font-bold px-2"
                                onClick={() => handleEdit(b)}
                              >
                                <Pencil size={14} className="mr-1" /> EDIT
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 border-rose-200 text-rose-600 shadow-sm text-[10px] font-bold px-2"
                                onClick={() => handleDelete(b._id)}
                              >
                                <Trash2 size={14} className="mr-1" /> ELIM
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
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>{editingBudget ? `Editando Presupuesto: ${editingBudget.description}` : 'Crear Presupuesto'}</CardTitle>
            </CardHeader>
            <CardContent>
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

