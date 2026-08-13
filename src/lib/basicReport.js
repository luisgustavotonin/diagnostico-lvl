// Geração do relatório básico de onboarding a partir das respostas,
// módulos e perguntas. Compartilhado entre o fluxo de conclusão (Onboarding)
// e a regeneração no Admin — garante a mesma sequência do questionário:
// cada pergunta principal seguida de suas condicionais (filhas).

const formatCNPJ = (cnpj) => {
  if (!cnpj) return '';
  const clean = String(cnpj).replace(/\D/g, '');
  if (clean.length === 14) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  }
  return cnpj;
};

const formatCPF = (cpf) => {
  if (!cpf) return '';
  const clean = String(cpf).replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  return cpf;
};

const formatCEP = (cep) => {
  if (!cep) return '';
  const clean = String(cep).replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return cep;
};

const formatPhone = (phone) => {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
};

const isQuestionVisible = (question, answers) => {
  if (!question.is_conditional) return true;
  const op = question.condition_operator || 'equals';
  const current = answers[question.condition_field];
  const target = question.condition_value;
  switch (op) {
    case 'equals': return current === target;
    case 'not_equals': return current !== target;
    case 'contains': return String(current || '').includes(target);
    case 'greater_than': return parseFloat(current) > parseFloat(target);
    case 'less_than': return parseFloat(current) < parseFloat(target);
    default: return true;
  }
};

const formatAnswer = (q, raw) => {
  let answer = raw;
  if (answer === undefined || answer === null || answer === '') return null;
  if (q.field_type === 'currency_cents' && answer) {
    answer = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(answer / 100);
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
  return answer;
};

export function buildBasicReport(answers = {}, modules = [], questions = []) {
  const activeModules = modules
    .filter(m => m.is_active)
    .sort((a, b) => a.order - b.order);

  let report = '# RELATÓRIO DE ONBOARDING\n\n';
  report += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

  activeModules.forEach(module => {
    report += `## ${module.title}\n\n`;

    const moduleQuestions = questions
      .filter(q => q.module_id === module.id && q.is_active && q.field_key !== 'horario_atendimento')
      .sort((a, b) => a.order - b.order);

    const mainQuestions = moduleQuestions.filter(q => !q.is_conditional);
    const conditionals = moduleQuestions.filter(q => q.is_conditional);

    const writeQA = (q) => {
      if (!isQuestionVisible(q, answers)) return;
      const answer = formatAnswer(q, answers[q.field_key]);
      report += `**${q.text}**\n`;
      report += `${answer || 'Não informado'}\n\n`;
    };

    mainQuestions.forEach(q => {
      writeQA(q);
      conditionals
        .filter(c => c.parent_question_id === q.id)
        .forEach(c => writeQA(c));
    });

    // Horário de atendimento no final do módulo 1
    if (module.number === 1 && answers.horario_atendimento) {
      const schedule = answers.horario_atendimento;
      let formatted = '';
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

      days.forEach((day, idx) => {
        const d = schedule[day];
        if (d && (d.isOpen || d.aberto) && d.periods && d.periods.length > 0) {
          const periods = d.periods
            .filter(p => (p.start || p.inicio) && (p.end || p.fim))
            .map(p => `${p.start || p.inicio} às ${p.end || p.fim}`)
            .join(', ');
          formatted += `\n- ${dayNames[idx]}: ${periods || 'Horários não definidos'}`;
        }
      });

      if (formatted) {
        report += `**Horário de Atendimento**\n`;
        report += `${formatted}\n\n`;
      }
    }
  });

  return report;
}