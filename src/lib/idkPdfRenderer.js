import { jsPDF } from 'jspdf';

// ─── Paleta IDK ───────────────────────────────────────────────────────────────
const C = {
  black:     '#0A0A0A',
  white:     '#FFFFFF',
  cream:     '#F1EEE7',
  green:     '#3FAF74',
  gray:      '#555555',
  grayLight: '#B3B3B3',
  line:      '#E3E0D8',
  darkBg:    '#1A1A1A',  // zebra par na tabela dentro de fundo preto
};

const STATUS_COLOR = { ok: C.green, atencao: C.gray, critico: C.black };
const STATUS_LABEL = { ok: 'OK', atencao: 'ATENÇÃO', critico: 'CRÍTICO' };

// ─── Constantes de layout ────────────────────────────────────────────────────
const PW = 210, PH = 297;   // A4 mm
const ML = 17, MR = 17, MT = 20, MB = 20;
const CW = PW - ML - MR;

// ─── Helpers de cor (hex→rgb) ─────────────────────────────────────────────────
function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function tint(hex, alpha = 0.13) {
  const [r, g, b] = hexRgb(hex);
  return [
    Math.round(r + (255 - r) * (1 - alpha)),
    Math.round(g + (255 - g) * (1 - alpha)),
    Math.round(b + (255 - b) * (1 - alpha)),
  ];
}

