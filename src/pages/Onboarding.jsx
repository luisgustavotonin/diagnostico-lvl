import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ProgressBar from '../components/onboarding/ProgressBar';
import ModuleQuestions from '../components/onboarding/ModuleQuestions';
import ValidationErrors from '../components/onboarding/ValidationErrors';

export default function Onboarding() {
  const [step, setStep] = useState('welcome'); // welcome, module-1 to module-7, conclusion
  const [currentModuleNum, setCurrentModuleNum] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Carregar módulos
  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => base44.entities.Module.filter({ is_active: true }, 'order'),
  });

  // Carregar perguntas
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.filter({ is_active: true }, 'order'),
  });

  const activeModules = useMemo(() => 
    modules.filter(m => m.is_active).sort((a, b) => a.order - b.order),
    [modules]
  );

  const currentModule = useMemo(() => 
    activeModules.find(m => m.number === currentModuleNum),
    [activeModules, currentModuleNum]
  );

  // Verifica se pergunta condicional está visível
  const isQuestionVisible = (question) => {
    if (!question.is_conditional) return true;
    
    const conditionField = question.condition_field;
    const conditionValue = question.condition_value;
    const conditionOperator = question.condition_operator || 'equals';
    const currentValue = answers[conditionField];

    switch (conditionOperator) {
      case 'equals':
        return currentValue === conditionValue;
      case 'not_equals':
        return currentValue !== conditionValue;
      case 'contains':
        return String(currentValue || '').includes(conditionValue);
      case 'greater_than':
        return parseFloat(currentValue) > parseFloat(conditionValue);
      case 'less_than':
        return parseFloat(currentValue) < parseFloat(conditionValue);
      default:
        return true;
    }
  };

  // Validar módulo atual
  const validateCurrentModule = () => {
    if (!currentModule) return true;
    
    const moduleQuestions = questions.filter(q => 
      q.module_id === currentModule.id && q.is_active
    );
    
    const newErrors = {};
    let isValid = true;

    moduleQuestions.forEach(q => {
      if (q.is_required && isQuestionVisible(q)) {
        const value = answers[q.field_key];
        const isEmpty = value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0);
        
        if (isEmpty) {
          newErrors[q.field_key] = true;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Iniciar onboarding
  const handleStart = async () => {
    setSaving(true);
    const project = await base44.entities.Project.create({
      status: 'IN_PROGRESS',
      current_module: 1,
      answers_json: {}
    });
    setProjectId(project.id);
    setStep('module');
    setCurrentModuleNum(1);
    setSaving(false);
  };

  // Salvar progresso
  const saveProgress = async () => {
    if (!projectId) return;
    
    // Extrair dados principais das respostas
    const updateData = {
      answers_json: answers,
      current_module: currentModuleNum
    };

    // Mapear campos conhecidos
    if (answers.unit_name) updateData.unit_name = answers.unit_name;
    if (answers.unit_type) updateData.unit_type = answers.unit_type;
    if (answers.city) updateData.city = answers.city;
    if (answers.cnpj) updateData.cnpj = answers.cnpj;
    if (answers.phone) updateData.phone = answers.phone;

    await base44.entities.Project.update(projectId, updateData);
  };

  // Atualizar resposta
  const handleAnswerChange = (fieldKey, value) => {
    setAnswers(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  // Próximo módulo
  const handleNext = async () => {
    if (!validateCurrentModule()) return;
    
    setSaving(true);
    await saveProgress();
    
    if (currentModuleNum < activeModules.length) {
      setCurrentModuleNum(prev => prev + 1);
    } else {
      setStep('conclusion');
    }
    setSaving(false);
    setErrors({});
    window.scrollTo(0, 0);
  };

  // Módulo anterior
  const handlePrevious = () => {
    if (currentModuleNum > 1) {
      setCurrentModuleNum(prev => prev - 1);
      setErrors({});
      window.scrollTo(0, 0);
    }
  };

  // Calcular Health Score
  const calculateHealthScore = () => {
    const weights = {
      marketing: { weight: 0.30, maxPoints: 0, earnedPoints: 0 },
      comercial: { weight: 0.30, maxPoints: 0, earnedPoints: 0 },
      operacao: { weight: 0.20, maxPoints: 0, earnedPoints: 0 },
      metas: { weight: 0.20, maxPoints: 0, earnedPoints: 0 }
    };

    questions.forEach(q => {
      if (q.weight_category && q.weight_points && weights[q.weight_category]) {
        weights[q.weight_category].maxPoints += q.weight_points;
        
        const answer = answers[q.field_key];
        if (answer === 'Sim' || answer === true) {
          weights[q.weight_category].earnedPoints += q.weight_points;
        } else if (typeof answer === 'number' && answer > 0) {
          weights[q.weight_category].earnedPoints += Math.min(q.weight_points, answer);
        }
      }
    });

    let totalScore = 0;
    Object.values(weights).forEach(cat => {
      if (cat.maxPoints > 0) {
        const categoryScore = (cat.earnedPoints / cat.maxPoints) * 100;
        totalScore += categoryScore * cat.weight;
      }
    });

    return Math.round(totalScore);
  };

  // Gerar relatório básico
  const generateBasicReport = () => {
    let report = '# RELATÓRIO DE ONBOARDING\n\n';
    report += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    activeModules.forEach(module => {
      report += `## ${module.title}\n\n`;
      
      const moduleQuestions = questions
        .filter(q => q.module_id === module.id && q.is_active)
        .sort((a, b) => a.order - b.order);
      
      moduleQuestions.forEach(q => {
        if (isQuestionVisible(q)) {
          let answer = answers[q.field_key];
          
          // Formatar resposta baseado no tipo
          if (q.field_type === 'currency_cents' && answer) {
            answer = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(answer / 100);
          } else if (Array.isArray(answer)) {
            answer = answer.join(', ');
          }
          
          report += `**${q.text}**\n`;
          report += `${answer || 'Não informado'}\n\n`;
        }
      });
    });

    return report;
  };

  // Concluir onboarding
  const handleComplete = async () => {
    if (!validateCurrentModule()) return;
    
    setSaving(true);
    
    const healthScore = calculateHealthScore();
    const healthLevel = healthScore >= 70 ? 'Alta' : healthScore >= 40 ? 'Média' : 'Baixa';
    const basicReport = generateBasicReport();

    await base44.entities.Project.update(projectId, {
      status: 'COMPLETED',
      answers_json: answers,
      completed_at: new Date().toISOString(),
      health_score: healthScore,
      health_level: healthLevel,
      report_basic_text: basicReport,
      unit_name: answers.unit_name || '',
      unit_type: answers.unit_type || '',
      city: answers.city || '',
      cnpj: answers.cnpj || '',
      phone: answers.phone || ''
    });

    setCompleted(true);
    setSaving(false);
  };

  if (loadingModules || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  // Tela de boas-vindas
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-xl border-0">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
            Bem-vindo ao Onboarding Estratégico
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Este questionário foi desenvolvido para entender a realidade atual da sua clínica, 
            identificar oportunidades e orientar as próximas ações estratégicas.
            <br /><br />
            O preenchimento é rápido e fundamental para que possamos atuar com precisão.
          </p>
          <Button 
            size="lg" 
            onClick={handleStart}
            disabled={saving}
            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-6 text-lg rounded-xl"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Iniciar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  // Tela de conclusão
  if (step === 'conclusion' || completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-xl border-0">
          <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto mb-8 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
            Obrigado!
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Obrigado por compartilhar as informações da sua unidade.
            <br /><br />
            Com base nas respostas, nossa equipe já consegue ter uma visão clara do cenário atual 
            e dos próximos passos estratégicos.
            <br /><br />
            Em breve, um consultor dará continuidade ao atendimento.
          </p>
          {!completed && (
            <Button 
              size="lg" 
              onClick={handleComplete}
              disabled={saving}
              className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Confirmar Conclusão
              <CheckCircle2 className="w-5 h-5 ml-2" />
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Tela de módulo
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <ProgressBar 
          currentModule={currentModuleNum} 
          totalModules={activeModules.length} 
        />

        <Card className="p-6 md:p-10 shadow-xl border-0 mt-6">
          <ValidationErrors errors={errors} questions={questions} />
          
          {currentModule && (
            <ModuleQuestions
              module={currentModule}
              questions={questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              errors={errors}
            />
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentModuleNum === 1 || saving}
              className="px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {currentModuleNum === activeModules.length ? 'Concluir' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}