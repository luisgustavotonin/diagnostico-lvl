import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Clock } from 'lucide-react';

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
    
    // Inicializar todos os dias como fechado
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
  }, [schedule, onChange]);

  const validatePeriod = (dayKey, periodIndex, field, newValue) => {
    const dayData = schedule[dayKey];
    const periodo = dayData.periodos[periodIndex];
    
    const inicio = field === 'inicio' ? newValue : periodo.inicio;
    const fim = field === 'fim' ? newValue : periodo.fim;

    if (inicio && fim && inicio >= fim) {
      setErrors(prev => ({
        ...prev,
        [`${dayKey}-${periodIndex}`]: 'Horário final deve ser maior que o inicial'
      }));
      return false;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${dayKey}-${periodIndex}`];
      return newErrors;
    });
    return true;
  };

  const toggleDay = (dayKey) => {
    setSchedule(prev => {
      const isCurrentlyOpen = prev[dayKey]?.aberto;
      
      return {
        ...prev,
        [dayKey]: {
          aberto: !isCurrentlyOpen,
          periodos: !isCurrentlyOpen ? [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '18:00' }] : []
        }
      };
    });
  };

  const updatePeriod = (dayKey, index, field, value) => {
    setSchedule(prev => {
      const dayData = prev[dayKey];
      const newPeriodos = [...dayData.periodos];
      newPeriodos[index] = { ...newPeriodos[index], [field]: value };
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          periodos: newPeriodos
        }
      };
    });

    validatePeriod(dayKey, index, field, value);
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

  const removePeriod = (dayKey, index) => {
    setSchedule(prev => {
      const dayData = prev[dayKey];
      const newPeriodos = dayData.periodos.filter((_, i) => i !== index);
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          periodos: newPeriodos
        }
      };
    });

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${dayKey}-${index}`];
      return newErrors;
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Horário de atendimento</h3>
      {DAYS.map(day => {
        const dayData = schedule[day.key] || { aberto: false, periodos: [] };
        const isOpen = dayData.aberto;
        
        return (
          <Card key={day.key} className="p-5 border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium text-slate-800">{day.label}</Label>
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
              <div className="space-y-2 mt-4">
                {dayData.periodos.map((periodo, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="time"
                          value={periodo.inicio}
                          onChange={(e) => updatePeriod(day.key, index, 'inicio', e.target.value)}
                          className={`pl-10 ${errors[`${day.key}-${index}`] ? 'border-red-500' : ''}`}
                        />
                      </div>
                      <span className="text-slate-500 text-sm">até</span>
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="time"
                          value={periodo.fim}
                          onChange={(e) => updatePeriod(day.key, index, 'fim', e.target.value)}
                          className={`pl-10 ${errors[`${day.key}-${index}`] ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {dayData.periodos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePeriod(day.key, index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors[`${day.key}-${index}`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${day.key}-${index}`]}</p>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPeriod(day.key)}
                  className="w-full mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar período
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}