import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Maximize2,
  Save,
  X,
  Layout
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { IElementoFooter } from '@/types';
import ReactMarkdown from 'react-markdown';

export const FooterConfigPage: React.FC = () => {
  const [elements, setElements] = useState<IElementoFooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentElement, setCurrentElement] = useState<Partial<IElementoFooter> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchElements = async () => {
    try {
      const res = await fetch('/api/landing/admin/footer-elements');
      if (res.ok) {
        const data = await res.json();
        setElements(data);
      }
    } catch (error) {
      console.error("Error fetching footer elements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElements();
  }, []);

  const handleSave = async () => {
    if (!currentElement?.nombreElemento || !currentElement?.tituloTexto || !currentElement?.cuerpoTexto) return;

    try {
      const method = currentElement._id ? 'PATCH' : 'POST';
      const url = currentElement._id 
        ? `/api/landing/footer-elements/${currentElement._id}` 
        : '/api/landing/footer-elements';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentElement)
      });

      if (res.ok) {
        fetchElements();
        setIsModalOpen(false);
        setCurrentElement(null);
      }
    } catch (error) {
      console.error("Error saving footer element:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este elemento informante?')) return;
    try {
      const res = await fetch(`/api/landing/footer-elements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchElements();
      }
    } catch (error) {
      console.error("Error deleting footer element:", error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Gestión de Pie de Página</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest text-[10px]">Administración de contenido informativo y legal</p>
        </div>
        <Button 
          onClick={() => {
            setCurrentElement({ isVisible: true, order: elements.length + 1 });
            setIsModalOpen(true);
          }}
          className="rounded-2xl h-12 px-6 bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
        >
          <Plus size={18} className="mr-2" /> Agregar Elemento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {elements.map((el) => (
            <motion.div
              key={el._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-slate-100 shadow-xl rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all h-full flex flex-col">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={el.isVisible ? "default" : "outline"} className={el.isVisible ? "bg-green-500 hover:bg-green-600" : "text-slate-400"}>
                      {el.isVisible ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
                      {el.isVisible ? 'Visible' : 'Oculto'}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden: #{el.order}</span>
                  </div>
                  <CardTitle className="text-xl font-black text-slate-900 uppercase italic leading-tight truncate">
                    {el.nombreElemento}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col space-y-4">
                   <p className="text-slate-500 font-bold text-xs uppercase tracking-tight line-clamp-1">
                     {el.tituloTexto}
                   </p>
                   <div className="bg-slate-50 rounded-2xl p-4 flex-1 text-[10px] font-medium text-slate-400 italic line-clamp-3">
                      {el.cuerpoTexto}
                   </div>
                   <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-xl h-10 font-bold text-[10px] uppercase"
                        onClick={() => {
                          setCurrentElement(el);
                          setIsModalOpen(true);
                        }}
                      >
                         <Edit2 size={14} className="mr-2" /> Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-xl h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(el._id!)}
                      >
                         <Trash2 size={16} />
                      </Button>
                   </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- CRUD Dialog --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="flex flex-col h-[85vh]">
            <div className="bg-slate-900 p-8 text-white shrink-0">
               <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                 {currentElement?._id ? 'Editar Elemento' : 'Nuevo Elemento'}
               </h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configuración de contenido para el landing page</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre en Footer</Label>
                    <Input 
                      placeholder="Ej: Protección de Datos"
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold px-4 focus:ring-primary"
                      value={currentElement?.nombreElemento || ''}
                      onChange={e => setCurrentElement(prev => ({ ...prev!, nombreElemento: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Prioridad (Orden)</Label>
                    <Input 
                      type="number"
                      placeholder="Ej: 1"
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold px-4 focus:ring-primary"
                      value={currentElement?.order || ''}
                      onChange={e => setCurrentElement(prev => ({ ...prev!, order: parseInt(e.target.value) }))}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Título del Modal</Label>
                  <Input 
                    placeholder="Ej: Políticas de Privacidad Institucional"
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold px-4 focus:ring-primary"
                    value={currentElement?.tituloTexto || ''}
                    onChange={e => setCurrentElement(prev => ({ ...prev!, tituloTexto: e.target.value }))}
                  />
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuerpo del Texto (MARKDOWN)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                      onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    >
                       {isPreviewOpen ? 'Ver Editor' : 'Ver Previsualización'}
                    </Button>
                  </div>
                  
                  {isPreviewOpen ? (
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 min-h-[300px] prose prose-slate max-w-none prose-sm">
                       <ReactMarkdown>{currentElement?.cuerpoTexto || ''}</ReactMarkdown>
                    </div>
                  ) : (
                    <Textarea 
                      placeholder="Redacte el contenido utilizando sintaxis Markdown..."
                      className="min-h-[300px] bg-slate-50 border-slate-100 rounded-3xl p-6 font-medium focus:ring-primary focus:bg-white transition-all text-sm leading-relaxed"
                      value={currentElement?.cuerpoTexto || ''}
                      onChange={e => setCurrentElement(prev => ({ ...prev!, cuerpoTexto: e.target.value }))}
                    />
                  )}
               </div>

               <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Visibilidad Pública</h4>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Define si se muestra en el landing page</p>
                  </div>
                  <Switch 
                    checked={currentElement?.isVisible || false}
                    onCheckedChange={(checked) => setCurrentElement(prev => ({ ...prev!, isVisible: checked }))}
                  />
               </div>
            </div>

            <div className="bg-slate-50 p-6 flex justify-end gap-3 border-t border-slate-100 shrink-0">
               <Button 
                 variant="outline" 
                 className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px]"
                 onClick={() => {
                   setIsModalOpen(false);
                   setCurrentElement(null);
                 }}
               >
                 Cancelar
               </Button>
               <Button 
                 className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-lg shadow-primary/20"
                 onClick={handleSave}
               >
                 <Save size={18} className="mr-2" /> Guardar Cambios
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FooterConfigPage;

function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'outline', className?: string }) {
  const variants = {
    default: 'bg-primary text-white',
    outline: 'border border-slate-200 text-slate-500'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
