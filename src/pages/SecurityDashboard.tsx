/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Monitor, Smartphone, Tablet, Globe, Clock, Search, BarChart3, Fingerprint } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SecurityDashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch('/api/security'),
        fetch('/api/security/stats')
      ]);
      if (logsRes.ok) setLogs(await logsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error("Error fetching security data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip?.includes(searchTerm) ||
    log.deviceType?.includes(searchTerm)
  );

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  const chartData = stats?.byDevice?.map((d: any) => ({
    name: d._id === 'desktop' ? 'Desktop' : d._id === 'mobile' ? 'Móvil' : 'Tablet',
    value: d.count
  })) || [];

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8" />
            Auditoría de Seguridad
          </h1>
          <p className="text-muted-foreground">Monitoreo de intentos de acceso no autorizados y análisis forense.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-100 bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Intentos</CardTitle>
            <ShieldAlert size={16} className="text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Registros históricos detectados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Zonas Horarias</CardTitle>
            <Globe size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{[...new Set(logs.map(l => l.timezone))].length}</div>
            <p className="text-xs text-muted-foreground">Ubicaciones distintas detectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emails Afectados</CardTitle>
            <Search size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byEmail?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Cuentas objetivo únicas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex gap-2">
            <Fingerprint size={16} /> Detalle Forense
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex gap-2">
            <BarChart3 size={16} /> Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Accesos Bloqueados</CardTitle>
                  <CardDescription>Datos recolectados del navegador y dispositivo del atacante.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por email, IP..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha / Hora</TableHead>
                    <TableHead>Email Intentado</TableHead>
                    <TableHead>IP Origen</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Zona Horaria</TableHead>
                    <TableHead>Forensia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Cargando registros...</TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">No hay registros de seguridad.</TableCell>
                    </TableRow>
                  ) : filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Clock size={12} />
                          {new Date(log.attemptDate).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">{log.email}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getDeviceIcon(log.deviceType)}
                          {log.deviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.timezone}</TableCell>
                      <TableCell>
                        <div className="text-[10px] text-muted-foreground leading-tight max-w-[200px] truncate" title={log.userAgent}>
                          {log.browser} | {log.os} | {log.resolution}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Frecuencia por Dispositivo</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Emails Objetivo</CardTitle>
                <CardDescription>Cuentas más atacadas en el sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.byEmail?.map((e: any) => (
                    <div key={e._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="text-sm font-medium">{e._id}</div>
                      <Badge variant="destructive">{e.count} intentos</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
