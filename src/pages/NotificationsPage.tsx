import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  Building2, 
  Trash2, 
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { ISolicitudContacto, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const NotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const { decrementUnreadCount, refreshUnreadCount } = useNotifications();
  const [solicitudes, setSolicitudes] = useState<ISolicitudContacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedSolicitud, setSelectedSolicitud] = useState<ISolicitudContacto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // RBAC Check
  if (profile?.role !== UserRole.ADMIN && profile?.role !== UserRole.MANAGER) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch('/api/landing/contact');
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(data);
        refreshUnreadCount();
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/landing/contact/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setSolicitudes(prev => prev.map(s => s._id === id ? { ...s, leido: true } : s));
        decrementUnreadCount();
        if (selectedSolicitud?._id === id) {
          setSelectedSolicitud(prev => prev ? { ...prev, leido: true } : null);
        }
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    // Abrir confirmación personalizada en lugar de window.confirm
    setIdToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    
    try {
      console.log(`[DELETE] Iniciando eliminación: ${idToDelete}`);
      const res = await fetch(`/api/landing/contact/${idToDelete}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();

      if (res.ok) {
        // Encontrar si era no leída ANTES de filtrar para bajar el contador
        const itemToDelete = solicitudes.find(s => s._id === idToDelete);
        const wasUnread = itemToDelete?.leido === false;
        
        // Actualizar estado local eliminando el registro
        setSolicitudes(prev => prev.filter(s => s._id !== idToDelete));
        
        // Actualizar contadores si era no leída
        if (wasUnread) {
          decrementUnreadCount();
        }
        
        // Cerrar modal de detalle si el elemento borrado era el seleccionado
        if (selectedSolicitud?._id === idToDelete) {
          setSelectedSolicitud(null);
        }
        
        console.log("[DELETE] Registro eliminado con éxito");
      } else {
        console.error("[DELETE] Error de servidor:", data.error);
        alert(data.error || "Ocurrió un error al intentar eliminar el registro.");
      }
    } catch (error) {
      console.error("[DELETE] Error de red:", error);
      alert("Error de conexión al intentar eliminar el registro.");
    } finally {
      setIsDeleteDialogOpen(false);
      setIdToDelete(null);
    }
  };

  const filteredSolicitudes = solicitudes
    .filter(s => {
      if (filter === 'unread') return !s.leido;
      if (filter === 'read') return s.leido;
      return true;
    })
    .filter(s => 
      s.nombre.toLowerCase().includes(search.toLowerCase()) || 
      s.empresa.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Notificaciones Recibidas</h1>
          <p className="text-muted-foreground text-sm font-medium">Gestión de contactos y solicitudes desde el Landing Page</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-8 px-4 font-black uppercase tracking-widest text-[10px] border-primary/20 bg-primary/5 text-primary">
              {solicitudes.filter(s => !s.leido).length} Pendientes
           </Badge>
           <Button variant="ghost" size="icon" onClick={fetchSolicitudes} disabled={loading}>
              <Clock className={loading ? 'animate-spin' : ''} size={18} />
           </Button>
        </div>
      </div>

      <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Buscar por nombre, empresa o email..." 
                className="pl-10 h-11 bg-white rounded-2xl border-slate-200 focus:ring-primary"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
               <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                className="rounded-xl h-10 px-6 font-bold text-xs"
                onClick={() => setFilter('all')}
               >
                 Todos
               </Button>
               <Button 
                variant={filter === 'unread' ? 'default' : 'outline'} 
                className="rounded-xl h-10 px-6 font-bold text-xs"
                onClick={() => setFilter('unread')}
               >
                 No Leídos
               </Button>
               <Button 
                variant={filter === 'read' ? 'default' : 'outline'} 
                className="rounded-xl h-10 px-6 font-bold text-xs"
                onClick={() => setFilter('read')}
               >
                 Leídos
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow className="hover:bg-transparent border-slate-200">
                  <TableHead className="w-[120px] font-black uppercase tracking-widest text-[10px] text-slate-900 px-6">ID Solicitud</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-900">Cliente Potencial</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-900">Empresa / Orgn.</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-900">Teléfono</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-900">Correo Electrónico</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-900">Fecha / Hora</TableHead>
                  <TableHead className="w-[140px] text-center font-black uppercase tracking-widest text-[10px] text-slate-900">Estado</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-widest text-[10px] pr-8 text-slate-900">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitudes.length > 0 ? (
                  filteredSolicitudes.map((s) => (
                    <TableRow 
                      key={s._id} 
                      className={cn(
                        "group transition-all cursor-pointer border-slate-100 border-b",
                        !s.leido ? "bg-blue-50/50 hover:bg-blue-100/50" : "hover:bg-slate-50"
                      )}
                      onClick={() => {
                        setSelectedSolicitud(s);
                        if (!s.leido) handleMarkAsRead(s._id!);
                      }}
                    >
                      <TableCell className="px-6">
                        <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">
                          #{s._id?.slice(-8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "uppercase tracking-tight text-xs",
                          !s.leido ? "font-black text-slate-900" : "font-semibold text-slate-600"
                        )}>
                          {s.nombre}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          {s.empresa}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-slate-600 tabular-nums">
                          {s.telefono}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-primary underline underline-offset-2">
                          {s.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(s.createdAt || '').toLocaleDateString('es-VE', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {s.leido ? (
                          <Badge variant="outline" className="bg-white text-slate-400 border-slate-200 uppercase font-black text-[8px] tracking-widest py-0.5 px-2 rounded-lg">
                            Leído
                          </Badge>
                        ) : (
                          <Badge className="bg-primary text-white border-none uppercase font-black text-[8px] tracking-widest py-0.5 px-2 rounded-lg shadow-sm shadow-primary/20">
                            No Leído
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/80">
                            <Eye size={16} className="text-slate-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s._id!);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Bell className="text-slate-200" size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                          No se encontraron solicitudes registradas
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Detalle */}
      <Dialog open={!!selectedSolicitud} onOpenChange={(open) => !open && setSelectedSolicitud(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          {selectedSolicitud && (
            <div className="flex flex-col">
              <div className="bg-slate-900 p-8 text-white relative">
                 <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Mail size={120} />
                 </div>
                 <Badge className="bg-primary hover:bg-primary border-none mb-4 uppercase tracking-[0.2em] font-black text-[10px]">
                    Detalles de Solicitud
                 </Badge>
                 <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight italic">
                    {selectedSolicitud.nombre}
                 </h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                   <Building2 size={14} className="text-primary" /> {selectedSolicitud.empresa}
                 </p>
              </div>

              <div className="p-8 space-y-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Correo Electrónico</Label>
                       <div className="h-14 bg-slate-50 rounded-2xl flex items-center px-6 gap-3 border border-slate-100">
                          <Mail className="text-primary" size={18} />
                          <span className="font-bold text-slate-700">{selectedSolicitud.email}</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Teléfono de Contacto</Label>
                       <div className="h-14 bg-slate-50 rounded-2xl flex items-center px-6 gap-3 border border-slate-100">
                          <Phone className="text-primary" size={18} />
                          <span className="font-bold text-slate-700">{selectedSolicitud.telefono}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Mensaje Recibido</Label>
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 min-h-[150px]">
                       <p className="text-slate-600 font-medium leading-relaxed italic">
                         "{selectedSolicitud.mensaje}"
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Clock size={14} /> Recibido el {new Date(selectedSolicitud.createdAt || '').toLocaleDateString('es-VE', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                       })}
                    </div>
                    {selectedSolicitud.leido && (
                       <Badge className="bg-green-50 text-green-600 border-green-200 uppercase font-black text-[9px] tracking-widest py-1.5 px-4 rounded-xl">
                          <CheckCircle2 size={12} className="mr-2" /> Leído
                       </Badge>
                    )}
                 </div>
              </div>

              <div className="bg-slate-50 p-6 flex justify-end gap-3 border-t border-slate-100">
                 <Button 
                   variant="outline" 
                   className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px]"
                   onClick={() => setSelectedSolicitud(null)}
                 >
                   Cerrar Vista
                 </Button>
                 <Button 
                   variant="destructive" 
                   className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700"
                   onClick={() => handleDelete(selectedSolicitud._id!)}
                 >
                   Eliminar Registro
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Borrado */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-600 p-6 text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight">Confirmar Eliminación</DialogTitle>
              <DialogDescription className="text-red-100 text-xs font-bold uppercase tracking-widest">Esta acción es irreversible</DialogDescription>
            </div>
          </div>
          <CardContent className="p-8 bg-white">
            <p className="text-slate-600 font-semibold mb-6">
              ¿Está seguro que desea eliminar permanentemente este registro de notificación? 
              Se borrará toda la información asociada a este cliente potencial.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
              >
                Eliminar Ahora
              </Button>
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsPage;
