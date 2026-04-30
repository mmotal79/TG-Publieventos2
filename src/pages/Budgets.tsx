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
import { Pencil, Trash2, Search, Loader2, Printer, Eye } from 'lucide-react';
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

  const filteredBudgets = budgets.filter(b => 
    b.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.clientId?.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBudgets.map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(b.fecha || b.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{b.clientId?.razonSocial || 'Desconocido'}</TableCell>
                        <TableCell>{b.description}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(b.totalCost)}</TableCell>
                        <TableCell>{getStatusBadge(b.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-primary hover:text-primary"
                              onClick={() => setPreviewingBudget(b)}
                              title="Visualizar"
                            >
                              <Printer size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}>
                              <Pencil size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(b._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

