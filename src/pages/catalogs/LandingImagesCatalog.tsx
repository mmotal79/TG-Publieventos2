import React from 'react';
import ImageCatalogManager from '@/components/ImageCatalogManager';
import { Layout } from 'lucide-react';

export default function LandingImagesCatalog() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-2">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Layout className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Recursos del Landing</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Personalización visual dinámica por secciones</p>
        </div>
      </div>

      <ImageCatalogManager />
    </div>
  );
}
