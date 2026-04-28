/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Client } from '@/types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    razonSocial: '',
    contacto: '',
    celular: '',
    rif: '',
    email: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newClient = await res.json();
        onSuccess(newClient);
        onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registro Rápido de Cliente</DialogTitle>
          <DialogDescription>
            Agregue un nuevo cliente al sistema sin abandonar el presupuesto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="col-span-2 space-y-2">
                <Label htmlFor="q-razonSocial">Razón Social</Label>
                <Input id="q-razonSocial" required value={formData.razonSocial} onChange={(e) => setFormData({...formData, razonSocial: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="q-contacto">Contacto</Label>
                <Input id="q-contacto" required value={formData.contacto} onChange={(e) => setFormData({...formData, contacto: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="q-rif">RIF</Label>
                <Input id="q-rif" required value={formData.rif} onChange={(e) => setFormData({...formData, rif: e.target.value})} placeholder="J-12345678-0" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="q-celular">Celular (ID)</Label>
                <Input id="q-celular" required value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="q-email">Email</Label>
                <Input id="q-email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
             </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar y Seleccionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
