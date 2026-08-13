import { jsPDF } from 'jspdf';

// ─── Paleta (igual à tela / tokens do app) ────────────────────────────────────
const C = {
  fg:        '#312B1D',   // charcoal — textos, títulos
  primary:   '#F85D07',   // laranja IDK
  primaryDk: '#D94E00',
  bg:        '#F7F4EE',   // bege — fundo da página
  card:      '#FFFFFF',   // cards
  mutedBg:   '#F9F7F3',   // blocos suaves
  muted:     '#7E6951',   // texto secundário
  border:    '#EBE5DA',
  white:     '#FFFFFF',
};
const STATUS = {
  critico: { label: 'Crítico', bg: '#FEE2E2', text: '#B91C1C' },
  atencao: { label: 'Atenção', bg: '#FEF3C7', text: '#B45309' },
  ok:      { label: 'OK',      bg: '#D1FAE5', text: '#047857' },
};

// A4 retrato (mm)
const PW = 210, PH = 297;
const ML = 16, MR = 16, MT = 18, MB = 18;
const CW = PW - ML - MR;

const hexRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};

class Doc {
  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    this.y = MT;
    this.page = 0;
    this.unitName = '';
  }
  fill(hex)        { const [r,g,b]=hexRgb(hex); this.doc.setFillColor(r,g,b); }
  stroke(hex, lw=0.3) { const [r,g,b]=hexRgb(hex); this.doc.setDrawColor(r,g,b); this.doc.setLineWidth(lw); }
  color(hex)      { const [r,g,b]=hexRgb(hex); this.doc.setTextColor(r,g,b); }
  font(size, style='normal') { this.doc.setFont('helvetica', style); this.doc.setFontSize(size); }

  txt(x, y, s, size, style, col, align='left') {
    this.font(size, style); this.color(col);
    this.doc.text(String(s ?? ''), x, y, { align });
  }

  paraH(text, width, size, leading) {
    leading = leading ?? (size * 1.45);
    const lines = this.doc.splitTextToSize(String(text ?? ''), width);
    return lines.length * leading;
  }
  para(x, y, text, width, size, style, col, leading) {
    leading = leading ?? (size * 1.45);
    this.font(size, style); this.color(col);
    const lines = this.doc.splitTextToSize(String(text ?? ''), width);
    lines.forEach((ln, i) => this.doc.text(ln, x, y + i * leading));
    return lines.length * leading;
  }

  rect(x, y, w, h, fillHex, strokeHex, r=0) {
    if (fillHex) this.fill(fillHex); else this.doc.setFillColor(255,255,255,0);
    if (strokeHex) this.stroke(strokeHex); else { this.doc.setDrawColor(255,255,255); this.doc.setLineWidth(0); }
    const style = fillHex && strokeHex ? 'FD' : fillHex ? 'F' : 'D';
    r > 0 ? this.doc.roundedRect(x, y, w, h, r, r, style) : this.doc.rect(x, y, w, h, style);
  }
  line(x1,y1,x2,y2,col,lw=0.3) { this.stroke(col,lw); this.doc.line(x1,y1,x2,y2); }

  newPage() {
    if (this.page > 0) this.doc.addPage();
    this.page++;
    this.rect(0, 0, PW, PH, C.bg);   // fundo bege em toda página
    this.y = MT;
  }
  ensure(h) { if (this.y + h > PH - MB) this.newPage(); }
  gap(g=4) { this.y += g; }

  // Título de seção (kicker laranja + título charcoal + underline laranja)
  sectionTitle(kicker, title) {
    this.ensure(20);
    const y0 = this.y;
    this.txt(ML, y0 + 4, (kicker || '').toUpperCase(), 7, 'bold', C.primary);
    this.txt(ML, y0 + 10, title || '', 13, 'bold', C.fg);
    this.line(ML, y0 + 12, PW - MR, y0 + 12, C.primary, 0.6);
    this.y = y0 + 17;
  }

  // Badge de status (chip colorido)
  statusBadge(x, y, status) {
    const st = STATUS[status] || STATUS.ok;
    this.font(6.5, 'bold');
    const tw = this.doc.getTextWidth(st.label);
    const w = tw + 4, h = 4.6;
    this.rect(x, y - h + 0.5, w, h, st.bg, null, 2);
    this.txt(x + w/2, y, st.label, 6.5, 'bold', st.text, 'center');
    return w;
  }

  // Tabela com cabeçalho muted + linhas zebradas suaves
  table(headers, rows, widths, statusCol=null) {
    const rh = 7;
    this.ensure(rh * (rows.length + 1) + 4);
    let y = this.y;
    // header
    this.rect(ML, y, CW, rh, C.mutedBg, null, 0);
    let cx = ML;
    headers.forEach((h, i) => {
      this.txt(cx + 3, y + 4.8, String(h), 7.5, 'bold', C.muted);
      cx += widths[i];
    });
    y += rh;
    rows.forEach((row, ri) => {
      if (ri % 2 === 1) this.rect(ML, y, CW, rh, C.mutedBg, null, 0);
      cx = ML;
      row.forEach((cell, ci) => {
        const s = String(cell ?? '');
        if (statusCol !== null && ci === statusCol) {
          this.statusBadge(cx + 3, y + 5, cell);
        } else {
          this.txt(cx + 3, y + 4.8, s, 7.5, ci === 0 ? 'bold' : 'normal', C.fg);
        }
        cx += widths[ci];
      });
      this.line(ML, y + rh, ML + CW, y + rh, C.border, 0.2);
      y += rh;
    });
    this.y = y + 4;
  }

  // Card genérico (branco com borda) — retorna altura usada
  card(x, y, w, h, fillHex = C.card) {
    this.rect(x, y, w, h, fillHex, C.border, 2);
  }

  footer() {
    if (this.page > 0) {
      this.txt(ML, PH - 8, 'Diagnóstico de Performance • Documento confidencial', 7, 'normal', C.muted);
      this.txt(PW - MR, PH - 8, `Página ${this.page}`, 7, 'normal', C.muted, 'right');
    }
  }
}

