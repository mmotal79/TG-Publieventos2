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
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón Social / Empresa</TableHead>
                  <TableHead>Identificación (Celular/RIF)</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground mt-2">Cargando clientes...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : filteredClients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell>
                      <div className="font-medium">{client.razonSocial}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Cel: {client.celular}</div>
                      <div className="text-xs text-muted-foreground">RIF: {client.rif}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{client.contacto}</div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {client.direccion || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(client)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(client._id!)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
