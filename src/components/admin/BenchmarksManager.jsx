import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import BenchmarkRow from './BenchmarkRow';
import BenchmarkCategoryHeader from './BenchmarkCategoryHeader';
import { Plus, Gauge, X, FolderPlus } from 'lucide-react';

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export default function BenchmarksManager({
  benchmarks,
  categories,
  onSave,
  onDelete,
  onAdd,
  onSaveCategory,
  onDeleteCategory,
  onAddCategory
}) {
  const [adding, setAdding] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [form, setForm] = useState({
    category: '',
    metric_label: '',
    faixa_critica: '',
    faixa_aceitavel: '',
    faixa_ideal: '',
    unidade: '%'
  });

  const sortedCategories = [...(categories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const grouped = sortedCategories.map((cat) => ({
    ...cat,
    rows: benchmarks
      .filter((b) => b.category === cat.key)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  }));

  const defaultCategory = sortedCategories[0]?.key || '';
  const formCategory = form.category || defaultCategory;

  const handleAdd = () => {
    if (!form.metric_label.trim() || !formCategory) return;
    onAdd({
      ...form,
      category: formCategory,
      metric_key: form.metric_key || slugify(form.metric_label),
      ordem: benchmarks.filter((b) => b.category === formCategory).length + 1,
      is_active: true
    });
    setForm({
      category: formCategory,
      metric_label: '',
      faixa_critica: '',
      faixa_aceitavel: '',
      faixa_ideal: '',
      unidade: form.unidade
    });
    setAdding(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const baseKey = slugify(newCategoryLabel);
    const existing = new Set((categories || []).map((c) => c.key));
    let key = baseKey;
    let i = 1;
    while (existing.has(key)) {
      key = `${baseKey}_${i++}`;
    }
    onAddCategory({
      key,
      label: newCategoryLabel.trim(),
      order: (categories || []).length + 1,
      is_active: true
    });
    setNewCategoryLabel('');
    setAddingCategory(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" /> Benchmarks de Referência
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as faixas usadas como régua no diagnóstico IA. Estas métricas alimentam
            todas as comparações e o funil reverso da meta.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => { setAddingCategory(!addingCategory); setAdding(false); }} variant="outline" className="gap-2">
            <FolderPlus className="w-4 h-4" /> Nova categoria
          </Button>
          <Button onClick={() => { setAdding(!adding); setAddingCategory(false); }} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Nova métrica
          </Button>
        </div>
      </div>

      {addingCategory && (
        <Card className="p-4 flex items-end gap-2 border-primary/40">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Nome da nova categoria</Label>
            <Input
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              placeholder="Ex.: Pós-venda"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
          </div>
          <Button size="sm" onClick={handleAddCategory}>Criar</Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingCategory(false)}>
            <X className="w-4 h-4" />
          </Button>
        </Card>
      )}

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
            <Select value={formCategory} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {sortedCategories.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {grouped.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma categoria cadastrada. Clique em "Nova categoria" para começar.
        </Card>
      )}

      {grouped.map((cat) => (
        <Card key={cat.key} className="p-4">
          <BenchmarkCategoryHeader
            category={cat}
            onSave={onSaveCategory}
            onDelete={onDeleteCategory}
          />
          <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wide text-muted-foreground mb-1 px-1">
            <div className="col-span-4">Métrica</div>
            <div className="col-span-2">Crítica</div>
            <div className="col-span-2">Aceitável</div>
            <div className="col-span-2">Ideal</div>
            <div className="col-span-1">Un.</div>
            <div className="col-span-1" />
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