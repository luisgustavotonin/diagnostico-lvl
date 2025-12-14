import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

export default function ModulesManager({ modules, onSave, onDelete }) {
  const [editingModule, setEditingModule] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    number: 1,
    order: 1,
    title: '',
    description: '',
    is_active: true
  });

  const handleNew = () => {
    const maxOrder = Math.max(...modules.map(m => m.order), 0);
    const maxNumber = Math.max(...modules.map(m => m.number), 0);
    setForm({
      number: maxNumber + 1,
      order: maxOrder + 1,
      title: '',
      description: '',
      is_active: true
    });
    setEditingModule(null);
    setDialogOpen(true);
  };

  const handleEdit = (module) => {
    setForm({
      number: module.number,
      order: module.order,
      title: module.title,
      description: module.description || '',
      is_active: module.is_active
    });
    setEditingModule(module);
    setDialogOpen(true);
  };

  const handleSave = () => {
    onSave(editingModule?.id, form);
    setDialogOpen(false);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sortedModules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar ordem de todos os módulos
    items.forEach((module, index) => {
      const updatedData = {
        number: module.number,
        order: index + 1,
        title: module.title,
        description: module.description || '',
        is_active: module.is_active
      };
      onSave(module.id, updatedData);
    });
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos</h3>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Módulo
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {sortedModules.map((module, index) => (
                <Draggable key={module.id} draggableId={module.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 flex items-center gap-4 ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-500">#{module.number}</span>
                          <h4 className="font-medium">{module.title}</h4>
                          {!module.is_active && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Inativo</span>
                          )}
                        </div>
                        {module.description && (
                          <p className="text-sm text-slate-500 mt-1">{module.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(module)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(module.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número</Label>
                <Input
                  type="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título do módulo"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}