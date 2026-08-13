import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

export default function BenchmarkCategoryHeader({ category, onSave, onDelete }) {
  const [label, setLabel] = useState(category.label || '');
  const isDirty = label !== (category.label || '');

  return (
    <div className="flex items-center gap-2 mb-3">
      <Input
        className="font-medium h-9 max-w-xs"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome da categoria"
        title="Clique para editar o nome da categoria"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={!isDirty}
        onClick={() => onSave(category.id, { label })}
        title="Salvar nome da categoria"
      >
        <Save className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 hover:bg-destructive/10"
        onClick={() => onDelete(category)}
        title="Excluir categoria e suas métricas"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}