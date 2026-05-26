import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ChevronRight, 
  Layers, 
  Scissors, 
  Palette, 
  Truck, 
  ShieldCheck, 
  Star, 
  Users, 
  Quote,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Factory,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Globe,
  Database,
  Eye,
  ScrollText,
  Instagram,
  Facebook,
  Share2
} from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { calculateBudgetPrice } from '@/services/budgetService';
import { IImagenSeccion, IElementoFooter } from '@/types';
import ReactMarkdown from 'react-markdown';

// --- Data for Calculator Teaser ---
const PRENDA_OPTIONS = [
  { id: 'franela', name: 'Franela Premium', base: 4.5, factor: 1.1 },
  { id: 'sueter', name: 'Suéter con Capucha', base: 12.0, factor: 1.4 },
  { id: 'pantalon', name: 'Pantalón Cargo', base: 15.0, factor: 1.5 },
  { id: 'uniforme', name: 'Uniforme Corporativo', base: 8.0, factor: 1.2 },
];

const TELA_OPTIONS = [
  { id: 'algodon', name: 'Algodón 100%', cost: 3.5 },
  { id: 'poliester', name: 'Poliéster Sport', cost: 2.2 },
  { id: 'mezclilla', name: 'Mezclilla Rígida', cost: 5.8 },
  { id: 'lino', name: 'Lino Italiano', cost: 12.5 },
];

