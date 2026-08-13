import React, { useMemo } from 'react';

const STATUS_STYLES = {
  critico: { label: 'Crítico', cls: 'bg-red-100 text-red-700 border-red-200' },
  atencao: { label: 'Atenção', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  ok: { label: 'OK', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const statusBadge = (s) => {
  const st = STATUS_STYLES[s] || STATUS_STYLES.ok;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>
      {st.label}
    </span>
  );
};

function SectionTitle({ children, kicker }) {
  return (
    <div className="mb-4">
      {kicker && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{kicker}</p>
      )}
      <h2 className="text-lg font-bold text-foreground border-b-2 border-primary pb-2">{children}</h2>
    </div>
  );
}

function KV({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      <span className="text-sm text-foreground font-medium">{children || '—'}</span>
    </div>
  );
}

function Paragraph({ children }) {
  if (!children) return null;
  return <p className="text-sm text-foreground leading-relaxed mb-3">{children}</p>;
}

export default function AiReportView({ project }) {
  const data = useMemo(() => {
    const raw = project?.ai_report_text;
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return null;
    }
  }, [project?.ai_report_text]);

  if (!data) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Não foi possível interpretar o diagnóstico (JSON inválido). Regere o relatório pela IA.
      </div>
    );
  }

  const meta = data.meta || {};
  const score = data.score || {};
  const resumo = data.resumo_executivo || {};
  const funilAtual = data.funil_atual || {};
  const funilReverso = data.funil_reverso_meta || {};
  const pilares = data.pilares || [];
  const matriz = data.matriz_priorizacao || [];
  const riscos = data.riscos || [];
  const midia = data.estrategia_midia || {};
  const plano = data.plano_acao || [];
  const cenarios = data.cenarios || [];
  const proxPassos = data.proximos_passos || {};
  const premissas = data.premissas || [];

  const scoreNum = parseFloat(String(score.geral || 0)) || 0;
  const scoreStr = scoreNum.toFixed(1).replace('.', ',');

  return (
    <div className="space-y-8">
      {/* META / CAPA */}
      <div className="bg-foreground text-white rounded-xl p-6">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Diagnóstico Estratégico de Performance</p>
        <h1 className="text-2xl font-bold mb-3">{meta.nome_unidade || project?.unit_name || 'Clínica'}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="block text-xs text-white/50 uppercase">Cidade/UF</span>{meta.cidade_uf || project?.city || '—'}</div>
          <div><span className="block text-xs text-white/50 uppercase">Data</span>{meta.data_diagnostico || '—'}</div>
          <div><span className="block text-xs text-white/50 uppercase">Responsável</span>{meta.responsavel || '—'}</div>
          <div><span className="block text-xs text-white/50 uppercase">Estágio</span>{score.estagio || '—'}</div>
        </div>
      </div>

      {/* PREMISSAS */}
      {premissas.length > 0 && (
        <div>
          <SectionTitle kicker="Base de cálculo">Premissas adotadas</SectionTitle>
          <ul className="space-y-1.5">
            {premissas.map((p, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SCORE */}
      <div>
        <SectionTitle kicker="Diagnóstico">Score de maturidade</SectionTitle>
        <div className="flex items-center gap-6 mb-5 p-4 bg-muted rounded-xl">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{scoreStr}</div>
            <div className="text-xs text-muted-foreground">/ 10</div>
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-sm font-semibold">
              {score.estagio || '—'}
            </span>
            <p className="text-xs text-muted-foreground mt-2">Média ponderada dos pilares</p>
          </div>
        </div>
        <div className="space-y-2">
          {(score.pilares || []).map((p, i) => (
            <div key={i} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-foreground">{p.pilar}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Peso {(p.peso * 100).toFixed(0)}%</span>
                  <span className="text-sm font-bold text-primary">{parseFloat(p.nota || 0).toFixed(1).replace('.', ',')}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (parseFloat(p.nota || 0) / 10) * 100)}%` }} />
              </div>
              {p.justificativa && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.justificativa}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* RESUMO EXECUTIVO */}
      <div>
        <SectionTitle kicker="Síntese">Resumo executivo</SectionTitle>
        <Paragraph>{resumo.paragrafo}</Paragraph>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {(resumo.tres_numeros_chave || []).map((n, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="text-xs uppercase text-muted-foreground font-semibold mb-1">{n.rotulo}</div>
              <div className="text-2xl font-bold text-foreground mb-1">{n.valor}</div>
              <div className="text-xs text-muted-foreground">{n.leitura}</div>
            </div>
          ))}
        </div>
        {resumo.veredito_meta && (
          <div className="bg-muted border-l-4 border-primary rounded-r-lg p-4">
            <p className="text-xs uppercase font-semibold text-primary mb-1">Veredito da meta</p>
            <p className="text-sm text-foreground leading-relaxed">{resumo.veredito_meta}</p>
          </div>
        )}
      </div>

      {/* FUNIL ATUAL */}
      <div>
        <SectionTitle kicker="Diagnóstico">Funil atual (mensal)</SectionTitle>
        <div className="space-y-2 mb-4">
          {(funilAtual.linhas || []).map((ln, i) => (
            <div key={i} className="flex items-center gap-3 border border-border rounded-lg p-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{ln.etapa}</div>
                <div className="text-xs text-muted-foreground">{ln.taxa} · benchmark {ln.benchmark || '—'}</div>
              </div>
              <div className="text-lg font-bold text-foreground">{ln.valor}</div>
              {statusBadge(ln.status)}
            </div>
          ))}
        </div>
        {(() => {
          const kpis = funilAtual.kpis || funilAtual.unit_economics || [];
          if (kpis.length) {
            return (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground mb-2">KPIs de custo e retorno</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Indicador</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Você hoje</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Benchmark</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map((u, j) => (
                        <tr key={j} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-foreground">{u.indicador}</td>
                          <td className="px-3 py-2 text-foreground">{u.valor}</td>
                          <td className="px-3 py-2 text-muted-foreground">{u.benchmark || '—'}</td>
                          <td className="px-3 py-2">{statusBadge(u.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
          // legado: relatórios antigos com categorias aninhadas
          return (funilAtual.categorias || []).map((cat, i) => (
            <div key={i} className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">{cat.categoria}</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Indicador</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Você hoje</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Benchmark</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cat.indicadores || []).map((u, j) => (
                      <tr key={j} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground">{u.indicador}</td>
                        <td className="px-3 py-2 text-foreground">{u.valor}</td>
                        <td className="px-3 py-2 text-muted-foreground">{u.benchmark || '—'}</td>
                        <td className="px-3 py-2">{statusBadge(u.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ));
        })()}
        <Paragraph>{funilAtual.leitura}</Paragraph>
      </div>

      {/* FUNIL REVERSO DA META */}
      <div>
        <SectionTitle kicker="Diagnóstico">A matemática da meta</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="border border-border rounded-lg p-4 bg-muted">
            <p className="text-xs uppercase font-bold text-foreground mb-2">Com as taxas de hoje</p>
            <KV label="Leads necessários">{funilReverso.cenario_taxas_atuais?.leads_necessarios}</KV>
            <KV label="Investimento necessário">{funilReverso.cenario_taxas_atuais?.investimento_necessario}</KV>
            <p className="text-xs text-muted-foreground mt-2 italic">{funilReverso.cenario_taxas_atuais?.comentario}</p>
          </div>
          <div className="border border-primary rounded-lg p-4 bg-primary/5">
            <p className="text-xs uppercase font-bold text-primary mb-2">Com o funil corrigido</p>
            <KV label="Leads necessários">{funilReverso.cenario_taxas_corrigidas?.leads_necessarios}</KV>
            <KV label="Investimento necessário">{funilReverso.cenario_taxas_corrigidas?.investimento_necessario}</KV>
            <p className="text-xs text-muted-foreground mt-2 italic">{funilReverso.cenario_taxas_corrigidas?.comentario}</p>
          </div>
        </div>
        <div className="flex gap-3 mb-3">
          <span className="text-xs uppercase font-semibold text-muted-foreground">Gap mensal:</span>
          <span className="text-sm font-bold text-foreground">{funilReverso.gap_mensal}</span>
        </div>
        <Paragraph>{funilReverso.conclusao}</Paragraph>
      </div>

      {/* PILARES */}
      {pilares.length > 0 && (
        <div>
          <SectionTitle kicker="Diagnóstico">Diagnóstico por pilar</SectionTitle>
          <div className="space-y-3">
            {pilares.map((p, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{p.pilar}</span>
                  <span className="text-sm font-bold text-primary">{parseFloat(p.nota || 0).toFixed(1).replace('.', ',')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-xs uppercase font-semibold text-muted-foreground">Situação</span><p className="text-foreground">{p.situacao}</p></div>
                  <div><span className="text-xs uppercase font-semibold text-muted-foreground">Gargalo central</span><p className="text-foreground">{p.gargalo_central}</p></div>
                  <div><span className="text-xs uppercase font-semibold text-muted-foreground">Impacto financeiro</span><p className="text-foreground">{p.impacto_financeiro}</p></div>
                  <div><span className="text-xs uppercase font-semibold text-primary">Quick win</span><p className="text-foreground">{p.quick_win}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MATRIZ DE PRIORIZAÇÃO */}
      {matriz.length > 0 && (
        <div>
          <SectionTitle kicker="Estratégia">Matriz de priorização</SectionTitle>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Iniciativa</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Impacto</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Esforço</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Janela</th>
                </tr>
              </thead>
              <tbody>
                {matriz.map((m, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{m.iniciativa}</td>
                    <td className="px-3 py-2 text-muted-foreground capitalize">{m.impacto}</td>
                    <td className="px-3 py-2 text-muted-foreground capitalize">{m.esforco}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.janela} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RISCOS */}
      {riscos.length > 0 && (
        <div>
          <SectionTitle kicker="Estratégia">Riscos</SectionTitle>
          <div className="space-y-2">
            {riscos.map((r, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground mb-1">{r.risco}</p>
                <p className="text-xs text-muted-foreground"><span className="font-semibold">Consequência:</span> {r.consequencia}</p>
                <p className="text-xs text-foreground"><span className="font-semibold text-primary">Mitigação:</span> {r.mitigacao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESTRATÉGIA DE MÍDIA */}
      {midia.distribuicao?.length > 0 || midia.campanhas?.length > 0 ? (
        <div>
          <SectionTitle kicker="Execução">Estratégia de mídia</SectionTitle>
          <div className="flex gap-3 mb-4">
            <span className="text-xs uppercase font-semibold text-muted-foreground">Verba total:</span>
            <span className="text-sm font-bold text-foreground">{midia.verba_total}</span>
          </div>
          {midia.distribuicao?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">Distribuição da verba</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Frente de investimento</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Objetivo</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Verba</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {midia.distribuicao.map((d, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground">{d.frente || d.canal}</td>
                        <td className="px-3 py-2 text-muted-foreground">{d.objetivo}</td>
                        <td className="px-3 py-2 text-foreground">{d.verba}</td>
                        <td className="px-3 py-2 text-foreground">{d.percentual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {midia.campanhas?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">Campanhas</h3>
              <div className="space-y-2">
                {midia.campanhas.map((c, i) => (
                  <div key={i} className="border border-border rounded-lg p-3">
                    <p className="text-sm font-semibold text-foreground mb-1">{c.tratamento}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-semibold">Público:</span> {c.publico}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-semibold">Ângulo:</span> {c.angulo}</p>
                    <p className="text-xs text-foreground"><span className="font-semibold text-primary">Oferta de entrada:</span> {c.oferta_entrada}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {midia.metas_midia?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">Metas de mídia (30/60/90 dias)</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Indicador</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">30d</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">60d</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">90d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {midia.metas_midia.map((m, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground">{m.indicador}</td>
                        <td className="px-3 py-2 text-foreground">{m.d30}</td>
                        <td className="px-3 py-2 text-foreground">{m.d60}</td>
                        <td className="px-3 py-2 text-foreground">{m.d90}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {midia.observacao_compliance && (
            <p className="text-xs text-muted-foreground italic bg-muted p-3 rounded-lg">{midia.observacao_compliance}</p>
          )}
        </div>
      ) : null}

      {/* PLANO DE AÇÃO */}
      {plano.length > 0 && (
        <div>
          <SectionTitle kicker="Execução">Plano de ação</SectionTitle>
          <div className="space-y-4">
            {plano.map((bloco, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <p className="text-sm font-bold text-primary mb-3">
                  {bloco.janela} dias — {bloco.titulo_janela}
                </p>
                <div className="space-y-2">
                  {(bloco.acoes || []).map((a, j) => (
                    <div key={j} className="pl-3 border-l-2 border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{a.titulo}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.prioridade === 'alta' ? 'bg-red-100 text-red-700' : a.prioridade === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                          {a.prioridade}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.descricao}</p>
                      <p className="text-xs text-foreground mt-1"><span className="font-semibold">Responsável:</span> {a.responsavel} · <span className="font-semibold">Sucesso:</span> {a.metrica_sucesso}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CENÁRIOS */}
      {cenarios.length > 0 && (
        <div>
          <SectionTitle kicker="Projeção">Cenários (90 dias)</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cenarios.map((c, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <p className="text-sm font-bold text-primary capitalize mb-2">{c.nome}</p>
                <p className="text-xs text-muted-foreground mb-2 italic">{c.premissas}</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Leads</span><span className="font-medium text-foreground">{c.funil?.leads}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Agendamentos</span><span className="font-medium text-foreground">{c.funil?.agendamentos}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Comparecimentos</span><span className="font-medium text-foreground">{c.funil?.comparecimentos}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fechamentos</span><span className="font-medium text-foreground">{c.funil?.fechamentos}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ticket</span><span className="font-medium text-foreground">{c.funil?.ticket}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Receita nova/mês</span><span className="font-bold text-foreground">{c.receita_nova_mes}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Faturamento projetado</span><span className="font-bold text-primary">{c.faturamento_projetado}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRÓXIMOS PASSOS */}
      {proxPassos.paragrafo_fechamento || proxPassos.primeira_reuniao_pauta?.length > 0 ? (
        <div>
          <SectionTitle kicker="Fechamento">Próximos passos</SectionTitle>
          <Paragraph>{proxPassos.paragrafo_fechamento}</Paragraph>
          {proxPassos.primeira_reuniao_pauta?.length > 0 && (
            <>
              <p className="text-sm font-bold text-foreground mb-2">Pauta sugerida da primeira reunião</p>
              <ol className="space-y-1.5 list-decimal pl-5">
                {proxPassos.primeira_reuniao_pauta.map((item, i) => (
                  <li key={i} className="text-sm text-foreground">{item}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}