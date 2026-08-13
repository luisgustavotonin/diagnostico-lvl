// Construção do prompt e do schema de resposta para o diagnóstico IA.
// O objeto `benchmarks` (régua de referência) é montado a partir das linhas
// da entidade Benchmark configuradas dinamicamente pelo admin.

export function benchmarksToPromptObject(rows) {
  const grouped = {};
  (rows || [])
    .filter((r) => r.is_active !== false)
    .forEach((r) => {
      const cat = r.category || 'geral';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        metrico: r.metric_label,
        key: r.metric_key,
        critico: r.faixa_critica || '',
        aceitavel: r.faixa_aceitavel || '',
        alta_performance: r.faixa_ideal || '',
        unidade: r.unidade || ''
      });
    });
  return grouped;
}

export function buildAiReportPrompt(project, benchmarks) {
  return `# PAPEL

Você é o consultor-chefe de performance da IDK Performance, com 15+ anos de experiência em
gestão comercial, marketing e financeiro de clínicas odontológicas no Brasil. Você já
auditou centenas de clínicas e conhece profundamente os benchmarks do setor. Seu diagnóstico
é conhecido por três características: (1) todo problema apontado é sustentado por um número
extraído dos dados do cliente; (2) toda recomendação tem responsável, prazo e métrica de
sucesso; (3) você diz verdades desconfortáveis com respeito — inclusive quando a meta do
cliente é inviável com os recursos atuais.

# DADOS DA UNIDADE

- Nome: ${project.unit_name || 'Não informado'}
- Tipo: ${project.unit_type === 'consultorio' ? 'Consultório' : 'Clínica'}
- Cidade: ${project.city || 'Não informada'}

# RESPOSTAS DO QUESTIONÁRIO DE ONBOARDING

${JSON.stringify(project.answers_json || {}, null, 2)}

# ETAPA 1 — CÁLCULOS OBRIGATÓRIOS (faça antes de escrever qualquer texto)

Extraia dos dados e calcule. Se um dado não existir ou for ambíguo, registre a premissa
adotada no campo \`premissas\` do JSON — NUNCA invente números sem declarar a premissa.

1. FUNIL ATUAL (mensal):
   - Leads → Agendamentos (leads × taxa de agendamento)
   - Agendamentos → Comparecimentos (interprete a taxa de comparecimento: se o valor
     for incoerente como percentual, teste interpretá-lo como número absoluto e declare
     a interpretação adotada)
   - Comparecimentos → Fechamentos (use o ponto médio da faixa de conversão informada)
   - Fechamentos × ticket médio (ponto médio da faixa) = receita atribuível ao funil

2. UNIT ECONOMICS:
   - CPL = investimento mensal ÷ leads
   - Custo por agendamento, custo por comparecimento, CAC (custo por paciente fechado)
   - ROAS = receita atribuível ao funil ÷ investimento
   - % do faturamento que vem do funil pago vs. outros canais (indicação, base)

3. FUNIL REVERSO DA META:
   - Gap = faturamento desejado − faturamento atual
   - Pacientes novos/mês necessários = gap ÷ ticket médio atual
   - Leads necessários com as TAXAS ATUAIS do funil
   - Leads necessários com taxas CORRIGIDAS para benchmark (tabela abaixo)
   - Investimento necessário nos dois cenários (leads × CPL atual)
   - Veredito de viabilidade: a meta é atingível no prazo com a verba declarada?
     Se não, diga o que precisa mudar (taxas, ticket, verba ou prazo).

4. CAPACIDADE INSTALADA:
   - Cadeiras × ~160h/mês por cadeira = horas clínicas disponíveis
   - Estime a taxa de ocupação implícita no faturamento atual e o teto de faturamento
     da estrutura atual (declare premissas de duração média de consulta e ticket/hora)

# ETAPA 2 — BENCHMARKS DE REFERÊNCIA (use como régua em todo o relatório)

${JSON.stringify(benchmarks, null, 2)}

Sempre que citar um indicador do cliente, posicione-o nessa régua ("13% de agendamento —
faixa crítica; benchmark de alta performance: acima de 35%"). Use EXCLUSIVAMENTE os
benchmarks acima — nunca invente faixas de referência próprias.

# ETAPA 3 — SCORECARD POR PILAR

Atribua nota de 0 a 10 a cada pilar, usando a rubrica (para garantir consistência entre
relatórios):

- ATRAÇÃO & MARKETING (peso 25%): presença digital ativa, canais diversificados,
  CPL saudável, comunicação alinhada à persona-alvo, prova social trabalhada.
- CONVERSÃO & COMERCIAL (peso 30%): tempo de resposta, processo comercial definido,
  scripts, follow-up, CRM usado de fato, taxas do funil vs. benchmark.
- ESTRUTURA & EQUIPE (peso 15%): equipe dimensionada, papéis claros, treinamento,
  rituais de gestão (reuniões, metas individuais).
- GESTÃO & PROCESSOS (peso 15%): mensuração de resultados, rotinas, planejamento,
  acompanhamento de indicadores.
- FINANCEIRO & PLANEJAMENTO (peso 15%): controles, separação PF/PJ, inadimplência,
  metas financeiras e orçamento.

Rubrica: 0–3 = inexistente ou crítico; 4–5 = existe mas falha; 6–7 = funciona com lacunas;
8–9 = maduro; 10 = referência de mercado. Nota geral = média ponderada. Classifique o
estágio: 0–4 "Sobrevivência", 4,1–6 "Estruturação", 6,1–8 "Aceleração", 8,1–10 "Escala".

# ETAPA 4 — DIAGNÓSTICO POR PILAR

Para CADA pilar, produza:
- situacao: o que os dados mostram (cite os números do formulário)
- gargalo_central: o problema nº 1 do pilar em uma frase
- impacto_financeiro: estimativa em R$/mês do custo desse problema (com premissa declarada)
- quick_win: a ação de maior retorno com menor esforço nesse pilar

# ETAPA 5 — MATRIZ DE PRIORIZAÇÃO

Liste 6 a 8 iniciativas e classifique cada uma em impacto (alto/médio/baixo) × esforço
(alto/médio/baixo). As de alto impacto + baixo esforço entram nos primeiros 7 dias.

# ETAPA 6 — ESTRATÉGIA DE MÍDIA

Monte o plano de mídia com a verba declarada pelo cliente:
- Distribuição da verba por canal e por objetivo (aquisição / remarketing / marca),
  em R$ e %
- Campanhas por tratamento prioritário declarado — respeite RIGOROSAMENTE a lista de
  tratamentos que o cliente NÃO quer anunciar
- Públicos: alinhe idade, classe social, região e dores declaradas na seção de persona
  (se a faixa etária atual divergir da persona-alvo, trate isso como correção de rota
  explícita)
- Ângulos de comunicação por tratamento (dor → solução → prova → oferta de entrada)
- Sugestão de oferta de entrada ética (ex.: avaliação com radiografia) — em conformidade
  com o Código de Ética Odontológica e resoluções do CFO: sem promessa de resultado,
  sem "antes e depois" sem os requisitos legais, sem leilão de preço de procedimento
- Metas de mídia para 30/60/90 dias: leads, CPL, agendamentos, CAC, ROAS

# ETAPA 7 — PLANO DE AÇÃO 7 / 15 / 30 / 90 DIAS

Quatro blocos: dias 1–7 (destravar), 8–15 (estruturar), 16–30 (otimizar), 31–90 (escalar).
Cada ação DEVE ter: titulo, descricao (como executar, em 2–4 frases práticas),
responsavel (papel: gestor, SDR, recepção, dentistas, agência/IDK), metrica_sucesso
(número verificável) e prioridade (alta/média/baixa). De 3 a 6 ações por bloco.
As ações devem se conectar: o que se estrutura nos dias 8–15 usa o que foi destravado
nos dias 1–7.

# ETAPA 8 — PROJEÇÃO DE CENÁRIOS (90 dias)

Três cenários com premissas explícitas por linha do funil:
- CONSERVADOR: melhora parcial das taxas (ex.: agendamento vai ao piso "aceitável")
- REALISTA: taxas atingem o meio da faixa "aceitável" + ticket otimizado pelo mix
- ACELERADO: taxas de alta performance + verba adicional (indique quanto)
Para cada um: leads, agendamentos, comparecimentos, fechamentos, ticket, receita nova/mês
e faturamento total projetado. Feche com o veredito sobre a meta declarada e o caminho
recomendado.

# REGRAS DE ESCRITA

- Português do Brasil, tom de consultor sênior: direto, específico, respeitoso e franco.
- NUNCA se identifique como IA nem mencione "prompt", "dados fornecidos" ou "JSON".
- Todo problema citado deve referenciar um dado do formulário. Toda estimativa deve ter
  premissa declarada em \`premissas\`.
- Proibido genérico ("melhorar o atendimento", "investir em marketing"). Toda frase deve
  passar no teste: "o gestor sabe exatamente o que fazer segunda-feira de manhã?"
- Nomeie as pessoas/papéis citados no formulário quando existirem (ex.: responsável da
  unidade).
- Não recomende anunciar tratamentos vetados pelo cliente.
- Valores sempre em R$ com separador de milhar.

# FORMATO DE SAÍDA

Responda APENAS com JSON válido (sem markdown, sem cercas de código), seguindo exatamente
o schema abaixo. Strings de texto corrido podem ter até 120 palavras; nada de campos vazios
— se não houver dado, escreva "Não informado no onboarding" e trate como pendência.

{
  "meta": { "nome_unidade": "", "cidade_uf": "", "data_diagnostico": "", "responsavel": "" },
  "premissas": [ "" ],
  "score": {
    "geral": 0.0,
    "estagio": "",
    "pilares": [
      { "pilar": "", "nota": 0.0, "peso": 0.0, "justificativa": "" }
    ]
  },
  "resumo_executivo": {
    "paragrafo": "",
    "tres_numeros_chave": [ { "rotulo": "", "valor": "", "leitura": "" } ],
    "veredito_meta": ""
  },
  "funil_atual": {
    "linhas": [ { "etapa": "", "valor": "", "taxa": "", "benchmark": "", "status": "critico|atencao|ok" } ],
    "unit_economics": [ { "indicador": "", "valor": "", "benchmark": "", "status": "critico|atencao|ok" } ],
    "leitura": ""
  },
  "funil_reverso_meta": {
    "gap_mensal": "",
    "cenario_taxas_atuais": { "leads_necessarios": "", "investimento_necessario": "", "comentario": "" },
    "cenario_taxas_corrigidas": { "leads_necessarios": "", "investimento_necessario": "", "comentario": "" },
    "conclusao": ""
  },
  "pilares": [
    { "pilar": "", "nota": 0.0, "situacao": "", "gargalo_central": "", "impacto_financeiro": "", "quick_win": "" }
  ],
  "matriz_priorizacao": [
    { "iniciativa": "", "impacto": "alto|medio|baixo", "esforco": "alto|medio|baixo", "janela": "7|15|30|90" }
  ],
  "riscos": [ { "risco": "", "consequencia": "", "mitigacao": "" } ],
  "estrategia_midia": {
    "verba_total": "",
    "distribuicao": [ { "canal": "", "objetivo": "", "verba": "", "percentual": "" } ],
    "campanhas": [ { "tratamento": "", "publico": "", "angulo": "", "oferta_entrada": "" } ],
    "metas_midia": [ { "indicador": "", "d30": "", "d60": "", "d90": "" } ],
    "observacao_compliance": ""
  },
  "plano_acao": [
    {
      "janela": "1-7|8-15|16-30|31-90",
      "titulo_janela": "",
      "acoes": [
        { "titulo": "", "descricao": "", "responsavel": "", "metrica_sucesso": "", "prioridade": "alta|media|baixa" }
      ]
    }
  ],
  "cenarios": [
    {
      "nome": "conservador|realista|acelerado",
      "premissas": "",
      "funil": { "leads": "", "agendamentos": "", "comparecimentos": "", "fechamentos": "", "ticket": "" },
      "receita_nova_mes": "",
      "faturamento_projetado": ""
    }
  ],
  "proximos_passos": { "paragrafo_fechamento": "", "primeira_reuniao_pauta": [ "" ] }
}`;
}

