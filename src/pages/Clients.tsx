/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Client } from '@/types';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    razonSocial: '',
    contacto: '',
    celular: '',
    rif: '',
    email: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        razonSocial: '',
        contacto: '',
        celular: '',
        rif: '',
        email: '',
        direccion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingClient ? 'PUT' : 'POST';
      const url = editingClient ? `/api/clients/${editingClient._id}` : '/api/clients';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchClients();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error al guardar cliente');
      }
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.celular.includes(searchTerm) ||
    c.rif.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gestione su cartera de clientes y prospectos.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 w-full md:w-auto">
          <UserPlus size={18} />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Directorio de Clientes</CardTitle>
              <CardDescription>Ordenado alfabéticamente por Razón Social</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, RIF o celular..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest p-4">Razón Social / Empresa</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest p-4">Identificación (Celular/RIF)</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest p-4">Contacto</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest p-4">Dirección</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest p-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground mt-2">Cargando clientes...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : filteredClients.map((client) => (
                  <TableRow key={client._id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                    <TableCell>
                      <div className="font-black text-slate-800 uppercase tracking-tight">{client.razonSocial}</div>
                      <div className="text-xs text-slate-400 font-medium italic">{client.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-slate-700">Cel: {client.celular}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase">RIF: {client.rif}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-rose-600 italic tracking-tight">{client.contacto}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate italic font-medium">
                      {client.direccion || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleOpenModal(client)}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(client._id!)}>
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
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-400">Cargando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-20 text-center text-slate-400 border-2 border-dashed rounded-xl">
                No se encontraron clientes.
              </div>
            ) : (
              filteredClients.map((client) => (
                <Card key={client._id} className="border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tighter leading-tight text-base mb-1">
                          {client.razonSocial}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{client.rif}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 text-primary shadow-sm" onClick={() => handleOpenModal(client)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 border-rose-200 text-rose-600 shadow-sm" onClick={() => handleDelete(client._id!)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Persona de Contacto</p>
                        <p className="text-xs font-bold text-rose-600 italic">{client.contacto}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Número Celular</p>
                        <p className="text-xs font-bold text-slate-700">{client.celular}</p>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email y Ubicación</p>
                      <p className="text-xs font-medium text-slate-500 italic truncate mb-1">{client.email}</p>
                      <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{client.direccion || 'Sin dirección registrada'}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              Complete los datos del cliente. El número de celular es el identificador único.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="razonSocial">Razón Social / Nombre (Obligatorio)</Label>
                <Input 
                  id="razonSocial" 
                  required 
                  value={formData.razonSocial} 
                  onChange={(e) => setFormData({...formData, razonSocial: e.target.value})}
                  placeholder="Ej: Inversiones Textil C.A."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Persona de Contacto</Label>
                <Input 
                  id="contacto" 
                  required 
                  value={formData.contacto} 
                  onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                  placeholder="Nombre del representante"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rif">RIF (J-00000000-0)</Label>
                <Input 
                  id="rif" 
                  required 
                  value={formData.rif} 
                  onChange={(e) => setFormData({...formData, rif: e.target.value})}
                  placeholder="J-12345678-9"
                  pattern="^[JGVE]-[0-9]{8}-[0-9]$"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular">Número de Celular (ID)</Label>
                <Input 
                  id="celular" 
                  required 
                  value={formData.celular} 
                  onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  placeholder="04121234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="cliente@correo.com"
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="direccion">Dirección Fiscal / Ubicación (Opcional)</Label>
                <Input 
                  id="direccion" 
                  value={formData.direccion} 
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Calle, Ciudad, Estado..."
                />
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
