import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Eye, EyeOff, Layout, ChevronUp, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { IImagenSeccion, ISeccionConfig } from '@/types';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { key: 'hero', label: 'Sección Hero (Fondo/Lado Derecho)' },
  { key: 'productos', label: 'Productos Destacados' },
  { key: 'promociones', label: 'Promociones' },
  { key: 'contacto', label: 'Sección Contacto' },
];

export default function ImageCatalogManager() {
  const [images, setImages] = useState<IImagenSeccion[]>([]);
  const [configs, setConfigs] = useState<ISeccionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('hero');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [imgRes, confRes] = await Promise.all([
        fetch('/api/landing/admin/images'),
        fetch('/api/landing/configs')
      ]);
      const imgData = await imgRes.json();
      const confData = await confRes.json();
      setImages(imgData);
      setConfigs(confData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validation: 1.5MB (Keep as safety, but we will compress heavily)
    if (file.size > 1.5 * 1024 * 1024) {
      setError("El archivo excede el límite de 1.5 MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          try {
            // Target maximum dimension of 1000px for speedy landing display and minimal storage footprint
            const maxDimension = 1000;
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error("No se pudo obtener el contexto 2D del canvas para la compresión.");
            }

            // Draw image scaled
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output compressed Base64 as JPEG quality 0.8 to make it extremely lightweight
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            const res = await fetch('/api/landing/images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sectionKey: selectedSection,
                base64Data: compressedBase64,
                order: images.filter(img => img.sectionKey === selectedSection).length
              })
            });

            if (res.ok) {
              setSuccess("Imagen cargada y optimizada Correctamente (10x más ligera).");
              fetchData();
            } else {
              const data = await res.json();
              setError(data.error || "Error al cargar la imagen");
            }
          } catch (uploadError: any) {
            console.error(uploadError);
            setError(uploadError.message || "Error al procesar y subir la imagen.");
          } finally {
            setUploading(false);
          }
        };
        img.onerror = () => {
          setError("Error al procesar el formato de la imagen.");
          setUploading(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Error al procesar el archivo.");
      setUploading(false);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    // Solución Reactiva de Alto Rendimiento: Actualización optimista local inmediata
    setImages(prev => prev.map(img => img._id === id ? { ...img, isVisible: !current } : img));
    setError(null);

    try {
      const res = await fetch(`/api/landing/images/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !current })
      });
      
      if (!res.ok) {
        // Deshacer el cambio en caso de error en el servidor
        setImages(prev => prev.map(img => img._id === id ? { ...img, isVisible: current } : img));
        const data = await res.json();
        setError(data.error || "Error al actualizar la visibilidad en el servidor.");
      }
    } catch (e) {
      console.error(e);
      // Deshacer en caso de error de red
      setImages(prev => prev.map(img => img._id === id ? { ...img, isVisible: current } : img));
      setError("Error de red al actualizar la visibilidad");
    }
  };

  const handleDeleteImagen = async (id: string) => {
    setError(null);
    setSuccess(null);
    
    // Guardar estado previo para poder revertir en caso de fallas de red
    const savedState = [...images];
    
    // Actualización optimista local inmediata: ocultamos del UI
    setImages(prev => prev.filter(img => img._id !== id));
    
    try {
      const res = await fetch(`/api/landing/images/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setSuccess("Imagen eliminada de forma segura del catálogo.");
      } else {
        // Revertir estado si falla en el servidor
        setImages(savedState);
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al procesar la eliminación");
      }
    } catch (e: any) {
      console.error("Error deleting image:", e);
      setImages(savedState);
      setError(`Ocurrió un fallo al intentar eliminar la imagen: ${e.message}`);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down', sectionKey: string) => {
    const sectionImages = images
      .filter(img => img.sectionKey === sectionKey)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sectionImages.length) return;

    const img1 = sectionImages[index];
    const img2 = sectionImages[targetIndex];

    const prevOrder1 = img1.order;
    const prevOrder2 = img2.order;

    // Cambiar las propiedades de orden localmente para actualización optimista inmediata
    setImages(prev => prev.map(img => {
      if (img._id === img1._id) {
        return { ...img, order: prevOrder2 };
      }
      if (img._id === img2._id) {
        return { ...img, order: prevOrder1 };
      }
      return img;
    }));

    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/landing/images/${img1._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: prevOrder2 })
        }),
        fetch(`/api/landing/images/${img2._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: prevOrder1 })
        })
      ]);

      if (!res1.ok || !res2.ok) {
        throw new Error("No se pudo actualizar el orden en el servidor de base de datos.");
      }
    } catch (e: any) { 
      console.error(e);
      setError(`Error al mover posición: ${e.message}`);
      // Revertir orden local en caso de error
      setImages(prev => prev.map(img => {
        if (img._id === img1._id) {
          return { ...img, order: prevOrder1 };
        }
        if (img._id === img2._id) {
          return { ...img, order: prevOrder2 };
        }
        return img;
      }));
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse">CARGANDO CATÁLOGO...</div>;

  return (
    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Catálogo de Imágenes (Landing)</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Gestión de recursos visuales por secciones</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest bg-slate-50 focus:ring-primary outline-none"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          
          <div className="relative">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label 
              htmlFor="file-upload"
              className="flex items-center gap-2 px-6 h-10 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {uploading ? "PROCESANDO..." : <><Upload size={14} /> CARGAR IMAGEN</>}
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs font-bold">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.filter(img => img.sectionKey === selectedSection).sort((a, b) => (a.order || 0) - (b.order || 0)).map((img, idx, filtered) => (
          <div key={img._id} className="group relative bg-slate-50 border border-slate-100 rounded-[1.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200">
            <div className="aspect-square overflow-hidden relative bg-slate-100">
              <img 
                src={img.base64Data} 
                alt="Landing" 
                className="w-full h-full object-cover" 
                loading="lazy"
                decoding="async"
              />
              
              {/* Overlay for Hidden Image State */}
              {!img.isVisible && (
                <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <Badge variant="outline" className="bg-white/95 text-slate-900 border-none px-2.5 py-0.5 font-black uppercase text-[8px] tracking-wider shadow-sm select-none">
                    OCULTA
                  </Badge>
                </div>
              )}

              {/* Overlay for Deletion Confirmation */}
              {deletingId === img._id && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center z-30">
                  <Trash2 size={20} className="text-rose-500 mb-2 animate-bounce" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-200 mb-3 leading-tight select-none">
                    ¿Eliminar del catálogo?
                  </p>
                  <div className="flex gap-2 w-full justify-center">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="px-2.5 h-7 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImagen(img._id!);
                        setDeletingId(null);
                      }}
                    >
                      Sí, Borrar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="px-2.5 h-7 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(null);
                      }}
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}

              {/* Top-Right Actions: Always accessible; permanently visible if hidden, hover-triggered otherwise */}
              <div className={cn(
                "absolute top-2 right-2 flex flex-col gap-1.5 transition-opacity z-20",
                !img.isVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                 <Button 
                   size="icon" 
                   variant="secondary" 
                   className="h-7.5 w-7.5 rounded-full bg-white/95 backdrop-blur shadow-md hover:bg-white text-slate-700 hover:text-slate-900 transition-transform active:scale-90"
                   onClick={() => toggleVisibility(img._id!, img.isVisible)}
                 >
                   {img.isVisible ? <Eye size={13} /> : <EyeOff size={13} className="text-rose-500" />}
                 </Button>
                 <Button 
                   size="icon" 
                   variant="destructive" 
                   className="h-7.5 w-7.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-transform active:scale-90"
                   onClick={() => setDeletingId(img._id!)}
                 >
                   <Trash2 size={13} />
                 </Button>
              </div>
              
              {/* Bottom-Left Controls: Always accessible; permanently visible if hidden, hover-triggered otherwise */}
              <div className={cn(
                "absolute bottom-2 left-2 flex gap-1 transition-opacity z-20",
                !img.isVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-6.5 w-6.5 rounded-md bg-white/95 backdrop-blur shadow-md hover:bg-white text-slate-700 disabled:opacity-40 transition-transform active:scale-90" 
                  onClick={() => moveOrder(idx, 'up', img.sectionKey)} 
                  disabled={idx === 0}
                >
                  <ChevronUp size={13} />
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-6.5 w-6.5 rounded-md bg-white/95 backdrop-blur shadow-md hover:bg-white text-slate-700 disabled:opacity-40 transition-transform active:scale-90" 
                  onClick={() => moveOrder(idx, 'down', img.sectionKey)} 
                  disabled={idx === filtered.length - 1}
                >
                  <ChevronDown size={13} />
                </Button>
              </div>
            </div>
            
            <div className="p-3 flex justify-between items-center bg-white border-t border-slate-50">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ORDEN: #{img.order}</span>
               <span className="text-[8px] font-bold text-blue-500 uppercase px-2 py-0.5 bg-blue-50 rounded-full">{img.sectionKey}</span>
            </div>
          </div>
        ))}

        {images.filter(img => img.sectionKey === selectedSection).length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
            <Layout size={40} className="mb-4 opacity-20" />
            <p className="font-black uppercase text-xs tracking-widest">No hay imágenes en esta sección</p>
          </div>
        )}
      </div>
    </div>
  );
}
