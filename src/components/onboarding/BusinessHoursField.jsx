import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Clock } from 'lucide-react';

const DAYS = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export default function BusinessHoursField({ value, onChange }) {
  const [schedule, setSchedule] = useState(() => {
    if (value && typeof value === 'object' && Object.keys(value).length > 0) {
      return value;
    }
    
    const initial = {};
    DAYS.forEach(day => {
      initial[day.key] = {
        aberto: false,
        periodos: []
      };
    });
    return initial;
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (onChange) {
      onChange(schedule);
    }
  }, [schedule]);

  const toggleDay = (dayKey) => {
    setSchedule(prev => {
      const isCurrentlyOpen = prev[dayKey]?.aberto;
      
      return {
        ...prev,
        [dayKey]: {
          aberto: !isCurrentlyOpen,
          periodos: !isCurrentlyOpen ? [{ inicio: '08:00', fim: '18:00' }] : []
        }
      };
    });
  };

  const updatePeriod = (dayKey, index, field, newValue) => {
    setSchedule(prev => {
      const dayData = prev[dayKey];
      const newPeriodos = [...dayData.periodos];
      newPeriodos[index] = { ...newPeriodos[index], [field]: newValue };
      
      const periodo = newPeriodos[index];
      if (periodo.inicio && periodo.fim && periodo.inicio >= periodo.fim) {
        setErrors(e => ({ ...e, [`${dayKey}-${index}`]: 'Horário final deve ser maior que o inicial' }));
      } else {
        setErrors(e => {
          const newErrors = { ...e };
          delete newErrors[`${dayKey}-${index}`];
          return newErrors;
        });
      }
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          periodos: newPeriodos
        }
      };
    });
  };

  const addPeriod = (dayKey) => {
    setSchedule(prev => {
      const dayData = prev[dayKey];
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          periodos: [...dayData.periodos, { inicio: '08:00', fim: '18:00' }]
        }
      };
    });
  };

  return (
    <div className="space-y-3">
      {DAYS.map(day => {
        const dayData = schedule[day.key] || { aberto: false, periodos: [] };
        const isOpen = dayData.aberto;
        
        return (
          <div key={day.key} className="border border-slate-200 rounded-lg bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium text-slate-700">{day.label}</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {isOpen ? 'Aberto' : 'Fechado'}
                </span>
                <Switch
                  checked={isOpen}
                  onCheckedChange={() => toggleDay(day.key)}
                />
              </div>
            </div>

            {isOpen && (
              <div className="space-y-3 pl-0">
                {dayData.periodos.map((periodo, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="time"
                          value={periodo.inicio}
                          onChange={(e) => updatePeriod(day.key, index, 'inicio', e.target.value)}
                          className={`pl-10 ${errors[`${day.key}-${index}`] ? 'border-red-500' : ''}`}
                        />
                      </div>
                      
                      <span className="text-slate-500 text-sm font-medium">até</span>
                      
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="time"
                          value={periodo.fim}
                          onChange={(e) => updatePeriod(day.key, index, 'fim', e.target.value)}
                          className={`pl-10 ${errors[`${day.key}-${index}`] ? 'border-red-500' : ''}`}
                        />
                      </div>
                    </div>
                    {errors[`${day.key}-${index}`] && (
                      <p className="text-xs text-red-500 mt-1 ml-1">{errors[`${day.key}-${index}`]}</p>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPeriod(day.key)}
                  className="w-full mt-2 text-slate-600 hover:text-slate-900 border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar período
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}