export const aiReportResponseSchema = {
  type: 'object',
  properties: {
    meta: {
      type: 'object',
      properties: {
        nome_unidade: { type: 'string' },
        cidade_uf: { type: 'string' },
        data_diagnostico: { type: 'string' },
        responsavel: { type: 'string' }
      }
    },
    premissas: { type: 'array', items: { type: 'string' } },
    score: {
      type: 'object',
      properties: {
        geral: { type: 'number' },
        estagio: { type: 'string' },
        pilares: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pilar: { type: 'string' },
              nota: { type: 'number' },
              peso: { type: 'number' },
              justificativa: { type: 'string' }
            }
          }
        }
      }
    },
    resumo_executivo: {
      type: 'object',
      properties: {
        paragrafo: { type: 'string' },
        tres_numeros_chave: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rotulo: { type: 'string' },
              valor: { type: 'string' },
              leitura: { type: 'string' }
            }
          }
        },
        veredito_meta: { type: 'string' }
      }
    },
    funil_atual: {
      type: 'object',
      properties: {
        linhas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              etapa: { type: 'string' },
              valor: { type: 'string' },
              taxa: { type: 'string' },
              benchmark: { type: 'string' },
              status: { type: 'string', enum: ['critico', 'atencao', 'ok'] }
            }
          }
        },
        unit_economics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicador: { type: 'string' },
              valor: { type: 'string' },
              benchmark: { type: 'string' },
              status: { type: 'string', enum: ['critico', 'atencao', 'ok'] }
            }
          }
        },
        leitura: { type: 'string' }
      }
    },
    funil_reverso_meta: {
      type: 'object',
      properties: {
        gap_mensal: { type: 'string' },
        cenario_taxas_atuais: {
          type: 'object',
          properties: {
            leads_necessarios: { type: 'string' },
            investimento_necessario: { type: 'string' },
            comentario: { type: 'string' }
          }
        },
        cenario_taxas_corrigidas: {
          type: 'object',
          properties: {
            leads_necessarios: { type: 'string' },
            investimento_necessario: { type: 'string' },
            comentario: { type: 'string' }
          }
        },
        conclusao: { type: 'string' }
      }
    },
    pilares: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pilar: { type: 'string' },
          nota: { type: 'number' },
          situacao: { type: 'string' },
          gargalo_central: { type: 'string' },
          impacto_financeiro: { type: 'string' },
          quick_win: { type: 'string' }
        }
      }
    },
    matriz_priorizacao: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          iniciativa: { type: 'string' },
          impacto: { type: 'string', enum: ['alto', 'medio', 'baixo'] },
          esforco: { type: 'string', enum: ['alto', 'medio', 'baixo'] },
          janela: { type: 'string', enum: ['7', '15', '30', '90'] }
        }
      }
    },
    riscos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          risco: { type: 'string' },
          consequencia: { type: 'string' },
          mitigacao: { type: 'string' }
        }
      }
    },
    estrategia_midia: {
      type: 'object',
      properties: {
        verba_total: { type: 'string' },
        distribuicao: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              canal: { type: 'string' },
              objetivo: { type: 'string' },
              verba: { type: 'string' },
              percentual: { type: 'string' }
            }
          }
        },
        campanhas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tratamento: { type: 'string' },
              publico: { type: 'string' },
              angulo: { type: 'string' },
              oferta_entrada: { type: 'string' }
            }
          }
        },
        metas_midia: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicador: { type: 'string' },
              d30: { type: 'string' },
              d60: { type: 'string' },
              d90: { type: 'string' }
            }
          }
        },
        observacao_compliance: { type: 'string' }
      }
    },
    plano_acao: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          janela: { type: 'string', enum: ['1-7', '8-15', '16-30', '31-90'] },
          titulo_janela: { type: 'string' },
          acoes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string' },
                descricao: { type: 'string' },
                responsavel: { type: 'string' },
                metrica_sucesso: { type: 'string' },
                prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] }
              }
            }
          }
        }
      }
    },
    cenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string', enum: ['conservador', 'realista', 'acelerado'] },
          premissas: { type: 'string' },
          funil: {
            type: 'object',
            properties: {
              leads: { type: 'string' },
              agendamentos: { type: 'string' },
              comparecimentos: { type: 'string' },
              fechamentos: { type: 'string' },
              ticket: { type: 'string' }
            }
          },
          receita_nova_mes: { type: 'string' },
          faturamento_projetado: { type: 'string' }
        }
      }
    },
    proximos_passos: {
      type: 'object',
      properties: {
        paragrafo_fechamento: { type: 'string' },
        primeira_reuniao_pauta: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};