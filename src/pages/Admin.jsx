import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, Building2, ListTree, Eye, Settings, FileDown, Gauge } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import StatsCards from '../components/admin/StatsCards';
import BenchmarksManager from '../components/admin/BenchmarksManager';
import { buildAiReportPrompt, aiReportResponseSchema, benchmarksToPromptObject } from '../lib/aiReportPrompt';
import ProjectsTable from '../components/admin/ProjectsTable';
import ModulesManager from '../components/admin/ModulesManager';
import QuestionsManager from '../components/admin/QuestionsManager';
import PreviewSimulator from '../components/admin/PreviewSimulator';
import SettingsPanel from '../components/admin/SettingsPanel';
import ReportViewer from '../components/admin/ReportViewer';
import ReportEditor from '../components/admin/ReportEditor';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('units');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reportType, setReportType] = useState('basic');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });

  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');

  // Carregar projetos
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return base44.entities.Project.list('-created_date');
      }
      
      // Buscar na base com regex case-insensitive
      const normalizedSearch = searchQuery
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      return base44.entities.Project.filter({
        $or: [
          { unit_name: { $regex: normalizedSearch, $options: 'i' } },
          { city: { $regex: normalizedSearch, $options: 'i' } },
          { cnpj: { $regex: searchQuery.replace(/\D/g, ''), $options: 'i' } },
          { phone: { $regex: searchQuery.replace(/\D/g, ''), $options: 'i' } }
        ]
      }, '-created_date');
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    refetchOnWindowFocus: true, // Atualiza quando voltar para a aba
  });

  // Carregar módulos
  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => base44.entities.Module.list('order'),
  });

  // Carregar perguntas
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list('order'),
  });

  // Carregar configurações
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  // Carregar benchmarks
  const { data: benchmarks = [], isLoading: loadingBenchmarks } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => base44.entities.Benchmark.list('category'),
  });

  // Carregar categorias de benchmark
  const { data: benchmarkCategories = [] } = useQuery({
    queryKey: ['benchmarkCategories'],
    queryFn: () => base44.entities.BenchmarkCategory.list('order'),
  });

  const aiReportMode = settings.find(s => s.key === 'ai_report_mode')?.value || 'separate';

  useEffect(() => {
    const aiSetting = settings.find(s => s.key === 'ai_enabled');
    if (aiSetting) {
      setAiEnabled(aiSetting.value === 'true');
    }
    
  }, [settings]);

  // Mutations
  const saveModuleMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return base44.entities.Module.update(id, data);
      }
      return base44.entities.Module.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo salvo com sucesso');
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.Module.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo excluído');
    }
  });

  const saveQuestionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return base44.entities.Question.update(id, data);
      }
      return base44.entities.Question.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Pergunta salva com sucesso');
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Pergunta excluída');
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto excluído');
    }
  });

  const saveBenchmarkMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return base44.entities.Benchmark.update(id, data);
      }
      return base44.entities.Benchmark.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      toast.success('Benchmark salvo com sucesso');
    }
  });

  const deleteBenchmarkMutation = useMutation({
    mutationFn: (id) => base44.entities.Benchmark.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      toast.success('Benchmark excluído');
    }
  });

  const saveBenchmarkCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) return base44.entities.BenchmarkCategory.update(id, data);
      return base44.entities.BenchmarkCategory.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarkCategories'] });
      toast.success('Categoria salva');
    }
  });

  const deleteBenchmarkCategoryMutation = useMutation({
    mutationFn: async ({ id, key }) => {
      await base44.entities.Benchmark.deleteMany({ category: key });
      return base44.entities.BenchmarkCategory.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      queryClient.invalidateQueries({ queryKey: ['benchmarkCategories'] });
      toast.success('Categoria e métricas excluídas');
    }
  });

  // Handlers
  const handleSaveModule = (id, data) => {
    saveModuleMutation.mutate({ id, data });
  };

  const handleDeleteModule = (id) => {
    setDeleteDialog({ open: true, type: 'module', id });
  };

  const handleSaveQuestion = (id, data) => {
    saveQuestionMutation.mutate({ id, data });
  };

  const handleDeleteQuestion = (id) => {
    setDeleteDialog({ open: true, type: 'question', id });
  };

  const handleToggleAI = async (enabled) => {
    setAiEnabled(enabled);
    const existingSetting = settings.find(s => s.key === 'ai_enabled');
    if (existingSetting) {
      await base44.entities.AppSettings.update(existingSetting.id, { value: String(enabled) });
    } else {
      await base44.entities.AppSettings.create({ key: 'ai_enabled', value: String(enabled) });
    }
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    toast.success(enabled ? 'IA ativada' : 'IA desativada');
  };

  const handleSaveBenchmark = (id, data) => {
    saveBenchmarkMutation.mutate({ id, data });
  };

  const handleAddBenchmark = (data) => {
    saveBenchmarkMutation.mutate({ id: null, data });
  };

  const handleDeleteBenchmark = (id) => {
    setDeleteDialog({ open: true, type: 'benchmark', id });
  };

  const handleSaveCategory = (id, data) => {
    saveBenchmarkCategoryMutation.mutate({ id, data });
  };

  const handleAddCategory = (data) => {
    saveBenchmarkCategoryMutation.mutate({ id: null, data });
  };

  const handleDeleteCategory = (category) => {
    setDeleteDialog({ open: true, type: 'category', id: category.id, extra: category.key });
  };

  const handleToggleAIMode = async (mode) => {
    const existingSetting = settings.find(s => s.key === 'ai_report_mode');
    if (existingSetting) {
      await base44.entities.AppSettings.update(existingSetting.id, { value: mode });
    } else {
      await base44.entities.AppSettings.create({ key: 'ai_report_mode', value: mode });
    }
    localStorage.setItem('ai_report_mode', mode);
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    toast.success(mode === 'combined' ? 'Diagnóstico IA será incluído no relatório padrão' : 'Diagnóstico IA será gerado separadamente');
  };


  const handleViewReport = (project) => {
    setSelectedProject(project);
    setReportType('basic');
    setViewerOpen(true);
  };

  const handleViewAIReport = (project) => {
    setSelectedProject(project);
    setReportType('ai');
    setViewerOpen(true);
  };

  const handleEditReport = (project, type = 'basic') => {
    setSelectedProject(project);
    setReportType(type);
    setEditorOpen(true);
  };

  const handleSaveReport = async (projectId, type, content) => {
    const data = type === 'ai' 
      ? { ai_report_text: content }
      : { report_basic_text: content };
    
    await updateProjectMutation.mutateAsync({ id: projectId, data });
    toast.success('Relatório atualizado');
  };

  const handleDeleteProject = (project) => {
    setDeleteDialog({ open: true, type: 'project', id: project.id });
  };

  const handlePrintReport = (project, type) => {
    setSelectedProject(project);
    setReportType(type);
    setViewerOpen(true);
  };

  const handleGenerateAI = async (project) => {
    if (!aiEnabled) return;
    
    setGeneratingAI(project.id);
    
    await updateProjectMutation.mutateAsync({ 
      id: project.id, 
      data: { ai_report_status: 'GENERATING' } 
    });

    const benchmarksObject = benchmarksToPromptObject(benchmarks);
    const prompt = buildAiReportPrompt(project, benchmarksObject);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: aiReportResponseSchema
    });

    // O novo prompt exige saída em JSON estruturado — armazenamos como string
    // para que o renderizador de relatório (próxima etapa) possa consumi-la.
    const aiReport = typeof response === 'string' ? response : JSON.stringify(response, null, 2);

    await updateProjectMutation.mutateAsync({
      id: project.id,
      data: {
        ai_report_status: 'READY',
        ai_report_text: aiReport
      }
    });

    setGeneratingAI(null);
    toast.success('Diagnóstico gerado com sucesso!');
  };

  const handleOpenProject = (project) => {
    window.open(`/Onboarding?project=${project.id}`, '_blank');
  };

  const handleExportModulesPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Estrutura de Módulos e Perguntas', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
    yPosition += 10;

    // Ordenar módulos
    const sortedModules = [...modules].sort((a, b) => a.order - b.order);

    sortedModules.forEach((module, idx) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Módulo
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Módulo ${module.number}: ${module.title}`, margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Ordem: ${module.order} | Ativo: ${module.is_active ? 'Sim' : 'Não'}`, margin, yPosition);
      yPosition += lineHeight;

      if (module.description) {
        const descLines = doc.splitTextToSize(`Descrição: ${module.description}`, 170);
        descLines.forEach(line => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
      }
      yPosition += 3;

      // Perguntas do módulo
      const moduleQuestions = questions
        .filter(q => q.module_id === module.id)
        .sort((a, b) => a.order - b.order);

      moduleQuestions.forEach((q, qIdx) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`  Pergunta ${qIdx + 1}:`, margin + 5, yPosition);
        yPosition += lineHeight;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        const questionLines = doc.splitTextToSize(`  ${q.text}`, 165);
        questionLines.forEach(line => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        });

        doc.text(`  Chave: ${q.field_key}`, margin + 5, yPosition);
        yPosition += lineHeight;

        doc.text(`  Tipo: ${q.field_type} | Ordem: ${q.order} | Obrigatória: ${q.is_required ? 'Sim' : 'Não'} | Ativa: ${q.is_active ? 'Sim' : 'Não'}`, margin + 5, yPosition);
        yPosition += lineHeight;

        if (q.is_conditional) {
          doc.setFont(undefined, 'italic');
          doc.text(`  CONDICIONAL: Campo "${q.condition_field}" ${q.condition_operator || 'equals'} "${q.condition_value}"`, margin + 5, yPosition);
          doc.setFont(undefined, 'normal');
          yPosition += lineHeight;
        }

        if (q.options && q.options.length > 0) {
          doc.text(`  Opções: ${q.options.join(', ')}`, margin + 5, yPosition);
          yPosition += lineHeight;
        }

        yPosition += 2;
      });

      yPosition += 5;
    });

    doc.save('estrutura-modulos-perguntas.pdf');
    toast.success('PDF exportado com sucesso!');
  };

  const confirmDelete = () => {
    const { type, id } = deleteDialog;
    
    if (type === 'module') {
      deleteModuleMutation.mutate(id);
    } else if (type === 'question') {
      deleteQuestionMutation.mutate(id);
    } else if (type === 'project') {
      deleteProjectMutation.mutate(id);
    } else if (type === 'benchmark') {
      deleteBenchmarkMutation.mutate(id);
    } else if (type === 'category') {
      deleteBenchmarkCategoryMutation.mutate({ id, key: deleteDialog.extra });
    }
    
    setDeleteDialog({ open: false, type: null, id: null, extra: null });
  };

  if (loadingProjects || loadingModules || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Gerencie unidades, módulos e configurações</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-8">
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Unidades
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <ListTree className="w-4 h-4" /> Módulos
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> Pré-visualização
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configurações
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Benchmarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="units">
            <StatsCards projects={projects} />
            <Card className="p-6">
              <ProjectsTable
                projects={projects}
                onView={handleViewReport}
                onEdit={handleEditReport}
                onDelete={handleDeleteProject}
                onPrint={handlePrintReport}
                onGenerateAI={handleGenerateAI}
                onViewAI={handleViewAIReport}
                onOpenProject={handleOpenProject}
                aiEnabled={aiEnabled}
                generatingAI={generatingAI}
                onSearchChange={setSearchQuery}
              />
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <div className="mb-4">
              <Button 
                onClick={handleExportModulesPDF}
                variant="outline"
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Exportar Estrutura em PDF
              </Button>
            </div>
            <Card className="p-6">
              <QuestionsManager
                modules={modules}
                questions={questions}
                onSaveModule={handleSaveModule}
                onDeleteModule={handleDeleteModule}
                onSave={handleSaveQuestion}
                onDelete={handleDeleteQuestion}
              />
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="p-6">
              <PreviewSimulator modules={modules} questions={questions} />
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="p-6">
                <SettingsPanel
                  aiEnabled={aiEnabled}
                  onToggleAI={handleToggleAI}
                  aiReportMode={aiReportMode}
                  onToggleAIMode={handleToggleAIMode}
                />
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="benchmarks">
            <Card className="p-6">
              {loadingBenchmarks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <BenchmarksManager
                  benchmarks={benchmarks}
                  categories={benchmarkCategories}
                  onSave={handleSaveBenchmark}
                  onDelete={handleDeleteBenchmark}
                  onAdd={handleAddBenchmark}
                  onSaveCategory={handleSaveCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onAddCategory={handleAddCategory}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ReportViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        project={selectedProject}
        type={reportType}
      />

      <ReportEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        project={selectedProject}
        type={reportType}
        onSave={handleSaveReport}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null, extra: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'category'
                ? 'Esta ação excluirá a categoria e TODAS as métricas dentro dela. Não pode ser desfeita. Deseja realmente continuar?'
                : 'Esta ação não pode ser desfeita. Deseja realmente excluir este item?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}