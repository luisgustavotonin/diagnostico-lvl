import React from 'react';
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function SettingsPanel({ aiEnabled, onToggleAI, aiReportMode, onToggleAIMode }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configurações</h3>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
            <Sparkles className={`w-6 h-6 ${aiEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Diagnóstico por IA</h4>
                <p className="text-sm text-muted-foreground mt-1">
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

            {aiEnabled && (
              <div className="mt-6 pt-6 border-t space-y-3">
                <Label className="text-sm font-medium text-foreground">Modo de Exibição do Diagnóstico IA</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha como o diagnóstico IA será apresentado nos relatórios
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={aiReportMode === 'separate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleAIMode('separate')}
                    className="flex-1"
                  >
                    Separado
                  </Button>
                  <Button
                    variant={aiReportMode === 'combined' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleAIMode('combined')}
                    className="flex-1"
                  >
                    Junto com Relatório Padrão
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aiReportMode === 'separate' 
                    ? 'O diagnóstico IA será gerado como um relatório separado' 
                    : 'O diagnóstico IA será incluído no relatório padrão'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}