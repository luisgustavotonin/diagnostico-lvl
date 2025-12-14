import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sliders, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HealthScoreSettings({ settings, modules, onSave }) {
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  useEffect(() => {
    // Carregar lista de categorias das configurações
    const categoriesListSetting = settings.find(s => s.key === 'health_score_categories');
    let categoryModuleIds = [];
    
    if (categoriesListSetting) {
      try {
        categoryModuleIds = JSON.parse(categoriesListSetting.value);
      } catch {
        categoryModuleIds = [];
      }
    }

    const loadedCategories = categoryModuleIds.map(moduleId => {
      const module = modules?.find(m => m.id === moduleId);
      const enabledSetting = settings.find(s => s.key === `health_score_module_${moduleId}_enabled`);
      const weightSetting = settings.find(s => s.key === `health_score_module_${moduleId}_weight`);
      
      return {
        moduleId,
        label: module?.title || 'Módulo não encontrado',
        enabled: enabledSetting ? enabledSetting.value === 'true' : true,
        weight: weightSetting ? parseFloat(weightSetting.value) : 25
      };
    });
    
    setCategories(loadedCategories);
  }, [settings, modules]);

  const handleToggle = (moduleId) => {
    setCategories(prev => prev.map(cat => 
      cat.moduleId === moduleId ? { ...cat, enabled: !cat.enabled } : cat
    ));
  };

  const handleWeightChange = (moduleId, value) => {
    const numValue = parseFloat(value) || 0;
    setCategories(prev => prev.map(cat => 
      cat.moduleId === moduleId ? { ...cat, weight: Math.max(0, Math.min(100, numValue)) } : cat
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

  const handleAddModule = () => {
    if (!selectedModuleId) return;
    
    if (categories.find(c => c.moduleId === selectedModuleId)) return;
    
    const module = modules?.find(m => m.id === selectedModuleId);
    if (!module) return;
    
    const remainingWeight = 100 - getTotalWeight();
    setCategories(prev => [...prev, {
      moduleId: selectedModuleId,
      label: module.title,
      enabled: true,
      weight: Math.max(0, remainingWeight)
    }]);
    
    setSelectedModuleId('');
  };

  const handleDeleteCategory = (moduleId) => {
    setCategories(prev => prev.filter(cat => cat.moduleId !== moduleId));
  };

  const availableModules = modules?.filter(m => 
    m.is_active && !categories.find(c => c.moduleId === m.id)
  ).sort((a, b) => a.order - b.order) || [];

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

      <div className="space-y-4">
        <Card className="p-4 bg-slate-50">
          <div className="flex gap-2">
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um módulo para adicionar..." />
              </SelectTrigger>
              <SelectContent>
                {availableModules.length > 0 ? (
                  availableModules.map(module => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="_none" disabled>
                    Todos os módulos já foram adicionados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddModule}
              variant="outline"
              className="gap-2"
              disabled={!selectedModuleId}
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          {categories.map((cat) => (
            <Card key={cat.moduleId} className={`p-5 ${!cat.enabled ? 'opacity-50' : ''}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium text-slate-700">
                    {cat.label}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(cat.moduleId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-500">
                      {cat.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      checked={cat.enabled}
                      onCheckedChange={() => handleToggle(cat.moduleId)}
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
                        onChange={(e) => handleWeightChange(cat.moduleId, e.target.value)}
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