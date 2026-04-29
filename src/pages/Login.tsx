import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import { loginWithGoogle } from '@/firebase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

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
        
        // 1. VALIDACIÓN TÉCNICA DEL SERVIDOR: ¿Estamos recibiendo datos o la web principal?
        if (!contentType || !contentType.includes("application/json") || responseText.toLowerCase().startsWith('<!doctype html')) {
          addStep("!! ERROR DE INFRAESTRUCTURA: El servidor devolvió HTML en una ruta de datos.");
          throw new Error("ERROR_CONFIGURACION_SERVIDOR: El servidor en Render está mal configurado y devolvió el index.html en lugar de JSON. Detener proceso.");
        }

        let data;
        try {
          addStep("PROCESANDO: Parseando respuesta JSON...");
          data = JSON.parse(responseText);
          addStep("ÉXITO: Perfil de usuario cargado.");
        } catch (jsonErr) {
          addStep("!! ERROR DE SERIALIZACIÓN: Los datos no son un JSON válido.");
          throw new Error("ERROR_DATOS_CORRUPTOS: La respuesta del servidor no tiene un formato válido para procesar el acceso.");
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
              setError('⚠️ VENTANA BLOQUEADA: Tu navegador bloqueó la ventana de autenticación de Google. Por favor, habilite las ventanas emergentes en la configuración de su navegador para este sitio e intente de nuevo.');
            } else if (loginErr.code === 'auth/popup-closed-by-user') {
              setError('El inicio de sesión fue cancelado al cerrar la ventana de Google.');
            } else {
              setError(`Error de autenticación: ${loginErr.message}`);
            }
          }
        } else {
          addStep(`!! BLOQUEADO: Estado de cuenta: ${data.estado}`);
          setError(`Acceso restringido: Su cuenta está '${data.estado}'. Contacte a Soporte.`);
        }
      } else {
        addStep(`!! FALLA API: Estatus ${res.status}`);
        const errorText = await res.text();
        
        if (errorText.toLowerCase().includes('<!doctype html')) {
          setError('❌ ERROR DE ENRUTAMIENTO: El servidor no detectó la API y devolvió la página web principal. Verifique la configuración del backend.');
        } else {
          setError('El correo institucional no está registrado en el sistema de Publieventos.');
        }
      }
    } catch (err: any) {
      addStep(`!! INTERRUPCIÓN CRÍTICA: ${err.message}`);
      
      if (err.message.includes('ERROR_CONFIGURACION_SERVIDOR') || err.message.includes('Unexpected token') || err.message.includes('<!doctype')) {
        setError('❌ FALLA DE SISTEMA: El servidor devolvió HTML en una ruta de datos. Esto indica que el proceso en Render no está ruteando las peticiones a la API correctamente.');
      } else if (err.message.includes('POPUP_BLOQUEADO')) {
        setError(err.message);
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
                className="h-12 border-slate-200 focus:border-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
                <div className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {steps.length > 0 && (
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono shadow-inner border border-slate-800 overflow-hidden">
                <div className="mb-2 border-b border-slate-700 pb-1 flex justify-between">
                  <span>SYSTEM_MONITOR</span>
                  <span className="animate-pulse">● LIVE</span>
                </div>
                {steps.map((step, idx) => (
                  <div key={idx} className={`${step.includes('!!') ? 'text-red-400' : ''}`}>
                    {">"} {step}
                  </div>
                ))}
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
    </div>
  );
};

export default Login;
