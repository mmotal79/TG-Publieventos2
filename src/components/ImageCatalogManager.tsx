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
    try {
      await fetch(`/api/landing/images/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !current })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteImagen = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar esta imagen del catálogo permanentemente?")) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`/api/landing/images/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        // Reactividad inmediata: Filtramos el estado local antes incluso de volver a consultar
        setImages(prev => prev.filter(img => img._id !== id));
        setSuccess("Imagen eliminada de forma segura del catálogo.");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al procesar la eliminación");
      }
    } catch (e: any) {
      console.error("Error deleting image:", e);
      setError(`Ocurrió un fallo al intentar eliminar la imagen: ${e.message}`);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down', sectionKey: string) => {
    const sectionImages = images.filter(img => img.sectionKey === sectionKey);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sectionImages.length) return;

    const img1 = sectionImages[index];
    const img2 = sectionImages[targetIndex];

    try {
      await Promise.all([
        fetch(`/api/landing/images/${img1._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: img2.order })
        }),
        fetch(`/api/landing/images/${img2._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: img1.order })
        })
      ]);
      fetchData();
    } catch (e) { console.error(e); }
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
        {images.filter(img => img.sectionKey === selectedSection).map((img, idx, filtered) => (
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
                   onClick={() => handleDeleteImagen(img._id!)}
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
