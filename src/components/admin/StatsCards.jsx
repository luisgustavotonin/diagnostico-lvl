import React from 'react';
import { Card } from "@/components/ui/card";
import { Building2, CheckCircle2, Clock } from 'lucide-react';

export default function StatsCards({ projects }) {
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'COMPLETED').length;
  const inProgress = projects.filter(p => p.status === 'IN_PROGRESS').length;

  const stats = [
    {
      label: 'Total de Unidades',
      value: total,
      icon: Building2,
      color: 'bg-slate-100 text-slate-600'
    },
    {
      label: 'Concluídos',
      value: completed,
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      label: 'Em Andamento',
      value: inProgress,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-6 border-0 shadow-md">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}