// ─── Classe principal ─────────────────────────────────────────────────────────
class IDKDoc {
  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    this.y = MT;
    this.page = 0;
    this.unitName = '';
    this.reportDate = '';
  }

  // ── primitivos ──────────────────────────────────────────────────────────────
  setFill(hex) {
    const [r, g, b] = hexRgb(hex);
    this.doc.setFillColor(r, g, b);
  }
  setStroke(hex, lw = 0.3) {
    const [r, g, b] = hexRgb(hex);
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(lw);
  }
  setTextColor(hex) {
    const [r, g, b] = hexRgb(hex);
    this.doc.setTextColor(r, g, b);
  }
  setFont(size, style = 'normal', family = 'helvetica') {
    this.doc.setFont(family, style);
    this.doc.setFontSize(size);
  }

  txt(x, y, s, size, style, color, align = 'left') {
    this.setFont(size, style);
    this.setTextColor(color);
    this.doc.text(String(s), x, y, { align });
  }

  // word-wrap + draw, returns height used
  para(x, y, text, width, size, style, color, leading) {
    leading = leading || size * 0.45 + size;
    const lines = this.doc.splitTextToSize(String(text), width);
    this.setFont(size, style);
    this.setTextColor(color);
    lines.forEach((ln, i) => {
      this.doc.text(ln, x, y + i * leading);
    });
    return lines.length * leading;
  }

  paraH(text, width, size, leading) {
    leading = leading || size * 0.45 + size;
    return this.doc.splitTextToSize(String(text), width).length * leading;
  }

  rect(x, y, w, h, fill, stroke, r = 0) {
    if (fill) { this.setFill(fill); }
    if (stroke) { this.setStroke(stroke); } else { this.doc.setDrawColor(255, 255, 255, 0); }
    const style = fill && stroke ? 'FD' : fill ? 'F' : 'D';
    if (r > 0) {
      this.doc.roundedRect(x, y, w, h, r, r, style);
    } else {
      this.doc.rect(x, y, w, h, style);
    }
  }

  line(x1, y1, x2, y2, color, lw = 0.3) {
    this.setStroke(color, lw);
    this.doc.line(x1, y1, x2, y2);
  }

  circle(x, y, r, fill) {
    this.setFill(fill);
    this.doc.setDrawColor(255, 255, 255);
    this.doc.circle(x, y, r, 'F');
  }

  // seta ↗ da marca IDK
  arrow(x, y, size, color = C.green, lw = 0.7) {
    this.setStroke(color, lw);
    this.doc.line(x, y + size, x + size, y);
    this.doc.line(x + size * 0.38, y, x + size, y);
    this.doc.line(x + size, y, x + size, y + size * 0.6);
  }

  // ── paginação ────────────────────────────────────────────────────────────────
  headerFooter() {
    const d = this.doc;
    // header
    this.txt(ML, 10, 'IDK', 10, 'bold', C.black);
    this.txt(PW - MR, 10, this.unitName, 8, 'normal', C.gray, 'right');
    this.line(ML, 13, PW - MR, 13, C.black, 0.4);
    // footer
    const foot = `Diagnóstico de Performance  •  ${this.reportDate}  •  Documento confidencial`;
    this.txt(ML, PH - 8, foot, 7, 'normal', C.gray);
    this.txt(PW - MR, PH - 8, `Página ${this.page}`, 7, 'normal', C.gray, 'right');
  }

  newPage(title, eyebrow) {
    if (this.page > 0) this.doc.addPage();
    this.page++;
    // fundo branco
    this.rect(0, 0, PW, PH, C.white);
    if (this.page > 1) {
      this.headerFooter();
      this.y = 22;
    } else {
      this.y = MT;
    }
    if (title) {
      if (eyebrow) {
        this.txt(ML, this.y + 3, eyebrow.toUpperCase(), 7, 'bold', C.green);
        this.y += 7;
      }
      this.txt(ML, this.y + 7, title.toUpperCase(), 14, 'bold', C.black);
      // seta ↗
      this.arrow(PW - MR - 8, this.y + 1, 7, C.black, 0.5);
      this.y += 10;
      this.line(ML, this.y, PW - MR, this.y, C.line, 0.3);
      this.y += 5;
    }
  }

  ensure(h, title, eyebrow) {
    if (this.y + h > PH - MB) {
      this.newPage(title, eyebrow);
    }
  }

  gap(g = 4) { this.y += g; }

  // ── componentes ──────────────────────────────────────────────────────────────

  sectionH2(text) {
    this.ensure(10);
    this.txt(ML, this.y + 4, text, 11, 'bold', C.black);
    this.y += 9;
  }

  // chip de status (OK / ATENÇÃO / CRÍTICO)
  chip(x, y, label, color) {
    this.setFont(6.5, 'bold');
    const tw = this.doc.getTextWidth(label);
    const cw = tw + 5;
    const ch = 4.5;
    if (color === C.black) {
      this.rect(x, y - ch + 0.5, cw, ch, C.black, null, 2);
      this.txt(x + 2.5, y, label, 6.5, 'bold', C.white);
    } else {
      const [r, g, b] = tint(color, 0.18);
      this.doc.setFillColor(r, g, b);
      this.doc.roundedRect(x, y - ch + 0.5, cw, ch, 2, 2, 'F');
      this.txt(x + 2.5, y, label, 6.5, 'bold', color);
    }
    return cw;
  }

  // callout: card creme com barra lateral colorida
  callout(title, body, color = C.green) {
    const bh = this.paraH(body, CW - 16, 9.5) + 16;
    this.ensure(bh + 6);
    const y0 = this.y;
    this.rect(ML, y0, CW, bh, C.cream, null, 2);
    this.rect(ML, y0, 1.5, bh, color, null, 1);
    this.txt(ML + 6, y0 + 5, title, 9, 'bold', C.black);
    this.para(ML + 6, y0 + 11, body, CW - 16, 9, 'normal', C.black);
    this.y = y0 + bh + 4;
  }

  // cards KPI (3 lado a lado)
  kpiCards(cards) {
    const n = cards.length;
    const gapx = 4;
    const cw = (CW - gapx * (n - 1)) / n;
    const ch = 34;
    this.ensure(ch + 4);
    const y0 = this.y;
    cards.forEach((card, i) => {
      const x = ML + i * (cw + gapx);
      this.rect(x, y0, cw, ch, C.cream, null, 2);
      this.txt(x + 4, y0 + 5, card.rotulo.toUpperCase(), 6, 'bold', C.gray);
      this.txt(x + 4, y0 + 14, card.valor, 16, 'bold', card.cor || C.black);
      this.para(x + 4, y0 + 19, card.leitura, cw - 8, 7, 'normal', C.black, 9);
    });
    this.y = y0 + ch + 4;
  }

  // tabela com header preto e zebra creme
  table(headers, rows, widths, statusCol = null) {
    const rh = 7;
    this.ensure(rh * (rows.length + 1) + 4);
    const x0 = ML;
    let y = this.y;
    // header
    this.rect(x0, y, CW, rh, C.black, null, 2);
    let cx = x0;
    headers.forEach((h, i) => {
      this.txt(cx + 3, y + 4.8, h, 8, 'bold', C.white);
      cx += widths[i];
    });
    y += rh;
    rows.forEach((row, ri) => {
      if (ri % 2 === 1) this.rect(x0, y, CW, rh, C.cream, null, 0);
      cx = x0;
      row.forEach((cell, ci) => {
        if (statusCol !== null && ci === statusCol && STATUS_COLOR[cell]) {
          this.chip(cx + 3, y + 5, STATUS_LABEL[cell], STATUS_COLOR[cell]);
        } else {
          const bold = ci === 0;
          this.txt(cx + 3, y + 4.8, String(cell), 8, bold ? 'bold' : 'normal', bold ? C.black : C.black);
        }
        cx += widths[ci];
      });
      y += rh;
    });
    this.line(x0, y, x0 + CW, y, C.line, 0.3);
    this.y = y + 4;
  }

  // barra horizontal (funil)
  funnelBar(label, pct, status, obs) {
    const maxW = CW * 0.58;
    const bw = Math.max(maxW * pct, 40);
    const bh = 9;
    this.ensure(bh + 8);
    const y = this.y;
    this.rect(ML, y, bw, bh, C.black, null, 2);
    this.txt(ML + 3, y + 6.2, label, 8.5, 'bold', C.white);
    // chip de taxa
    const chipX = ML + maxW + 4;
    if (status && status !== 'ok') {
      const lbl = obs.split('\n')[0]; // taxa inline
      this.chip(chipX, y + 6, lbl, STATUS_COLOR[status]);
    }
    this.y = y + bh + 1;
    // obs abaixo
    if (obs) {
      const obsLines = obs.split('\n');
      const note = obsLines[obsLines.length - 1];
      this.txt(chipX, this.y + 3, note, 7, 'normal', C.gray);
      this.y += 6;
    }
    this.gap(2);
  }

  // barra de verba de mídia
  mediaBar(label, value, pct, color) {
    const maxW = CW * 0.72;
    const bw = Math.max(maxW * (pct / 50), 22);
    const bh = 6.5;
    this.txt(ML, this.y + 4, label, 8.5, 'bold', C.black);
    this.y += 6;
    this.rect(ML, this.y, bw, bh, color, null, 2);
    this.txt(ML + 3, this.y + 4.5, value, 8, 'bold', C.white);
    this.y += bh + 3;
  }

  // gráfico de barras de cenários
  scenarioChart(scenarios) {
    const ch = 40;
    const bw = 22;
    const gapx = 14;
    const maxVal = 300;
    const chartW = scenarios.length * (bw + gapx) - gapx;
    const x0 = ML;
    const y0 = this.y + ch;
    // linha da meta
    const ym = this.y + ch * (1 - 300 / maxVal);
    this.setStroke(C.green, 0.4);
    this.doc.setLineDashPattern([1, 1], 0);
    this.doc.line(x0, ym, x0 + CW, ym);
    this.doc.setLineDashPattern([], 0);
    this.txt(PW - MR, ym - 1, 'Meta: R$ 300 mil', 7, 'bold', C.green, 'right');
    const scenarioColors = [C.grayLight, C.gray, C.green, C.black];
    scenarios.forEach((sc, i) => {
      const val = parseInt(String(sc.faturamento_projetado || '').replace(/\D/g, '')) || 0;
      const barH = ch * (val / maxVal);
      const x = x0 + i * (bw + gapx);
      const y = y0 - barH;
      this.rect(x, y, bw, barH, scenarioColors[i], null, 2);
      this.txt(x + bw / 2, y - 2, `R$ ${Math.round(val / 1000)} mil`, 7.5, 'bold', C.black, 'center');
      this.txt(x + bw / 2, y0 + 4, sc.nome || '', 7, 'normal', C.gray, 'center');
    });
    this.y = y0 + 10;
  }
}

