/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Worker, WorkerStatus, PaymentFrequency } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  worker?: Worker | null;
}

const WorkerModal: React.FC<WorkerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  worker 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Worker>>({
    nombre: '',
    cedula: '',
    email: '',
    direccion: '',
    telefono: '',
    cargo: '',
    frecuenciaPago: 'Mensual',
    sueldoBase: 0,
    comision: 0,
    banco: '',
    codigoBIN: '',
    status: 'activo',
    hasSystemAccess: false
  });

  const [systemRole, setSystemRole] = useState<number>(3); // Default to Employee

  useEffect(() => {
    if (worker) {
      setFormData(worker);
      // If worker has system role, we might need to fetch it, but usually it's in the populated userId
      if (worker.userId && typeof worker.userId === 'object') {
          setSystemRole((worker.userId as any).rol);
      }
    } else {
      setFormData({
        nombre: '',
        cedula: '',
        email: '',
        direccion: '',
        telefono: '',
        cargo: '',
        frecuenciaPago: 'Mensual',
        sueldoBase: 0,
        comision: 0,
        banco: '',
        codigoBIN: '',
        status: 'activo',
        hasSystemAccess: false
      });
      setSystemRole(3);
    }
  }, [worker, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.codigoBIN?.length !== 4) {
        toast({
            title: 'Error',
            description: 'El código BIN debe tener exactamente 4 dígitos',
            variant: 'destructive'
        });
        return;
    }

    setLoading(true);
    try {
      const url = worker ? `/api/workers/${worker._id}` : '/api/workers';
      const method = worker ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...formData,
           systemRole: formData.hasSystemAccess ? systemRole : undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar el trabajador');
      }

      toast({
        title: 'Éxito',
        description: `Trabajador ${worker ? 'actualizado' : 'registrado'} correctamente`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const bancos = [
    'Banco de Venezuela',
    'Banesco',
    'Mercantil',
    'BBVA Provincial',
    'BNC',
    'Bancaribe',
    'Exterior',
    'Tesoro',
    'Bicentenario'
  ];

  const roles = [
    { value: 0, name: 'Administrador', show: profile?.role === 0 },
    { value: 1, name: 'Gerente', show: true },
    { value: 2, name: 'Vendedor', show: true },
    { value: 3, name: 'Empleado', show: true },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight italic">
            {worker ? 'Editar Personal' : 'Nuevo Personal'}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Registro y Gestión de Capital Humano
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombres y Apellidos</Label>
              <Input 
                id="nombre" 
                required 
                placeholder="Ej. Juan Pérez"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cedula" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cédula de Identidad</Label>
              <Input 
                id="cedula" 
                required 
                placeholder="V-12345678"
                value={formData.cedula}
                onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                className="h-11 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</Label>
              <Input 
                id="email" 
                type="email"
                required 
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teléfono</Label>
              <Input 
                id="telefono" 
                required 
                placeholder="0412-0000000"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dirección de Vivienda</Label>
            <Input 
              id="direccion" 
              required 
              placeholder="Calle, Sector, Ciudad..."
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              className="h-11 rounded-xl italic"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cargo</Label>
              <Input 
                id="cargo" 
                required 
                placeholder="Ej. Operador Textil"
                value={formData.cargo}
                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frecuencia de Pago</Label>
              <Select 
                value={formData.frecuenciaPago} 
                onValueChange={(val: PaymentFrequency) => setFormData({...formData, frecuenciaPago: val})}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Quincenal">Quincenal</SelectItem>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sueldo" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sueldo Base (USD)</Label>
              <Input 
                id="sueldo" 
                type="number"
                step="0.01"
                value={formData.sueldoBase}
                onChange={(e) => setFormData({...formData, sueldoBase: parseFloat(e.target.value)})}
                className="h-11 rounded-xl font-bold text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comision" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comisión (%)</Label>
              <Input 
                id="comision" 
                type="number"
                step="0.1"
                value={formData.comision}
                onChange={(e) => setFormData({...formData, comision: parseFloat(e.target.value)})}
                className="h-11 rounded-xl font-bold text-rose-500 italic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Banco de Pago</Label>
              <Select 
                value={formData.banco} 
                onValueChange={(val) => setFormData({...formData, banco: val})}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Seleccionar Banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bin" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código BIN (4 Dígitos)</Label>
              <Input 
                id="bin" 
                maxLength={4}
                required 
                placeholder="0000"
                value={formData.codigoBIN}
                onChange={(e) => setFormData({...formData, codigoBIN: e.target.value.replace(/\D/g, '')})}
                className="h-11 rounded-xl font-mono tracking-widest text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estatus Administrativo</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: WorkerStatus) => setFormData({...formData, status: val})}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="retirado">Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-black uppercase tracking-tight italic">Acceso al Sistema</Label>
                <p className="text-[10px] text-slate-400 font-bold">Habilita usuario de inicio de sesión</p>
              </div>
              <Switch 
                checked={formData.hasSystemAccess}
                onCheckedChange={(val) => setFormData({...formData, hasSystemAccess: val})}
              />
            </div>

            {formData.hasSystemAccess && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rol de Usuario</Label>
                <Select 
                  value={systemRole.toString()} 
                  onValueChange={(val) => setSystemRole(parseInt(val))}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(r => r.show).map(r => (
                      <SelectItem key={r.value} value={r.value.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold uppercase text-[10px] tracking-widest">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-12 rounded-xl px-8 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-[0.2em]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {worker ? 'Actualizar Trabajador' : 'Guardar Nuevo Personal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerModal;