// ─── Renderer principal ───────────────────────────────────────────────────────
export function generateAiReportPdf(project, reportData, opts = {}) {
  const { autoPrint = false } = opts;
  const data = typeof reportData === 'string'
    ? (() => { try { return JSON.parse(reportData); } catch (e) { return {}; } })()
    : (reportData || {});

  const meta          = data.meta || {};
  const score         = data.score || {};
  const resumo        = data.resumo_executivo || {};
  const funilAtual    = data.funil_atual || {};
  const funilReverso  = data.funil_reverso_meta || {};
  const pilares       = data.pilares || [];
  const matriz        = data.matriz_priorizacao || [];
  const riscos        = data.riscos || [];
  const midia         = data.estrategia_midia || {};
  const plano         = data.plano_acao || [];
  const cenarios      = data.cenarios || [];
  const proxPassos    = data.proximos_passos || {};
  const premissas     = data.premissas || [];

  const unitName    = meta.nome_unidade || project?.unit_name || 'Clínica';
  const cidade      = meta.cidade_uf || project?.city || '—';
  const responsavel = meta.responsavel || '—';
  const rawDate     = meta.data_diagnostico || new Date().toISOString().slice(0, 10);
  const dateStr     = new Date(rawDate + 'T12:00:00').toLocaleDateString('pt-BR');
  const estagio     = score.estagio || '—';
  const scoreNum    = parseFloat(String(score.geral || 0)) || 0;
  const scoreStr    = scoreNum.toFixed(1).replace('.', ',');

  const d = new Doc();
  d.unitName = unitName;

  // ════════════════════════════ CAPA / HERO ════════════════════════════
  d.newPage();

  // bloco charcoal arredondado
  const heroH = 46;
  d.rect(ML, d.y, CW, heroH, C.fg, null, 4);
  d.txt(ML + 8, d.y + 9, 'DIAGNÓSTICO ESTRATÉGICO DE PERFORMANCE', 7, 'bold', '#B9B0A0');
  d.txt(ML + 8, d.y + 19, unitName, 19, 'bold', C.white);
  // metadata grid (4 colunas)
  const gridY = d.y + 30;
  const colW = CW / 4;
  const meta4 = [
    ['CIDADE/UF', cidade],
    ['DATA', dateStr],
    ['RESPONSÁVEL', responsavel],
    ['ESTÁGIO', estagio],
  ];
  meta4.forEach((m, i) => {
    const cx = ML + 8 + i * colW;
    d.txt(cx, gridY, m[0], 6, 'bold', '#9A8E78');
    d.txt(cx, gridY + 5, m[1], 9, 'bold', C.white);
  });
  d.y += heroH + 10;

  // ════════════════════════════ PREMISSAS ═════════════════════════════
  if (premissas.length) {
    d.sectionTitle('Base de cálculo', 'Premissas adotadas');
    premissas.forEach((p) => {
      const h = d.paraH(p, CW - 8, 9, 13) + 2;
      d.ensure(h + 2);
      const y0 = d.y;
      // bullet laranja
      d.fill(C.primary);
      d.doc.circle(ML + 1.5, y0 + 2.2, 0.9, 'F');
      d.para(ML + 5, y0 + 3, p, CW - 5, 9, 'normal', C.fg, 13);
      d.y += h + 2;
    });
    d.gap(4);
  }

  // ════════════════════════════ SCORE ═════════════════════════════════
  d.sectionTitle('Diagnóstico', 'Score de maturidade');
  // bloco do score
  const sbH = 26;
  d.ensure(sbH + 4);
  d.rect(ML, d.y, CW, sbH, C.mutedBg, C.border, 3);
  d.txt(ML + 8, d.y + 14, scoreStr, 26, 'bold', C.primary);
  d.txt(ML + 8 + 22, d.y + 15, '/ 10', 10, 'bold', C.muted);
  // pill estágio
  d.font(8, 'bold');
  const pillW = d.doc.getTextWidth(estagio) + 8;
  d.rect(ML + 8, d.y + 18, pillW, 6, C.primary, null, 3);
  d.txt(ML + 8 + pillW / 2, d.y + 22.3, estagio, 8, 'bold', C.white, 'center');
  d.txt(ML + 8 + pillW + 4, d.y + 22.3, 'Média ponderada dos pilares', 7.5, 'normal', C.muted);
  d.y += sbH + 5;

  // barras por pilar
  (score.pilares || []).forEach((p) => {
    const nota = parseFloat(p.nota) || 0;
    const justH = p.justificativa ? d.paraH(p.justificativa, CW - 8, 7.5, 11) : 0;
    const h = 14 + justH + 4;
    d.ensure(h + 3);
    const y0 = d.y;
    d.card(ML, y0, CW, h);
    d.txt(ML + 5, y0 + 6, p.pilar || '', 9.5, 'bold', C.fg);
    d.txt(PW - MR - 5, y0 + 6, `Peso ${Math.round((p.peso || 0) * 100)}%`, 7.5, 'normal', C.muted, 'right');
    d.txt(PW - MR - 5, y0 + 11, nota.toFixed(1).replace('.', ','), 9.5, 'bold', C.primary, 'right');
    // barra
    const barY = y0 + 13, barW = CW - 10;
    d.rect(ML + 5, barY, barW, 1.8, C.mutedBg, null, 1);
    d.rect(ML + 5, barY, barW * Math.min(1, nota / 10), 1.8, C.primary, null, 1);
    if (p.justificativa) d.para(ML + 5, y0 + 18, p.justificativa, CW - 10, 7.5, 'normal', C.muted, 11);
    d.y = y0 + h + 3;
  });
  d.gap(2);

  // ════════════════════════════ RESUMO EXECUTIVO ═══════════════════════
  d.sectionTitle('Síntese', 'Resumo executivo');
  if (resumo.paragrafo) {
    const h = d.paraH(resumo.paragrafo, CW, 9.5, 14) + 3;
    d.ensure(h);
    d.para(ML, d.y, resumo.paragrafo, CW, 9.5, 'normal', C.fg, 14);
    d.y += h;
  }
  // 3 KPI cards
  const nums = resumo.tres_numeros_chave || [];
  if (nums.length) {
    const n = nums.length;
    const gapx = 3;
    const cw = (CW - gapx * (n - 1)) / n;
    let maxH = 24;
    nums.forEach((k) => {
      const lh = d.paraH(k.leitura || '', cw - 8, 7.5, 11);
      maxH = Math.max(maxH, 18 + lh);
    });
    d.ensure(maxH + 2);
    const y0 = d.y;
    nums.forEach((k, i) => {
      const x = ML + i * (cw + gapx);
      d.card(x, y0, cw, maxH);
      d.txt(x + 4, y0 + 6, (k.rotulo || '').toUpperCase(), 6.5, 'bold', C.muted);
      d.txt(x + 4, y0 + 13, k.valor || '', 15, 'bold', C.fg);
      d.para(x + 4, y0 + 17, k.leitura || '', cw - 8, 7.5, 'normal', C.muted, 11);
    });
    d.y = y0 + maxH + 4;
  }
  if (resumo.veredito_meta) {
    const h = d.paraH(resumo.veredito_meta, CW - 10, 9, 13) + 10;
    d.ensure(h + 2);
    const y0 = d.y;
    d.rect(ML, y0, CW, h, C.mutedBg, null, 2);
    d.rect(ML, y0, 1.5, h, C.primary, null, 1);
    d.txt(ML + 6, y0 + 5, 'VEREDITO DA META', 7, 'bold', C.primary);
    d.para(ML + 6, y0 + 10, resumo.veredito_meta, CW - 10, 9, 'normal', C.fg, 13);
    d.y = y0 + h + 4;
  }
  d.gap(2);

  // ════════════════════════════ FUNIL ATUAL ════════════════════════════
  d.sectionTitle('Diagnóstico', 'Funil atual (mensal)');
  (funilAtual.linhas || []).forEach((ln) => {
    const h = 14;
    d.ensure(h + 3);
    const y0 = d.y;
    d.card(ML, y0, CW, h);
    d.txt(ML + 5, y0 + 6, ln.etapa || '', 9.5, 'bold', C.fg);
    d.txt(ML + 5, y0 + 11, `${ln.taxa || ''} · benchmark ${ln.benchmark || '—'}`, 7.5, 'normal', C.muted);
    d.txt(PW - MR - 22, y0 + 8, ln.valor || '', 11, 'bold', C.fg, 'right');
    d.statusBadge(PW - MR - 18, y0 + 8, ln.status);
    d.y = y0 + h + 3;
  });

  const kpis = funilAtual.kpis || funilAtual.unit_economics || [];
  if (kpis.length) {
    d.gap(2);
    d.txt(ML, d.y + 4, 'KPIs de custo e retorno', 9.5, 'bold', C.fg);
    d.y += 7;
    d.table(
      ['Indicador', 'Você hoje', 'Benchmark', 'Status'],
      kpis.map(u => [u.indicador || '', u.valor || '', u.benchmark || '—', u.status || 'ok']),
      [66, 48, 44, 20], 3
    );
  }
  if (funilAtual.leitura) {
    d.gap(2);
    const h = d.paraH(funilAtual.leitura, CW, 9, 13) + 2;
    d.ensure(h);
    d.para(ML, d.y, funilAtual.leitura, CW, 9, 'normal', C.fg, 13);
    d.y += h;
  }
  d.gap(2);

  // ════════════════════════════ MATEMÁTICA DA META ═════════════════════
  d.sectionTitle('Diagnóstico', 'A matemática da meta');
  const cw2 = (CW - 4) / 2;
  const cAt = funilReverso.cenario_taxas_atuais || {};
  const cCo = funilReverso.cenario_taxas_corrigidas || {};
  const comentH = Math.max(
    d.paraH(cAt.comentario || '', cw2 - 10, 7.5, 11),
    d.paraH(cCo.comentario || '', cw2 - 10, 7.5, 11)
  );
  const cardH = 8 + 2 * 9 + comentH + 6;
  d.ensure(cardH + 4);
  const y0 = d.y;
  // card esquerdo
  d.card(ML, y0, cw2, cardH);
  d.txt(ML + 5, y0 + 6, 'COM AS TAXAS DE HOJE', 7.5, 'bold', C.fg);
  d.txt(ML + 5, y0 + 12, 'Leads necessários', 7.5, 'normal', C.muted);
  d.txt(ML + cw2 - 5, y0 + 12, cAt.leads_necessarios || '—', 8, 'bold', C.fg, 'right');
  d.txt(ML + 5, y0 + 17, 'Investimento necessário', 7.5, 'normal', C.muted);
  d.txt(ML + cw2 - 5, y0 + 17, cAt.investimento_necessario || '—', 8, 'bold', C.fg, 'right');
  if (cAt.comentario) d.para(ML + 5, y0 + 22, cAt.comentario, cw2 - 10, 7.5, 'italic', C.muted, 11);
  // card direito (borda laranja)
  const x2 = ML + cw2 + 4;
  d.card(x2, y0, cw2, cardH);
  d.rect(x2, y0, 1.5, cardH, C.primary, null, 1);
  d.txt(x2 + 5, y0 + 6, 'COM O FUNIL CORRIGIDO', 7.5, 'bold', C.primary);
  d.txt(x2 + 5, y0 + 12, 'Leads necessários', 7.5, 'normal', C.muted);
  d.txt(x2 + cw2 - 5, y0 + 12, cCo.leads_necessarios || '—', 8, 'bold', C.fg, 'right');
  d.txt(x2 + 5, y0 + 17, 'Investimento necessário', 7.5, 'normal', C.muted);
  d.txt(x2 + cw2 - 5, y0 + 17, cCo.investimento_necessario || '—', 8, 'bold', C.fg, 'right');
  if (cCo.comentario) d.para(x2 + 5, y0 + 22, cCo.comentario, cw2 - 10, 7.5, 'italic', C.muted, 11);
  d.y = y0 + cardH + 4;
  if (funilReverso.gap_mensal) {
    d.txt(ML, d.y + 4, 'Gap mensal:', 7.5, 'bold', C.muted);
    d.txt(ML + 20, d.y + 4, funilReverso.gap_mensal, 8, 'bold', C.fg);
    d.y += 8;
  }
  if (funilReverso.conclusao) {
    const h = d.paraH(funilReverso.conclusao, CW, 9, 13) + 2;
    d.ensure(h);
    d.para(ML, d.y, funilReverso.conclusao, CW, 9, 'normal', C.fg, 13);
    d.y += h;
  }
  d.gap(2);

  // ════════════════════════════ DIAGNÓSTICO POR PILAR ══════════════════
  if (pilares.length) {
    d.sectionTitle('Diagnóstico', 'Diagnóstico por pilar');
    pilares.forEach((p) => {
      const cols = [
        ['Situação', p.situacao, C.muted],
        ['Gargalo central', p.gargalo_central, C.muted],
        ['Impacto financeiro', p.impacto_financeiro, C.muted],
        ['Quick win', p.quick_win, C.primary],
      ];
      const halfW = (CW - 12) / 2;
      const heights = cols.map((c) => d.paraH(c[1] || '', halfW - 4, 8.5, 12));
      const bodyH = Math.max(heights[0] + heights[1], heights[2] + heights[3]) + 4;
      const h = 16 + bodyH;
      d.ensure(h + 4);
      const y0 = d.y;
      d.card(ML, y0, CW, h);
      d.txt(ML + 5, y0 + 6, p.pilar || '', 9.5, 'bold', C.fg);
      d.txt(PW - MR - 5, y0 + 6, (parseFloat(p.nota) || 0).toFixed(1).replace('.', ','), 9.5, 'bold', C.primary, 'right');
      // 2x2 grid
      const gx1 = ML + 5, gx2 = ML + 5 + halfW + 2;
      const rowH = (bodyH) / 2;
      cols.forEach((c, i) => {
        const cx = i % 2 === 0 ? gx1 : gx2;
        const cy = y0 + 12 + Math.floor(i / 2) * rowH;
        d.txt(cx, cy + 3, c[0].toUpperCase(), 6.5, 'bold', c[2]);
        d.para(cx, cy + 7, c[1] || '—', halfW - 4, 8.5, 'normal', C.fg, 12);
      });
      d.y = y0 + h + 4;
    });
    d.gap(2);
  }

  // ════════════════════════════ MATRIZ DE PRIORIZAÇÃO ═══════════════════
  if (matriz.length) {
    d.sectionTitle('Estratégia', 'Matriz de priorização');
    d.table(
      ['Iniciativa', 'Impacto', 'Esforço', 'Janela'],
      matriz.map(m => [m.iniciativa || '', (m.impacto || ''), (m.esforco || ''), `${m.janela || ''} dias`]),
      [88, 28, 28, 34], null
    );
    d.gap(2);
  }

  // ════════════════════════════ RISCOS ═════════════════════════════════
  if (riscos.length) {
    d.sectionTitle('Estratégia', 'Riscos');
    riscos.forEach((r) => {
      const h = 10 + d.paraH(r.consequencia || '', CW - 10, 8, 12) + d.paraH(r.mitigacao || '', CW - 10, 8, 12) + 4;
      d.ensure(h + 3);
      const y0 = d.y;
      d.card(ML, y0, CW, h);
      d.txt(ML + 5, y0 + 6, r.risco || '', 9, 'bold', C.fg);
      let ry = y0 + 11;
      ry += d.para(ML + 5, ry, `Consequência: ${r.consequencia || ''}`, CW - 10, 8, 'normal', C.muted, 12) + 1;
      d.para(ML + 5, ry, `Mitigação: ${r.mitigacao || ''}`, CW - 10, 8, 'normal', C.fg, 12);
      d.y = y0 + h + 3;
    });
    d.gap(2);
  }

  // ════════════════════════════ ESTRATÉGIA DE MÍDIA ═════════════════════
  if (midia.distribuicao?.length || midia.campanhas?.length) {
    d.sectionTitle('Execução', 'Estratégia de mídia');
    if (midia.verba_total) {
      d.txt(ML, d.y + 4, 'Verba total:', 7.5, 'bold', C.muted);
      d.txt(ML + 20, d.y + 4, midia.verba_total, 8.5, 'bold', C.fg);
      d.y += 8;
    }
    if (midia.distribuicao?.length) {
      d.txt(ML, d.y + 4, 'Distribuição da verba', 9, 'bold', C.fg);
      d.y += 7;
      d.table(
        ['Frente de investimento', 'Objetivo', 'Verba', '%'],
        midia.distribuicao.map(dd => [dd.frente || dd.canal || '', dd.objetivo || '', dd.verba || '', dd.percentual || '']),
        [58, 56, 36, 20], null
      );
    }
    if (midia.campanhas?.length) {
      d.gap(2);
      d.txt(ML, d.y + 4, 'Campanhas', 9, 'bold', C.fg);
      d.y += 7;
      midia.campanhas.forEach((c) => {
        const h = 8 + d.paraH(`Público: ${c.publico || ''}`, CW - 10, 8, 12) + d.paraH(`Ângulo: ${c.angulo || ''}`, CW - 10, 8, 12) + d.paraH(`Oferta de entrada: ${c.oferta_entrada || ''}`, CW - 10, 8, 12) + 4;
        d.ensure(h + 3);
        const y0 = d.y;
        d.card(ML, y0, CW, h);
        d.txt(ML + 5, y0 + 6, c.tratamento || '', 9, 'bold', C.fg);
        let ry = y0 + 11;
        ry += d.para(ML + 5, ry, `Público: ${c.publico || ''}`, CW - 10, 8, 'normal', C.muted, 12) + 1;
        ry += d.para(ML + 5, ry, `Ângulo: ${c.angulo || ''}`, CW - 10, 8, 'normal', C.muted, 12) + 1;
        d.para(ML + 5, ry, `Oferta de entrada: ${c.oferta_entrada || ''}`, CW - 10, 8, 'normal', C.fg, 12);
        d.y = y0 + h + 3;
      });
    }
    if (midia.metas_midia?.length) {
      d.gap(2);
      d.txt(ML, d.y + 4, 'Metas de mídia (30/60/90 dias)', 9, 'bold', C.fg);
      d.y += 7;
      d.table(
        ['Indicador', '30d', '60d', '90d'],
        midia.metas_midia.map(m => [m.indicador || '', m.d30 || '', m.d60 || '', m.d90 || '']),
        [78, 32, 32, 28], null
      );
    }
    if (midia.observacao_compliance) {
      d.gap(2);
      const h = d.paraH(midia.observacao_compliance, CW - 10, 8, 12) + 6;
      d.ensure(h);
      d.rect(ML, d.y, CW, h, C.mutedBg, null, 2);
      d.para(ML + 5, d.y + 4, midia.observacao_compliance, CW - 10, 8, 'italic', C.muted, 12);
      d.y += h + 3;
    }
    d.gap(2);
  }

  // ════════════════════════════ PLANO DE AÇÃO ══════════════════════════
  if (plano.length) {
    d.sectionTitle('Execução', 'Plano de ação');
    plano.forEach((bloco) => {
      const acoes = bloco.acoes || [];
      const acoesH = acoes.reduce((acc, a) => {
        const dh = d.paraH(a.descricao || '', CW - 12, 8, 12);
        const mh = d.paraH(`Responsável: ${a.responsavel || ''} · Sucesso: ${a.metrica_sucesso || ''}`, CW - 12, 7.5, 11);
        return acc + 8 + dh + mh + 6;
      }, 0);
      const h = 10 + acoesH;
      d.ensure(h + 4);
      const y0 = d.y;
      d.card(ML, y0, CW, h);
      d.txt(ML + 5, y0 + 6, `${bloco.janela || ''} dias — ${bloco.titulo_janela || ''}`, 9, 'bold', C.primary);
      let ay = y0 + 12;
      acoes.forEach((a) => {
        d.txt(ML + 7, ay + 4, a.titulo || '', 8.5, 'bold', C.fg);
        // prioridade chip
        const pri = (a.prioridade || '').toLowerCase();
        const priCol = pri === 'alta' ? '#B91C1C' : pri === 'media' ? '#B45309' : C.muted;
        const priBg = pri === 'alta' ? '#FEE2E2' : pri === 'media' ? '#FEF3C7' : C.mutedBg;
        d.font(6.5, 'bold');
        const pw = d.doc.getTextWidth(a.prioridade || '') + 4;
        d.rect(PW - MR - 5 - pw, ay + 1.5, pw, 4.6, priBg, null, 2);
        d.txt(PW - MR - 5 - pw / 2, ay + 5, a.prioridade || '', 6.5, 'bold', priCol, 'center');
        let ry = ay + 8;
        ry += d.para(ML + 7, ry, a.descricao || '', CW - 14, 8, 'normal', C.muted, 12) + 1;
        d.para(ML + 7, ry, `Responsável: ${a.responsavel || ''} · Sucesso: ${a.metrica_sucesso || ''}`, CW - 14, 7.5, 'normal', C.fg, 11);
        ay += 8 + d.paraH(a.descricao || '', CW - 12, 8, 12) + d.paraH(`Responsável: ${a.responsavel || ''} · Sucesso: ${a.metrica_sucesso || ''}`, CW - 12, 7.5, 11) + 6;
      });
      d.y = y0 + h + 4;
    });
    d.gap(2);
  }

  // ════════════════════════════ CENÁRIOS ═══════════════════════════════
  if (cenarios.length) {
    d.sectionTitle('Projeção', 'Cenários (90 dias)');
    const n = cenarios.length;
    const gapx = 3;
    const cw = (CW - gapx * (n - 1)) / n;
    let maxH = 50;
    cenarios.forEach((c) => {
      const lh = d.paraH(c.premissas || '', cw - 8, 7, 10);
      maxH = Math.max(maxH, 22 + lh + 18);
    });
    d.ensure(maxH + 2);
    const y0 = d.y;
    cenarios.forEach((c, i) => {
      const x = ML + i * (cw + gapx);
      d.card(x, y0, cw, maxH);
      d.txt(x + 4, y0 + 6, (c.nome || '').charAt(0).toUpperCase() + (c.nome || '').slice(1), 9, 'bold', C.primary);
      let ry = y0 + 10;
      ry += d.para(x + 4, ry, c.premissas || '', cw - 8, 7, 'italic', C.muted, 10) + 1;
      const f = c.funil || {};
      [['Leads', f.leads], ['Agendamentos', f.agendamentos], ['Comparecimentos', f.comparecimentos], ['Fechamentos', f.fechamentos], ['Ticket', f.ticket]].forEach(([lbl, val]) => {
        d.txt(x + 4, ry, lbl, 7.5, 'normal', C.muted);
        d.txt(x + cw - 4, ry, val || '—', 7.5, 'medium', C.fg, 'right');
        ry += 5;
      });
      d.line(x + 4, ry, x + cw - 4, ry, C.border, 0.2);
      ry += 4;
      d.txt(x + 4, ry, 'Receita nova/mês', 7, 'normal', C.muted);
      d.txt(x + cw - 4, ry, c.receita_nova_mes || '—', 7.5, 'bold', C.fg, 'right');
      ry += 5;
      d.txt(x + 4, ry, 'Faturamento proj.', 7, 'normal', C.muted);
      d.txt(x + cw - 4, ry, c.faturamento_projetado || '—', 7.5, 'bold', C.primary, 'right');
    });
    d.y = y0 + maxH + 4;
    d.gap(2);
  }

  // ════════════════════════════ PRÓXIMOS PASSOS ════════════════════════
  if (proxPassos.paragrafo_fechamento || proxPassos.primeira_reuniao_pauta?.length) {
    d.sectionTitle('Fechamento', 'Próximos passos');
    if (proxPassos.paragrafo_fechamento) {
      const h = d.paraH(proxPassos.paragrafo_fechamento, CW, 9.5, 14) + 3;
      d.ensure(h);
      d.para(ML, d.y, proxPassos.paragrafo_fechamento, CW, 9.5, 'normal', C.fg, 14);
      d.y += h;
    }
    if (proxPassos.primeira_reuniao_pauta?.length) {
      d.txt(ML, d.y + 4, 'Pauta sugerida da primeira reunião', 9, 'bold', C.fg);
      d.y += 8;
      proxPassos.primeira_reuniao_pauta.forEach((item, i) => {
        const h = d.paraH(item, CW - 12, 9, 13) + 2;
        d.ensure(h + 2);
        const y0 = d.y;
        d.fill(C.primary);
        d.doc.circle(ML + 2, y0 + 2.5, 2, 'F');
        d.txt(ML + 2, y0 + 3.5, String(i + 1), 7, 'bold', C.white, 'center');
        d.para(ML + 7, y0 + 3, item, CW - 12, 9, 'normal', C.fg, 13);
        d.y += h + 2;
      });
    }
  }

  // rodapé em todas as páginas
  const total = d.doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    d.doc.setPage(p);
    d.txt(ML, PH - 8, 'Diagnóstico de Performance • Documento confidencial', 7, 'normal', C.muted);
    d.txt(PW - MR, PH - 8, `Página ${p}`, 7, 'normal', C.muted, 'right');
  }

  // Saída
  const safeUnit = unitName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const safeDate = dateStr.replace(/\//g, '-');
  const fileName = `Diagnostico_${safeUnit}_${safeDate}.pdf`;

  if (autoPrint) {
    d.doc.autoPrint();
    d.doc.output('dataurlnewwindow');
  } else {
    d.doc.save(fileName);
  }
}

// Compatibilidade: manter o nome antigo de exportação
export const generateIDKReport = (project, reportData) => generateAiReportPdf(project, reportData);