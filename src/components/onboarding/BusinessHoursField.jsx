import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Clock } from 'lucide-react';

const DAYS = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' }
];

const DEFAULT_HOURS = [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }];

export default function BusinessHoursField({ value, onChange }) {
  const [schedule, setSchedule] = useState(() => {
    if (value && typeof value === 'object' && Object.keys(value).length > 0) {
      return value;
    }
    
    // Inicializar com horário padrão para todos os dias
    const initial = {};
    DAYS.forEach(day => {
      initial[day.key] = {
        open: true,
        hours: [...DEFAULT_HOURS]
      };
    });
    return initial;
  });

  useEffect(() => {
    if (JSON.stringify(schedule) !== JSON.stringify(value)) {
      onChange(schedule);
    }
  }, [schedule]);

  const toggleDay = (dayKey) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        open: !prev[dayKey]?.open
      }
    }));
  };

  const updateHours = (dayKey, index, field, value) => {
    setSchedule(prev => {
      const dayData = prev[dayKey] || { open: true, hours: [...DEFAULT_HOURS] };
      const newHours = [...dayData.hours];
      newHours[index] = { ...newHours[index], [field]: value };
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          hours: newHours
        }
      };
    });
  };

  const addInterval = (dayKey) => {
    setSchedule(prev => {
      const dayData = prev[dayKey] || { open: true, hours: [...DEFAULT_HOURS] };
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          hours: [...dayData.hours, { start: '08:00', end: '18:00' }]
        }
      };
    });
  };

  const removeInterval = (dayKey, index) => {
    setSchedule(prev => {
      const dayData = prev[dayKey];
      const newHours = dayData.hours.filter((_, i) => i !== index);
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          hours: newHours.length > 0 ? newHours : [...DEFAULT_HOURS]
        }
      };
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Horário de atendimento</h3>
      {DAYS.map(day => {
        const dayData = schedule[day.key] || { open: false, hours: [...DEFAULT_HOURS] };
        const isOpen = dayData.open;
        
        return (
          <Card key={day.key} className="p-4 border border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-slate-700">{day.label}</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isOpen ? 'text-teal-600' : 'text-slate-400'}`}>
                    {isOpen ? 'Aberto' : 'Fechado'}
                  </span>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={() => toggleDay(day.key)}
                  />
                </div>
              </div>

              {isOpen && (
                <div className="space-y-2">
                  {dayData.hours.map((interval, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="time"
                          value={interval.start}
                          onChange={(e) => updateHours(day.key, index, 'start', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <span className="text-slate-500 text-sm">até</span>
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="time"
                          value={interval.end}
                          onChange={(e) => updateHours(day.key, index, 'end', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {dayData.hours.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInterval(day.key, index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addInterval(day.key)}
                    className="w-full mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar período
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}