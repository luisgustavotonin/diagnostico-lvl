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
};

const STATUS_COLOR = { ok: C.green, atencao: C.gray, critico: C.black };
const STATUS_LABEL = { ok: 'OK', atencao: 'ATENÇÃO', critico: 'CRÍTICO' };

// A4 em mm
const PW = 210, PH = 297;
const ML = 16, MR = 16, MT = 20, MB = 22;
const CW = PW - ML - MR;

function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function tintRgb(hex, alpha = 0.12) {
  const [r,g,b] = hexRgb(hex);
  return [Math.round(r+(255-r)*(1-alpha)), Math.round(g+(255-g)*(1-alpha)), Math.round(b+(255-b)*(1-alpha))];
}

class IDKDoc {
  constructor() {
    this.doc = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });
    this.y = MT;
    this.page = 0;
    this.unitName = '';
    this.reportDate = '';
  }

  // ── primitivos ──
  fill(hex)   { const [r,g,b]=hexRgb(hex); this.doc.setFillColor(r,g,b); }
  stroke(hex, lw=0.25) { const [r,g,b]=hexRgb(hex); this.doc.setDrawColor(r,g,b); this.doc.setLineWidth(lw); }
  color(hex)  { const [r,g,b]=hexRgb(hex); this.doc.setTextColor(r,g,b); }
  font(size, style='normal') { this.doc.setFont('helvetica', style); this.doc.setFontSize(size); }

  txt(x, y, s, size, style, col, align='left') {
    this.font(size, style); this.color(col);
    this.doc.text(String(s??''), x, y, { align });
  }

  // Calcula altura de um parágrafo
  paraH(text, width, size, leading) {
    leading = leading ?? (size * 1.45);
    const lines = this.doc.splitTextToSize(String(text??''), width);
    return lines.length * leading;
  }

  // Desenha parágrafo, retorna altura usada
  para(x, y, text, width, size, style, col, leading) {
    leading = leading ?? (size * 1.45);
    this.font(size, style); this.color(col);
    const lines = this.doc.splitTextToSize(String(text??''), width);
    lines.forEach((ln, i) => this.doc.text(ln, x, y + i * leading));
    return lines.length * leading;
  }

  rect(x, y, w, h, fillHex, strokeHex, r=0) {
    if (fillHex) this.fill(fillHex);
    else this.doc.setFillColor(255,255,255,0);
    if (strokeHex) this.stroke(strokeHex);
    else { this.doc.setDrawColor(255,255,255); this.doc.setLineWidth(0); }
    const style = fillHex && strokeHex ? 'FD' : fillHex ? 'F' : 'D';
    r > 0
      ? this.doc.roundedRect(x, y, w, h, r, r, style)
      : this.doc.rect(x, y, w, h, style);
  }

  line(x1,y1,x2,y2,col,lw=0.25) { this.stroke(col,lw); this.doc.line(x1,y1,x2,y2); }

  circle(cx, cy, r, fillHex) {
    this.fill(fillHex);
    this.doc.setDrawColor(255,255,255);
    this.doc.circle(cx, cy, r, 'F');
  }

  // Seta ↗
  arrow(x, y, size, col=C.green, lw=0.6) {
    this.stroke(col, lw);
    this.doc.line(x, y+size, x+size, y);
    this.doc.line(x+size*0.38, y, x+size, y);
    this.doc.line(x+size, y, x+size, y+size*0.62);
  }

  // ── Paginação ──
  headerFooter() {
    this.txt(ML, 9, 'IDK', 10, 'bold', C.black);
    this.txt(PW-MR, 9, this.unitName, 8, 'normal', C.gray, 'right');
    this.line(ML, 11.5, PW-MR, 11.5, C.black, 0.35);
    const foot = `Diagnóstico de Performance  •  ${this.reportDate}  •  Documento confidencial`;
    this.txt(ML, PH-7, foot, 7, 'normal', C.gray);
    this.txt(PW-MR, PH-7, `Página ${this.page}`, 7, 'normal', C.gray, 'right');
  }

  newPage(title, eyebrow) {
    if (this.page > 0) this.doc.addPage();
    this.page++;
    this.rect(0,0,PW,PH, C.white);
    if (this.page > 1) {
      this.headerFooter();
      this.y = 18;
    } else {
      this.y = MT;
    }
    if (title) {
      if (eyebrow) {
        this.txt(ML, this.y+3, eyebrow.toUpperCase(), 7, 'bold', C.green);
        this.y += 7;
      }
      this.txt(ML, this.y+6, title.toUpperCase(), 14, 'bold', C.black);
      this.arrow(PW-MR-8, this.y, 7, C.black, 0.5);
      this.y += 8;
      this.line(ML, this.y, PW-MR, this.y, C.line, 0.25);
      this.y += 4;
    }
  }

  ensure(h, title, eyebrow) {
    if (this.y + h > PH - MB) this.newPage(title, eyebrow);
  }

  gap(g=4) { this.y += g; }

  sectionH2(text) {
    this.ensure(10);
    this.txt(ML, this.y+4, text, 10.5, 'bold', C.black);
    this.y += 8;
  }

  // ── Chip status ──
  chip(x, y, label, col) {
    this.font(6.5, 'bold');
    const tw = this.doc.getTextWidth(label);
    const cw = tw + 5, ch = 4.5;
    if (col === C.black) {
      this.rect(x, y-ch+0.5, cw, ch, C.black, null, 2);
      this.txt(x+2.5, y, label, 6.5, 'bold', C.white);
    } else {
      const [r,g,b] = tintRgb(col, 0.2);
      this.doc.setFillColor(r,g,b);
      this.doc.roundedRect(x, y-ch+0.5, cw, ch, 2, 2, 'F');
      this.txt(x+2.5, y, label, 6.5, 'bold', col);
    }
    return cw;
  }

  // ── Callout (card creme + barra lateral) ──
  callout(title, body, col=C.green) {
    const pad = 4;
    const bodyW = CW - 14;
    const titleH = 6;
    const bodyH = this.paraH(body, bodyW, 9, 13);
    const total = titleH + bodyH + pad*2 + 2;
    this.ensure(total + 4);
    const y0 = this.y;
    this.rect(ML, y0, CW, total, C.cream, null, 2);
    this.rect(ML, y0, 1.5, total, col, null, 1);
    this.txt(ML+6, y0+pad+4, title, 8.5, 'bold', C.black);
    this.para(ML+6, y0+pad+4+titleH, body, bodyW, 9, 'normal', C.black, 13);
    this.y = y0 + total + 4;
  }

  // ── 3 KPI cards ──
  kpiCards(cards) {
    const n = cards.length;
    const gapx = 3;
    const cw = (CW - gapx*(n-1)) / n;
    // Calcular altura necessária para o maior card
    let maxH = 26;
    cards.forEach(card => {
      const lh = this.paraH(card.leitura||'', cw-8, 8, 11);
      maxH = Math.max(maxH, 20 + lh + 4);
    });
    this.ensure(maxH+4);
    const y0 = this.y;
    cards.forEach((card,i) => {
      const x = ML + i*(cw+gapx);
      this.rect(x, y0, cw, maxH, C.cream, null, 2);
      this.txt(x+4, y0+5, (card.rotulo||'').toUpperCase(), 6, 'bold', C.gray);
      this.txt(x+4, y0+13, card.valor||'', 15, 'bold', card.cor||C.black);
      this.para(x+4, y0+17, card.leitura||'', cw-8, 8, 'normal', C.black, 11);
    });
    this.y = y0 + maxH + 4;
  }

  // ── Tabela zebra ──
  table(headers, rows, widths, statusCol=null) {
    const rh = 7;
    const total = rh*(rows.length+1)+2;
    this.ensure(total+4);
    let y = this.y;
    // header
    this.rect(ML, y, CW, rh, C.black, null, 2);
    let cx = ML;
    headers.forEach((h,i) => {
      this.txt(cx+3, y+4.8, String(h), 7.5, 'bold', C.white);
      cx += widths[i];
    });
    y += rh;
    rows.forEach((row,ri) => {
      if (ri%2===1) this.rect(ML, y, CW, rh, C.cream, null, 0);
      cx = ML;
      row.forEach((cell,ci) => {
        const s = String(cell??'');
        if (statusCol!==null && ci===statusCol && STATUS_COLOR[s]) {
          this.chip(cx+3, y+5, STATUS_LABEL[s], STATUS_COLOR[s]);
        } else {
          this.txt(cx+3, y+4.8, s, 7.5, ci===0?'bold':'normal', C.black);
        }
        cx += widths[ci];
      });
      y += rh;
    });
    this.line(ML, y, ML+CW, y, C.line, 0.25);
    this.y = y+4;
  }

  // ── Funil bar ──
  funnelBar(label, widthPct, status, taxa, benchmark) {
    const maxW = CW * 0.56;
    const bw = Math.max(maxW * widthPct, 38);
    const bh = 8;
    this.ensure(bh + 14);
    const y = this.y;
    this.rect(ML, y, bw, bh, C.black, null, 2);
    this.txt(ML+3, y+5.5, label, 8.5, 'bold', C.white);
    const chipX = ML + maxW + 5;
    if (taxa && status && status !== 'ok') {
      this.chip(chipX, y+5.5, taxa, STATUS_COLOR[status]);
    } else if (taxa) {
      this.txt(chipX, y+5.5, taxa, 7.5, 'normal', C.gray);
    }
    this.y = y + bh + 2;
    if (benchmark) {
      this.txt(chipX, this.y+3, benchmark, 7, 'normal', C.gray);
      this.y += 6;
    }
    this.gap(2);
  }

  // ── Barra de verba de mídia ──
  mediaBar(label, valueLabel, pct, col) {
    const maxW = CW * 0.85;
    const bw = Math.max(maxW*(pct/100), 20);
    const bh = 6;
    this.txt(ML, this.y+4, label, 8.5, 'bold', C.black);
    this.y += 6;
    this.rect(ML, this.y, bw, bh, col, null, 2);
    this.txt(ML+3, this.y+4.3, valueLabel, 7.5, 'bold', C.white);
    this.y += bh + 4;
  }

  // ── Gráfico de barras cenários ──
  scenarioChart(cenarios) {
    const ch = 38, bw = 20, gapx = 12;
    const maxVal = 300;
    const y0 = this.y + ch;
    // linha da meta
    const ym = this.y + ch * (1 - 300/maxVal);
    this.stroke(C.green, 0.35);
    this.doc.setLineDashPattern([1,1],0);
    this.doc.line(ML, ym, ML+CW, ym);
    this.doc.setLineDashPattern([],0);
    this.txt(PW-MR, ym-1, 'Meta: R$ 300 mil', 7, 'bold', C.green, 'right');

    const barColors = [C.grayLight, C.gray, C.green, C.black];
    cenarios.forEach((sc,i) => {
      const raw = sc.faturamento_projetado || sc.receita_nova_mes || '0';
      const num = parseInt(String(raw).replace(/\D/g,'')) || 0;
      const barH = Math.max(ch * (num/maxVal), 2);
      const x = ML + i*(bw+gapx);
      const y = y0 - barH;
      this.rect(x, y, bw, barH, barColors[i%4], null, 2);
      this.txt(x+bw/2, y-2, `R$ ${Math.round(num/1000)} mil`, 7, 'bold', C.black, 'center');
      this.txt(x+bw/2, y0+4, (sc.nome||'').charAt(0).toUpperCase()+(sc.nome||'').slice(1), 7, 'normal', C.gray, 'center');
    });
    this.y = y0 + 10;
  }
}

