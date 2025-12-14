import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from 'lucide-react';

export default function ReportEditor({ open, onClose, project, type, onSave }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setContent(type === 'ai' ? project.ai_report_text || '' : project.report_basic_text || '');
    }
  }, [project, type]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(project.id, type, content);
    setSaving(false);
    onClose();
  };

  const title = type === 'ai' ? 'Editar Relatório + Diagnóstico IA' : 'Editar Relatório Básico';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {project?.unit_name && (
            <p className="text-sm text-slate-500">{project.unit_name}</p>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full min-h-[400px] font-mono text-sm resize-none"
            placeholder="Conteúdo do relatório em Markdown..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}