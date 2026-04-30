/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, ShieldAlert, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const userSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  rol: z.number().min(0).max(4),
  estado: z.enum(['Activo', 'Bloqueado', 'Suspendido', 'Baja Laboral']),
  salarioBaseUSD: z.number().min(0).optional(),
  porcentajeComision: z.number().min(0).max(100).optional(),
  frecuenciaPago: z.enum(['Semanal', 'Quincenal', 'Mensual']).optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserData extends UserFormValues {
  _id: string;
}

const ROLES = {
  0: 'Admin',
  1: 'Gerente',
  2: 'Vendedor',
  3: 'Empleado',
  4: 'Cliente'
};

const UsuariosCatalog: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check access level
  const currentRole = profile?.role ?? 4;
  const hasAccess = currentRole === 0 || currentRole === 1;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      rol: 3,
      estado: 'Activo',
      salarioBaseUSD: 0,
      porcentajeComision: 0,
      frecuenciaPago: 'Quincenal'
    }
  });

  const selectedRole = watch('rol');

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [hasAccess]);

  const fetchUsers = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const openModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      reset({
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        estado: user.estado,
        salarioBaseUSD: user.salarioBaseUSD || 0,
        porcentajeComision: user.porcentajeComision || 0,
        frecuenciaPago: user.frecuenciaPago || 'Quincenal'
      });
    } else {
      setEditingUser(null);
      reset({
        nombre: '',
        email: '',
        rol: 3,
        estado: 'Activo',
        salarioBaseUSD: 0,
        porcentajeComision: 0,
        frecuenciaPago: 'Quincenal'
      });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (data: UserFormValues) => {
    setStatus('loading');
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error saving user');
      }

      await fetchUsers();
      setStatus('success');
      setTimeout(() => setIsModalOpen(false), 1000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleDelete = async (user: UserData) => {
    if (user.email === profile?.email) {
      alert("No puedes eliminarte a ti mismo.");
      return;
    }
    if (!confirm(`¿Está seguro de eliminar al usuario "${user.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      else {
        const errData = await res.json();
        alert(errData.message || "Error al eliminar usuario.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.rol.toString() === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administre accesos, roles y parámetros de nómina.</p>
        </div>
        <Button className="gap-2" onClick={() => openModal()}>
          <Plus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Directorio de Personal</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre o email..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filtrar Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Roles</SelectItem>
                  <SelectItem value="0">Admin</SelectItem>
                  <SelectItem value="1">Gerente</SelectItem>
                  <SelectItem value="2">Vendedor</SelectItem>
                  <SelectItem value="3">Empleado</SelectItem>
                  <SelectItem value="4">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nómina (Base)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.nombre}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROLES[u.rol as keyof typeof ROLES]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.estado === 'Activo' ? 'default' : 'destructive'}>
                          {u.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.rol === 4 ? '-' : `$${u.salarioBaseUSD || 0} (${u.frecuenciaPago})`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openModal(u)}
                            disabled={currentRole === 1 && u.rol === 0} // Gerente no puede editar Admin
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(u)}
                            disabled={(currentRole === 1 && u.rol === 0) || u.email === profile?.email}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Cuenta de Google)</Label>
                <Input id="email" type="email" {...register('email')} disabled={!!editingUser} />
                <p className="text-xs text-muted-foreground">El usuario iniciará sesión con esta cuenta de Google.</p>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select 
                  value={selectedRole.toString()} 
                  onValueChange={(v) => setValue('rol', parseInt(v))}
                  disabled={currentRole === 1 && selectedRole === 0}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentRole === 0 && <SelectItem value="0">Admin</SelectItem>}
                    <SelectItem value="1">Gerente</SelectItem>
                    <SelectItem value="2">Vendedor</SelectItem>
                    <SelectItem value="3">Empleado</SelectItem>
                    <SelectItem value="4">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                {errors.rol && <p className="text-xs text-destructive">{errors.rol.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={watch('estado')} 
                  onValueChange={(v: any) => setValue('estado', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo (Permitir acceso)</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                    <SelectItem value="Baja Laboral">Baja Laboral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole !== 4 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="porcentajeComision">% Comisión</Label>
                    <Input id="porcentajeComision" type="number" step="0.1" {...register('porcentajeComision', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salarioBaseUSD">Salario Periódico (USD)</Label>
                    <Input id="salarioBaseUSD" type="number" step="0.01" {...register('salarioBaseUSD', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuenciaPago">Frecuencia de Salario</Label>
                    <Select 
                      value={watch('frecuenciaPago')} 
                      onValueChange={(v: any) => setValue('frecuenciaPago', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Quincenal">Quincenal</SelectItem>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {status === 'error' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Ocurrió un error al guardar. Verifique los datos o el email.
              </div>
            )}

            {status === 'success' && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                ¡Usuario guardado exitosamente!
              </div>
            )}

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={status === 'loading'}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={status === 'loading' || status === 'success'}>
                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'success' ? 'Guardado' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsuariosCatalog;
