import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import ProgressBar from '../onboarding/ProgressBar';
import ModuleQuestions from '../onboarding/ModuleQuestions';
import ValidationErrors from '../onboarding/ValidationErrors';

export default function PreviewSimulator({ modules, questions }) {
  const [currentModuleNum, setCurrentModuleNum] = useState(1);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  const activeModules = useMemo(() => 
    modules.filter(m => m.is_active).sort((a, b) => a.order - b.order),
    [modules]
  );

  const currentModule = useMemo(() => 
    activeModules.find(m => m.number === currentModuleNum),
    [activeModules, currentModuleNum]
  );

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

  const handleAnswerChange = (fieldKey, value) => {
    setAnswers(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleNext = () => {
    if (!validateCurrentModule()) return;
    
    if (currentModuleNum < activeModules.length) {
      setCurrentModuleNum(prev => prev + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    if (currentModuleNum > 1) {
      setCurrentModuleNum(prev => prev - 1);
      setErrors({});
    }
  };

  const handleReset = () => {
    setCurrentModuleNum(1);
    setAnswers({});
    setErrors({});
  };

  if (activeModules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        Nenhum módulo ativo para pré-visualizar
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pré-visualização do Formulário</h3>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar
        </Button>
      </div>

      <div className="bg-slate-100 rounded-xl p-6">
        <ProgressBar 
          currentModule={currentModuleNum} 
          totalModules={activeModules.length} 
        />

        <Card className="p-6 mt-6">
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

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentModuleNum === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentModuleNum === activeModules.length}
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              {currentModuleNum === activeModules.length ? 'Fim' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Modo Simulação:</strong> Os dados preenchidos aqui não são salvos. 
          Use para testar layout, condicionais e validações.
        </p>
      </div>
    </div>
  );
}