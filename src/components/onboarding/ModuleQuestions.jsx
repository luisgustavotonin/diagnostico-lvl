import React, { useMemo } from 'react';
import QuestionField from './QuestionField';

export default function ModuleQuestions({ 
  module, 
  questions, 
  answers, 
  onAnswerChange, 
  errors 
}) {
  // Filtra e ordena perguntas do módulo
  const moduleQuestions = useMemo(() => {
    return questions
      .filter(q => q.module_id === module.id && q.is_active)
      .sort((a, b) => a.order - b.order);
  }, [questions, module.id]);

  // Verifica se uma pergunta condicional deve ser exibida
  const shouldShowQuestion = (question) => {
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

  // Agrupa perguntas principais e suas condicionais
  const groupedQuestions = useMemo(() => {
    const mainQuestions = moduleQuestions.filter(q => !q.is_conditional);
    const conditionals = moduleQuestions.filter(q => q.is_conditional);

    return mainQuestions.map(main => ({
      main,
      conditionals: conditionals.filter(c => c.parent_question_id === main.id)
    }));
  }, [moduleQuestions]);

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-semibold text-slate-800">{module.title}</h2>
        {module.description && (
          <p className="mt-2 text-slate-600">{module.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {groupedQuestions.map(({ main, conditionals }) => (
          <div key={main.id} className="space-y-4">
            {shouldShowQuestion(main) && (
              <QuestionField
                question={main}
                value={answers[main.field_key]}
                onChange={(val) => onAnswerChange(main.field_key, val)}
                error={errors[main.field_key]}
              />
            )}

            {conditionals.map(conditional => (
              shouldShowQuestion(conditional) && (
                <div key={conditional.id} className="ml-6 pl-4 border-l-2 border-slate-200">
                  <QuestionField
                    question={conditional}
                    value={answers[conditional.field_key]}
                    onChange={(val) => onAnswerChange(conditional.field_key, val)}
                    error={errors[conditional.field_key]}
                  />
                </div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}