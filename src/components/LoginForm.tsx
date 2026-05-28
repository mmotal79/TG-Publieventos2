import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, ShieldAlert } from 'lucide-react';
import { loginWithGoogle } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [showAuthConsole, setShowAuthConsole] = useState(true);

  React.useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        if (config && config.showAuthConsole === false) {
          setShowAuthConsole(false);
        }
      })
      .catch(err => console.error("Error setting console visibility config:", err));
  }, []);

  const addStep = (msg: string) => {
    setSteps(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    console.log(`[MONITOR] ${msg}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSteps([]);
    
    if (!email) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    
    try {
      addStep(`INICIO: Consultando cuenta ${cleanEmail}`);
      addStep("ENVIANDO: Petición a /api/users/email/...");
      
      const res = await fetch(`/api/users/email/${cleanEmail}`);
      addStep(`RECIBIDO: Estatus HTTP ${res.status}`);
      
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        const responseText = await res.text();
        
        if (!contentType || !contentType.includes("application/json") || responseText.toLowerCase().startsWith('<!doctype html')) {
          addStep("!! ERROR DE INFRAESTRUCTURA: El servidor devolvió HTML en una ruta de datos.");
          throw new Error("ERROR_CONFIGURACION_SERVIDOR: El servidor en Render está mal configurado y devolvió el index.html en lugar de JSON.");
        }

        let data;
        try {
          addStep("PROCESANDO: Parseando respuesta JSON...");
          data = JSON.parse(responseText);
          addStep("ÉXITO: Perfil de usuario cargado.");
        } catch (jsonErr) {
          addStep("!! ERROR DE SERIALIZACIÓN: Los datos no son un JSON válido.");
          throw new Error("ERROR_DATOS_CORRUPTOS: La respuesta del servidor no tiene un formato válido.");
        }

        if (data.estado === 'Activo') {
          addStep(`VALIDADO: Usuario '${data.nombre}' está activo.`);
          addStep("GOOGLE AUTH: Abriendo ventana emergente de identidad...");
          try {
            await loginWithGoogle(cleanEmail);
            addStep("AUTENTICADO: Identidad verificada. Preparando entrada...");
            navigate('/');
          } catch (loginErr: any) {
            addStep(`!! FALLA GOOGLE: ${loginErr.code || loginErr.message}`);
            if (loginErr.code === 'auth/popup-blocked') {
              setError('⚠️ VENTANA BLOQUEADA: Habilite las ventanas emergentes en su navegador.');
            } else if (loginErr.code === 'auth/popup-closed-by-user') {
              setError('El inicio de sesión fue cancelado.');
            } else {
              setError(`Error de autenticación: ${loginErr.message}`);
            }
          }
        } else {
          addStep(`!! BLOQUEADO: Estado de cuenta: ${data.estado}`);
          setError(`Acceso restringido: Su cuenta está '${data.estado}'.`);
        }
      } else {
        addStep(`!! FALLA API: Estatus ${res.status}`);
        const errorText = await res.text();
        
        if (errorText.toLowerCase().includes('<!doctype html')) {
          setError('❌ ERROR DE ENRUTAMIENTO: El servidor no detectó la API.');
        } else {
          const detectDevice = () => {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
            return "desktop";
          };

          const logSecurityAlert = async () => {
            try {
              const forensicData = {
                email: email,
                userAgent: navigator.userAgent,
                deviceType: detectDevice(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                resolution: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                attemptDate: new Date().toISOString()
              };
              await fetch('/api/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(forensicData)
              });
            } catch (e) {
              console.error("Failed to log security event:", e);
            }
          };

          logSecurityAlert();
          setError('El correo institucional no está registrado.');
          setShowSecurityAlert(true);
        }
      }
    } catch (err: any) {
      addStep(`!! INTERRUPCIÓN CRÍTICA: ${err.message}`);
      setError(`Error crítico: ${err.message || 'El servicio no responde'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-2xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">TG-Publieventos</CardTitle>
          <CardDescription className="font-medium text-slate-500">
            Plataforma de Control Textil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                Acceso Colaborador
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@publieventos.com" 
                className="h-12 border-slate-200 focus:ring-primary focus:border-primary transition-all rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {showAuthConsole && steps.length > 0 && (
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[9px] font-mono shadow-inner border border-slate-800 overflow-hidden max-h-32 overflow-y-auto">
                <div className="mb-2 border-b border-slate-700 pb-1 flex justify-between">
                  <span className="opacity-50">AUTH_MONITOR</span>
                  <span className="animate-pulse">●</span>
                </div>
                {steps.map((step, idx) => (
                  <div key={idx} className={`${step.includes('!!') ? 'text-rose-400' : ''}`}>
                    {">"} {step}
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verificando...</>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Entrar con Google</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showSecurityAlert} onOpenChange={setShowSecurityAlert}>
        <DialogContent className="sm:max-w-md border-rose-200 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2 font-black uppercase tracking-tighter text-xl">
              <ShieldAlert className="w-8 h-8" />
              Alerta de Seguridad
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-900 font-bold mb-3">
              Intento de acceso no autorizado registrado.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              El correo <span className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-bold">{email}</span> no está en nuestro directorio central.
              <br /><br />
              Este evento ha sido geo-localizado y reportado automáticamente al centro de monitoreo. Si es un error, contacte a TI.
            </p>
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full rounded-xl font-black uppercase text-xs tracking-widest h-12" onClick={() => setShowSecurityAlert(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
