import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import { loginWithGoogle, logout } from '@/firebase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    
    try {
      console.log(`Intentando conectar con API: /api/users/email/${cleanEmail}`);
      // 1. Verify if user exists and is active in MongoDB
      const res = await fetch(`/api/users/email/${cleanEmail}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Respuesta de API recibida:", data);
        if (data.estado === 'Activo') {
          // 2. Proceed with Google Login
          try {
            await loginWithGoogle(cleanEmail);
            navigate('/');
          } catch (loginErr: any) {
            console.error("Login mapping error:", loginErr);
            if (loginErr.code === 'auth/popup-closed-by-user') {
              setError('Inicio de sesión cancelado por el usuario.');
            } else if (loginErr.code === 'auth/popup-blocked') {
              setError('El navegador bloqueó la ventana emergente. Por favor, permita las ventanas emergentes para este sitio.');
            } else {
              setError('Error al iniciar sesión con Google.');
            }
          }
        } else {
          setError(`Acceso denegado. El usuario se encuentra: ${data.estado}.`);
        }
      } else {
        const errorText = await res.text();
        console.warn(`API retornó error ${res.status}:`, errorText);
        setError('Este correo no está registrado en el sistema.');
      }
    } catch (err: any) {
      console.error("Error de red/fetch:", err);
      setError(`Error de conexión al verificar el usuario: ${err.message || 'Desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">TG-Publieventos</CardTitle>
          <CardDescription>
            Ingrese su correo para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico (Cuenta de Google)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                <><svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg> Continuar con Google</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
