import React, { useEffect, useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Download } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';

interface BudgetPreviewDialogProps {
  budget: any;
  isOpen: boolean;
  onClose: () => void;
}

const BudgetPreviewDialog: React.FC<BudgetPreviewDialogProps> = ({ budget, isOpen, onClose }) => {
  const [config, setConfig] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
           // Si es un array o objeto único
           if (Array.isArray(data)) setConfig(data[0]);
           else setConfig(data);
        })
        .catch(err => console.error("Error loading config:", err));
    }
  }, [isOpen]);

  if (!budget) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Clone styles from current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Presupuesto - ${budget.description}</title>
          ${styles}
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            .print-container { 
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              background: white;
            }
            @media print {
              .no-print { display: none !important; }
              body { background: white; }
              .print-container { 
                box-shadow: none !important;
                border: none !important;
              }
            }
          </style>
        </head>
        <body class="bg-slate-100">
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fecha = new Date(budget.fecha || budget.createdAt || new Date()).toLocaleDateString('es-VE');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[950px] max-h-[90vh] overflow-y-auto bg-slate-50 p-0 border-none">
        <div className="sticky top-0 z-20 bg-white border-b p-4 flex justify-between items-center no-print shadow-sm">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-rose-600" />
            Vista Previa de Cotización
          </DialogTitle>
          <div className="flex gap-2">
            <Button variant="default" className="bg-rose-600 hover:bg-rose-700" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-8 flex justify-center bg-slate-200/50">
          {/* THE ACTUAL DOCUMENT CONTAINER */}
          <div 
            ref={printRef}
            className="print-container w-[210mm] min-h-[297mm] bg-white shadow-2xl mx-auto p-0 relative flex flex-col font-sans text-slate-800"
          >
            {/* Header Banner - Matching PDF styling */}
            <div className="relative h-40 bg-zinc-900 overflow-hidden flex items-center border-b-8 border-rose-600">
              {/* Slanted red effect */}
              <div className="absolute top-0 right-0 w-3/4 h-full bg-rose-600 transform -skew-x-[25deg] translate-x-32 shadow-2xl"></div>
              
              <div className="relative z-10 w-full px-12 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    {config?.logoBase64 ? (
                      <img src={config.logoBase64} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="text-rose-600 font-black text-5xl italic">G</span>
                    )}
                  </div>
                  <div className="text-white">
                    <h1 className="text-4xl font-black italic tracking-tighter leading-none mb-1 drop-shadow-lg">GEOS</h1>
                    <p className="text-sm font-medium tracking-[0.2em] opacity-90">MÁS FÁCIL ES HACERLO BIEN</p>
                  </div>
                </div>
                <div className="text-white text-right">
                   <div className="bg-zinc-900/40 backdrop-blur-md p-3 rounded-lg border border-white/10 text-center min-w-[200px]">
                     <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1 italic">Presupuesto N° {budget._id?.toString().slice(-6).toUpperCase() || 'TEMP'}</p>
                     <p className="text-2xl font-black">{fecha}</p>
                     <p className="text-[9px] font-bold uppercase tracking-tight opacity-80 mt-1">{config?.razonSocial || 'INVERSIONES GEOS CA.'}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="px-14 py-12 flex-grow">
              <div className="flex justify-between items-start mb-12">
                <h2 className="text-5xl font-black text-slate-200 uppercase tracking-[0.3em] absolute -rotate-90 origin-top-left translate-y-64 -translate-x-12 opacity-20 pointer-events-none">
                  Cotización
                </h2>
                
                {/* Client Info Section */}
                <div className="w-full grid grid-cols-2 gap-12 ml-8 italic">
                  <div className="space-y-3">
                    <div className="border-l-4 border-rose-500 pl-4 py-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                      <p className="text-xl font-black text-slate-800 leading-tight">{budget.clientId?.razonSocial || 'CLIENTE FINAL'}</p>
                      <p className="text-sm font-bold text-slate-500 mt-1 underline decoration-rose-300 underline-offset-4">Ref: {budget.description}</p>
                    </div>
                    <div className="flex gap-6 mt-4 pl-4 overflow-hidden">
                      <div className="min-w-fit">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RIF / CI</p>
                        <p className="text-sm font-bold">{budget.clientId?.rif || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                        <p className="text-sm font-bold">{budget.clientId?.celular || budget.clientId?.telefono || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-3 mr-4">
                    <div className="border-r-4 border-slate-200 pr-4 py-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Directo</p>
                      <p className="text-xl font-bold text-slate-700 uppercase">{budget.clientId?.contacto || budget.clientId?.personaContacto || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm mb-10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white">
                      <th className="py-5 px-6 text-left font-black uppercase tracking-widest text-xs">Descripción Detallada</th>
                      <th className="py-5 px-4 text-center font-black uppercase tracking-widest text-xs w-36 border-x border-white/10">Precio U.</th>
                      <th className="py-5 px-4 text-center font-black uppercase tracking-widest text-xs w-28">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.map((item: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="py-6 px-6">
                          <div className="font-black text-lg text-slate-800 uppercase tracking-tight">
                            {item.modeloId?.tipoPrenda || 'Producto'} <span className="text-rose-600 mx-1">|</span> <span className="font-bold text-slate-500 text-base">{budget.estructuraCostosId?.nombre || ''}</span>
                          </div>
                          <div className="text-[10px] text-slate-600 mt-2 grid grid-cols-3 gap-y-2 uppercase font-bold">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"/> Nivel: {item.modeloId?.nivelComplejidad || 'Básico'}</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"/> Tela: {item.telaId?.nombre || '-'}</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"/> Corte: {item.corteId?.nombre || '-'}</span>
                            {item.personalizacion > 0 && <span className="flex items-center gap-1 text-rose-500"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"/> Personalizado: ${item.personalizacion}</span>}
                            {item.acabados > 0 && <span className="flex items-center gap-1 text-rose-500"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"/> Acabados: ${item.acabados}</span>}
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center font-black text-2xl text-slate-700 border-x border-slate-100">
                          {formatCurrency(item.precioUnitario)}
                        </td>
                        <td className="py-6 px-4 text-center font-black text-2xl text-slate-800">
                          {item.cantidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-900 text-white">
                      <td colSpan={2} className="py-8 px-6 text-right font-black uppercase tracking-[0.4em] text-xl italic underline decoration-rose-600 underline-offset-8">TOTAL ESTIMADO</td>
                      <td className="py-8 px-4 text-center bg-rose-600">
                        <span className="text-3xl font-black drop-shadow-md">{formatCurrency(budget.totalCost)}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Conditions & Information Footer Section */}
              <div className="grid grid-cols-2 gap-16 mt-6">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 mb-4 flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-rose-600"/> Condiciones de Pago
                  </h3>
                  <div className="text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed font-bold italic px-2">
                    {config?.informacionPago || `70% para comenzar, 30% al entregar.\nTiempo de entrega sujeto a volumen de pedido.\nPrecios en Divisas ($).\nValidez de la oferta: 5 días hábiles.`}
                  </div>
                  
                  {budget.observations && (
                    <div className="mt-8">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-slate-300"/> Notas Adicionales
                      </h3>
                      <p className="text-[11px] text-slate-400 px-2 italic font-medium leading-normal">{budget.observations}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 rounded-2xl p-6 border-r-8 border-zinc-900 shadow-inner">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Métricas del Presupuesto</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] border-b border-slate-200 pb-2">
                        <span className="text-slate-400 font-bold uppercase">Urgencia:</span>
                        <span className={cn(
                          "font-black py-1 px-3 rounded-full text-[9px] uppercase tracking-tighter",
                          budget.urgencia === 'urgente' ? "bg-rose-100 text-rose-600" : 
                          budget.urgencia === 'planificada' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"
                        )}>
                          {budget.urgencia}
                        </span>
                      </div>
                      {budget.volumeDiscountPercent > 0 && (
                        <div className="flex justify-between items-center text-[11px] border-b border-slate-200 pb-2">
                          <span className="text-emerald-500 font-black uppercase tracking-tighter italic">Desc. x Volumen Aplicado:</span>
                          <span className="font-black text-emerald-600 text-sm">-{budget.volumeDiscountPercent}%</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[11px] pt-2">
                        <span className="text-slate-400 font-bold uppercase tracking-widest italic text-[9px]">Representante Ventas:</span>
                        <p className="font-black text-zinc-900 uppercase tracking-tighter">Ramón Torrealba</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-[9px] text-slate-300 font-bold flex items-center justify-end h-full">
                    <p className="uppercase tracking-[0.3em]">Documento no válido como factura fiscal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Banner */}
            <div className="bg-rose-600 h-14 w-full mt-auto relative overflow-hidden flex items-center justify-center shadow-[0_-10px_20px_rgba(225,29,72,0.2)]">
               <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
               <p className="text-white font-black text-base tracking-[0.6em] uppercase drop-shadow-md z-10">@PUBLIEVENTOSTG</p>
               <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetPreviewDialog;

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
