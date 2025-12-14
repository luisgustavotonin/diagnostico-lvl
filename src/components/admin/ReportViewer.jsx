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
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    
    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${project?.unit_name || 'Relatório'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            h1 { font-size: 24px; margin-bottom: 20px; color: #0f172a; }
            h2 { font-size: 18px; margin: 24px 0 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            h3 { font-size: 16px; margin: 16px 0 8px; color: #475569; }
            p { margin-bottom: 12px; }
            strong { color: #334155; }
            ul, ol { margin: 12px 0; padding-left: 24px; }
            li { margin-bottom: 6px; }
            .header { 
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .unit-name { font-size: 14px; color: #64748b; margin-top: 4px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="unit-name">${project?.unit_name || 'Unidade não identificada'}</div>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
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