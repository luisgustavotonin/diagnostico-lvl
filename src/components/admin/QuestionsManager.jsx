import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, ChevronRight, GripVertical } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'E-mail' },
  { value: 'date', label: 'Data' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cep', label: 'CEP' },
  { value: 'currency_cents', label: 'Moeda (R$)' },
  { value: 'yes_no', label: 'Sim/Não' },
  { value: 'radio', label: 'Escolha Única' },
  { value: 'select', label: 'Lista Suspensa' },
  { value: 'checkbox', label: 'Múltipla Escolha' }
];



const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' }
];

export default function QuestionsManager({ modules, questions, onSave, onDelete, onSaveModule, onDeleteModule }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    number: 1,
    order: 1,
    title: '',
    description: '',
    is_active: true
  });
  const [form, setForm] = useState({
    module_id: '',
    order: 1,
    text: '',
    field_key: '',
    field_type: 'text',
    options: [],
    placeholder: '',
    help_text: '',
    is_required: false,
    is_active: true,
    is_conditional: false,
    parent_question_id: '',
    condition_field: '',
    condition_operator: 'equals',
    condition_value: '',
    weight_category: '',
    weight_points: 0
  });
  const [optionsText, setOptionsText] = useState('');

  const handleNew = (moduleId, parentId = null) => {
    let maxOrder = 1;
    
    if (parentId) {
      // Para condicionais, pegar max order das condicionais do mesmo pai
      const conditionals = getConditionalQuestions(parentId);
      maxOrder = conditionals.length > 0 ? Math.max(...conditionals.map(q => q.order)) + 1 : 1;
    } else {
      // Para principais, pegar max order das principais do módulo
      const mainQuestions = getMainQuestions(moduleId);
      maxOrder = mainQuestions.length > 0 ? Math.max(...mainQuestions.map(q => q.order)) + 1 : 1;
    }
    
    setForm({
      module_id: moduleId,
      order: maxOrder,
      text: '',
      field_key: '',
      field_type: 'text',
      options: [],
      placeholder: '',
      help_text: '',
      is_required: false,
      is_active: true,
      is_conditional: !!parentId,
      parent_question_id: parentId || '',
      condition_field: parentId ? questions.find(q => q.id === parentId)?.field_key : '',
      condition_operator: 'equals',
      condition_value: '',
      weight_category: '',
      weight_points: 0
    });
    setOptionsText('');
    setEditingQuestion(null);
    setDialogOpen(true);
  };

  const handleEdit = (question) => {
    setForm({
      ...question,
      options: question.options || [],
      weight_category: question.weight_category || 'none',
      weight_points: question.weight_points || 0
    });
    setOptionsText((question.options || []).join('\n'));
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const options = optionsText.split('\n').filter(o => o.trim());
    const saveData = { ...form, options };
    if (saveData.weight_category === 'none') {
      saveData.weight_category = null;
    }

    // Se for uma nova pergunta e a posição foi alterada, reordenar
    if (!editingQuestion) {
      if (form.is_conditional) {
        // Reordenar perguntas condicionais do mesmo pai
        const conditionalQuestions = getConditionalQuestions(form.parent_question_id);
        const targetOrder = saveData.order;

        for (const q of conditionalQuestions) {
          if (q.order >= targetOrder) {
            await onSave(q.id, { ...q, order: q.order + 1 });
          }
        }
      } else {
        // Reordenar perguntas principais do módulo
        const moduleQuestions = getMainQuestions(form.module_id);
        const targetOrder = saveData.order;

        for (const q of moduleQuestions) {
          if (q.order >= targetOrder) {
            await onSave(q.id, { ...q, order: q.order + 1 });
          }
        }
      }
    }

    onSave(editingQuestion?.id, saveData);
    setDialogOpen(false);
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  const getQuestionsByModule = (moduleId) => {
    return questions
      .filter(q => q.module_id === moduleId)
      .sort((a, b) => a.order - b.order);
  };

  const getMainQuestions = (moduleId) => {
    return getQuestionsByModule(moduleId).filter(q => !q.is_conditional);
  };

  const getConditionalQuestions = (parentId) => {
    return questions.filter(q => q.parent_question_id === parentId).sort((a, b) => a.order - b.order);
  };

  const handleNewModule = () => {
    const maxOrder = Math.max(...modules.map(m => m.order), 0);
    const maxNumber = Math.max(...modules.map(m => m.number), 0);
    setModuleForm({
      number: maxNumber + 1,
      order: maxOrder + 1,
      title: '',
      description: '',
      is_active: true
    });
    setEditingModule(null);
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module) => {
    setModuleForm({
      number: module.number,
      order: module.order,
      title: module.title,
      description: module.description || '',
      is_active: module.is_active
    });
    setEditingModule(module);
    setModuleDialogOpen(true);
  };

  const handleSaveModule = () => {
    onSaveModule(editingModule?.id, moduleForm);
    setModuleDialogOpen(false);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const droppableId = result.destination.droppableId;
    
    // Verifica se é um grupo de perguntas condicionais
    if (droppableId.startsWith('conditional-')) {
      const parentId = droppableId.replace('conditional-', '');
      const conditionalQuestions = getConditionalQuestions(parentId);
      const items = Array.from(conditionalQuestions);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Atualizar ordem de todas as perguntas condicionais
      items.forEach((question, index) => {
        onSave(question.id, { ...question, order: index + 1 });
      });
    } else {
      // Perguntas principais do módulo
      const moduleId = droppableId.replace('module-', '');
      const mainQuestions = getMainQuestions(moduleId);
      const items = Array.from(mainQuestions);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Atualizar ordem de todas as perguntas principais
      items.forEach((question, index) => {
        onSave(question.id, { ...question, order: index + 1 });
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos e Perguntas</h3>
        <Button onClick={handleNewModule}>
          <Plus className="w-4 h-4 mr-2" /> Novo Módulo
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {sortedModules.map((module) => (
          <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">#{module.number}</span>
                  <span className="font-medium">{module.title}</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {getQuestionsByModule(module.id).length} perguntas
                  </span>
                  {!module.is_active && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inativo</span>
                  )}
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => handleEditModule(module)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteModule(module.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={`module-${module.id}`}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {getMainQuestions(module.id).map((question, index) => (
                        <Draggable key={question.id} draggableId={question.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <Card className={`p-3 flex items-center gap-3 ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                      #{index + 1}
                                    </span>
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                      {FIELD_TYPES.find(t => t.value === question.field_type)?.label}
                                    </span>
                                    {question.is_required && (
                                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Obrigatório</span>
                                    )}
                                    {!question.is_active && (
                                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Inativo</span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm">{question.text}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{question.field_key}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleNew(module.id, question.id)}
                                    className="text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Condicional
                                  </Button>
                                </div>
                              </Card>

                              {getConditionalQuestions(question.id).length > 0 && (
                                <Droppable droppableId={`conditional-${question.id}`}>
                                  {(provided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="ml-8 mt-2 space-y-2"
                                    >
                                      {getConditionalQuestions(question.id).map((cond, condIndex) => (
                                        <Draggable key={cond.id} draggableId={cond.id} index={condIndex}>
                                          {(provided, snapshot) => (
                                            <Card
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`p-3 flex items-center gap-3 border-l-4 border-blue-200 ${
                                                snapshot.isDragging ? 'shadow-lg' : ''
                                              }`}
                                            >
                                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4 text-blue-400" />
                                              </div>
                                              <ChevronRight className="w-4 h-4 text-blue-400" />
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                    #{index + 1}.{condIndex + 1}
                                                  </span>
                                                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                                    Condicional
                                                  </span>
                                                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                    {FIELD_TYPES.find(t => t.value === cond.field_type)?.label}
                                                  </span>
                                                </div>
                                                <p className="mt-1 text-sm">{cond.text}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                  Se {cond.condition_field} {cond.condition_operator} "{cond.condition_value}"
                                                </p>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(cond)}>
                                                  <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => onDelete(cond.id)}>
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
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => handleNew(module.id)}
              >
                <Plus className="w-4 h-4 mr-2" /> Nova Pergunta
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
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
                  value={moduleForm.number}
                  onChange={(e) => setModuleForm({ ...moduleForm, number: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Título</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Título do módulo"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={moduleForm.is_active}
                onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_active: checked })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Módulo</Label>
                <Select 
                  value={form.module_id} 
                  onValueChange={(v) => setForm({ ...form, module_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        #{m.number} - {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posição</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {form.is_conditional 
                    ? `Posição ${getMainQuestions(form.module_id).findIndex(q => q.id === form.parent_question_id) + 1}.${form.order}`
                    : `Posição ${form.order}`
                  }
                </p>
              </div>
            </div>

            <div>
              <Label>Texto da Pergunta</Label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Digite a pergunta..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chave (field_key)</Label>
                <Input
                  value={form.field_key}
                  onChange={(e) => setForm({ ...form, field_key: e.target.value })}
                  placeholder="nome_do_campo"
                />
              </div>
              <div>
                <Label>Tipo de Campo</Label>
                <Select 
                  value={form.field_type} 
                  onValueChange={(v) => setForm({ ...form, field_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {['radio', 'select', 'checkbox'].includes(form.field_type) && (
              <div>
                <Label>Opções (uma por linha)</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                  rows={4}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={form.placeholder}
                  onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                />
              </div>
              <div>
                <Label>Texto de Ajuda</Label>
                <Input
                  value={form.help_text}
                  onChange={(e) => setForm({ ...form, help_text: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_required}
                  onCheckedChange={(c) => setForm({ ...form, is_required: c })}
                />
                <Label>Obrigatório</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(c) => setForm({ ...form, is_active: c })}
                />
                <Label>Ativo</Label>
              </div>
            </div>

            {form.is_conditional && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <Label className="text-blue-800 font-medium">Condição para Exibir</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Campo (field_key)</Label>
                    <Input
                      value={form.condition_field}
                      onChange={(e) => setForm({ ...form, condition_field: e.target.value })}
                      placeholder="field_key"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Operador</Label>
                    <Select 
                      value={form.condition_operator} 
                      onValueChange={(v) => setForm({ ...form, condition_operator: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor</Label>
                    <Input
                      value={form.condition_value}
                      onChange={(e) => setForm({ ...form, condition_value: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <Label className="font-medium">Pontuação (Health Score)</Label>
              <p className="text-xs text-slate-500">Define como esta pergunta contribui para a nota final</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Módulo</Label>
                  <Select 
                    value={form.weight_category || form.module_id} 
                    onValueChange={(v) => setForm({ ...form, weight_category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione módulo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {modules.filter(m => m.is_active).sort((a, b) => a.order - b.order).map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Pontos</Label>
                  <Input
                    type="number"
                    value={form.weight_points}
                    onChange={(e) => setForm({ ...form, weight_points: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
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