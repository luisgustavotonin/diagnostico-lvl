/**
 * Utilidade para preenchimento automático de pontuação do Health Score
 * com base no texto das opções de resposta
 */

// Palavras-chave para pontuação 0
const ZERO_KEYWORDS = [
  'não', 'nunca', 'nenhum', 'nenhuma', 'desconheço', 'não sei', 
  'não faço', 'sem controle', 'inexistente', 'não possui', 
  'não tenho', 'não há', 'não realizo', 'ausente'
];

// Palavras-chave para pontuação parcial (40-60)
const PARTIAL_KEYWORDS = [
  'parcialmente', 'raramente', 'às vezes', 'informal', 'anotações',
  'planilha', 'esporadicamente', 'ocasionalmente', 'manual', 
  'simples', 'básico', 'pouco', 'média', 'médio'
];

// Palavras-chave para pontuação alta (80-100)
const HIGH_KEYWORDS = [
  'sim', 'sempre', 'estruturado', 'sistema', 'processo definido',
  'completo', 'avançado', 'automatizado', 'integrado', 'profissional',
  'frequentemente', 'regularmente', 'alto', 'alta', 'excelente'
];

/**
 * Analisa o texto de uma opção e retorna uma pontuação sugerida (0-100)
 * baseada em regras semânticas
 */
export function autoScoreOption(label) {
  if (!label || typeof label !== 'string') return 50;
  
  const normalized = label.toLowerCase().trim();
  
  // Verifica palavras-chave de pontuação zero
  if (ZERO_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return 0;
  }
  
  // Verifica palavras-chave de pontuação alta
  if (HIGH_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return 100;
  }
  
  // Verifica palavras-chave de pontuação parcial
  if (PARTIAL_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return 50;
  }
  
  // Detectar padrões numéricos (ex: "Menos de 5 minutos")
  const numberMatch = normalized.match(/(\d+)/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    
    // Tempo de resposta (minutos)
    if (normalized.includes('minuto') || normalized.includes('min')) {
      if (normalized.includes('menos de') && num <= 5) return 100;
      if (num <= 5) return 100;
      if (num <= 30) return 70;
      if (num <= 60) return 40;
      return 0;
    }
    
    // Percentual de conversão
    if (normalized.includes('%') || normalized.includes('percent')) {
      if (num >= 30) return 100;
      if (num >= 10) return 60;
      return 30;
    }
    
    // Número de pessoas na equipe
    if (normalized.includes('pessoa') || normalized.includes('profissional')) {
      if (num === 0) return 0;
      if (num === 1) return 50;
      return 100;
    }
    
    // Meses (prazo)
    if (normalized.includes('mes') || normalized.includes('mês')) {
      if (num >= 6) return 100;
      if (num >= 3) return 60;
      return 30;
    }
  }
  
  // Análise de hierarquia (para opções escalonadas)
  // Se contém "+" ou "mais" geralmente é melhor
  if (normalized.includes('+') || normalized.includes('mais de')) {
    return 100;
  }
  
  // Se contém "menos" geralmente é pior
  if (normalized.includes('menos de') && !normalized.includes('minuto')) {
    return 30;
  }
  
  // Padrão: pontuação média
  return 50;
}

/**
 * Processa um array de opções e preenche automaticamente os scores
 * Retorna array no formato [{ label, score }]
 */
export function autoScoreOptions(options) {
  if (!options || !Array.isArray(options)) return [];
  
  // Se já estão no formato objeto com score, retornar como está
  if (options.length > 0 && typeof options[0] === 'object' && options[0].label) {
    return options.map(opt => ({
      label: opt.label,
      score: opt.score !== undefined ? opt.score : autoScoreOption(opt.label)
    }));
  }
  
  // Se são strings, converter para objetos com score automático
  if (options.length > 0 && typeof options[0] === 'string') {
    // Para opções escalonadas, distribuir proporcionalmente
    if (options.length >= 3) {
      return options.map((label, index) => ({
        label,
        score: Math.round((index / (options.length - 1)) * 100)
      }));
    }
    
    // Para poucas opções, usar análise semântica
    return options.map(label => ({
      label,
      score: autoScoreOption(label)
    }));
  }
  
  return [];
}

/**
 * Identifica a categoria (módulo) sugerida para uma pergunta
 * baseada no texto da pergunta
 */
export function suggestCategory(questionText, modules) {
  if (!questionText || !modules) return null;
  
  const normalized = questionText.toLowerCase();
  
  const categoryKeywords = {
    'Financeiro': ['financeiro', 'custo', 'preço', 'faturamento', 'receita', 'lucro', 'ticket médio', 'inadimplência'],
    'Marketing': ['marketing', 'tráfego', 'anúncio', 'campanha', 'mídia', 'conversão', 'lead', 'google', 'instagram'],
    'Comercial & Atendimento': ['atendimento', 'comercial', 'vendas', 'lead', 'tempo de resposta', 'agendamento'],
    'Equipe & Gestão': ['equipe', 'gestão', 'colaborador', 'funcionário', 'pessoas', 'organização'],
    'Expectativas & Metas': ['meta', 'expectativa', 'objetivo', 'prazo', 'crescimento']
  };
  
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      const module = modules.find(m => m.title === categoryName);
      if (module) return module.id;
    }
  }
  
  return null;
}