// ─── Renderer principal ────────────────────────────────────────────────────────
export function generateIDKReport(project, reportData) {
  const d = new IDKDoc();
  const data = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;

  const meta = data.meta || {};
  const unitName = meta.nome_unidade || project?.unit_name || 'Clínica';
  const cidade = meta.cidade_uf || project?.city || '';
  const responsavel = meta.responsavel || '';
  const dateStr = meta.data_diagnostico
    ? new Date(meta.data_diagnostico + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateShort = meta.data_diagnostico
    ? new Date(meta.data_diagnostico + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  d.unitName = unitName;
  d.reportDate = dateShort;

  const score = data.score || {};
  const resumo = data.resumo_executivo || {};
  const funnelAtual = data.funil_atual || {};
  const funnelReverso = data.funil_reverso_meta || {};
  const pilares = data.pilares || [];
  const matrizPriorizacao = data.matriz_priorizacao || [];
  const riscos = data.riscos || [];
  const estrategiaMidia = data.estrategia_midia || {};
  const planoAcao = data.plano_acao || [];
  const cenarios = data.cenarios || [];
  const proximosPassos = data.proximos_passos || {};

  // ─── CAPA ──────────────────────────────────────────────────────────────────
  d.newPage();
  // logo IDK
  d.txt(ML, 14, 'IDK', 13, 'bold', C.black);
  d.line(ML, 16, ML + 10, 16, C.black, 0.5);

  // eyebrow + titulo
  d.y = 68;
  d.txt(ML, d.y, 'RELATÓRIO ESTRATÉGICO', 7.5, 'bold', C.green);
  // tracking via letter spacing não é nativo em jsPDF; usamos texto normal
  d.y += 10;
  d.txt(ML, d.y, 'DIAGNÓSTICO DE', 26, 'bold', C.black);
  d.y += 15;
  d.txt(ML, d.y, 'PERFORMANCE', 26, 'bold', C.black);
  d.y += 10;
  d.txt(ML, d.y, '& Plano de Crescimento — 90 dias', 12, 'normal', C.gray);

  // seta grande ↗
  d.arrow(PW - MR - 28, 72, 24, C.green, 1.8);

  // filete + nome unidade
  d.y += 10;
  d.line(ML, d.y, PW - MR, d.y, C.black, 0.4);
  d.y += 7;
  d.txt(ML, d.y, unitName, 13, 'bold', C.black);
  d.y += 6;
  const subMeta = [cidade, responsavel ? `Responsável: ${responsavel}` : '', dateStr].filter(Boolean).join('  •  ');
  d.txt(ML, d.y, subMeta, 9, 'normal', C.gray);

  // band preto na base da capa
  const bandY = PH - 47;
  const bandH = 38;
  d.rect(0, bandY, PW, bandH, C.black, null, 0);

  // KPIs na capa — extraídos dos cenários/resumo
  const faturamentoAtual = resumo.tres_numeros_chave?.find(k => /faturamento|atual/i.test(k.rotulo))?.valor
    || project?.answers_json?.faturamento_atual || '—';
  const metaDeclarada = funnelReverso?.gap_mensal ? 'Ver diagnóstico' : '—';
  const prazoDesejado = '90 dias';

  const kpiCapa = [
    { label: 'FATURAMENTO ATUAL', val: faturamentoAtual, color: C.white },
    { label: 'META DECLARADA', val: metaDeclarada, color: C.green },
    { label: 'PRAZO DESEJADO', val: prazoDesejado, color: C.white },
  ];
  const kw = CW / 3;
  kpiCapa.forEach((k, i) => {
    const kx = ML + i * kw;
    if (i > 0) {
      d.line(kx - 2, bandY + 6, kx - 2, bandY + bandH - 6, '#333333', 0.3);
    }
    d.txt(kx, bandY + 8, k.label, 6.5, 'bold', C.grayLight);
    d.txt(kx, bandY + 17, k.val, 13, 'bold', k.color);
  });
  // confidencial
  d.txt(ML, PH - 5, `Documento confidencial — uso exclusivo de ${unitName}.`, 7, 'normal', C.gray);

  // ─── PG 2: SCORE DE MATURIDADE ─────────────────────────────────────────────
  d.newPage('Score de Maturidade', '01 · Diagnóstico');
  const scoreDesc = `Avaliação de 0 a 10 em cinco pilares do negócio, ponderada pelo peso de cada pilar no potencial de crescimento. A régua: 0–4 Sobrevivência, 4,1–6 Estruturação, 6,1–8 Aceleração, 8,1–10 Escala.`;
  const sdH = d.paraH(scoreDesc, CW, 9, 13);
  d.para(ML, d.y, scoreDesc, CW, 9, 'normal', C.gray, 13);
  d.y += sdH + 4;

  // bloco preto score
  const scoreVal = String(score.geral || '—').replace('.', ',');
  const estagio = score.estagio || 'Estruturação';
  const sbH = 36;
  d.rect(ML, d.y, CW, sbH, C.black, null, 3);
  d.txt(ML + 8, d.y + 18, scoreVal, 30, 'bold', C.white);
  d.txt(ML + 8 + 22, d.y + 19, '/ 10', 11, 'bold', C.grayLight);
  // tag estágio
  d.setFont(7, 'bold');
  const tagW = d.doc.getTextWidth(`ESTÁGIO: ${estagio.toUpperCase()}`) + 8;
  d.rect(ML + 8, d.y + 22, tagW, 7, C.green, null, 3);
  d.txt(ML + 12, d.y + 27, `ESTÁGIO: ${estagio.toUpperCase()}`, 7, 'bold', C.black);
  // gauge bar
  const gx = ML + 68, gw = CW - 72;
  const scoreNum = parseFloat(String(score.geral)) || 0;
  d.rect(gx, d.y + 14, gw, 4, '#333333', null, 2);
  d.rect(gx, d.y + 14, gw * (scoreNum / 10), 4, C.green, null, 2);
  [0, 0.4, 0.6, 0.8, 1.0].forEach((v, vi) => {
    d.txt(gx + gw * v, d.y + 12, ['0', '4', '6', '8', '10'][vi], 6, 'normal', C.grayLight, 'center');
  });
  // frase no bloco
  const scoreNote = score.pilares?.[0]
    ? `A clínica está no estágio ${estagio.toLowerCase()} — foque nos pilares com menor nota primeiro.`
    : 'Veja o diagnóstico por pilar para o plano de ação.';
  d.para(gx, d.y + 20, scoreNote, gw, 7.5, 'normal', C.grayLight, 11);
  d.y += sbH + 6;

  // barras dos pilares
  const pilaresList = score.pilares || pilares.map(p => ({
    pilar: p.pilar, nota: p.nota, peso: Math.round((p.peso || 0) * 100), justificativa: p.situacao?.slice(0, 80) || ''
  }));
  pilaresList.forEach(p => {
    d.ensure(20);
    const nota = parseFloat(p.nota) || 0;
    const col = nota <= 4 ? C.black : nota <= 6 ? C.gray : C.green;
    const peso = p.peso || 0;
    d.txt(ML, d.y + 4, p.pilar || p.nome || '', 10, 'bold', C.black);
    d.txt(PW - MR, d.y + 4, `${String(nota.toFixed(1)).replace('.', ',')}  (peso ${peso}%)`, 10, 'bold', col, 'right');
    d.y += 6;
    d.rect(ML, d.y, CW, 3.5, C.cream, null, 2);
    d.rect(ML, d.y, CW * nota / 10, 3.5, col, null, 2);
    d.y += 5;
    const jus = p.justificativa || '';
    if (jus) {
      d.para(ML, d.y, jus, CW, 8.5, 'normal', C.gray, 11);
      d.y += d.paraH(jus, CW, 8.5, 11) + 3;
    }
    d.line(ML, d.y, PW - MR, d.y, C.line, 0.2);
    d.y += 3;
  });

  // ─── PG 3: RESUMO EXECUTIVO ────────────────────────────────────────────────
  d.newPage('Resumo Executivo', '02 · Diagnóstico');
  const paragrafo = resumo.paragrafo || '';
  d.para(ML, d.y, paragrafo, CW, 10, 'normal', C.black, 14);
  d.y += d.paraH(paragrafo, CW, 10, 14) + 6;

  // KPI cards
  const kpiCards = (resumo.tres_numeros_chave || []).map(k => ({
    rotulo: k.rotulo,
    valor: k.valor,
    leitura: k.leitura,
    cor: /0,/i.test(k.valor) || /crítico/i.test(k.leitura) ? C.black : C.black,
  }));
  if (kpiCards.length) d.kpiCards(kpiCards);

  // veredito callout
  if (resumo.veredito_meta) {
    d.callout(`VEREDITO SOBRE A META`, resumo.veredito_meta, C.green);
  }

  // ─── PG 4: RAIO-X DO FUNIL ────────────────────────────────────────────────
  d.newPage('Raio-X do Funil Comercial', '03 · Diagnóstico');
  d.sectionH2('Funil atual (mensal)');

  const linhas = funnelAtual.linhas || [];
  linhas.forEach(ln => {
    const label = `${ln.etapa}: ${ln.valor}`;
    const pct = ln.etapa === 'Leads' ? 1
      : ln.etapa === 'Agendamentos' ? 0.35
      : ln.etapa === 'Comparecimentos' ? 0.2
      : 0.1;
    const st = ln.status || 'ok';
    const obs = ln.taxa ? `${ln.taxa}\n${ln.benchmark || ''}` : ln.benchmark || '';
    d.funnelBar(label, pct, st, obs);
  });

  // leitura do funil
  if (funnelAtual.leitura) {
    d.gap(2);
    d.para(ML, d.y, funnelAtual.leitura, CW, 8.5, 'normal', C.gray, 12);
    d.y += d.paraH(funnelAtual.leitura, CW, 8.5, 12) + 5;
  }

  d.sectionH2('Unit economics');
  const ueLinhas = funnelAtual.unit_economics || [];
  if (ueLinhas.length) {
    d.table(
      ['Indicador', 'Você hoje', 'Benchmark', 'Status'],
      ueLinhas.map(u => [u.indicador, u.valor, u.benchmark || '—', u.status]),
      [68, 52, 42, 14],
      3
    );
  }

  // ─── PG 5: MATEMÁTICA DA META ──────────────────────────────────────────────
  d.newPage('A Matemática da Sua Meta', '04 · Diagnóstico');
  const cenaAtual = funnelReverso.cenario_taxas_atuais || {};
  const cenaCorr = funnelReverso.cenario_taxas_corrigidas || {};
  const gap = funnelReverso.gap_mensal || '';

  const intro = `Meta declarada: gap de ${gap}. Abaixo, o que esse gap exige em dois mundos: mantendo o funil de hoje ou operando no benchmark.`;
  d.para(ML, d.y, intro, CW, 10, 'normal', C.black, 14);
  d.y += d.paraH(intro, CW, 10, 14) + 5;

  // dois cards comparativos
  const cw2 = (CW - 4) / 2;
  const cardH = 52;
  d.ensure(cardH + 6);
  const cy0 = d.y;

  // card esquerdo (preto)
  d.rect(ML, cy0, cw2, cardH, C.cream, null, 3);
  d.rect(ML, cy0, cw2, 10, C.black, null, 3);
  d.rect(ML, cy0 + 4, cw2, 6, C.black, null, 0);
  d.txt(ML + 5, cy0 + 7, 'COM AS TAXAS DE HOJE', 8.5, 'bold', C.white);
  const row1 = [
    ['Leads necessários', cenaAtual.leads_necessarios || '—'],
    ['Investimento necessário', cenaAtual.investimento_necessario || '—'],
    ['Comentário', cenaAtual.comentario || ''],
    ['Veredito', 'INVIÁVEL'],
  ];
  let ry = cy0 + 17;
  row1.forEach(([a, b]) => {
    d.txt(ML + 5, ry, a, 8, 'normal', C.gray);
    d.txt(ML + cw2 - 5, ry, b, 8.5, 'bold', a === 'Veredito' ? C.black : C.black, 'right');
    ry += 7;
  });

  // card direito (verde)
  const x2 = ML + cw2 + 4;
  d.rect(x2, cy0, cw2, cardH, C.cream, null, 3);
  d.rect(x2, cy0, cw2, 10, C.green, null, 3);
  d.rect(x2, cy0 + 4, cw2, 6, C.green, null, 0);
  d.txt(x2 + 5, cy0 + 7, 'COM O FUNIL CORRIGIDO', 8.5, 'bold', C.white);
  const row2 = [
    ['Leads necessários', cenaCorr.leads_necessarios || '—'],
    ['Investimento necessário', cenaCorr.investimento_necessario || '—'],
    ['Comentário', cenaCorr.comentario || ''],
    ['Veredito', 'VIÁVEL COM ESCALONAMENTO'],
  ];
  ry = cy0 + 17;
  row2.forEach(([a, b]) => {
    d.txt(x2 + 5, ry, a, 8, 'normal', C.gray);
    d.txt(x2 + cw2 - 5, ry, b, a === 'Veredito' ? 7.5 : 8.5, 'bold', a === 'Veredito' ? C.green : C.black, 'right');
    ry += 7;
  });

  d.y = cy0 + cardH + 5;
  if (funnelReverso.conclusao) {
    d.callout('CONCLUSÃO', funnelReverso.conclusao, C.green);
  }

  // ─── PGS 5+: DIAGNÓSTICO POR PILAR ────────────────────────────────────────
  d.newPage('Diagnóstico por Pilar', '05 · Diagnóstico');
  pilares.forEach((p, pi) => {
    if (pi > 0 && pi % 2 === 0) {
      d.newPage('Diagnóstico por Pilar (cont.)');
    }
    const nota = parseFloat(p.nota) || 0;
    const col = nota <= 4 ? C.black : nota <= 6 ? C.gray : C.green;

    d.ensure(70, 'Diagnóstico por Pilar (cont.)');
    // badge circular com nota
    d.circle(ML + 6, d.y + 6, 6, col);
    d.txt(ML + 6, d.y + 8, String(nota.toFixed(1)).replace('.', ','), 8, 'bold', C.white, 'center');
    d.txt(ML + 16, d.y + 8, p.pilar || '', 12, 'bold', C.black);
    d.y += 16;

    // SITUAÇÃO
    d.txt(ML, d.y, 'SITUAÇÃO', 7, 'bold', C.gray);
    d.y += 4;
    const sh = d.paraH(p.situacao || '', CW, 9.5, 13);
    d.para(ML, d.y, p.situacao || '', CW, 9.5, 'normal', C.black, 13);
    d.y += sh + 3;

    // GARGALO
    if (p.gargalo_central) {
      const gh = d.paraH(p.gargalo_central, CW - 8, 9.5, 13) + 12;
      d.ensure(gh + 4, 'Diagnóstico por Pilar (cont.)');
      d.rect(ML, d.y, CW, gh, C.cream, null, 2);
      d.rect(ML, d.y, 1.5, gh, C.black, null, 1);
      d.txt(ML + 6, d.y + 5, 'GARGALO CENTRAL', 7, 'bold', C.black);
      d.para(ML + 6, d.y + 9, p.gargalo_central, CW - 10, 9.5, 'normal', C.black, 13);
      d.y += gh + 3;
    }

    // IMPACTO
    if (p.impacto_financeiro) {
      d.ensure(8, 'Diagnóstico por Pilar (cont.)');
      d.setFont(8, 'bold'); d.setTextColor(C.gray);
      d.doc.text('IMPACTO ESTIMADO:  ', ML, d.y);
      const off = d.doc.getTextWidth('IMPACTO ESTIMADO:  ');
      d.para(ML + off, d.y, p.impacto_financeiro, CW - off, 8.5, 'normal', C.black, 12);
      d.y += d.paraH(p.impacto_financeiro, CW - off, 8.5, 12) + 2;
    }

    // QUICK WIN
    if (p.quick_win) {
      const qh = d.paraH(p.quick_win, CW - 8, 9.5, 13) + 12;
      d.ensure(qh + 4, 'Diagnóstico por Pilar (cont.)');
      const [tr, tg, tb] = tint(C.green, 0.06);
      d.doc.setFillColor(tr, tg, tb);
      d.doc.roundedRect(ML, d.y, CW, qh, 2, 2, 'F');
      d.rect(ML, d.y, 1.5, qh, C.green, null, 1);
      d.txt(ML + 6, d.y + 5, 'QUICK WIN', 7, 'bold', C.green);
      d.para(ML + 6, d.y + 9, p.quick_win, CW - 10, 9.5, 'normal', C.black, 13);
      d.y += qh + 3;
    }
    d.gap(8);
  });

  // ─── MATRIZ DE PRIORIZAÇÃO ─────────────────────────────────────────────────
  d.newPage('Matriz de Priorização', '06 · Plano');
  const mpIntro = 'O que fazer primeiro: iniciativas ordenadas por impacto no faturamento versus esforço de implantação. Alto impacto + baixo esforço = primeiros 7 dias.';
  d.para(ML, d.y, mpIntro, CW, 9.5, 'normal', C.gray, 13);
  d.y += d.paraH(mpIntro, CW, 9.5, 13) + 4;

  if (matrizPriorizacao.length) {
    d.table(
      ['#', 'Iniciativa', 'Impacto', 'Esforço', 'Janela'],
      matrizPriorizacao.map((m, i) => [
        String(i + 1),
        m.iniciativa || '',
        (m.impacto || '').toUpperCase(),
        (m.esforco || '').toUpperCase(),
        `Dias ${m.janela || ''}`,
      ]),
      [8, 100, 22, 22, 24],
      null
    );
  }

  // ─── RISCOS ESTRATÉGICOS ───────────────────────────────────────────────────
  d.gap(4);
  d.sectionH2('Riscos estratégicos');
  riscos.forEach(r => {
    const bh = d.paraH(r.risco || '', CW - 8, 9.5, 13)
      + d.paraH(r.consequencia || '', CW - 8, 9, 13)
      + d.paraH(r.mitigacao || '', CW - 8, 9, 13)
      + 18;
    d.ensure(bh + 4, 'Riscos estratégicos (cont.)');
    d.rect(ML, d.y, CW, bh, C.cream, null, 2);
    d.rect(ML, d.y, 1.5, bh, C.gray, null, 1);
    d.txt(ML + 6, d.y + 5, r.risco || '', 9.5, 'bold', C.black);
    let ry2 = d.y + 11;
    ry2 += d.para(ML + 6, ry2, r.consequencia || '', CW - 10, 9, 'normal', C.black, 13) + 2;
    d.para(ML + 6, ry2, `Mitigação: ${r.mitigacao || ''}`, CW - 10, 9, 'normal', C.green, 13);
    d.y += bh + 3;
  });

  // ─── ESTRATÉGIA DE MÍDIA ───────────────────────────────────────────────────
  const verbaTotLabel = `ESTRATÉGIA DE MÍDIA${estrategiaMidia.verba_total ? ' — ' + estrategiaMidia.verba_total : ''}`;
  d.newPage(verbaTotLabel.toUpperCase(), '07 · Plano');

  d.sectionH2('Distribuição da verba');
  const distColors = [C.black, C.gray, C.green, C.grayLight];
  (estrategiaMidia.distribuicao || []).forEach((item, i) => {
    const pct = parseFloat(String(item.percentual || '').replace('%', '')) || 10;
    d.mediaBar(item.canal || '', `${item.verba || ''}  (${item.percentual || ''})`, pct, distColors[i % 4]);
  });

  d.gap(4);
  if ((estrategiaMidia.campanhas || []).length) {
    d.sectionH2('Campanhas por tratamento prioritário');
    d.table(
      ['Tratamento', 'Público', 'Ângulo de comunicação', 'Oferta de entrada'],
      (estrategiaMidia.campanhas || []).map(c => [
        c.tratamento || '', c.publico || '', c.angulo || '', c.oferta_entrada || ''
      ]),
      [28, 40, 68, 40],
      null
    );
  }

  if ((estrategiaMidia.metas_midia || []).length) {
    d.gap(4);
    d.sectionH2('Metas de mídia (30 / 60 / 90 dias)');
    d.table(
      ['Indicador', '30 dias', '60 dias', '90 dias'],
      (estrategiaMidia.metas_midia || []).map(m => [m.indicador || '', m.d30 || '', m.d60 || '', m.d90 || '']),
      [60, 30, 30, 30],
      null
    );
  }

  if (estrategiaMidia.observacao_compliance) {
    d.gap(4);
    d.callout('COMPLIANCE — PUBLICIDADE ODONTOLÓGICA (CFO)', estrategiaMidia.observacao_compliance, C.gray);
  }

  // ─── PLANO DE AÇÃO 7/15/30/90 ─────────────────────────────────────────────
  d.newPage('Plano de Ação — 7 / 15 / 30 / 90 dias', '08 · Plano');

  // timeline
  const tlMarks = [
    { label: 'DIAS 1–7', sub: 'Destravar' },
    { label: 'DIAS 8–15', sub: 'Estruturar' },
    { label: 'DIAS 16–30', sub: 'Otimizar' },
    { label: 'DIAS 31–90', sub: 'Escalar' },
  ];
  const tlY = d.y + 10;
  d.line(ML, tlY, PW - MR, tlY, C.line, 0.5);
  tlMarks.forEach((m, i) => {
    const tx = ML + (CW / 3) * i;
    const circleColor = i === 0 ? C.green : C.black;
    d.circle(tx, tlY, 3, circleColor);
    d.txt(tx, tlY - 4, m.label, 7, 'bold', C.black, 'center');
    d.txt(tx, tlY + 7, m.sub, 7, 'normal', C.gray, 'center');
  });
  d.y = tlY + 14;

  planoAcao.forEach(janela => {
    d.ensure(16, 'Plano de Ação (cont.)');
    // faixa preta do período
    const fh = 8;
    d.rect(ML, d.y, CW, fh, C.black, null, 2);
    d.txt(ML + 4, d.y + 5.5, janela.titulo_janela || '', 9, 'bold', C.white);
    if (janela.acoes && janela.acoes.length) {
      const subtH = janela.acoes[0]?.titulo || '';
      // pega subtítulo da janela se houver
    }
    d.y += fh + 3;

    (janela.acoes || []).forEach(acao => {
      const descH = d.paraH(acao.descricao || '', CW - 8, 9, 13);
      const metaH = d.paraH(`Responsável: ${acao.responsavel || ''}   •   Métrica: ${acao.metrica_sucesso || ''}`, CW - 8, 7.5, 11);
      const cardH = descH + metaH + 16;
      d.ensure(cardH + 4, 'Plano de Ação (cont.)');
      d.rect(ML, d.y, CW, cardH, C.cream, null, 2);
      // título da ação
      d.txt(ML + 5, d.y + 6, acao.titulo || '', 9.5, 'bold', C.black);
      // chip de prioridade
      const priColor = acao.prioridade === 'alta' ? C.green : acao.prioridade === 'media' ? C.gray : C.grayLight;
      const priLabel = (acao.prioridade || '').toUpperCase();
      d.chip(PW - MR - 22, d.y + 5, priLabel, priColor);
      let ay = d.y + 10;
      ay += d.para(ML + 5, ay, acao.descricao || '', CW - 10, 9, 'normal', C.black, 13) + 2;
      d.para(ML + 5, ay, `Responsável: ${acao.responsavel || ''}   •   Métrica: ${acao.metrica_sucesso || ''}`, CW - 10, 7.5, 'normal', C.gray, 11);
      d.y += cardH + 3;
    });
    d.gap(3);
  });

  // ─── CENÁRIOS ──────────────────────────────────────────────────────────────
  d.newPage('Projeção de Cenários — 90 dias', '09 · Projeção');
  if (cenarios.length) {
    const cHeaders = ['Funil mensal', 'Hoje', ...cenarios.slice(1).map(c => c.nome ? c.nome.charAt(0).toUpperCase() + c.nome.slice(1) : '')];
    const cWidths = [44, ...cenarios.slice(0).map(() => Math.floor((CW - 44) / cenarios.length))];
    // monta rows
    const fields = ['leads', 'agendamentos', 'comparecimentos', 'fechamentos', 'ticket'];
    const labels = ['Leads', 'Agendamentos', 'Comparecimentos', 'Fechamentos', 'Ticket médio'];
    const cRows = labels.map((lbl, li) => {
      return [lbl, ...cenarios.map(c => c.funil?.[fields[li]] || '—')];
    });
    cRows.push(['Receita nova (mídia)', ...cenarios.map(c => c.receita_nova_mes || '—')]);
    d.table(
      ['Funil mensal', ...cenarios.map(c => c.nome ? c.nome.charAt(0).toUpperCase() + c.nome.slice(1) : '')],
      cRows,
      [46, ...cenarios.map(() => Math.floor((CW - 46) / cenarios.length))],
      null
    );
  }

  d.gap(4);
  d.sectionH2('Faturamento mensal projetado (dia 90)');
  if (cenarios.length) {
    d.scenarioChart(cenarios);
  }

  if (resumo.veredito_meta || cenarios.length) {
    const leitura = data.cenarios_leitura || 'Veja os cenários acima para a projeção de crescimento.';
    d.callout('LEITURA DOS CENÁRIOS', leitura, C.green);
  }

  // ─── PRÓXIMOS PASSOS ───────────────────────────────────────────────────────
  d.newPage('Próximos Passos', '10 · Fechamento');
  const ppPara = proximosPassos.paragrafo_fechamento || '';
  if (ppPara) {
    d.para(ML, d.y, ppPara, CW, 10.5, 'normal', C.black, 14);
    d.y += d.paraH(ppPara, CW, 10.5, 14) + 6;
  }

  d.sectionH2('Pauta sugerida da primeira reunião');
  (proximosPassos.primeira_reuniao_pauta || []).forEach((item, i) => {
    d.ensure(14);
    d.circle(ML + 4, d.y + 4, 4, C.green);
    d.txt(ML + 4, d.y + 6, String(i + 1), 7.5, 'bold', C.black, 'center');
    d.para(ML + 12, d.y + 1, item, CW - 14, 9.5, 'normal', C.black, 13);
    d.y += Math.max(10, d.paraH(item, CW - 14, 9.5, 13) + 3);
  });

  d.gap(8);
  // bloco preto de fechamento
  const blH = 28;
  d.ensure(blH + 4);
  d.rect(ML, d.y, CW, blH, C.black, null, 3);
  d.txt(ML + 8, d.y + 10, 'Vamos destravar esse funil juntos.', 11, 'bold', C.green);
  d.txt(ML + 8, d.y + 17, 'IDK Performance — Diagnóstico, mídia e processo comercial para clínicas odontológicas.', 8.5, 'normal', C.white);
  const onboardDate = project?.completed_at
    ? new Date(project.completed_at).toLocaleDateString('pt-BR')
    : dateShort;
  d.txt(ML + 8, d.y + 23, `Este relatório foi gerado a partir do onboarding respondido em ${onboardDate}.`, 7.5, 'normal', C.grayLight);
  d.y += blH + 4;

  // ─── Salva ─────────────────────────────────────────────────────────────────
  const fileName = `Diagnostico_${unitName.replace(/\s+/g, '_')}_${dateShort.replace(/\//g, '-')}.pdf`;
  d.doc.save(fileName);
}