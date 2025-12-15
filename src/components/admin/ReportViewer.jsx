import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from 'lucide-react';

export default function ReportViewer({ open, onClose, project, type }) {
  const printRef = useRef(null);

  const content = type === 'ai' ? project?.ai_report_text : project?.report_basic_text;
  const title = type === 'ai' ? 'Relatório + Diagnóstico IA' : 'Relatório Básico';

  const handlePrint = () => {
    let reportContent = type === 'ai' ? project.ai_report_text : project.report_basic_text;
    
    // Se mode combinado e relatório básico, incluir IA
    const aiReportMode = localStorage.getItem('ai_report_mode') || 'separate';
    if (type === 'basic' && aiReportMode === 'combined' && project.ai_report_text) {
      reportContent += '\n\n---\n\n## DIAGNÓSTICO COM INTELIGÊNCIA ARTIFICIAL\n\n' + project.ai_report_text;
    }
    
    const reportTitle = type === 'ai' ? 'Diagnóstico Estratégico Completo' : 'Relatório de Onboarding';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório - ${project.unit_name || 'Projeto'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              color: #1e293b;
              background: #f8fafc;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
              color: white;
              padding: 60px 60px 50px;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -10%;
              width: 500px;
              height: 500px;
              background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
              border-radius: 50%;
            }
            .header::after {
              content: '📊';
              position: absolute;
              bottom: 20px;
              right: 40px;
              font-size: 80px;
              opacity: 0.2;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 12px;
              position: relative;
              z-index: 1;
            }
            .header .subtitle {
              font-size: 18px;
              opacity: 0.9;
              font-weight: 400;
              position: relative;
              z-index: 1;
            }
            .meta-info {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              padding: 35px 60px;
              border-left: 6px solid #3b82f6;
              box-shadow: inset 0 2px 4px rgba(59, 130, 246, 0.05);
            }
            .meta-info .row {
              display: flex;
              gap: 50px;
              flex-wrap: wrap;
            }
            .meta-info .item {
              margin-bottom: 12px;
            }
            .meta-info .label {
              font-size: 12px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .meta-info .value {
              font-size: 16px;
              color: #1e293b;
              font-weight: 600;
            }
            .content {
              padding: 50px 60px;
            }
            h1 {
              color: #1e293b;
              font-size: 28px;
              font-weight: 700;
              margin: 30px 0 16px 0;
              padding-bottom: 10px;
              border-bottom: 3px solid #3b82f6;
            }
            h1:first-child {
              margin-top: 0;
            }
            h2 {
              color: #1e40af;
              font-size: 22px;
              font-weight: 600;
              margin: 28px 0 14px 0;
              padding-left: 20px;
              border-left: 5px solid #60a5fa;
              background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
              padding: 12px 20px;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.08);
            }
            h2::before {
              content: '▸ ';
              color: #3b82f6;
              font-weight: bold;
            }
            h3 {
              color: #475569;
              font-size: 18px;
              font-weight: 600;
              margin: 20px 0 10px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #e2e8f0;
            }
            p {
              margin: 8px 0;
              color: #334155;
              font-size: 15px;
            }
            strong, b {
              color: #1e293b;
              font-weight: 600;
            }
            ul, ol {
              margin: 12px 0;
              padding-left: 30px;
            }
            li {
              margin: 6px 0;
              color: #334155;
              padding-left: 8px;
            }
            ul li::marker {
              color: #3b82f6;
              font-weight: bold;
            }
            blockquote {
              border-left: 4px solid #60a5fa;
              padding-left: 20px;
              margin: 20px 0;
              font-style: italic;
              color: #475569;
              background: #f8fafc;
              padding: 16px 20px;
              border-radius: 4px;
            }
            .health-badge {
              display: inline-block;
              padding: 10px 18px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border-radius: 24px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            .footer {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 35px 60px;
              margin-top: 60px;
              border-top: 3px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 13px;
              position: relative;
            }
            .footer::before {
              content: '◆';
              display: block;
              color: #3b82f6;
              font-size: 24px;
              margin-bottom: 15px;
            }
            .footer::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #3b82f6 0%, #1e40af 50%, #3b82f6 100%);
            }
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
              h1 { page-break-after: avoid; }
              h2, h3 { page-break-after: avoid; }
              ul, ol { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${reportTitle}</h1>
              <div class="subtitle">${project.unit_name || 'Unidade'}</div>
            </div>
            
            <div class="meta-info">
              <div class="row">
                <div class="item">
                  <div class="label">Unidade</div>
                  <div class="value">${project.unit_name || 'Não informado'}</div>
                </div>
                <div class="item">
                  <div class="label">Tipo</div>
                  <div class="value">${project.unit_type === 'consultorio' ? 'Consultório' : 'Clínica'}</div>
                </div>
                <div class="item">
                  <div class="label">Cidade</div>
                  <div class="value">${project.city || 'Não informada'}</div>
                </div>
                ${project.health_score ? `
                <div class="item">
                  <div class="label">Health Score</div>
                  <div class="value">
                    <span class="health-badge">${project.health_score}/100 - ${project.health_level}</span>
                  </div>
                </div>
                ` : ''}
                <div class="item">
                  <div class="label">Data</div>
                  <div class="value">${new Date(project.completed_at || project.created_date).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </div>
            
            <div class="content">
              ${reportContent ? reportContent.split('\n').map(line => {
                line = line.trim();
                if (line.startsWith('# ')) return '<h1>' + line.slice(2) + '</h1>';
                if (line.startsWith('## ')) return '<h2>' + line.slice(3) + '</h2>';
                if (line.startsWith('### ')) return '<h3>' + line.slice(4) + '</h3>';
                if (line.startsWith('**') && line.endsWith('**')) return '<p><strong>' + line.slice(2, -2) + '</strong></p>';
                if (line.startsWith('- ')) return '<li>' + line.slice(2) + '</li>';
                if (line === '---') return '<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">';
                return line ? '<p>' + line + '</p>' : '<br>';
              }).join('') : '<p>Sem conteúdo</p>'}
            </div>
            
            <div class="footer">
              <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
              <p style="margin-top: 8px; font-size: 11px; color: #94a3b8;">© ${new Date().getFullYear()} - Todos os direitos reservados</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
          {project?.unit_name && (
            <p className="text-sm text-slate-500">{project.unit_name}</p>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2" ref={printRef}>
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 pb-2 border-b">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-3 text-slate-700">{children}</p>,
                strong: ({ children }) => <strong className="text-slate-800">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-700">{children}</li>,
              }}
            >
              {content || 'Nenhum conteúdo disponível'}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}