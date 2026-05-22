import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    FileText,
    Search,
    Filter,
    Edit2,
    Trash2,
    Copy,
    CheckCircle,
    XCircle,
    Loader2,
    Settings,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { BaseCrudService } from '@/integrations';
import AdminLayout from '@/components/layouts/AdminLayout';
import { TemplateEditorModal } from '@/components/admin/contracts/TemplateEditorModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractTemplate {
    id: string;
    nome: string;
    categoria: string;
    tipoOperacao?: string;
    subtipo?: string;
    garantia?: string;
    conteudoHtml: string;
    variaveisDetectadas: string[];
    ativo: boolean;
    versao: number;
    createdAt: string;
    updatedAt: string;
}

export default function ContractTemplatesPage() {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            // Using the Next.js API endpoint directly
            const response = await fetch('/api/v1/contract-templates');
            if (!response.ok) throw new Error('Falha ao buscar templates');
            const data = await response.json();
            
            setTemplates(data.items || []);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Erro ao carregar templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setIsEditorOpen(true);
    };

    const handleImportFromFolder = async () => {
        setImporting(true);
        try {
            const response = await fetch('/api/v1/contract-templates/import-all');
            if (!response.ok) throw new Error('Falha ao importar modelos');
            const data = await response.json();
            
            if (data.success) {
                toast.success(`${data.importedCount} modelos de contratos importados com sucesso!`);
                loadTemplates();
            } else {
                toast.error('Erro na importação: ' + JSON.stringify(data.errors));
            }
        } catch (error: any) {
            console.error('Error importing templates:', error);
            toast.error('Erro ao importar templates: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleEdit = (template: ContractTemplate) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleToggleActive = async (template: ContractTemplate) => {
        try {
            // Assuming we will have a PUT endpoint or we can just send the updated object
            // Let's implement an update function if needed, or send via Prisma directly
            // For now, let's use the standard update if we mapped it, but wait, the API we saw only has GET and POST.
            // We need to ensure we can update! Let's update the API as well.
            const response = await fetch(`/api/v1/contract-templates/${template.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ativo: !template.ativo })
            });

            if (!response.ok) throw new Error('Falha ao atualizar');
            
            setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, ativo: !template.ativo } : t));
            toast.success(`Template ${!template.ativo ? 'ativado' : 'inativado'} com sucesso`);
        } catch (error) {
            console.error('Error toggling template:', error);
            toast.error('Erro ao atualizar status do template');
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || t.categoria === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'LOCACAO': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'VENDA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-emerald-600" />
                            Modelos de Contrato
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Gerencie os templates para geração automática de contratos no Motor Jurídico.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Button 
                            onClick={handleImportFromFolder} 
                            disabled={importing}
                            variant="outline" 
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 rounded-xl h-12 px-6 shadow-sm font-semibold"
                        >
                            {importing ? (
                                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                            ) : (
                                <Copy className="w-5 h-5 text-slate-500" />
                            )}
                            Importar Modelos da Pasta
                        </Button>
                        <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-12 px-6 shadow-sm font-semibold">
                            <Plus className="w-5 h-5" />
                            Criar Template
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Buscar template por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200 rounded-xl h-11"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['ALL', 'LOCACAO', 'VENDA', 'OUTROS'].map(cat => (
                            <Button
                                key={cat}
                                variant={filterCategory === cat ? 'default' : 'outline'}
                                onClick={() => setFilterCategory(cat)}
                                className={`rounded-xl h-11 ${filterCategory === cat ? 'bg-slate-800 text-white hover:bg-slate-700' : 'text-slate-600'}`}
                            >
                                {cat === 'ALL' ? 'Todos' : cat === 'LOCACAO' ? 'Locação' : cat === 'VENDA' ? 'Venda' : 'Outros'}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                        <p className="text-slate-500">Carregando templates...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">Nenhum template encontrado</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            Você ainda não possui templates cadastrados ou nenhum corresponde à sua busca.
                        </p>
                        <Button onClick={handleCreateNew} variant="outline" className="mt-6 gap-2 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <Plus className="w-4 h-4" /> Cadastrar Primeiro Template
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <motion.div
                                key={template.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`bg-white rounded-2xl border ${template.ativo ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 opacity-75'} shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col`}
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="outline" className={`${getCategoryColor(template.categoria)} rounded-lg border px-3 py-1 font-semibold`}>
                                            {template.categoria === 'LOCACAO' ? 'Locação' : template.categoria === 'VENDA' ? 'Venda' : 'Outros'}
                                        </Badge>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                <DropdownMenuItem onClick={() => handleEdit(template)} className="gap-2 cursor-pointer">
                                                    <Edit2 className="w-4 h-4" /> Editar Template
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleActive(template)} className="gap-2 cursor-pointer">
                                                    {template.ativo ? <XCircle className="w-4 h-4 text-orange-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />} 
                                                    {template.ativo ? 'Desativar' : 'Ativar'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{template.nome}</h3>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {template.tipoOperacao && (
                                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {template.tipoOperacao}
                                            </span>
                                        )}
                                        {template.garantia && (
                                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                                                Garantia: {template.garantia}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>Atualizado em {format(new Date(template.updatedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                                        <span className="flex items-center gap-1">
                                            v{template.versao}
                                        </span>
                                    </div>
                                </div>
                                <div className={`h-1.5 w-full ${template.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {isEditorOpen && (
                <TemplateEditorModal 
                    isOpen={isEditorOpen} 
                    onClose={() => setIsEditorOpen(false)} 
                    template={editingTemplate}
                    onSave={() => {
                        setIsEditorOpen(false);
                        loadTemplates();
                    }}
                />
            )}
        </AdminLayout>
    );
}
