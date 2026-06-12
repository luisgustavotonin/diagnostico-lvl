import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Eye, Pencil, Trash2, Printer, Sparkles, ExternalLink, Loader2 } from 'lucide-react';

export default function ProjectsTable({ 
  projects, 
  onView, 
  onEdit, 
  onDelete, 
  onPrint, 
  onGenerateAI, 
  onViewAI,
  onOpenProject,
  aiEnabled,
  generatingAI,
  onSearchChange
}) {
  const [search, setSearch] = useState('');

  const handleSearchChange = (value) => {
    setSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '-';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
    }
    return cnpj;
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return cpf;
  };

  const getDocumento = (project) => {
    const tipoRaw = project.unit_type || project.answers_json?.tipo_unidade || project.answers_json?.unit_name || '';
    const isClinica = /cl[ií]nica/i.test(tipoRaw) || tipoRaw === 'clinica';
    
    if (isClinica) {
      const cnpj = project.cnpj || project.answers_json?.cnpj || '';
      return formatCNPJ(cnpj);
    } else {
      const cpf = project.cpf || project.answers_json?.cpf || '';
      return formatCPF(cpf);
    }
  };

  const filteredProjects = projects.filter(p => {
    // Filtrar apenas projetos salvos (IN_PROGRESS ou COMPLETED)
    if (p.status === 'DRAFT') return false;
    return true;
  });



  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, cidade, CNPJ ou telefone..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="min-w-[100px]">Data</TableHead>
              <TableHead className="min-w-[250px]">Nome</TableHead>
              <TableHead className="min-w-[180px]">CPF/CNPJ</TableHead>
              <TableHead className="min-w-[150px]">Cidade</TableHead>
              <TableHead className="min-w-[140px]">Relatório Básico</TableHead>
              <TableHead className="min-w-[140px]">Relatório + IA</TableHead>
              <TableHead className="min-w-[200px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Nenhum projeto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-slate-50">
                  <TableCell className="text-sm">
                    {format(
                      new Date(project.completed_at || project.created_date),
                      'dd/MM/yyyy',
                      { locale: ptBR }
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {project.unit_type === 'consultorio' 
                      ? (project.answers_json?.nome_consultorio || project.unit_name || '-')
                      : (project.answers_json?.nome_fantasia || project.unit_name || '-')
                    }
                  </TableCell>
                  <TableCell>{getDocumento(project)}</TableCell>
                  <TableCell>{project.city || '-'}</TableCell>
                  <TableCell>
                    {project.report_basic_text ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(project)}>
                            <Eye className="w-4 h-4 mr-2" /> Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(project)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrint(project, 'basic')}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(project)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!aiEnabled ? (
                      <span className="text-slate-400 text-xs">Geração desativada</span>
                    ) : project.ai_report_status === 'READY' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewAI(project)}>
                            <Eye className="w-4 h-4 mr-2" /> Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(project, 'ai')}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrint(project, 'ai')}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : project.ai_report_status === 'GENERATING' || generatingAI === project.id ? (
                      <Button variant="ghost" size="sm" disabled>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </Button>
                    ) : project.status === 'COMPLETED' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onGenerateAI(project)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" /> Gerar
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {project.status === 'IN_PROGRESS' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onOpenProject(project)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Abrir e finalizar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(project)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(project)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(project)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}