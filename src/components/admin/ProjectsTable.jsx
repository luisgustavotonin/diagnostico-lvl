import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  generatingAI
}) {
  const [search, setSearch] = useState('');

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

  const filteredProjects = projects.filter(p => {
    const searchLower = search.toLowerCase();
    return (
      (p.unit_name || '').toLowerCase().includes(searchLower) ||
      (p.city || '').toLowerCase().includes(searchLower) ||
      (p.cnpj || '').includes(searchLower) ||
      (p.phone || '').includes(searchLower)
    );
  });

  const getHealthBadge = (score, level) => {
    if (!score && score !== 0) return <span className="text-slate-400">-</span>;
    
    const colors = {
      'Alta': 'bg-emerald-100 text-emerald-700',
      'Média': 'bg-amber-100 text-amber-700',
      'Baixa': 'bg-red-100 text-red-700'
    };

    return (
      <Badge className={colors[level] || 'bg-slate-100 text-slate-700'}>
        {score} - {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, cidade, CNPJ ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Health Query</TableHead>
              <TableHead>Relatório Básico</TableHead>
              <TableHead>Relatório + IA</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
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
                    {project.unit_name || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {project.unit_type === 'consultorio' ? 'Consultório' : 
                     project.unit_type === 'clinica' ? 'Clínica' : '-'}
                  </TableCell>
                  <TableCell>{project.city || '-'}</TableCell>
                  <TableCell>
                    {getHealthBadge(project.health_score, project.health_level)}
                  </TableCell>
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
                    {project.status === 'IN_PROGRESS' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onOpenProject(project)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" /> Abrir e finalizar
                      </Button>
                    )}
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