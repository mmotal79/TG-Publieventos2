import React, { useEffect, useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Mail, MessageSquare, Image as ImageIcon, Download, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';
import { toPng } from 'html-to-image';

interface BudgetPreviewDialogProps {
  budget: any;
  isOpen: boolean;
  onClose: () => void;
}

const BudgetPreviewDialog: React.FC<BudgetPreviewDialogProps> = ({ budget, isOpen, onClose }) => {
  const [config, setConfig] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Default zoom based on window width
      if (window.innerWidth < 640) setZoom(0.35);
      else if (window.innerWidth < 768) setZoom(0.55);
      else if (window.innerWidth < 1024) setZoom(0.7);
      else setZoom(0.9);

      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
           if (Array.isArray(data)) setConfig(data[0]);
           else setConfig(data);
        })
        .catch(err => console.error("Error loading config:", err));
        
      fetch('/api/exchange-rates/current')
        .then(res => res.json())
        .then(data => {
           if (data.rate) setExchangeRate(data.rate);
        })
        .catch(err => console.error("Error loading exchange rate:", err));
    }
  }, [isOpen]);

  if (!budget) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
              size: Letter;
              margin: 0;
            }
            body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              font-family: sans-serif;
            }
            .print-container { 
              width: 816px;
              min-height: 1056px;
              margin: 0 auto;
              background: white;
            }
            @media print {
              .no-print { display: none !important; }
              body { background: white; }
              .print-container { 
                box-shadow: none !important;
                border: none !important;
                width: 100% !important;
                margin: 0 !important;
                padding-bottom: 40px !important;
              }
              .print-exact-color {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .print-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
              }
            }
          </style>
        </head>
        <body class="bg-slate-100 italic">
          <div style="width: 816px; margin: 0 auto; background: white;">
            ${printContent.outerHTML}
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

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const scrollHeight = printRef.current.scrollHeight;
      // Ensure specific styles are applied for export
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: 816, // Letter width at 96dpi
        height: Math.max(1056, scrollHeight), // Letter height or content height
        style: {
          transform: 'none',
          boxShadow: 'none',
          margin: '0',
        }
      });
      const link = document.createElement('a');
      link.download = `Presupuesto_GEOS_${budget._id?.toString().slice(-6) || 'Doc'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar imagen:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = async () => {
    // First, trigger image download as requested
    await handleDownloadImage();

    const empresa = config?.nombreComercial || 'GEOS';
    const contacto = budget.clientId?.contacto || budget.clientId?.personaContacto || 'Estimado Cliente';
    const razonSocial = budget.clientId?.razonSocial || 'Cliente';
    const numeral = budget._id?.toString().slice(-6).toUpperCase() || 'P';

    const asesor = config?.nombreAsesor || 'Asesor de Ventas';

    const texto = `*¡Hola! Es un gusto saludarle, ${contacto}* (${razonSocial}) 🌟%0A%0A` +
      `Espero que se encuentre excelente. En respuesta a su amable solicitud, le envío adjunto la *Cotización #${numeral}* detallada por *${budget.description}*.%0A%0A` +
      `*Monto Total:* ${formatCurrency(budget.totalCost)}%0A%0A` +
      `En ${empresa}, nos apasiona materializar sus ideas con la más alta calidad y atención al detalle. Estamos convencidos de que este proyecto será un éxito total.%0A%0A` +
      `_Agradecería mucho si pudiera confirmarme la recepción del documento que acabo de descargar para usted. Quedo atento a su respuesta para proceder con el pedido._%0A%0A` +
      `*¡Más fácil es hacerlo bien!*%0A%0A` +
      `Atentamente,%0A*${asesor}*%0A${empresa}`;
    
    // Open WhatsApp
    setTimeout(() => {
      window.open(`https://wa.me/?text=${texto}`, '_blank');
    }, 1000); // Small delay to let the download start
  };

  const handleShareEmail = () => {
    const empresa = config?.nombreComercial || 'Nuestra Empresa';
    const contacto = budget.clientId?.contacto || budget.clientId?.personaContacto || 'Estimado Cliente';
    const razonSocial = budget.clientId?.razonSocial || 'Cliente';
    const numeral = budget._id?.toString().slice(-6).toUpperCase() || 'P';
    const fecha = new Date(budget.fecha || budget.createdAt).toLocaleDateString('es-VE');
    const whatsappLink = `https://wa.me/${config?.telefonoCorporativo?.replace(/\D/g, '') || ''}`;
    const asesor = config?.nombreAsesor || 'Su Asesor de Confianza';

    const subject = encodeURIComponent(`Presupuesto #${numeral} - ${fecha} - ${budget.description}`);
    
    const body = encodeURIComponent(
      `Estimado(a) ${contacto} (${razonSocial}),\n\n` +
      `Es un verdadero placer saludarle y agradecerle por el interés en nuestros servicios.\n\n` +
      `Adjunto a este mensaje encontrará la cotización formalizada N° ${numeral} referente a su solicitud de "${budget.description}". En ${empresa}, nos enfocamos en ofrecer soluciones que combinan calidad superior y entrega impecable, garantizando que su proyecto se ejecute con la excelencia que usted merece.\n\n` +
      `Si desea proceder o tiene alguna consulta inmediata, no dude en contactarme directamente haciendo clic aquí: ${whatsappLink}\n\n` +
      `Quedo atento a su gentil respuesta y confirmación de recepción. Estamos listos para comenzar este proyecto con la mayor dedicación.\n\n` +
      `Atentamente,\n\n` +
      `${asesor}\n` +
      `${empresa}\n` +
      `Más fácil es hacerlo bien.`
    );
    
    window.location.href = `mailto:${budget.clientId?.email || ''}?subject=${subject}&body=${body}`;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => {
    if (window.innerWidth < 640) setZoom(0.35);
    else if (window.innerWidth < 1024) setZoom(0.7);
    else setZoom(0.9);
  };

  const fecha = new Date(budget.fecha || budget.createdAt || new Date()).toLocaleDateString('es-VE');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className={`overflow-y-auto bg-slate-100 p-0 border-none transition-all duration-300 ease-in-out ${isMaximized ? 'w-screen h-screen max-w-none max-h-none rounded-none m-0' : 'w-[98vw] max-w-[1000px] max-h-[98vh] mx-auto'}`}>
        <div className="sticky top-0 z-30 bg-white border-b p-2 sm:p-3 flex flex-row justify-between items-center gap-2 no-print shadow-md w-full overflow-x-auto">
          <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-1 sm:gap-2 shrink-0">
            <Printer className="w-4 h-4 text-rose-600 hidden sm:block" />
            <span className="hidden sm:inline font-black uppercase tracking-tighter">Vista Previa</span>
            <span className="sm:hidden font-black">Ver</span>
          </DialogTitle>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="default" size="icon" className="bg-rose-600 hover:bg-rose-700 h-8 w-8 sm:h-9 sm:w-auto sm:px-4 rounded-md shadow-sm" onClick={handlePrint} title="Imprimir PDF">
              <Printer className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline font-bold tracking-tight text-xs">PDF</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-4 border-rose-600 text-rose-600 hover:bg-rose-50 rounded-md shadow-sm" onClick={handleDownloadImage} disabled={isExporting} title="Descargar Imagen">
              <Download className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline font-bold tracking-tight text-xs">{isExporting ? '...' : 'Imagen'}</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-4 border-green-600 text-green-600 hover:bg-green-50 rounded-md shadow-sm" onClick={handleShareWhatsApp} title="Compartir WhatsApp">
              <MessageSquare className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline font-bold tracking-tight text-xs">WhatsApp</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-4 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md shadow-sm" onClick={handleShareEmail} title="Enviar por Email">
              <Mail className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline font-bold tracking-tight text-xs">Email</span>
            </Button>

            <div className="w-px h-5 bg-slate-200 mx-0.5 hidden sm:block" />

            <div className="flex items-center bg-slate-100 rounded-md border text-slate-600 hidden sm:flex">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-none hover:bg-slate-200" onClick={handleZoomOut} title="Alejar">
                <ZoomOut size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-none border-l hover:bg-slate-200" onClick={handleZoomIn} title="Acercar">
                <ZoomIn size={16} />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-slate-500 hover:text-slate-800 ml-0.5" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Restaurar Ventana" : "Maximizar Ventana"}>
              {isMaximized ? <Minimize size={18} /> : <Maximize2 size={18} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-slate-500 hover:text-slate-800" onClick={onClose} title="Cerrar">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="p-2 sm:p-4 md:p-8 flex justify-center bg-slate-200/50 overflow-x-auto min-h-screen">
          <div 
            className="relative transform origin-top transition-transform duration-200 ease-out"
            style={{ 
              transform: `scale(${zoom})`,
              marginBottom: `-${(1 - zoom) * 1056}px` // Collapse empty space based on Letter height
            }}
          >
            <div 
              ref={printRef}
              className="print-container w-[816px] min-h-[1056px] bg-white shadow-2xl p-0 relative flex flex-col font-sans text-slate-800"
            >
              <div className="relative h-28 bg-zinc-900 overflow-hidden flex items-center border-b-[6px] border-rose-600 print-exact-color">
                <div className="absolute top-0 right-0 w-3/4 h-full bg-rose-600 transform -skew-x-[25deg] translate-x-32 shadow-2xl print-exact-color"></div>
                <div className="relative z-10 w-full px-8 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-xl overflow-hidden print-exact-color">
                      {config?.logoBase64 ? (
                        <img src={config.logoBase64} alt="Logo" className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="text-rose-600 font-black text-3xl italic">G</span>
                      )}
                    </div>
                    <div className="text-white text-left">
                      <h1 className="text-3xl font-black italic tracking-tighter leading-none mb-1 drop-shadow-lg print-exact-color">
                        {config?.nombreComercial || 'GEOS'}
                      </h1>
                      <p className="text-[10px] font-medium tracking-[0.2em] opacity-90 uppercase italic print-exact-color">MÁS FÁCIL ES HACERLO BIEN</p>
                    </div>
                  </div>
                  <div className="text-white text-right">
                     <div className="bg-zinc-900/40 backdrop-blur-md p-2 rounded-lg border border-white/10 text-center min-w-[150px] print-exact-color">
                       <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-0.5 italic print-exact-color">N° {budget._id?.toString().slice(-6).toUpperCase() || 'PROV'}</p>
                       <p className="text-xl font-black print-exact-color">{fecha}</p>
                       <p className="text-[8px] font-bold uppercase tracking-tight opacity-80 mt-0.5 no-print">Tasa BCV: {exchangeRate > 0 ? `${exchangeRate.toFixed(2)} Bs/USD` : 'S/N'}</p>
                     </div>
                  </div>
                </div>
              </div>

              <div className="px-12 py-2 border-b border-slate-100 bg-slate-50/30">
                 <h2 className="text-xl font-black text-zinc-900 text-center uppercase tracking-[0.5em] italic">PRESUPUESTO</h2>
              </div>

              <div className="px-12 py-4 pb-16 flex-grow text-left flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-black text-slate-200 uppercase tracking-[0.3em] absolute -rotate-90 origin-top-left translate-y-64 -translate-x-12 opacity-20 pointer-events-none italic">
                    Cotización
                  </h2>
                  <div className="w-full grid grid-cols-2 gap-8 ml-8">
                    <div className="space-y-1">
                      <div className="border-l-4 border-rose-500 pl-4 py-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                        <p className="text-lg font-black text-slate-800 leading-tight">{budget.clientId?.razonSocial || 'CLIENTE FINAL'}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Ref: <span className="font-medium underline decoration-slate-300 underline-offset-2">{budget.description}</span></p>
                      </div>
                      <div className="flex gap-6 pl-4 overflow-hidden mt-3">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RIF / CI</p>
                          <p className="text-xs font-bold">{budget.clientId?.rif || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                          <p className="text-xs font-bold">{budget.clientId?.celular || budget.clientId?.telefono || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-3 mr-4 flex flex-col justify-between">
                      <div className="border-r-4 border-slate-200 pr-4 py-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Contacto Directo</p>
                        <p className="text-lg font-bold text-slate-700 uppercase text-right">{budget.clientId?.contacto || budget.clientId?.personaContacto || '-'}</p>
                      </div>
                      <div className="border-r-4 border-slate-200 pr-4 py-1 text-xs">
                         <div className="flex justify-end gap-3 text-slate-600 font-bold uppercase tracking-tight">
                           <span>Total: <span className="text-slate-900">{formatCurrency(budget.totalCost)}</span></span>
                           <span><span className="text-xs text-slate-400">|</span> Abono: <span className="text-blue-600">{formatCurrency(budget.pagos?.reduce((sum: number, p: any) => sum + (p.status === 'aprobado' ? p.amount : 0), 0) || 0)}</span></span>
                           <span><span className="text-xs text-slate-400">|</span> Saldo: <span className="text-rose-600">{formatCurrency((budget.totalCost || 0) - (budget.pagos?.reduce((sum: number, p: any) => sum + (p.status === 'aprobado' ? p.amount : 0), 0) || 0))}</span></span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 text-white print-exact-color">
                        <th className="py-3 px-6 text-left font-black uppercase tracking-widest text-xs print-exact-color">Descripción Detallada</th>
                        <th className="py-3 px-4 text-center font-black uppercase tracking-widest text-xs w-28 border-x border-white/10 print-exact-color">Precio U.</th>
                        <th className="py-3 px-4 text-center font-black uppercase tracking-widest text-xs w-24 print-exact-color">Cantidad</th>
                        <th className="py-3 px-4 text-center font-black uppercase tracking-widest text-xs w-28 border-l border-white/10 print-exact-color">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budget.items.map((item: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="py-3 px-6 text-left">
                            <div className="font-semibold text-sm text-slate-800 uppercase tracking-tight">
                              {item.modeloId?.tipoPrenda || 'Producto'} <span className="text-rose-600 mx-1">|</span> <span className="font-medium text-slate-500 text-sm">{budget.estructuraCostosId?.nombre || ''}</span>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1 flex flex-col gap-0.5 uppercase font-medium">
                              <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-rose-500 rounded-full"/> Modelo: <span className="text-slate-800">{item.modeloId?.tipoPrenda || '-'}</span></span>
                              <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-slate-300 rounded-full"/> Tela: <span className="text-slate-800">{item.telaId?.nombre || '-'}</span></span>
                              <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-slate-300 rounded-full"/> Corte: <span className="text-slate-800">{item.corteId?.nombre || '-'}</span></span>
                              {item.personalizacion > 0 && <span className="flex items-center gap-1.5 text-rose-500"><div className="w-1 h-1 bg-rose-500 rounded-full"/> Personalización: ${item.personalizacion}</span>}
                              {item.acabados > 0 && <span className="flex items-center gap-1.5 text-rose-500"><div className="w-1 h-1 bg-rose-500 rounded-full"/> Acabado Especial: ${item.acabados}</span>}
                              {budget.volumeDiscountPercent > 0 && (
                                <span className="flex items-center gap-1.5 text-emerald-600">
                                  <div className="w-1 h-1 bg-emerald-500 rounded-full"/> 
                                  Descuento Vol. Aplicado: -{budget.volumeDiscountPercent}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm text-slate-700 border-x border-slate-100">
                            {formatCurrency(item.precioUnitario)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm text-slate-800">
                            {item.cantidad}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm text-slate-800 border-l border-slate-100">
                            {formatCurrency(item.precioUnitario * item.cantidad)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-900 text-white print-exact-color">
                        <td colSpan={3} className="py-3 px-6 text-right font-black uppercase tracking-widest text-sm underline decoration-rose-600 underline-offset-4 print-exact-color">TOTAL ESTIMADO</td>
                        <td className="py-3 px-4 text-center bg-rose-600 print-exact-color">
                          <span className="text-base font-black drop-shadow-md print-exact-color">{formatCurrency(budget.totalCost)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-auto">
                  <div className="text-left">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 mb-2 flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-rose-600"/> Condiciones de Pago
                    </h3>
                    <div className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed font-bold px-2">
                      {config?.informacionPago || `70% para comenzar, 30% al entregar.\nTiempo de entrega sujeto a volumen de pedido.\nPrecios en Divisas ($).\nValidez de la oferta: 5 días hábiles.`}
                    </div>
                    {budget.observations && (
                      <div className="mt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-slate-300"/> Notas Adicionales
                        </h3>
                        <p className="text-[10px] text-slate-400 px-2 font-medium leading-normal">{budget.observations}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-end text-left">
                    <div className="bg-slate-50 rounded-xl p-4 border-r-[4px] border-zinc-900 shadow-inner print:hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 text-left italic">Métricas del Presupuesto</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] border-b border-slate-200 pb-1">
                          <span className="text-slate-400 font-bold uppercase tracking-widest italic">Urgencia:</span>
                          <span className={cn(
                            "font-black py-0.5 px-2 rounded-full text-[8px] uppercase tracking-tighter italic shadow-sm",
                            budget.urgencia === 'urgente' ? "bg-rose-100 text-rose-600" : 
                            budget.urgencia === 'planificada' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"
                          )}>
                            {budget.urgencia}
                          </span>
                        </div>
                        {budget.volumeDiscountPercent > 0 && (
                          <div className="flex justify-between items-center text-[10px] border-b border-slate-200 pb-1">
                            <span className="text-emerald-500 font-black uppercase tracking-tighter italic">Desc. x Volumen Aplicado:</span>
                            <span className="font-black text-emerald-600 text-xs">-{budget.volumeDiscountPercent}%</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px] pt-1">
                          <span className="text-slate-400 font-bold uppercase tracking-widest italic text-[8px]">Representante Ventas:</span>
                          <p className="font-black text-zinc-900 uppercase tracking-tighter italic">{config?.nombreAsesor || 'Ramón Torrealba'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[8px] text-slate-300 font-bold flex items-center justify-end h-full">
                      <p className="uppercase tracking-[0.3em]">Documento no válido como factura fiscal</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="print-footer bg-rose-600 h-10 w-full relative overflow-hidden flex items-center justify-center shadow-[0_-5px_10px_rgba(225,29,72,0.2)] print-exact-color">
                 <div className="absolute top-0 left-0 w-full h-1 bg-white/20 print-exact-color"></div>
                 <p className="text-white font-black text-xs tracking-[0.6em] uppercase drop-shadow-md z-10 italic print-exact-color">
                   {config?.nombreComercial ? `@${config.nombreComercial.replace(/\s+/g, '').toUpperCase()}` : '@GEOS'}
                 </p>
                 <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl print-exact-color"></div>
              </div>
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
