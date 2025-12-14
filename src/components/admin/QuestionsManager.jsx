import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'E-mail' },
  { value: 'date', label: 'Data' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'cep', label: 'CEP' },
  { value: 'currency_cents', label: 'Moeda (R$)' },
  { value: 'yes_no', label: 'Sim/Não' },
  { value: 'radio', label: 'Escolha única' },
  { value: 'select', label: 'Lista suspensa' },
  { value: 'checkbox', label: 'Múltipla escolha' }
];

const WEIGHT_CATEGORIES = [
  { value: '', label: 'Nenhuma' },
  { value: 'marketing', label: 'Marketing & Presença Digital (30%)' },
  { value: 'comercial', label: 'Comercial & Atendimento (30%)' },
  { value: 'operacao', label: 'Operação & Estrutura (20%)' },
  { value: 'metas', label: 'Metas & Planejamento (20%)' }
];

const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' }
];

export default function QuestionsManager({ modules, questions, onSave, onDelete }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
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
    const moduleQuestions = questions.filter(q => q.module_id === moduleId);
    const maxOrder = Math.max(...moduleQuestions.map(q => q.order), 0);
    
    setForm({
      module_id: moduleId,
      order: maxOrder + 1,
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
      weight_category: question.weight_category || '',
      weight_points: question.weight_points || 0
    });
    setOptionsText((question.options || []).join('\n'));
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const options = optionsText.split('\n').filter(o => o.trim());
    onSave(editingQuestion?.id, { ...form, options });
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Perguntas por Módulo</h3>

      <Accordion type="multiple" className="space-y-3">
        {sortedModules.map((module) => (
          <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">#{module.number}</span>
                <span className="font-medium">{module.title}</span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                  {getQuestionsByModule(module.id).length} perguntas
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2">
                {getMainQuestions(module.id).map((question) => (
                  <div key={question.id}>
                    <Card className="p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
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

                    {getConditionalQuestions(question.id).map((cond) => (
                      <Card key={cond.id} className="p-3 ml-8 mt-2 flex items-center gap-3 border-l-4 border-blue-200">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
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
                    ))}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleNew(module.id)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Nova Pergunta
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

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
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                />
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
                <Label className="text-blue-800 font-medium">Condição de Exibição</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Campo</Label>
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
              <Label className="font-medium">Health Score (opcional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select 
                    value={form.weight_category} 
                    onValueChange={(v) => setForm({ ...form, weight_category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
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