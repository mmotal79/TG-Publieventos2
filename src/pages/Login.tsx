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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);

  const updateProgress = (percentage: number) => {
    setProgress(percentage);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProgress(0);
    
    if (!email) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    
    try {
      updateProgress(10); // Inicio
      
      const res = await fetch(`/api/users/email/${cleanEmail}`);
      updateProgress(40); // Petición enviada
      
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        const responseText = await res.text();
        updateProgress(60); // Respuesta recibida
        
        // 1. VALIDACIÓN TÉCNICA
        if (!contentType || !contentType.includes("application/json") || responseText.toLowerCase().startsWith('<!doctype html')) {
          throw new Error("ERROR_CONFIGURACION_SERVIDOR");
        }

        let data;
        try {
          data = JSON.parse(responseText);
          updateProgress(80); // Datos procesados
        } catch (jsonErr) {
          throw new Error("ERROR_DATOS_CORRUPTOS");
        }

        if (data.estado === 'Activo') {
          try {
            await loginWithGoogle(cleanEmail);
            updateProgress(100); // Finalizado
            navigate('/');
          } catch (loginErr: any) {
            if (loginErr.code === 'auth/popup-blocked') {
              setError('⚠️ VENTANA BLOQUEADA: Tu navegador bloqueó la ventana de autenticación de Google. Por favor, habilite las ventanas emergentes.');
            } else if (loginErr.code === 'auth/popup-closed-by-user') {
              setError('El inicio de sesión fue cancelado al cerrar la ventana de Google.');
            } else {
              setError(`Error de autenticación: ${loginErr.message}`);
            }
          }
        } else {
          setError(`Acceso restringido: Su cuenta está '${data.estado}'. Contacte a Soporte.`);
        }
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
          } catch (e) {}
        };

        logSecurityAlert();
        setError('El correo institucional no está registrado en el sistema.');
        setShowSecurityAlert(true);
      }
    } catch (err: any) {
      if (err.message.includes('ERROR_CONFIGURACION_SERVIDOR') || err.message.includes('Unexpected token') || err.message.includes('<!doctype')) {
        setError('❌ FALLA DE SISTEMA: El servidor no está ruteando correctamente.');
      } else {
        setError(`Error crítico: ${err.message || 'El servicio no responde'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">TG-Publieventos</CardTitle>
          <CardDescription>
            Plataforma de Control de Personal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Correo Institucional
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ejemplo@gmail.com" 
                className="h-12 border-slate-200 focus:border-primary transition-all text-base md:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
                autoComplete="email"
                inputMode="email"
              />
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="space-y-2 py-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                  <span>Validando acceso...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-md font-medium shadow-md hover:shadow-lg transition-all" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
              ) : (
                <><svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg> Ingresar con Google</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showSecurityAlert} onOpenChange={setShowSecurityAlert}>
        <DialogContent className="sm:max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" />
              Alerta de Seguridad
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700 font-medium mb-2">
              Se ha detectado un intento de acceso no autorizado.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              El correo ingresado <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600 font-mono">{email}</code> no está registrado en nuestro componente de usuarios. 
              <br /><br />
              Esta acción ha sido registrada como un <strong>intento de violación de la seguridad</strong>. Si usted es personal autorizado y ha recibido este mensaje por error, por favor informe a su supervisor o al departamento de TI inmediatamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full" onClick={() => setShowSecurityAlert(false)}>
              Reconocido y Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
