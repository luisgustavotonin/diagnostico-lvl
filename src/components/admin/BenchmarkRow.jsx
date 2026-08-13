import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

const FIELDS = ['metric_label', 'faixa_critica', 'faixa_aceitavel', 'faixa_ideal', 'unidade'];

export default function BenchmarkRow({ benchmark, onSave, onDelete }) {
  const [d, setD] = useState({
    metric_label: benchmark.metric_label || '',
    faixa_critica: benchmark.faixa_critica || '',
    faixa_aceitavel: benchmark.faixa_aceitavel || '',
    faixa_ideal: benchmark.faixa_ideal || '',
    unidade: benchmark.unidade || ''
  });

  const isDirty = FIELDS.some((k) => d[k] !== (benchmark[k] || ''));
  const set = (k) => (e) => setD((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-1 border-b border-border/50 last:border-0">
      <Input
        className="col-span-3 font-medium"
        value={d.metric_label}
        onChange={set('metric_label')}
        placeholder="Métrica"
      />
      <Input
        className="col-span-2"
        value={d.faixa_critica}
        onChange={set('faixa_critica')}
        placeholder="Crítica"
      />
      <Input
        className="col-span-2"
        value={d.faixa_aceitavel}
        onChange={set('faixa_aceitavel')}
        placeholder="Aceitável"
      />
      <Input
        className="col-span-2"
        value={d.faixa_ideal}
        onChange={set('faixa_ideal')}
        placeholder="Ideal"
      />
      <Input
        className="col-span-1 text-center"
        value={d.unidade}
        onChange={set('unidade')}
        placeholder="%"
      />
      <div className="col-span-2 flex gap-1 justify-end">
        <Button
          size="icon"
          variant="ghost"
          disabled={!isDirty}
          onClick={() => onSave(benchmark.id, d)}
          title="Salvar"
        >
          <Save className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(benchmark.id)}
          title="Excluir"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}