const CORTE_OPTIONS = [
  { id: 'slim', name: 'Slim Fit', factor: 1.1 },
  { id: 'oversized', name: 'Oversized', factor: 1.4 },
  { id: 'regular', name: 'Regular Fit', factor: 1.2 },
];

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 100], ['rgba(15,23,42,0)', 'rgba(15,23,42,0.95)']);
  const navBorder = useTransform(scrollY, [0, 100], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)']);

  // Dynamic Data States
  const [companyName, setCompanyName] = useState('TG-Textiles');
  const [logo, setLogo] = useState<string | null>(null);
  const [modelos, setModelos] = useState<any[]>([]);
  const [telas, setTelas] = useState<any[]>([]);
  const [cortes, setCortes] = useState<any[]>([]);
  const [estructuras, setEstructuras] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Budget Calculator State
  const [calcModel, setCalcModel] = useState<string>('');
  const [calcTela, setCalcTela] = useState<string>('');
  const [calcCorte, setCalcCorte] = useState<string>('');
  const [calcEstructura, setCalcEstructura] = useState<string>('');
  const [calcQty, setCalcQty] = useState(100);
  const [estimate, setEstimate] = useState(0);

  // Portfolio & Showcase State
  const [portafolioItems, setPortafolioItems] = useState<any[]>([]);
  const [creaciones, setCreaciones] = useState<any[]>([]);
  const [currentShowcaseIdx, setCurrentShowcaseIdx] = useState(0);
  const [showCalculator, setShowCalculator] = useState(true);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showCreations, setShowCreations] = useState(true);
  const [heroImages, setHeroImages] = useState<IImagenSeccion[]>([]);
  const [contactImages, setContactImages] = useState<IImagenSeccion[]>([]);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [currentContactIdx, setCurrentContactIdx] = useState(0);

  // Social & Contact Info
  const [socialConfig, setSocialConfig] = useState<any>({});
  const [contactForm, setContactForm] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    email: '',
    mensaje: ''
  });
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDataProtection, setShowDataProtection] = useState(false);
  const [footerElements, setFooterElements] = useState<IElementoFooter[]>([]);
  const [selectedFooterEl, setSelectedFooterEl] = useState<IElementoFooter | null>(null);

  const nombreInputRef = useRef<HTMLInputElement>(null);

  const handleFormalizarPropuesta = () => {
    const model = modelos.find(p => p._id === calcModel)?.nombre || 'N/A';
    const tela = telas.find(t => t._id === calcTela)?.nombre || 'N/A';
    const corte = cortes.find(c => c._id === calcCorte)?.nombre || 'N/A';
    const estructura = estructuras.find(e => e._id === calcEstructura)?.nombre || 'N/A';

    const messagePayload = `Estoy interesado en este presupuesto: \n\nPerfil Cliente / Estructura: ${estructura}\nTipo Prenda / Modelo: ${model}\nTextura Material: ${tela}\nEstilo Ajuste: ${corte}\nCantidad de Elementos: ${calcQty}`;

    setContactForm(prev => ({ ...prev, mensaje: messagePayload }));

    scrollToSection('contacto');
    
    setTimeout(() => {
      nombreInputRef.current?.focus();
    }, 600);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, modelosRes, telasRes, cortesRes, estructurasRes, portafolioRes, creacionesRes, heroRes, contactRes, footerRes] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/catalogs/modelos'),
          fetch('/api/catalogs/telas'),
          fetch('/api/catalogs/cortes'),
          fetch('/api/catalogs/estructura-costos'),
          fetch('/api/catalogs/portafolio'),
          fetch('/api/catalogs/creaciones'),
          fetch('/api/landing/images/hero'),
          fetch('/api/landing/images/contacto'),
          fetch('/api/landing/footer-elements')
        ]);

        if (configRes.ok) {
          const config = await configRes.json();
          if (config.nombreComercial) setCompanyName(config.nombreComercial);
          if (config.logoBase64) setLogo(config.logoBase64);
          setShowCalculator(config.mostrarConfiguradorLanding !== false);
          setShowPortfolio(config.showPortfolio !== false);
          setShowCreations(config.showCreations !== false);
          setSocialConfig({
            emailCorporativo: config.emailCorporativo,
            urlInstagram: config.urlInstagram,
            urlFacebook: config.urlFacebook,
            urlTiktok: config.urlTiktok
          });
        }

        const mData = modelosRes.ok ? await modelosRes.json() : [];
        const tData = telasRes.ok ? await telasRes.json() : [];
        const cData = cortesRes.ok ? await cortesRes.json() : [];
        const eData = estructurasRes.ok ? await estructurasRes.json() : [];
        const pData = portafolioRes.ok ? await portafolioRes.json() : [];
        const crData = creacionesRes.ok ? await creacionesRes.json() : [];
        const hData = heroRes.ok ? await heroRes.json() : [];
        const conData = contactRes.ok ? await contactRes.json() : [];
        const fData = footerRes.ok ? await footerRes.json() : [];

        setModelos(mData.filter((i: any) => i.activo));
        setTelas(tData.filter((i: any) => i.activo));
        setCortes(cData);
        setEstructuras(eData.filter((i: any) => i.activo));
        setPortafolioItems(pData.filter((i: any) => i.activo));
        setCreaciones(crData.filter((i: any) => i.activo));
        setHeroImages(hData);
        setContactImages(conData);
        setFooterElements(fData);

        // Set defaults if data available
        if (mData.length > 0) setCalcModel(mData[0]._id);
        if (tData.length > 0) setCalcTela(tData[0]._id);
        if (cData.length > 0) setCalcCorte(cData[0]._id);
        if (eData.length > 0) setCalcEstructura(eData[0]._id);

      } catch (error) {
        console.error("Error fetching landing page data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Carousel logic for Hero
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIdx(prev => (prev + 1) % heroImages.length);
    }, 5000); // 5 seconds default
    return () => clearInterval(interval);
  }, [heroImages]);

  // Carousel logic for Contact
  useEffect(() => {
    if (contactImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentContactIdx(prev => (prev + 1) % contactImages.length);
    }, 4500); 
    return () => clearInterval(interval);
  }, [contactImages]);

  useEffect(() => {
    if (!calcModel || !calcTela || !calcCorte || !calcEstructura || !modelos.length || !telas.length) {
      setEstimate(0);
      return;
    }

    const model = modelos.find(p => p._id === calcModel);
    const tela = telas.find(t => t._id === calcTela);
    const corte = cortes.find(c => c._id === calcCorte);
    const estructura = estructuras.find(e => e._id === calcEstructura);

    if (!model || !tela || !corte || !estructura) {
      setEstimate(0);
      return;
    }

    // Logic safely calculated using shared service
    const { totalPrice } = calculateBudgetPrice(model, tela, corte, estructura, calcQty, {
      incluirIVA: false // Display Net Total to match internal system shown in white background
    });

    if (isNaN(totalPrice) || totalPrice === Infinity) {
      setEstimate(0);
    } else {
      setEstimate(totalPrice);
    }
  }, [calcModel, calcTela, calcCorte, calcEstructura, calcQty, modelos, telas, cortes, estructuras]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    setContactSuccess(false);

    try {
      const res = await fetch('/api/landing/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      if (res.ok) {
        setContactSuccess(true);
        setShowSuccessModal(true);
        setContactForm({ nombre: '', empresa: '', telefono: '', email: '', mensaje: '' });
        setTimeout(() => setContactSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Error sending contact request:", error);
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-primary selection:text-white overflow-x-hidden text-white">
      {/* Loading Overlay for Data Fetching */}
      {loadingData && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
        </div>
      )}
      {/* --- Navbar --- */}
      <motion.nav 
        style={{ backgroundColor: navBg, borderBottomColor: navBorder }}
        className="fixed top-0 left-0 w-full z-50 transition-all h-20 border-b border-transparent flex items-center px-6 md:px-12 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection('home')}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform overflow-hidden p-1">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Factory className="text-primary w-6 h-6" />
              )}
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black tracking-tighter text-white uppercase">{companyName}</span>
              <span className="text-[8px] font-bold text-primary tracking-[0.4em] uppercase">Innovación Textil</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {[
              'Proceso', 
              showCreations ? 'Creaciones' : null, 
              showCalculator ? 'Presupuesto' : null, 
              showPortfolio ? 'Portafolio' : null, 
              'Ventajas', 
              'Contacto',
              'Acceso'
            ]
              .filter(Boolean)
              .map((item) => (
              <button 
                key={item}
                onClick={() => {
                  let target = item?.toLowerCase();
                  if (item === 'Presupuesto') target = 'estimador';
                  if (item === 'Portafolio') target = 'gallery';
                  if (target) scrollToSection(target);
                }}
                className="text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]"
              >
                {item}
              </button>
            ))}
            <Button 
              onClick={() => scrollToSection('acceso')}
              className="rounded-full px-8 font-black uppercase tracking-widest text-[10px] h-11 shadow-2xl shadow-primary/20 bg-white text-slate-950 hover:bg-slate-200"
            >
              Comenzar
            </Button>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 bg-slate-950 z-40 flex flex-col p-12 pt-32 gap-8 md:hidden"
          >
            {[
              'Proceso', 
              showCreations ? 'Creaciones' : null,
              showCalculator ? 'Estimador' : null, 
              showPortfolio ? 'Portafolio' : null,
              'Ventajas', 
              'Contacto',
              'Acceso'
            ].filter(Boolean).map((item) => (
              <button 
                key={item}
                onClick={() => {
                  let target = item.toLowerCase();
                  if (item === 'Portafolio') target = 'gallery';
                  scrollToSection(target);
                }}
                className="text-4xl font-black text-white text-left border-b border-white/10 pb-6 uppercase tracking-tighter"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Hero Section --- */}
      <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-950">
        {/* Abstract Background Decoration */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-px h-px bg-white shadow-[0_0_100px_40px_rgba(255,255,255,0.05)] rounded-full" />

        <div className="container max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10 items-center py-12 lg:py-20 min-h-[auto] lg:min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-4xl z-20 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-white border border-primary/20 px-4 py-1.5 lg:px-5 lg:py-2 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-8 lg:mb-10 backdrop-blur-md">
              <Sparkles size={14} className="text-primary" />
              <span>Sistema de gestión corporativo</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-[90px] font-black text-white tracking-tighter leading-[0.9] lg:leading-[0.82] uppercase mb-8 lg:mb-12">
              Creaciones <br /> <span className="text-primary italic text-[0.95em] drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">Textiles</span> <br className="hidden lg:block" /> y Publicidades <br className="hidden lg:block" /> de Alto Nivel.
            </h1>
            <p className="text-slate-400 text-base lg:text-xl font-medium max-w-2xl mb-8 lg:mb-12 leading-relaxed border-l-2 border-primary/30 pl-6 lg:pl-8 mx-auto lg:mx-0">
              Transformamos conceptos en realidades tangibles con la precisión técnica y el diseño vanguardista que su marca merece. Calidad premium garantizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center lg:justify-start">
              {showCalculator && (
                <Button 
                  onClick={() => scrollToSection('estimador')}
                  className="rounded-2xl h-14 lg:h-16 px-8 lg:px-12 font-black uppercase tracking-widest text-[10px] lg:text-xs shadow-[0_20px_50px_rgba(var(--primary),0.3)] bg-primary hover:bg-primary/90 text-white transition-all hover:scale-105 active:scale-95"
                >
                  Planificar Orden
                </Button>
              )}
              <Button 
                onClick={() => scrollToSection('proceso')}
                className="rounded-2xl h-14 lg:h-16 px-8 lg:px-12 border-2 border-white/10 font-black uppercase tracking-widest text-[10px] lg:text-xs hover:bg-white/10 text-white bg-transparent transition-all backdrop-blur-sm"
              >
                Metodología
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex items-center justify-center relative z-10 w-full py-8 lg:py-10"
          >
            <AnimatePresence mode="wait">
              {heroImages.length > 0 ? (
                <motion.img 
                  key={heroImages[currentHeroIdx]._id}
                  initial={{ opacity: 0, scale: 0.9, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 1.1, x: -30 }}
                  transition={{ duration: 0.8 }}
                  src={heroImages[currentHeroIdx].base64Data} 
                  alt="Modelo Textil" 
                  className="max-h-[50vh] lg:max-h-[85vh] w-full max-w-[320px] sm:max-w-md lg:max-w-none object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.6)] filter contrast-[1.05] brightness-[1.1]" 
                />
              ) : (
                <motion.img 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src="https://storage.googleapis.com/static-artifacts/1d5a6f97-c67d-4296-9ba0-8761b7bb228c/artifacts/aeb0f6e6-056a-4b95-a1c1-4096be277b0c.png" 
                  alt="Modelo Textil Default" 
                  className="max-h-[50vh] lg:max-h-[85vh] w-full max-w-[320px] sm:max-w-md lg:max-w-none object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.6)] filter contrast-[0.8] brightness-[0.5] grayscale" 
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="absolute bottom-16 right-16 hidden 2xl:block opacity-10">
           {logo ? (
             <img src={logo} alt="Watermark" className="w-96 h-96 object-contain grayscale" />
           ) : (
             <Factory size={200} className="text-primary/10" />
           )}
        </div>
      </section>

      {/* --- Process Section (WHITE BACKGROUND) --- */}
      <section id="proceso" className="py-32 bg-white relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-2/5">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">Pipeline Operativo</h2>
              <h3 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
                Ingeniería <br /> de la <br /> <span className="text-primary">Confección.</span>
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-10 text-lg">
                Optimizamos cada fase de la confección mediante procesos estandarizados que garantizan la calidad y el cumplimiento de plazos.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   <div className="text-3xl font-black text-slate-900 mb-2">99%</div>
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cumplimiento de Tiempos</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   <div className="text-3xl font-black text-slate-900 mb-2">100%</div>
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clientes Satisfechos</div>
                </div>
              </div>
            </div>

            <div className="lg:w-3/5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { 
                  icon: <Palette className="w-6 h-6" />, 
                  title: 'Asesoría de Diseño', 
                  desc: 'Transformamos su identidad corporativa en piezas textiles de vanguardia con soporte técnico especializado.' 
                },
                { 
                  icon: <Scissors className="w-6 h-6" />, 
                  title: 'Precisión Digital', 
                  desc: 'Patrones optimizados digitalmente para garantizar un ajuste perfecto y el mejor aprovechamiento de materiales.' 
                },
                { 
                  icon: <Layers className="w-6 h-6" />, 
                  title: 'Control de Calidad', 
                  desc: 'Monitoreo riguroso en cada estación de costura para asegurar acabados impecables en cada unidad.' 
                },
                { 
                  icon: <Truck className="w-6 h-6" />, 
                  title: 'Puntualidad Logística', 
                  desc: 'Sistema de despacho inteligente que garantiza la entrega de su pedido en los tiempos acordados.' 
                },
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="group p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all hover:bg-white hover:shadow-xl"
                >
                  <div className="w-14 h-14 bg-white shadow-md group-hover:bg-primary group-hover:text-white transition-all rounded-2xl flex items-center justify-center mb-8 text-primary group-hover:scale-110">
                    {step.icon}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 italic group-hover:text-primary">
                    {step.title}
                  </h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed group-hover:text-slate-600">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Nuestras Creaciones Showcase (Flowing White) --- */}
      {showCreations && creaciones.length > 0 && (
        <section id="creaciones" className="py-32 bg-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center mb-20">
              <h2 className="text-primary font-black uppercase tracking-[0.5em] text-[11px] mb-6">Exhibición Exclusiva</h2>
              <h3 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
                Nuestras <br /> <span className="text-primary italic">Creaciones.</span>
              </h3>
            </div>

            <div className="relative group">
              <div className="flex flex-col lg:flex-row gap-16 items-center">
                <div className="lg:w-3/5 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentShowcaseIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="relative aspect-[4/5] sm:aspect-square md:aspect-video rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl bg-white"
                    >
                      <img 
                        src={creaciones[currentShowcaseIdx].imagen} 
                        alt={creaciones[currentShowcaseIdx].titulo} 
                        className="w-full h-full object-cover sm:object-contain md:object-cover bg-slate-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40" />
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Controls */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-xl">
                    <button 
                      onClick={() => setCurrentShowcaseIdx(prev => (prev === 0 ? creaciones.length - 1 : prev - 1))}
                      className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-all"
                    >
                      <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div className="px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                       {currentShowcaseIdx + 1} / {creaciones.length}
                    </div>
                    <button 
                      onClick={() => setCurrentShowcaseIdx(prev => (prev === creaciones.length - 1 ? 0 : prev + 1))}
                      className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-primary/30"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="lg:w-2/5 space-y-10">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key={currentShowcaseIdx}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="space-y-8"
                     >
                       <div className="space-y-4">
                         <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-[0.2em] font-black text-[10px] px-4 py-1.5 rounded-full">
                           Diseño Premium
                         </Badge>
                         <h4 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                           {creaciones[currentShowcaseIdx].titulo}
                         </h4>
                       </div>
                       
                       <p className="text-slate-500 text-lg font-medium leading-relaxed">
                         {creaciones[currentShowcaseIdx].descripcion}
                       </p>

                       <div className="pt-8 border-t border-slate-100">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio Base Sugerido</div>
                         <div className="text-4xl font-black text-primary tracking-tighter">
                            ${(creaciones[currentShowcaseIdx].precioBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-bold ml-1 uppercase">USD</span>
                         </div>
                       </div>

                       <Button 
                        onClick={() => scrollToSection('estimador')}
                        className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-xl"
                       >
                         Solicitar Cotización Similar
                       </Button>
                     </motion.div>
                   </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- Interactive Budget Estimator (DARK BACKGROUND) --- */}
      {showCalculator && (
        <section id="estimador" className="py-32 relative bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-primary font-black uppercase tracking-[0.5em] text-[11px] mb-6">Motor de Inteligencia de Costos</h2>
            <h3 className="text-6xl md:text-7xl font-black tracking-tighter uppercase leading-none text-white italic">Calcula tu Presupuesto</h3>
          </div>

          <div className="bg-slate-950/50 backdrop-blur-xl border border-white/5 rounded-[4rem] p-10 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">
              <div className="space-y-10">
                {/* Perfil Selector */}
                <div className="space-y-5">
                   <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 ml-2">Perfil del Cliente / Estructura</Label>
                   <Select value={calcEstructura} onValueChange={setCalcEstructura}>
                      <SelectTrigger className="h-16 bg-slate-900 border-white/10 rounded-2xl text-white font-bold px-6 focus:ring-primary">
                        <SelectValue>
                          {estructuras.find(e => e._id === calcEstructura)?.nombre || "Tipo de Negocio"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {estructuras.map(e => (
                          <SelectItem key={e._id} value={e._id} className="py-3 font-bold">
                            {e.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>

                {/* Modelo Selector */}
                <div className="space-y-5">
                  <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 ml-2">Tipo de Prenda / Modelo</Label>
                   <Select value={calcModel} onValueChange={setCalcModel}>
                      <SelectTrigger className="h-16 bg-slate-900 border-white/10 rounded-2xl text-white font-bold px-6 focus:ring-primary">
                        <SelectValue>
                          {modelos.find(m => m._id === calcModel)?.tipoPrenda || "Seleccione el Producto"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {modelos.map(m => (
                          <SelectItem key={m._id} value={m._id} className="py-3 font-bold">
                            {m.tipoPrenda}
                          </SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 ml-2">Textura y Material</Label>
                    <Select value={calcTela} onValueChange={setCalcTela}>
                      <SelectTrigger className="h-16 bg-slate-900 border-white/10 rounded-2xl text-white font-bold px-6">
                        <SelectValue>
                          {telas.find(t => t._id === calcTela)?.nombre || "Materia Prima"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {telas.map(t => (
                          <SelectItem key={t._id} value={t._id} className="font-bold">{t.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-5">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 ml-2">Estilo de Ajuste</Label>
                    <Select value={calcCorte} onValueChange={setCalcCorte}>
                      <SelectTrigger className="h-16 bg-slate-900 border-white/10 rounded-2xl text-white font-bold px-6">
                        <SelectValue>
                          {cortes.find(c => c._id === calcCorte)?.nombre || "Corte"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {cortes.map(c => (
                          <SelectItem key={c._id} value={c._id} className="font-bold">{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-8 bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                  <div className="flex justify-between items-end mb-6">
                    <div className="flex flex-col">
                      <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mb-2">Unidades Totales</Label>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number"
                          value={calcQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) setCalcQty(val);
                          }}
                          min={1}
                          max={100}
                          className="w-24 h-12 bg-slate-900 border-white/10 text-xl font-black text-white focus:ring-primary rounded-xl text-center"
                        />
                        <span className="text-[10px] uppercase opacity-30 font-black tracking-widest text-white">PCS</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mb-2">Saldo Proyectado</Label>
                      <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">
                        ${(estimate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-[9px] font-black text-slate-700 uppercase tracking-widest px-1">
                    <span>Proyectos Exclusivos (1-100)</span>
                    <span>Control de Producción Directo</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center bg-primary/10 rounded-[3rem] p-10 md:p-16 border border-primary/20 relative group transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Factory size={150} className="text-white" />
                </div>
                
                <div className="inline-flex items-center gap-3 bg-primary/20 text-primary px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-12 border border-primary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Cálculo Dinámico Activo
                </div>

                <div className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Presupuesto Sugerido (USD)</div>
                <motion.div 
                  key={estimate}
                  initial={{ scale: 0.9, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="text-8xl md:text-[130px] font-black tracking-tighter text-white mb-10 tabular-nums leading-none drop-shadow-[0_10px_30px_rgba(var(--primary),0.4)]"
                >
                  ${estimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.div>
                
                <div className="bg-slate-900/40 backdrop-blur p-8 rounded-3xl border border-white/5 mb-12 w-full max-w-sm">
                   <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-80 italic">
                     "Términos comerciales basados en el perfil de negocio seleccionado y consumo de materiales certificados."
                   </p>
                </div>

                <Button 
                  onClick={handleFormalizarPropuesta}
                  size="lg"
                  className="w-full h-20 rounded-3xl font-black uppercase tracking-[0.3em] text-xs bg-white text-slate-950 hover:bg-slate-100 shadow-3xl flex items-center justify-center group"
                >
                  Formalizar Propuesta <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* --- Gallery / Showcase Section (Dynamic Background) --- */}
      {showPortfolio && (
        <section id="gallery" className={cn(
          "py-32 relative overflow-hidden transition-colors duration-500", 
          showCalculator ? "bg-white" : "bg-slate-950"
        )}>
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
               <h2 className="text-primary font-black uppercase tracking-[0.4em] text-[11px] mb-6">Portafolio de Entregas</h2>
               <h3 className={cn("text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none", showCalculator ? "text-slate-900" : "text-white")}>
                 Excelencia en <br /> <span className="text-primary">Cada Fibra.</span>
               </h3>
            </div>
            <p className={cn("font-bold uppercase tracking-widest text-[10px] mb-2 border-b-2 border-primary pb-2", showCalculator ? "text-slate-500" : "text-slate-400")}>
              Colecciones Recientes
            </p>
          </div>

          <div className="relative">
            <div className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-hide">
              {portafolioItems.length > 0 ? (
                portafolioItems.map((item, idx) => (
                  <motion.div 
                    key={item._id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="min-w-[300px] md:min-w-[450px] snap-center"
                  >
                    <div className={cn("rounded-[2.5rem] overflow-hidden border shadow-xl group", showCalculator ? "bg-slate-50 border-slate-100" : "bg-slate-900 border-white/5")}>
                      <div className="relative aspect-[4/3] sm:aspect-video lg:aspect-[4/3] overflow-hidden">
                        <img 
                          src={item.imagen} 
                          alt={item.nombreCliente} 
                          className="w-full h-full object-cover sm:object-contain lg:object-cover transition-transform duration-700 group-hover:scale-110 bg-slate-800" 
                        />
                        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-5 py-2 rounded-full shadow-lg">
                           <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.nombreCliente}</span>
                        </div>
                      </div>
                      {item.mostrarTestimonio && item.comentario && (
                        <div className={cn("p-10 border-t italic", showCalculator ? "border-slate-100 text-slate-600 bg-white" : "border-white/5 text-slate-400 bg-slate-950")}>
                           <Quote className="text-primary/20 w-8 h-8 mb-4" />
                           <p className="text-sm font-medium leading-relaxed">
                             "{item.comentario}"
                           </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={cn("flex gap-4 w-full justify-center opacity-30 italic font-medium py-20 rounded-3xl border border-dashed", showCalculator ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-white/10")}>
                  Cargando piezas exclusivas...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* --- Advantages Section (Dynamic Background) --- */}
      <section id="ventajas" className={cn(
        "py-32 transition-colors duration-500", 
        (showPortfolio ? (showCalculator ? false : true) : (showCalculator ? true : false)) ? "bg-white" : "bg-slate-950"
      )}>
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { icon: <ShieldCheck className="w-8 h-8" />, title: 'Calidad Premium', desc: 'Sourcing selectivo de materias primas con estándares internacionales de resistencia y confort.' },
              { icon: <Users className="w-8 h-8" />, title: 'Atención Personalizada', desc: 'Asesoría técnica constante para garantizar que cada diseño supere sus expectativas.' },
              { icon: <Quote className="w-8 h-8" />, title: 'Compromiso y Entrega', desc: 'Cumplimiento riguroso de cronogramas y trazabilidad real del avance de su producción.' },
            ].map((adv, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={cn("w-24 h-24 border shadow-2xl rounded-[2.5rem] flex items-center justify-center text-primary mb-10 group-hover:rotate-12 transition-transform", showCalculator ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-100")}>
                  {adv.icon}
                </div>
                <h4 className={cn("text-2xl font-black uppercase tracking-tighter mb-5 italic", showCalculator ? "text-white" : "text-slate-900")}>{adv.title}</h4>
                <p className={cn("font-medium text-sm leading-relaxed max-w-xs transition-colors", showCalculator ? "text-slate-500 group-hover:text-slate-400" : "text-slate-500 group-hover:text-slate-600")}>{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Contact Section --- */}
      <section id="contacto" className="py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div>
                <h2 className="text-primary font-black uppercase tracking-[0.5em] text-[11px] mb-6">Contáctenos</h2>
                <h3 className="text-6xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none italic mb-8">
                  Hablemos de su <br /> <span className="text-primary">Proyecto.</span>
                </h3>
                <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed">
                  Estamos listos para llevar su visión al siguiente nivel con precisión técnica y calidad garantizada.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-8 pt-6 border-t border-white/5">
                  <h4 className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Redes Sociales</h4>
                  <div className="flex items-center gap-4">
                    {socialConfig.urlInstagram && (
                      <a href={socialConfig.urlInstagram} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/5 hover:bg-primary hover:text-white border border-white/10 rounded-2xl flex items-center justify-center transition-all text-slate-400">
                        <Instagram size={20} />
                      </a>
                    )}
                    {socialConfig.urlFacebook && (
                      <a href={socialConfig.urlFacebook} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/5 hover:bg-primary hover:text-white border border-white/10 rounded-2xl flex items-center justify-center transition-all text-slate-400">
                        <Facebook size={20} />
                      </a>
                    )}
                    {socialConfig.urlTiktok && (
                      <a href={socialConfig.urlTiktok} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/5 hover:bg-primary hover:text-white border border-white/10 rounded-2xl flex items-center justify-center transition-all text-slate-400">
                        <Share2 size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl relative border border-slate-100">
              <div className="absolute -top-6 -right-6 bg-primary text-white w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl shadow-primary/30 z-20">
                <Sparkles size={32} />
              </div>
              
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</Label>
                    <Input 
                      ref={nombreInputRef}
                      required
                      placeholder="Ej: Juan Pérez"
                      className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 font-bold px-6 focus:ring-primary"
                      value={contactForm.nombre}
                      onChange={e => setContactForm({ ...contactForm, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa</Label>
                    <Input 
                      required
                      placeholder="Nombre de su negocio"
                      className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 font-bold px-6 focus:ring-primary"
                      value={contactForm.empresa}
                      onChange={e => setContactForm({ ...contactForm, empresa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</Label>
                    <Input 
                      required
                      placeholder="+58 412..."
                      className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 font-bold px-6 focus:ring-primary"
                      value={contactForm.telefono}
                      onChange={e => setContactForm({ ...contactForm, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <Input 
                      required
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 font-bold px-6 focus:ring-primary"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mensaje o Petición</Label>
                  <textarea 
                    required
                    placeholder="Cuéntenos sobre su requerimiento..."
                    className="w-full min-h-[150px] bg-slate-50 border border-slate-100 rounded-3xl p-6 text-slate-900 font-medium focus:ring-primary outline-none transition-all"
                    value={contactForm.mensaje}
                    onChange={e => setContactForm({ ...contactForm, mensaje: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={sendingContact}
                  className="w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  {sendingContact ? 'Enviando...' : (contactSuccess ? '¡Mensaje Enviado!' : 'Solicitar Información')}
                </Button>

                {contactSuccess && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs font-bold text-primary uppercase tracking-widest"
                  >
                    Gracias por contactarnos. Le responderemos a la brevedad.
                  </motion.p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- Acceso / Login Section (Dynamic Background) --- */}
      <section id="acceso" className={cn(
        "py-32 relative transition-colors duration-500", 
        (showPortfolio ? (showCalculator ? true : false) : (showCalculator ? false : true)) ? "bg-white" : "bg-slate-950"
      )}>
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
           <div className={cn("rounded-[4rem] border flex flex-col lg:flex-row shadow-2xl overflow-hidden min-h-[750px]", showCalculator ? "bg-slate-50 border-slate-100" : "bg-slate-900 border-white/5")}>
              <div className="lg:w-1/2 p-16 md:p-24 flex flex-col justify-center bg-slate-900 text-white relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {contactImages.length > 0 && (
                    <motion.div
                      key={contactImages[currentContactIdx]._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      <img 
                        src={contactImages[currentContactIdx].base64Data} 
                        className="w-full h-full object-cover" 
                        alt="Background" 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="relative z-10">
                  <h2 className="text-primary font-black uppercase tracking-[0.5em] text-[11px] mb-8">Nuestra Promesa</h2>
                <h3 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85] uppercase mb-12">
                   Calidad <br /> de Diseño <br /> <span className="text-primary italic">Certificada.</span>
                </h3>
            <div className="space-y-10">
              {[
                'Atención Técnica Especializada',
                'Monitoreo de Avance de Producción',
                'Materiales Certificados de Alta Gama',
                'Garantía de Satisfacción Total'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-6 text-slate-300 font-bold text-lg uppercase tracking-tight group cursor-default">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-lg group-hover:shadow-primary/40 group-hover:-translate-y-1">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="group-hover:text-white transition-colors">{item}</span>
                </div>
              ))}
            </div>
                </div>
              </div>

            <div className="lg:w-1/2 p-10 md:p-24 flex items-center justify-center relative bg-white">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] pointer-events-none" />
                <div className="relative z-10 w-full max-w-lg">
                   <div className="text-center mb-10 lg:hidden">
                      <h2 className="text-2xl font-black text-slate-900 uppercase">Panel de Acceso</h2>
                   </div>
                   <LoginForm />
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 bg-slate-950 border-t border-white/5">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden p-1">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Factory className="text-slate-950 w-6 h-6" />
                )}
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">{companyName}</span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-x-10 gap-y-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              {footerElements.map((el) => (
                <span 
                  key={el._id}
                  className="hover:text-white cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedFooterEl(el);
                    setShowDataProtection(true);
                  }}
                >
                  {el.nombreElemento}
                </span>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-black text-slate-600 tracking-[0.2em] uppercase text-center md:text-right space-y-2">
            <div>© {new Date().getFullYear()} Todos los derechos reservados.</div>
            <div className="text-slate-400">
              Desarrollado por: Ing. Miguel Mota,{' '}
              <a 
                href="https://ing-ti-miguelmota.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                Desarrollo de Sistemas Creativos
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Dynamic Information Modal --- */}
      <Dialog open={showDataProtection} onOpenChange={setShowDataProtection}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-white rounded-[3rem] shadow-2xl">
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-8 md:p-10 bg-slate-900 relative shrink-0">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <ShieldAlert size={150} />
               </div>
               <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 uppercase tracking-[0.3em] font-black text-[9px] px-3 py-0.5">
                  Seguridad Institucional
               </Badge>
               <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic leading-tight">
                  {selectedFooterEl?.tituloTexto || 'Información Institucional'}
               </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white prose prose-slate max-w-none prose-sm lg:prose-base prose-p:text-slate-600 prose-headings:text-slate-900 prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-900">
               <ReactMarkdown>
                  {selectedFooterEl?.cuerpoTexto || ''}
               </ReactMarkdown>
            </div>

            <div className="p-8 bg-slate-50 flex justify-end shrink-0 border-t border-slate-100">
               <Button 
                onClick={() => setShowDataProtection(false)}
                className="rounded-2xl h-12 px-10 font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white hover:bg-slate-800"
               >
                 Entendido y Aceptar
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Contact Success Message Popup --- */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-white rounded-[3rem] shadow-2xl">
          <div className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-lg shadow-primary/20">
               <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
               <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.3em] font-black text-[9px] px-3 py-1">
                  Enviado con Éxito
               </Badge>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                  ¡Mensaje <br /> Registrado!
               </h2>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Su solicitud de información ha sido recibida correctamente. Uno de nuestros asesores corporativos se pondrá en contacto con usted a la brevedad.
            </p>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
