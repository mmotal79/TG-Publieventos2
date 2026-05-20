/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  DollarSign,
  Loader2,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Wallet
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="px-1 md:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Panel de Control</h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Información real del sistema de gestión de TG-Publieventos.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {(data?.stats || []).map((stat: any) => {
          const Icon = iconMap[stat.icon] || TrendingUp;
          return (
            <Card key={stat.title} className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
                <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {stat.title}
                </CardTitle>
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight italic">Historial de Ventas</CardTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimos 6 meses de facturación</p>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px] px-2 sm:px-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight italic">Avance de Producción</CardTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado por fase operativa</p>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {(data?.production || []).map((phase: any) => (
                <div key={phase.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{phase.name}</span>
                    <span className="text-sm font-black italic">{phase.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${phase.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-primary" 
                    />
                  </div>
                </div>
              ))}
              {(!data?.production || data.production.length === 0) && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                  <Clock size={40} className="mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin procesos activos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
