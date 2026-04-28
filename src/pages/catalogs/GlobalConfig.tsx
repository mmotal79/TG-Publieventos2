/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Building2, 
  Phone, 
  CreditCard, 
  Image as ImageIcon, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { GlobalConfig } from '@/types';

export default function GlobalConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, reset, watch, formState: { isDirty } } = useForm<GlobalConfig>({
    defaultValues: {
      nombreComercial: '',
      razonSocial: '',
      rif: '',
      telefonoCorporativo: '',
      informacionPago: '',
      logoBase64: ''
    }
  });

  const logoBase64 = watch('logoBase64');

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (logoBase64) {
      setLogoPreview(logoBase64);
    }
  }, [logoBase64]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        reset(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Imagen muy pesada",
          description: "El logo debe ser menor a 2MB para asegurar rendimiento.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setValue('logoBase64', base64String, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue('logoBase64', '', { shouldDirty: true });
  };

  const onSubmit = async (data: GlobalConfig) => {
    setSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: "Configuración Guardada",
          description: "Los datos de la empresa se han actualizado correctamente.",
        });
        reset(data); // Mark as not dirty
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "Vuelva a intentarlo en unos momentos.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground italic">Gestione la identidad corporativa y datos operativos de la empresa.</p>
        </div>
        <Button 
          onClick={handleSubmit(onSubmit)} 
          disabled={saving || !isDirty}
          className="w-full md:w-auto shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Logo */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
              <ImageIcon size={16} /> Logo Institucional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-slate-50 min-h-[220px] transition-colors hover:bg-slate-100/50">
              {logoPreview ? (
                <div className="relative group w-full flex flex-col items-center">
                  <div className="w-full aspect-square bg-white rounded-md border flex items-center justify-center overflow-hidden mb-4 p-2 shadow-sm">
                    <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={removeLogo}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Logo
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-4 w-full">
                  <div className="bg-white p-4 rounded-full shadow-sm border border-slate-200">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-primary block">Subir Logo</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG o SVG (Máx. 2MB)</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <div className="bg-amber-50 p-3 rounded border border-amber-100 flex gap-2">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800">
                Este logo se usará automáticamente en todos los presupuestos PDF y reportes del sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Fields */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
              <Building2 size={16} /> Perfil Corporativo
            </CardTitle>
            <CardDescription>Información legal y comercial para documentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                <Input id="nombreComercial" {...register('nombreComercial')} placeholder="Ej: T&G Publieventos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rif">RIF / Identificación Fiscal</Label>
                <Input id="rif" {...register('rif')} placeholder="J-12345678-0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social Completa</Label>
              <Input id="razonSocial" {...register('razonSocial')} placeholder="Ej: Inversiones T&G C.A." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefonoCorporativo" className="flex items-center gap-2">
                <Phone size={14} /> WhatsApp / Teléfono Corporativo
              </Label>
              <Input id="telefonoCorporativo" {...register('telefonoCorporativo')} placeholder="+58 414..." />
              <p className="text-[10px] text-muted-foreground">Formato internacional requerido para integración con mensajes automáticos.</p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="informacionPago" className="flex items-center gap-2">
                <CreditCard size={14} /> Información de Pago (Aparecerá en Cobros)
              </Label>
              <Textarea 
                id="informacionPago" 
                {...register('informacionPago')} 
                placeholder="Banco: Banesco&#10;Cuenta: 0134...&#10;Titular: Inversiones T&G&#10;Zelle: pagos@tg.com" 
                className="min-h-[150px] font-mono text-sm bg-slate-50"
              />
              <div className="flex items-center gap-2 text-[10px] text-blue-600 font-medium">
                <CheckCircle2 size={12} /> Esta información se adjunta automáticamente a las notificaciones de cobro.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isDirty && (
        <div className="fixed bottom-6 right-6 md:hidden">
           <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={saving}
            size="lg"
            className="rounded-full h-14 w-14 p-0 shadow-2xl"
          >
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
          </Button>
        </div>
      )}
    </div>
  );
}
