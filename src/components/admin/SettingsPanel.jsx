import React from 'react';
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function SettingsPanel({ aiEnabled, onToggleAI }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configurações</h3>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiEnabled ? 'bg-purple-100' : 'bg-slate-100'}`}>
            <Sparkles className={`w-6 h-6 ${aiEnabled ? 'text-purple-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Diagnóstico por IA</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Permite gerar relatórios com análise estratégica e plano de ação usando inteligência artificial.
                </p>
              </div>
              <Switch
                checked={aiEnabled}
                onCheckedChange={onToggleAI}
              />
            </div>

            {!aiEnabled && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Com esta opção desativada, não será possível gerar novos diagnósticos por IA. 
                  Diagnósticos já gerados continuarão acessíveis.
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}