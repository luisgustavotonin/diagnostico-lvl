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
          periodos: !isCurrentlyOpen ? [{ inicio: '08:00', fim: '18:00' }] : []
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
    <div className="space-y-2">
      {DAYS.map(day => {
        const dayData = schedule[day.key] || { aberto: false, periodos: [] };
        const isOpen = dayData.aberto;
        
        return (
          <div key={day.key} className="border border-slate-200 rounded-lg bg-white overflow-hidden hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 p-3 bg-slate-50">
              <Label className="text-sm font-medium text-slate-700 w-28 flex-shrink-0">{day.label}</Label>
              
              {!isOpen ? (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm text-slate-400">Fechado</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDay(day.key)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
                  >
                    Adicionar horário
                  </Button>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  {dayData.periodos.map((periodo, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={periodo.inicio}
                        onChange={(e) => updatePeriod(day.key, index, 'inicio', e.target.value)}
                        className={`h-8 text-sm w-28 ${errors[`${day.key}-${index}`] ? 'border-red-500' : ''}`}
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <Input
                        type="time"
                        value={periodo.fim}
                        onChange={(e) => updatePeriod(day.key, index, 'fim', e.target.value)}
                        className={`h-8 text-sm w-28 ${errors[`${day.key}-${index}`] ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePeriod(day.key, index)}
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      {errors[`${day.key}-${index}`] && (
                        <span className="text-xs text-red-500">{errors[`${day.key}-${index}`]}</span>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addPeriod(day.key)}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar horário
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDay(day.key)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                    >
                      Fechar este dia
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}