// ─── Renderer principal ────────────────────────────────────────────────────────
export function generateIDKReport(project, reportData) {
  const data = typeof reportData === 'string'
    ? (() => { try { return JSON.parse(reportData); } catch(e) { return {}; } })()
    : (reportData || {});

  const d = new IDKDoc();

  const meta          = data.meta || {};
  const score         = data.score || {};
  const resumo        = data.resumo_executivo || {};
  const funnelAtual   = data.funil_atual || {};
  const funnelReverso = data.funil_reverso_meta || {};
  const pilares       = data.pilares || [];
  const matriz        = data.matriz_priorizacao || [];
  const riscos        = data.riscos || [];
  const midia         = data.estrategia_midia || {};
  const plano         = data.plano_acao || [];
  const cenarios      = data.cenarios || [];
  const proxPassos    = data.proximos_passos || {};

  const unitName    = meta.nome_unidade || project?.unit_name || 'Clínica';
  const cidade      = meta.cidade_uf || project?.city || '';
  const responsavel = meta.responsavel || '';
  const rawDate     = meta.data_diagnostico || new Date().toISOString().slice(0,10);
  const dateObj     = new Date(rawDate + 'T12:00:00');
  const dateShort   = dateObj.toLocaleDateString('pt-BR');
  const dateLong    = dateObj.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});

  d.unitName    = unitName;
  d.reportDate  = dateShort;

  // ── Extrair KPIs da capa do JSON ──
  const kpiCapa = (() => {
    // Tenta extrair faturamento atual e meta do resumo ou cenários
    const keys3 = resumo.tres_numeros_chave || [];
    const fat = keys3.find(k => /faturamento|atual/i.test(k.rotulo))?.valor
      || project?.answers_json?.faturamento_atual || '—';
    const metaVal = funnelReverso.gap_mensal
      ? 'Ver diagnóstico'
      : keys3.find(k => /meta/i.test(k.rotulo))?.valor || '—';
    const prazo = '90 dias';
    return [
      { label:'FATURAMENTO ATUAL', val: fat,     col: C.white },
      { label:'META DECLARADA',    val: metaVal, col: C.green },
      { label:'PRAZO DESEJADO',    val: prazo,   col: C.white },
    ];
  })();

  // ════════════════════════════════════════════════════
  // PG 1: CAPA
  // ════════════════════════════════════════════════════
  d.newPage();

  // logo
  d.txt(ML, 14, 'IDK', 12, 'bold', C.black);
  d.line(ML, 16, ML+10, 16, C.black, 0.4);

  // eyebrow + título
  d.y = 65;
  d.txt(ML, d.y, 'RELATÓRIO ESTRATÉGICO', 7, 'bold', C.green);
  d.y += 10;
  d.txt(ML, d.y, 'DIAGNÓSTICO DE', 26, 'bold', C.black);
  d.y += 14;
  d.txt(ML, d.y, 'PERFORMANCE', 26, 'bold', C.black);
  d.y += 9;
  d.txt(ML, d.y, '& Plano de Crescimento — 90 dias', 11, 'normal', C.gray);

  // seta grande
  d.arrow(PW-MR-26, 67, 22, C.green, 1.6);

  // filete + nome unidade
  d.y += 12;
  d.line(ML, d.y, PW-MR, d.y, C.black, 0.35);
  d.y += 7;
  d.txt(ML, d.y, unitName, 12, 'bold', C.black);
  d.y += 6;
  const subline = [cidade, responsavel ? `Responsável: ${responsavel}` : '', dateLong].filter(Boolean).join('  •  ');
  d.txt(ML, d.y, subline, 9, 'normal', C.gray);

  // band preto
  const bandY = PH - 46, bandH = 36;
  d.rect(0, bandY, PW, bandH, C.black, null, 0);
  const kw = CW/3;
  kpiCapa.forEach((k,i) => {
    const kx = ML + i*kw;
    if (i > 0) {
      d.doc.setFillColor(50,50,50);
      d.doc.rect(kx-2, bandY+5, 0.4, bandH-10, 'F');
    }
    d.txt(kx, bandY+8, k.label, 6, 'bold', C.grayLight);
    d.txt(kx, bandY+17, k.val, 12, 'bold', k.col);
  });

  d.txt(ML, PH-5, `Documento confidencial — uso exclusivo de ${unitName}.`, 7, 'normal', C.gray);

  // ════════════════════════════════════════════════════
  // PG 2: SCORE
  // ════════════════════════════════════════════════════
  d.newPage('Score de Maturidade', '01 · Diagnóstico');

  const scoreDesc = 'Avaliação de 0 a 10 em cinco pilares do negócio, ponderada pelo peso de cada pilar no potencial de crescimento. A régua: 0–4 Sobrevivência, 4,1–6 Estruturação, 6,1–8 Aceleração, 8,1–10 Escala.';
  d.para(ML, d.y, scoreDesc, CW, 9, 'normal', C.gray, 13);
  d.y += d.paraH(scoreDesc, CW, 9, 13) + 5;

  const scoreNum = parseFloat(String(score.geral||4)) || 4;
  const scoreStr = scoreNum.toFixed(1).replace('.',',');
  const estagio  = score.estagio || 'Estruturação';
  const sbH = 34;

  d.rect(ML, d.y, CW, sbH, C.black, null, 3);
  // score grande
  d.txt(ML+8, d.y+20, scoreStr, 28, 'bold', C.white);
  d.txt(ML+8+20, d.y+21, '/ 10', 10, 'bold', C.grayLight);
  // tag estágio
  d.font(7, 'bold');
  const tagLabel = `ESTÁGIO: ${estagio.toUpperCase()}`;
  const tagW = d.doc.getTextWidth(tagLabel)+8;
  d.rect(ML+8, d.y+24, tagW, 7, C.green, null, 3);
  d.txt(ML+12, d.y+29.5, tagLabel, 7, 'bold', C.black);
  // gauge
  const gx = ML+64, gw = CW-70;
  d.rect(gx, d.y+12, gw, 3.5, '#333333', null, 2);
  d.rect(gx, d.y+12, gw*(scoreNum/10), 3.5, C.green, null, 2);
  ['0','4','6','8','10'].forEach((v,vi) => {
    d.txt(gx + gw*[0,0.4,0.6,0.8,1.0][vi], d.y+10, v, 6, 'normal', C.grayLight, 'center');
  });
  // nota no bloco
  const scoreNote = score.pilares?.[0]?.justificativa || `Score ${scoreStr} — ${estagio}.`;
  d.para(gx, d.y+18, scoreNote, gw, 7.5, 'normal', C.grayLight, 11);
  d.y += sbH + 6;

  // Barras dos pilares
  const pilaresScore = score.pilares?.length
    ? score.pilares
    : pilares.map(p => ({
        pilar: p.pilar,
        nota:  p.nota,
        peso:  typeof p.peso === 'number' && p.peso <= 1 ? Math.round(p.peso*100) : (p.peso || 0),
        justificativa: (p.situacao || '').slice(0,100),
      }));

  pilaresScore.forEach(p => {
    d.ensure(20);
    const nota = parseFloat(p.nota) || 0;
    const col  = nota <= 4 ? C.black : nota <= 6 ? C.gray : C.green;
    const peso = typeof p.peso === 'number' && p.peso <= 1 ? Math.round(p.peso*100) : (p.peso||0);
    d.txt(ML, d.y+4, p.pilar||p.nome||'', 10, 'bold', C.black);
    d.txt(PW-MR, d.y+4, `${nota.toFixed(1).replace('.',',')}  (peso ${peso}%)`, 9.5, 'bold', col, 'right');
    d.y += 6;
    d.rect(ML, d.y, CW, 3, C.cream, null, 2);
    d.rect(ML, d.y, CW*(nota/10), 3, col, null, 2);
    d.y += 5;
    const jus = p.justificativa || '';
    if (jus) {
      d.para(ML, d.y, jus, CW, 8.5, 'normal', C.gray, 12);
      d.y += d.paraH(jus, CW, 8.5, 12) + 2;
    }
    d.line(ML, d.y, PW-MR, d.y, C.line, 0.2);
    d.y += 4;
  });

  // ════════════════════════════════════════════════════
  // PG 3: RESUMO EXECUTIVO
  // ════════════════════════════════════════════════════
  d.newPage('Resumo Executivo', '02 · Diagnóstico');

  const paragrafo = resumo.paragrafo || '';
  d.para(ML, d.y, paragrafo, CW, 10, 'normal', C.black, 14);
  d.y += d.paraH(paragrafo, CW, 10, 14) + 5;

  const kpiItems = (resumo.tres_numeros_chave || []).map(k => ({
    rotulo: k.rotulo || '',
    valor:  k.valor  || '',
    leitura: k.leitura || '',
    cor: C.black,
  }));
  if (kpiItems.length) d.kpiCards(kpiItems);

  if (resumo.veredito_meta) {
    d.callout('VEREDITO SOBRE A META', resumo.veredito_meta, C.green);
  }

  // ════════════════════════════════════════════════════
  // PG 4: RAIO-X DO FUNIL
  // ════════════════════════════════════════════════════
  d.newPage('Raio-X do Funil Comercial', '03 · Diagnóstico');
  d.sectionH2('Funil atual (mensal)');

  const linhas = funnelAtual.linhas || [];
  const funnelWidths = [1, 0.42, 0.25, 0.15];
  linhas.forEach((ln, idx) => {
    const label = `${ln.etapa}: ${ln.valor}`;
    const st = ln.status || 'ok';
    d.funnelBar(label, funnelWidths[idx]||0.1, st, ln.taxa||'', ln.benchmark||'');
  });

  if (funnelAtual.leitura) {
    d.gap(2);
    d.para(ML, d.y, funnelAtual.leitura, CW, 8.5, 'normal', C.gray, 13);
    d.y += d.paraH(funnelAtual.leitura, CW, 8.5, 13) + 5;
  }

  d.sectionH2('Unit economics');
  const ue = funnelAtual.unit_economics || [];
  if (ue.length) {
    d.table(
      ['Indicador','Você hoje','Benchmark','Status'],
      ue.map(u => [u.indicador, u.valor, u.benchmark||'—', u.status]),
      [66, 50, 42, 18], 3
    );
  }

  // ════════════════════════════════════════════════════
  // PG 5: MATEMÁTICA DA META
  // ════════════════════════════════════════════════════
  d.newPage('A Matemática da Sua Meta', '04 · Diagnóstico');

  const cenaAtual = funnelReverso.cenario_taxas_atuais  || {};
  const cenaCorr  = funnelReverso.cenario_taxas_corrigidas || {};
  const gap       = funnelReverso.gap_mensal || '';
  const intro = `Meta declarada: gap de ${gap}. Abaixo, o que esse gap exige em dois mundos: mantendo o funil de hoje ou operando no benchmark.`;
  d.para(ML, d.y, intro, CW, 9.5, 'normal', C.black, 14);
  d.y += d.paraH(intro, CW, 9.5, 14) + 5;

  // Altura dinâmica dos cards
  const cw2 = (CW-4)/2;
  const leftRows = [
    ['Leads necessários',       cenaAtual.leads_necessarios || '—'],
    ['Investimento necessário',  cenaAtual.investimento_necessario || '—'],
    ['Veredito',                 'INVIÁVEL'],
  ];
  const rightRows = [
    ['Leads necessários',       cenaCorr.leads_necessarios || '—'],
    ['Investimento necessário',  cenaCorr.investimento_necessario || '—'],
    ['Veredito',                 'VIÁVEL COM ESCALONAMENTO'],
  ];
  const comentH = Math.max(
    d.paraH(cenaAtual.comentario||'', cw2-10, 8, 12),
    d.paraH(cenaCorr.comentario||'',  cw2-10, 8, 12),
  );
  const cardH = 10 + leftRows.length*7 + comentH + 8;

  d.ensure(cardH+8);
  const cy0 = d.y;

  // card esquerdo (cabeçalho preto)
  d.rect(ML, cy0, cw2, cardH, C.cream, null, 3);
  d.rect(ML, cy0, cw2, 10, C.black, null, 3);
  d.rect(ML, cy0+5, cw2, 5, C.black, null, 0);
  d.txt(ML+5, cy0+7.5, 'COM AS TAXAS DE HOJE', 8, 'bold', C.white);
  let ry = cy0+17;
  leftRows.forEach(([a,b]) => {
    d.txt(ML+5, ry, a, 7.5, 'normal', C.gray);
    d.txt(ML+cw2-5, ry, b, a==='Veredito'?7:8, 'bold', a==='Veredito'?C.black:C.black, 'right');
    ry += 7;
  });
  if (cenaAtual.comentario) {
    d.para(ML+5, ry, cenaAtual.comentario, cw2-10, 7.5, 'normal', C.gray, 12);
  }

  // card direito (cabeçalho verde)
  const x2 = ML+cw2+4;
  d.rect(x2, cy0, cw2, cardH, C.cream, null, 3);
  d.rect(x2, cy0, cw2, 10, C.green, null, 3);
  d.rect(x2, cy0+5, cw2, 5, C.green, null, 0);
  d.txt(x2+5, cy0+7.5, 'COM O FUNIL CORRIGIDO', 8, 'bold', C.white);
  ry = cy0+17;
  rightRows.forEach(([a,b]) => {
    d.txt(x2+5, ry, a, 7.5, 'normal', C.gray);
    d.txt(x2+cw2-5, ry, b, a==='Veredito'?7:8, 'bold', a==='Veredito'?C.green:C.black, 'right');
    ry += 7;
  });
  if (cenaCorr.comentario) {
    d.para(x2+5, ry, cenaCorr.comentario, cw2-10, 7.5, 'normal', C.gray, 12);
  }

  d.y = cy0 + cardH + 5;

  // premissas
  const prem = `Premissas do cenário corrigido: agendamento 35%, comparecimento 70%, fechamento 40%.`;
  d.txt(ML, d.y, prem, 7.5, 'normal', C.gray);
  d.y += 6;

  if (funnelReverso.conclusao) {
    d.callout('CONCLUSÃO', funnelReverso.conclusao, C.green);
  }

  // ════════════════════════════════════════════════════
  // PGS: DIAGNÓSTICO POR PILAR
  // ════════════════════════════════════════════════════
  d.newPage('Diagnóstico por Pilar', '05 · Diagnóstico');

  pilares.forEach((p, pi) => {
    const nota = parseFloat(p.nota) || 0;
    const col  = nota <= 4 ? C.black : nota <= 6 ? C.gray : C.green;

    // Calcular altura do pilar antes de desenhar
    const sitH  = d.paraH(p.situacao||'',  CW-8, 9.5, 13);
    const gargH = d.paraH(p.gargalo_central||'', CW-10, 9, 13);
    const impH  = d.paraH(p.impacto_financeiro||'', CW-30, 8.5, 12);
    const qwH   = d.paraH(p.quick_win||'', CW-10, 9, 13);
    const totalH = 18 + sitH + gargH + impH + qwH + 50;

    d.ensure(totalH, 'Diagnóstico por Pilar (cont.)');

    // Badge circular
    d.circle(ML+6, d.y+6, 6, col);
    d.txt(ML+6, d.y+8.5, nota.toFixed(1).replace('.',','), 7.5, 'bold', C.white, 'center');
    d.txt(ML+15, d.y+8, p.pilar||'', 12, 'bold', C.black);
    d.y += 16;

    // SITUAÇÃO
    d.txt(ML, d.y, 'SITUAÇÃO', 6.5, 'bold', C.gray);
    d.y += 4;
    d.para(ML, d.y, p.situacao||'', CW, 9.5, 'normal', C.black, 13);
    d.y += sitH + 3;

    // GARGALO
    if (p.gargalo_central) {
      const gh = gargH + 12;
      d.rect(ML, d.y, CW, gh, C.cream, null, 2);
      d.rect(ML, d.y, 1.5, gh, C.black, null, 1);
      d.txt(ML+6, d.y+5, 'GARGALO CENTRAL', 6.5, 'bold', C.black);
      d.para(ML+6, d.y+9, p.gargalo_central, CW-10, 9, 'normal', C.black, 13);
      d.y += gh + 3;
    }

    // IMPACTO
    if (p.impacto_financeiro) {
      d.font(7.5, 'bold'); d.color(C.gray);
      d.doc.text('IMPACTO ESTIMADO:  ', ML, d.y);
      const off = d.doc.getTextWidth('IMPACTO ESTIMADO:  ');
      d.para(ML+off, d.y, p.impacto_financeiro, CW-off, 8, 'normal', C.black, 12);
      d.y += Math.max(impH, 5) + 3;
    }

    // QUICK WIN
    if (p.quick_win) {
      const qh = qwH + 12;
      const [tr,tg,tb] = tintRgb(C.green, 0.07);
      d.doc.setFillColor(tr,tg,tb);
      d.doc.roundedRect(ML, d.y, CW, qh, 2,2,'F');
      d.rect(ML, d.y, 1.5, qh, C.green, null, 1);
      d.txt(ML+6, d.y+5, 'QUICK WIN', 6.5, 'bold', C.green);
      d.para(ML+6, d.y+9, p.quick_win, CW-10, 9, 'normal', C.black, 13);
      d.y += qh + 3;
    }

    d.gap(9);
  });

  // ════════════════════════════════════════════════════
  // MATRIZ + RISCOS
  // ════════════════════════════════════════════════════
  d.newPage('Matriz de Priorização', '06 · Plano');

  const mpIntro = 'O que fazer primeiro: iniciativas ordenadas por impacto no faturamento versus esforço de implantação. Alto impacto + baixo esforço = primeiros 7 dias.';
  d.para(ML, d.y, mpIntro, CW, 9, 'normal', C.gray, 13);
  d.y += d.paraH(mpIntro, CW, 9, 13) + 4;

  if (matriz.length) {
    d.table(
      ['#','Iniciativa','Impacto','Esforço','Janela'],
      matriz.map((m,i) => [
        String(i+1),
        m.iniciativa||'',
        (m.impacto||'').toUpperCase(),
        (m.esforco||'').toUpperCase(),
        `Dias ${m.janela||''}`,
      ]),
      [8, 102, 22, 22, 22], null
    );
  }

  d.gap(5);
  d.sectionH2('Riscos estratégicos');

  riscos.forEach(r => {
    const rh = d.paraH(r.consequencia||'', CW-10, 9, 13)
             + d.paraH(r.mitigacao||'',    CW-10, 9, 13)
             + 18;
    d.ensure(rh+4, 'Riscos estratégicos (cont.)');
    d.rect(ML, d.y, CW, rh, C.cream, null, 2);
    d.rect(ML, d.y, 1.5, rh, C.gray, null, 1);
    d.txt(ML+6, d.y+5.5, r.risco||'', 9, 'bold', C.black);
    let ry2 = d.y+11;
    ry2 += d.para(ML+6, ry2, r.consequencia||'', CW-10, 9, 'normal', C.black, 13)+2;
    d.para(ML+6, ry2, `Mitigação: ${r.mitigacao||''}`, CW-10, 9, 'normal', C.green, 13);
    d.y += rh+3;
  });

  // ════════════════════════════════════════════════════
  // ESTRATÉGIA DE MÍDIA
  // ════════════════════════════════════════════════════
  const verbaTit = midia.verba_total ? `Estratégia de Mídia — ${midia.verba_total}` : 'Estratégia de Mídia';
  d.newPage(verbaTit, '07 · Plano');

  d.sectionH2('Distribuição da verba');
  const barCols = [C.black, C.gray, C.green, C.grayLight];
  (midia.distribuicao||[]).forEach((item,i) => {
    const pct = parseFloat(String(item.percentual||'').replace('%',''))||10;
    d.mediaBar(item.canal||'', `${item.verba||''}  (${item.percentual||''})`, pct, barCols[i%4]);
  });

  d.gap(4);
  if ((midia.campanhas||[]).length) {
    d.sectionH2('Campanhas por tratamento prioritário');
    d.table(
      ['Tratamento','Público','Ângulo de comunicação','Oferta de entrada'],
      (midia.campanhas||[]).map(c => [c.tratamento||'',c.publico||'',c.angulo||'',c.oferta_entrada||'']),
      [26,42,68,40], null
    );
  }

  if ((midia.metas_midia||[]).length) {
    d.gap(4);
    d.sectionH2('Metas de mídia (30 / 60 / 90 dias)');
    d.table(
      ['Indicador','30 dias','60 dias','90 dias'],
      (midia.metas_midia||[]).map(m => [m.indicador||'',m.d30||'',m.d60||'',m.d90||'']),
      [60,30,30,30], null
    );
  }

  if (midia.observacao_compliance) {
    d.gap(4);
    d.callout('COMPLIANCE — PUBLICIDADE ODONTOLÓGICA (CFO)', midia.observacao_compliance, C.gray);
  }

  // ════════════════════════════════════════════════════
  // PLANO DE AÇÃO
  // ════════════════════════════════════════════════════
  d.newPage('Plano de Ação — 7 / 15 / 30 / 90 dias', '08 · Plano');

  // Timeline
  const tlMarks = [
    {label:'DIAS 1–7',   sub:'Destravar'},
    {label:'DIAS 8–15',  sub:'Estruturar'},
    {label:'DIAS 16–30', sub:'Otimizar'},
    {label:'DIAS 31–90', sub:'Escalar'},
  ];
  const tlY = d.y + 10;
  d.line(ML, tlY, PW-MR, tlY, C.line, 0.4);
  tlMarks.forEach((m,i) => {
    const tx = ML + (CW/3)*i;
    d.circle(tx, tlY, 3, i===0 ? C.green : C.black);
    d.txt(tx, tlY-4, m.label, 6.5, 'bold', C.black, 'center');
    d.txt(tx, tlY+6, m.sub, 6.5, 'normal', C.gray, 'center');
  });
  d.y = tlY+12;

  plano.forEach(janela => {
    const fh = 8;
    d.ensure(fh+20, 'Plano de Ação (cont.)');
    d.rect(ML, d.y, CW, fh, C.black, null, 2);
    d.txt(ML+4, d.y+5.5, janela.titulo_janela||'', 9, 'bold', C.white);
    d.y += fh+3;

    (janela.acoes||[]).forEach(acao => {
      const descH = d.paraH(acao.descricao||'', CW-10, 9, 13);
      const metaH = d.paraH(`Responsável: ${acao.responsavel||''}   •   Métrica: ${acao.metrica_sucesso||''}`, CW-10, 7.5, 11);
      const cH = descH + metaH + 16;
      d.ensure(cH+4, 'Plano de Ação (cont.)');
      d.rect(ML, d.y, CW, cH, C.cream, null, 2);
      d.txt(ML+5, d.y+6, acao.titulo||'', 9.5, 'bold', C.black);
      const priLabel = (acao.prioridade||'').toUpperCase();
      const priCol = acao.prioridade==='alta' ? C.green : acao.prioridade==='media' ? C.gray : C.grayLight;
      d.chip(PW-MR-22, d.y+5, priLabel, priCol);
      let ay = d.y+10;
      ay += d.para(ML+5, ay, acao.descricao||'', CW-10, 9, 'normal', C.black, 13)+2;
      d.para(ML+5, ay, `Responsável: ${acao.responsavel||''}   •   Métrica: ${acao.metrica_sucesso||''}`, CW-10, 7.5, 'normal', C.gray, 11);
      d.y += cH+3;
    });
    d.gap(3);
  });

  // ════════════════════════════════════════════════════
  // CENÁRIOS
  // ════════════════════════════════════════════════════
  d.newPage('Projeção de Cenários — 90 dias', '09 · Projeção');

  if (cenarios.length) {
    const cHdr  = ['Funil mensal', ...cenarios.map(c => (c.nome||'').charAt(0).toUpperCase()+(c.nome||'').slice(1))];
    const cWids = [48, ...cenarios.map(() => Math.floor((CW-48)/cenarios.length))];
    const fields  = ['leads','agendamentos','comparecimentos','fechamentos','ticket'];
    const labels2 = ['Leads','Agendamentos','Comparecimentos','Fechamentos','Ticket médio'];
    const cRows = labels2.map((lbl,li) => [lbl, ...cenarios.map(c => c.funil?.[fields[li]]||'—')]);
    cRows.push(['Receita nova (mídia)', ...cenarios.map(c => c.receita_nova_mes||'—')]);
    d.table(cHdr, cRows, cWids, null);
  }

  d.gap(4);
  d.sectionH2('Faturamento mensal projetado (dia 90)');
  if (cenarios.length) d.scenarioChart(cenarios);

  const cenaLeitura = data.cenarios_leitura || proxPassos.paragrafo_fechamento || 'Veja os cenários acima para a projeção de crescimento.';
  d.callout('LEITURA DOS CENÁRIOS', cenaLeitura, C.green);

  // ════════════════════════════════════════════════════
  // PRÓXIMOS PASSOS
  // ════════════════════════════════════════════════════
  d.newPage('Próximos Passos', '10 · Fechamento');

  const ppPara = proxPassos.paragrafo_fechamento || '';
  if (ppPara) {
    d.para(ML, d.y, ppPara, CW, 10.5, 'normal', C.black, 14);
    d.y += d.paraH(ppPara, CW, 10.5, 14) + 6;
  }

  d.sectionH2('Pauta sugerida da primeira reunião');
  (proxPassos.primeira_reuniao_pauta||[]).forEach((item,i) => {
    d.ensure(14);
    d.circle(ML+4, d.y+4, 4, C.green);
    d.txt(ML+4, d.y+6, String(i+1), 7, 'bold', C.black, 'center');
    const ih = d.paraH(item, CW-14, 9.5, 13);
    d.para(ML+12, d.y+1, item, CW-14, 9.5, 'normal', C.black, 13);
    d.y += Math.max(ih+3, 10);
  });

  d.gap(8);
  const blH = 28;
  d.ensure(blH+4);
  d.rect(ML, d.y, CW, blH, C.black, null, 3);
  d.txt(ML+8, d.y+10, 'Vamos destravar esse funil juntos.', 11, 'bold', C.green);
  d.txt(ML+8, d.y+17, 'IDK Performance — Diagnóstico, mídia e processo comercial para clínicas odontológicas.', 8.5, 'normal', C.white);
  const onbDate = project?.completed_at
    ? new Date(project.completed_at).toLocaleDateString('pt-BR') : dateShort;
  d.txt(ML+8, d.y+23, `Este relatório foi gerado a partir do onboarding respondido em ${onbDate}.`, 7.5, 'normal', C.grayLight);

  // ── Salvar ──
  const safeUnit = unitName.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
  const safeDate = dateShort.replace(/\//g,'-');
  d.doc.save(`Diagnostico_${safeUnit}_${safeDate}.pdf`);
}