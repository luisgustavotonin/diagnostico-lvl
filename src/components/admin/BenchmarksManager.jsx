import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import BenchmarkRow from './BenchmarkRow';
import { Plus, Gauge, X } from 'lucide-react';

export const BENCHMARK_CATEGORIES = [
  { key: 'funil', label: 'Funil de Conversão' },
  { key: 'unit_economics', label: 'Unit Economics' },
  { key: 'capacidade', label: 'Capacidade Instalada' }
];

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export default function BenchmarksManager({ benchmarks, onSave, onDelete, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    category: 'funil',
    metric_key: '',
    metric_label: '',
    faixa_critica: '',
    faixa_aceitavel: '',
    faixa_ideal: '',
    unidade: '%'
  });

  const grouped = BENCHMARK_CATEGORIES.map((cat) => ({
    ...cat,
    rows: benchmarks
      .filter((b) => b.category === cat.key)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  }));

  const handleAdd = () => {
    if (!form.metric_label.trim()) return;
    onAdd({
      ...form,
      metric_key: form.metric_key || slugify(form.metric_label),
      ordem: benchmarks.filter((b) => b.category === form.category).length + 1,
      is_active: true
    });
    setForm({
      category: form.category,
      metric_key: '',
      metric_label: '',
      faixa_critica: '',
      faixa_aceitavel: '',
      faixa_ideal: '',
      unidade: form.unidade
    });
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" /> Benchmarks de Referência
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as faixas usadas como régua no diagnóstico IA. Estas métricas alimentam
            todas as comparações e o funil reverso da meta.
          </p>
        </div>
        <Button onClick={() => setAdding(!adding)} variant="outline" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Nova métrica
        </Button>
      </div>

      {adding && (
        <Card className="p-4 space-y-3 border-primary/40">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Métrica</Label>
              <Input
                value={form.metric_label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metric_label: e.target.value, metric_key: slugify(e.target.value) }))
                }
                placeholder="Ex.: Taxa de Agendamento"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Faixa crítica</Label>
              <Input
                value={form.faixa_critica}
                onChange={(e) => setForm((f) => ({ ...f, faixa_critica: e.target.value }))}
                placeholder="0–10%"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Faixa aceitável</Label>
              <Input
                value={form.faixa_aceitavel}
                onChange={(e) => setForm((f) => ({ ...f, faixa_aceitavel: e.target.value }))}
                placeholder="11–30%"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Faixa ideal</Label>
              <Input
                value={form.faixa_ideal}
                onChange={(e) => setForm((f) => ({ ...f, faixa_ideal: e.target.value }))}
                placeholder=">30%"
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label className="text-xs">Un.</Label>
              <Input
                value={form.unidade}
                onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                placeholder="%"
              />
            </div>
            <div className="col-span-2 flex gap-1 justify-end">
              <Button size="sm" onClick={handleAdd}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="w-56 space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENCHMARK_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {grouped.map((cat) => (
        <Card key={cat.key} className="p-4">
          <h3 className="font-medium mb-3">{cat.label}</h3>
          <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wide text-muted-foreground mb-1 px-1">
            <div className="col-span-3">Métrica</div>
            <div className="col-span-2">Crítica</div>
            <div className="col-span-2">Aceitável</div>
            <div className="col-span-2">Ideal</div>
            <div className="col-span-1">Un.</div>
            <div className="col-span-2" />
          </div>
          <div>
            {cat.rows.length === 0 && (
              <p className="text-sm text-muted-foreground py-3">Nenhuma métrica nesta categoria.</p>
            )}
            {cat.rows.map((b) => (
              <BenchmarkRow key={b.id} benchmark={b} onSave={onSave} onDelete={onDelete} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}