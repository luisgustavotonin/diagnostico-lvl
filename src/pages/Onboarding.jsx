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
  const [loadingProject, setLoadingProject] = useState(true);

  // Verificar se há um projeto na URL para retomar
  useEffect(() => {
    const loadProject = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const projectIdFromUrl = urlParams.get('project');

      if (projectIdFromUrl) {
        try {
          const projects = await base44.entities.Project.filter({ id: projectIdFromUrl });
          if (projects && projects.length > 0) {
            const proj = projects[0];
            setProjectId(proj.id);
            setAnswers(proj.answers_json || {});
            setCurrentModuleNum(proj.current_module || 1);
            setStep('module');
          }
        } catch (error) {
          console.error('Erro ao carregar projeto:', error);
        }
      }
      setLoadingProject(false);
    };

    loadProject();
  }, []);

  // Carregar módulos
  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => base44.entities.Module.filter({ is_active: true }, 'order')
  });

  // Carregar perguntas
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.filter({ is_active: true }, 'order')
  });

  const activeModules = useMemo(() =>
  modules.filter((m) => m.is_active).sort((a, b) => a.order - b.order),
  [modules]
  );

  const currentModule = useMemo(() =>
  activeModules.find((m) => m.number === currentModuleNum),
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

    const moduleQuestions = questions.filter((q) =>
    q.module_id === currentModule.id && q.is_active
    );

    const newErrors = {};
    let isValid = true;

    moduleQuestions.forEach((q) => {
      if (q.is_required && isQuestionVisible(q)) {
        const value = answers[q.field_key];
        const isEmpty = value === undefined || value === null || value === '' ||
        Array.isArray(value) && value.length === 0;

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
      status: 'DRAFT',
      current_module: 1,
      answers_json: {}
    });
    setProjectId(project.id);
    setStep('module');
    setCurrentModuleNum(1);
    setSaving(false);
  };

  // Salvar progresso (apenas dados, sem mudar status)
  const saveProgress = async () => {
    if (!projectId) return;

    const updateData = {
      answers_json: answers,
      current_module: currentModuleNum
    };

    // Mapear campos do módulo 1 para facilitar busca
    if (answers.nome_consultorio) updateData.unit_name = answers.nome_consultorio;
    if (answers.nome_fantasia) updateData.unit_name = answers.nome_fantasia;
    if (answers.nome_unidade) updateData.unit_name = answers.nome_unidade;

    if (answers.tipo_unidade) {
      const tipo = String(answers.tipo_unidade).toLowerCase();
      updateData.unit_type = tipo === 'consultório' || tipo === 'consultorio' ? 'consultorio' : 'clinica';

      // Se for consultório, salvar CPF; se for clínica, salvar CNPJ
      if (updateData.unit_type === 'consultorio' && answers.cpf) {
        updateData.cpf = answers.cpf;
      } else if (updateData.unit_type === 'clinica' && answers.cnpj) {
        updateData.cnpj = answers.cnpj;
      }
    }

    if (answers.city) updateData.city = answers.city;else
    if (answers.cidade) updateData.city = answers.cidade;
    if (answers.telefone) updateData.phone = answers.telefone;

    await base44.entities.Project.update(projectId, updateData);
  };

  // Salvar e marcar como "Em Andamento"
  const handleSaveProgress = async () => {
    if (!projectId) return;

    setSaving(true);

    const updateData = {
      answers_json: answers,
      current_module: currentModuleNum,
      status: 'IN_PROGRESS'
    };

    if (answers.nome_consultorio) updateData.unit_name = answers.nome_consultorio;
    if (answers.nome_fantasia) updateData.unit_name = answers.nome_fantasia;
    if (answers.nome_unidade) updateData.unit_name = answers.nome_unidade;

    if (answers.tipo_unidade) {
      const tipo = String(answers.tipo_unidade).toLowerCase();
      updateData.unit_type = tipo === 'consultório' || tipo === 'consultorio' ? 'consultorio' : 'clinica';

      if (updateData.unit_type === 'consultorio' && answers.cpf) {
        updateData.cpf = answers.cpf;
      } else if (updateData.unit_type === 'clinica' && answers.cnpj) {
        updateData.cnpj = answers.cnpj;
      }
    }

    if (answers.city) updateData.city = answers.city;else
    if (answers.cidade) updateData.city = answers.cidade;
    if (answers.telefone) updateData.phone = answers.telefone;

    await base44.entities.Project.update(projectId, updateData);
    setSaving(false);
  };

  // Atualizar resposta
  const handleAnswerChange = (fieldKey, value) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  // Próximo módulo
  const handleNext = async () => {
    if (!validateCurrentModule()) return;

    setSaving(true);
    await saveProgress();

    if (currentModuleNum < activeModules.length) {
      setCurrentModuleNum((prev) => prev + 1);
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
      setCurrentModuleNum((prev) => prev - 1);
      setErrors({});
      window.scrollTo(0, 0);
    }
  };

  // Carregar configurações do Health Score
  const { data: healthScoreSettings = [] } = useQuery({
    queryKey: ['healthScoreSettings'],
    queryFn: () => base44.entities.AppSettings.filter({
      key: { $regex: '^health_score_' }
    })
  });

  // Calcular Health Score (NOVO - baseado em pontuação por resposta)
  const calculateHealthScore = () => {
    // Carregar lista de módulos configurados
    const categoriesListSetting = healthScoreSettings.find((s) => s.key === 'health_score_categories');
    let categoryModuleIds = [];

    if (categoriesListSetting) {
      try {
        categoryModuleIds = JSON.parse(categoriesListSetting.value);
      } catch {
        categoryModuleIds = [];
      }
    }

    if (categoryModuleIds.length === 0) {
      return 0; // Sem módulos configurados
    }

    // Montar estrutura de pesos por módulo
    const weights = {};

    categoryModuleIds.forEach((moduleId) => {
      const enabledSetting = healthScoreSettings.find((s) => s.key === `health_score_module_${moduleId}_enabled`);
      const weightSetting = healthScoreSettings.find((s) => s.key === `health_score_module_${moduleId}_weight`);

      const isEnabled = enabledSetting ? enabledSetting.value === 'true' : true;
      const weightValue = weightSetting ? parseFloat(weightSetting.value) / 100 : 0.25;

      if (isEnabled) {
        weights[moduleId] = {
          weight: weightValue,
          totalScore: 0,
          count: 0
        };
      }
    });

    // Calcular pontuação por pergunta (baseado na resposta selecionada)
    questions.forEach((q) => {
      // Verificar se a pergunta participa do Health Score
      if (!q.weight_category || !weights[q.weight_category]) return;

      // Verificar se a pergunta está visível (para condicionais)
      if (!isQuestionVisible(q)) return;

      const userAnswer = answers[q.field_key];
      if (!userAnswer) return;

      // Encontrar a pontuação da opção selecionada
      let score = 0;

      if (q.options && Array.isArray(q.options) && q.options.length > 0) {
        // Verificar se as opções estão no novo formato ({ label, score })
        const firstOption = q.options[0];

        if (typeof firstOption === 'object' && firstOption.label !== undefined) {
          // Novo formato: buscar a opção selecionada
          const selectedOption = q.options.find((opt) => opt.label === userAnswer);
          if (selectedOption && selectedOption.score !== undefined) {
            score = selectedOption.score;
          }
        } else {
          // Formato antigo (string[]): atribuir pontuação padrão
          if (userAnswer === 'Sim' || userAnswer === true) {
            score = 100;
          } else if (userAnswer === 'Não' || userAnswer === false) {
            score = 0;
          } else {
            score = 50; // Resposta parcial
          }
        }
      } else if (q.field_type === 'yes_no') {
        // Perguntas sim/não sem opções configuradas
        score = userAnswer === 'Sim' || userAnswer === true ? 100 : 0;
      }

      // Adicionar à pontuação do módulo
      weights[q.weight_category].totalScore += score;
      weights[q.weight_category].count += 1;
    });

    // Calcular score final ponderado
    let finalScore = 0;

    Object.values(weights).forEach((moduleData) => {
      if (moduleData.count > 0) {
        // Média do módulo (0-100)
        const moduleAverage = moduleData.totalScore / moduleData.count;
        // Aplicar peso do módulo
        finalScore += moduleAverage * moduleData.weight;
      }
    });

    return Math.round(finalScore);
  };

  // Funções de formatação
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
    }
    return cnpj;
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return cpf;
  };

  const formatCEP = (cep) => {
    if (!cep) return '';
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return cep;
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  // Gerar relatório básico
  const generateBasicReport = () => {
    let report = '# RELATÓRIO DE ONBOARDING\n\n';
    report += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    activeModules.forEach((module) => {
      report += `## ${module.title}\n\n`;

      const moduleQuestions = questions.
      filter((q) => q.module_id === module.id && q.is_active && q.field_key !== 'horario_atendimento').
      sort((a, b) => a.order - b.order);

      moduleQuestions.forEach((q) => {
        if (isQuestionVisible(q)) {
          let answer = answers[q.field_key];

          // Formatar resposta baseado no tipo
          if (q.field_type === 'currency_cents' && answer) {
            answer = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(answer / 100);
          } else if (q.field_type === 'percent' && answer) {
            answer = `${answer}%`;
          } else if (q.field_type === 'cnpj' && answer) {
            answer = formatCNPJ(answer);
          } else if (q.field_type === 'cpf' && answer) {
            answer = formatCPF(answer);
          } else if (q.field_type === 'cep' && answer) {
            answer = formatCEP(answer);
          } else if (q.field_type === 'phone' && answer) {
            answer = formatPhone(answer);
          } else if (Array.isArray(answer)) {
            answer = answer.join(', ');
          } else if (typeof answer === 'object' && answer !== null) {
            answer = JSON.stringify(answer, null, 2);
          }

          report += `**${q.text}**\n`;
          report += `${answer || 'Não informado'}\n\n`;
        }
      });

      // Adicionar horário de atendimento no final do módulo 1
      if (module.number === 1 && answers.horario_atendimento) {
        const schedule = answers.horario_atendimento;
        let formatted = '';
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

        days.forEach((day, idx) => {
          if (schedule[day] && schedule[day].isOpen && schedule[day].periods && schedule[day].periods.length > 0) {
            formatted += `\n- ${dayNames[idx]}: `;
            const periods = schedule[day].periods.
            filter((p) => p.start && p.end).
            map((p) => `${p.start} às ${p.end}`).
            join(', ');
            formatted += periods || 'Horários não definidos';
          }
        });

        if (formatted) {
          report += `**Horário de Atendimento**\n`;
          report += `${formatted}\n\n`;
        }
      }
    });

    return report;
  };

  // Concluir onboarding
  const handleComplete = async () => {
    if (!validateCurrentModule()) return;

    setSaving(true);

    const healthScore = calculateHealthScore();
    let healthLevel = 'Crítico';
    if (healthScore >= 80) healthLevel = 'Maduro / Escalável';else
    if (healthScore >= 60) healthLevel = 'Estruturado';else
    if (healthScore >= 40) healthLevel = 'Instável';
    const basicReport = generateBasicReport();

    const tipo = String(answers.tipo_unidade || '').toLowerCase();
    const unitType = tipo === 'consultório' || tipo === 'consultorio' ? 'consultorio' : tipo === 'clínica' || tipo === 'clinica' ? 'clinica' : '';

    await base44.entities.Project.update(projectId, {
      status: 'COMPLETED',
      answers_json: answers,
      completed_at: new Date().toISOString(),
      health_score: healthScore,
      health_level: healthLevel,
      report_basic_text: basicReport,
      unit_name: answers.nome_consultorio || answers.nome_fantasia || answers.nome_unidade || '',
      unit_type: unitType,
      city: answers.city || answers.cidade || '',
      cpf: unitType === 'consultorio' ? answers.cpf || '' : '',
      cnpj: unitType === 'clinica' ? answers.cnpj || '' : '',
      phone: answers.telefone || ''
    });

    setCompleted(true);
    setSaving(false);
  };

  if (loadingModules || loadingQuestions || loadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>);

  }

  // Tela de boas-vindas
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 text-center shadow-xl border-0">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Bem-vindo ao seu Diagnóstico

          </h1>
          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            Este processo nos ajuda a conhecer sua clínica e montar a{' '}
            <span className="text-slate-800 font-semibold">estratégia de tráfego perfeita</span> para você.
          </p>

          <div className="flex items-center justify-center gap-2 mb-8 text-slate-600">
            <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Tempo estimado: <span className="font-bold text-slate-800">30 a 60 minutos</span></span>
          </div>

          <div className="space-y-3 mb-8">
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium">Estratégia personalizada para sua clínica</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium">Diagnóstico completo do seu marketing</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium">Identificação de oportunidades de crescimento</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            disabled={saving}
            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-6 text-lg rounded-xl w-full mb-4">
            
            {saving ?
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> :
            null}
            Iniciar Onboarding
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-slate-400">
            Suas informações são confidenciais e usadas apenas para sua estratégia.
          </p>
        </Card>
      </div>);

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
          {!completed &&
          <div className="flex justify-center mt-8">
              <Button
              size="lg"
              onClick={handleComplete}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl">
              
                {saving ?
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> :
              null}
                Confirmar Conclusão
                <CheckCircle2 className="w-5 h-5 ml-2" />
              </Button>
            </div>
          }
        </Card>
      </div>);

  }

  // Tela de módulo
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <ProgressBar
          currentModule={currentModuleNum}
          totalModules={activeModules.length} />
        

        <Card className="p-6 md:p-10 shadow-xl border-0 mt-6">
          <ValidationErrors errors={errors} questions={questions} />
          
          {currentModule &&
          <ModuleQuestions
            module={currentModule}
            questions={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            errors={errors} />

          }

          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentModuleNum === 1 || saving}
              className="px-6">
              
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveProgress}
                disabled={saving}
                className="px-6">
                
                {saving ?
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                null}
                Salvar Progresso
              </Button>

              <Button
                onClick={handleNext}
                disabled={saving}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6">
                
                {saving ?
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                null}
                {currentModuleNum === activeModules.length ? 'Concluir' : 'Próximo'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>);

}