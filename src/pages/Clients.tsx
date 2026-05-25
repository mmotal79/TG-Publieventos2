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
import { useAuth } from '@/contexts/AuthContext';

const Clients: React.FC = () => {
  const { profile } = useAuth();
  const isSales = profile?.role === 2;
  const userEmail = profile?.email;

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
      const emailQuery = userEmail ? `creatorEmail=${encodeURIComponent(userEmail)}` : '';
      const roleQuery = profile?.role !== undefined ? `role=${profile.role}` : '';
      const queryParams = [emailQuery, roleQuery].filter(Boolean).join('&');
      const url = queryParams ? `/api/clients?${queryParams}` : '/api/clients';
      const res = await fetch(url);
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
    if (profile) {
      fetchClients();
    }
  }, [profile]);

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
      
      const payload = {
        ...formData,
        ...(!editingClient ? { creado_por: userEmail || 'unknown' } : {})
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  const filteredClients = clients
    .filter(c => {
      const currentRole = profile?.role !== undefined ? Number(profile.role) : 2;
      const uEmail = (profile?.email || '').trim().toLowerCase();
      const cCreator = (c.creado_por || '').trim().toLowerCase();
      
      if (currentRole === 2) {
        return cCreator === uEmail || cCreator === '';
      }
      if (currentRole === 1) {
        return c.creatorRole !== 0;
      }
      return true; // Admin (0) and others see everything
    })
    .filter(c => 
      c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.celular.includes(searchTerm) ||
      c.rif.includes(searchTerm)
    );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1 md:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Clientes</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Gestione su cartera de clientes y prospectos.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 w-full md:w-auto h-12 rounded-xl shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest">
          <UserPlus size={18} />
          Nuevo Cliente
        </Button>
      </div>

      <Card className="border-none shadow-none bg-transparent md:bg-white md:border md:shadow-xl md:shadow-slate-200/50 md:rounded-[2rem] overflow-hidden">
        <CardHeader className="px-1 md:px-8 md:pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight italic">Directorio</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orden Alfabético</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Nombre, RIF o Cel..." 
                className="pl-10 h-12 bg-white border-slate-200 rounded-2xl font-bold text-sm shadow-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-8">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-y border-slate-100 bg-slate-50/50">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Razón Social / Empresa</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Identificación</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Contacto</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Dirección</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 animate-pulse">Sincronizando directorio...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24 border-2 border-dashed border-slate-100 rounded-[2rem] m-4">
                      <Search size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="font-black text-xl uppercase tracking-tighter text-slate-300">Sin resultados</p>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.map((client) => (
                  <TableRow key={client._id} className="hover:bg-slate-50/50 border-slate-100 transition-colors group">
                    <TableCell>
                      <div className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none group-hover:text-primary transition-colors">{client.razonSocial}</div>
                      <div className="text-[10px] text-slate-400 font-bold italic mt-1">{client.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-black text-slate-700 tracking-tight">CEL: {client.celular}</div>
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">RIF: {client.rif}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-black text-rose-600 italic tracking-tight">{client.contacto}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span className="text-xs text-slate-500 italic font-medium">{client.direccion || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleOpenModal(client)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(client._id!)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 px-1 pb-10">
            {loading ? (
              <div className="py-24 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando directorio...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white">
                <Search size={40} className="mx-auto mb-3 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sin coincidencias</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <Card key={client._id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white active:scale-[0.98] transition-transform">
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tighter leading-none text-lg mb-2">
                          {client.razonSocial}
                        </h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1 rounded-full">
                          RIF: {client.rif}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-primary shadow-sm" onClick={() => handleOpenModal(client)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-rose-100 text-rose-600 shadow-sm" onClick={() => handleDelete(client._id!)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable</p>
                        <p className="text-xs font-black text-rose-600 italic truncate">{client.contacto}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conexión</p>
                        <p className="text-xs font-black text-slate-700">{client.celular}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                         <p className="text-[10px] font-bold text-slate-500 italic truncate">{client.email}</p>
                      </div>
                      <div className="flex items-start gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5" />
                         <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">{client.direccion || 'Sin dirección registrada'}</p>
                      </div>
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
