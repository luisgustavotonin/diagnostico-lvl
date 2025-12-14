import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sliders, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  { key: 'marketing', label: 'Marketing', defaultWeight: 30, defaultEnabled: true },
  { key: 'comercial', label: 'Comercial', defaultWeight: 30, defaultEnabled: true },
  { key: 'operacao', label: 'Operação', defaultWeight: 20, defaultEnabled: true },
  { key: 'metas', label: 'Metas', defaultWeight: 20, defaultEnabled: true }
];

export default function HealthScoreSettings({ settings, onSave }) {
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadedCategories = CATEGORIES.map(cat => {
      const enabledSetting = settings.find(s => s.key === `health_score_${cat.key}_enabled`);
      const weightSetting = settings.find(s => s.key === `health_score_${cat.key}_weight`);
      
      return {
        ...cat,
        enabled: enabledSetting ? enabledSetting.value === 'true' : cat.defaultEnabled,
        weight: weightSetting ? parseFloat(weightSetting.value) : cat.defaultWeight
      };
    });
    setCategories(loadedCategories);
  }, [settings]);

  const handleToggle = (key) => {
    setCategories(prev => prev.map(cat => 
      cat.key === key ? { ...cat, enabled: !cat.enabled } : cat
    ));
  };

  const handleWeightChange = (key, value) => {
    const numValue = parseFloat(value) || 0;
    setCategories(prev => prev.map(cat => 
      cat.key === key ? { ...cat, weight: Math.max(0, Math.min(100, numValue)) } : cat
    ));
  };

  const getTotalWeight = () => {
    return categories
      .filter(cat => cat.enabled)
      .reduce((sum, cat) => sum + cat.weight, 0);
  };

  const isValidTotal = () => {
    const total = getTotalWeight();
    return Math.abs(total - 100) < 0.01;
  };

  const handleSave = async () => {
    if (!isValidTotal()) return;
    
    setSaving(true);
    await onSave(categories);
    setSaving(false);
  };

  const totalWeight = getTotalWeight();
  const isValid = isValidTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          <Sliders className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Configuração do Health Score</h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure quais categorias participam do cálculo e seus respectivos pesos percentuais
          </p>
        </div>
      </div>

      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A soma dos pesos deve ser exatamente 100%. Total atual: {totalWeight.toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {categories.map((cat) => (
          <Card key={cat.key} className={`p-5 ${!cat.enabled ? 'opacity-50' : ''}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label className="text-base font-medium text-slate-700">
                    {cat.label}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {cat.enabled ? 'Ativa' : 'Inativa'}
                  </span>
                  <Switch
                    checked={cat.enabled}
                    onCheckedChange={() => handleToggle(cat.key)}
                  />
                </div>
              </div>

              {cat.enabled && (
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">
                    Peso no cálculo (%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={cat.weight}
                      onChange={(e) => handleWeightChange(cat.key, e.target.value)}
                      className="max-w-[120px]"
                    />
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-slate-600 h-full transition-all duration-300"
                        style={{ width: `${cat.weight}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 min-w-[60px] text-right">
                      {cat.weight.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm">
          <span className="text-slate-600">Total: </span>
          <span className={`font-semibold ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalWeight.toFixed(1)}%
          </span>
        </div>
        <Button 
          onClick={handleSave}
          disabled={!isValid || saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}