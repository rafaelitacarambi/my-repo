import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Wand2, Save, X, Code, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Grupos de variáveis pré-definidas para facilitar a inserção
const VARIABLE_GROUPS = [
    {
        name: 'Locador (Proprietário)',
        vars: [
            { id: 'locador.nome', label: 'Nome Completo' },
            { id: 'locador.cpf', label: 'CPF' },
            { id: 'locador.rg', label: 'RG' },
            { id: 'locador.nacionalidade', label: 'Nacionalidade' },
            { id: 'locador.estado_civil', label: 'Estado Civil' },
            { id: 'locador.profissao', label: 'Profissão' },
            { id: 'locador.endereco', label: 'Endereço Residencial' }
        ]
    },
    {
        name: 'Locatário (Inquilino)',
        vars: [
            { id: 'locatario.nome', label: 'Nome Completo' },
            { id: 'locatario.cpf', label: 'CPF' },
            { id: 'locatario.rg', label: 'RG' },
            { id: 'locatario.nacionalidade', label: 'Nacionalidade' },
            { id: 'locatario.estado_civil', label: 'Estado Civil' },
            { id: 'locatario.profissao', label: 'Profissão' },
            { id: 'locatario.endereco', label: 'Endereço Atual' }
        ]
    },
    {
        name: 'Imóvel',
        vars: [
            { id: 'imovel.endereco_completo', label: 'Endereço Completo' },
            { id: 'imovel.tipo', label: 'Tipo (Casa, Apto)' },
            { id: 'imovel.matricula', label: 'Matrícula' },
            { id: 'imovel.iptu', label: 'Inscrição Municipal (IPTU)' },
            { id: 'imovel.descricao', label: 'Descrição/Características' }
        ]
    },
    {
        name: 'Contrato & Valores',
        vars: [
            { id: 'contrato.valor_aluguel', label: 'Valor do Aluguel (Numérico)' },
            { id: 'contrato.valor_aluguel_extenso', label: 'Valor do Aluguel (Extenso)' },
            { id: 'contrato.prazo_meses', label: 'Prazo em Meses' },
            { id: 'contrato.data_inicio', label: 'Data de Início' },
            { id: 'contrato.data_fim', label: 'Data de Término' },
            { id: 'contrato.dia_vencimento', label: 'Dia de Vencimento' },
            { id: 'contrato.indice_reajuste', label: 'Índice de Reajuste (Ex: IGP-M)' },
            { id: 'contrato.cidade_foro', label: 'Cidade do Foro' }
        ]
    },
    {
        name: 'Garantia (Se aplicável)',
        vars: [
            { id: 'garantia.fiador_nome', label: 'Nome do Fiador' },
            { id: 'garantia.fiador_cpf', label: 'CPF do Fiador' },
            { id: 'garantia.caucao_valor', label: 'Valor da Caução' },
            { id: 'garantia.seguradora_nome', label: 'Nome da Seguradora' }
        ]
    }
];

interface TemplateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: any;
    onSave: () => void;
}

export function TemplateEditorModal({ isOpen, onClose, template, onSave }: TemplateEditorModalProps) {
    const isEditing = !!template;
    
    const [formData, setFormData] = useState({
        nome: template?.nome || '',
        categoria: template?.categoria || 'LOCACAO',
        tipoOperacao: template?.tipoOperacao || '',
        subtipo: template?.subtipo || '',
        garantia: template?.garantia || '',
        ativo: template?.ativo ?? true,
    });

    const [htmlContent, setHtmlContent] = useState(template?.conteudoHtml || '');
    const [variaveisDetectadas, setVariaveisDetectadas] = useState<string[]>(template?.variaveisDetectadas || []);
    const [activeTab, setActiveTab] = useState('editor');
    const [isSaving, setIsSaving] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // Detectar variáveis sempre que o HTML mudar
    useEffect(() => {
        const matches = htmlContent.match(/\{\{([^}]+)\}\}/g) || [];
        const unique = [...new Set(matches.map((m: string) => m.replace(/[{}]/g, '').trim()))];
        setVariaveisDetectadas(unique);
    }, [htmlContent]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de 5MB para teste
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Limite de 5MB.");
            return;
        }

        setErrorMessage('');
        setIsParsing(true);
        try {
            console.log("Iniciando upload de:", file.name, file.type, file.size);
            const formData = new FormData();
            formData.append('file', file);
            
            console.log("Enviando requisição...");
            const response = await fetch('/api/v1/contract-templates/parse-document', {
                method: 'POST',
                // Não precisa de cabeçalho Content-Type, o fetch configura automaticamente para multipart/form-data
                body: formData
            });

            console.log("Resposta recebida com status:", response.status);
            const data = await response.json();
            console.log("Corpo da resposta:", data);
            
            if (response.ok && data.success) {
                // Adiciona o conteúdo novo ao final ou substitui se estiver vazio
                setHtmlContent(prev => prev ? `${prev}<br/><br/>${data.htmlContent}` : data.htmlContent);
                toast.success('Documento processado com sucesso!');
                setActiveTab('preview');
            } else {
                setErrorMessage(data.error || 'Falha ao processar arquivo');
                toast.error(data.error || 'Falha ao processar arquivo');
            }
        } catch (error: any) {
            console.error("Erro no fetch:", error);
            setErrorMessage(error.message || 'Erro na comunicação com o servidor');
            toast.error('Erro na comunicação com o servidor');
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const insertVariable = (varId: string) => {
        const tag = `{{${varId}}}`;
        if (editorRef.current) {
            const start = editorRef.current.selectionStart;
            const end = editorRef.current.selectionEnd;
            const text = htmlContent;
            const newText = text.substring(0, start) + tag + text.substring(end);
            setHtmlContent(newText);
            
            // Focar de volta no textarea
            setTimeout(() => {
                editorRef.current?.focus();
                editorRef.current?.setSelectionRange(start + tag.length, start + tag.length);
            }, 0);
        } else {
            setHtmlContent(prev => prev + tag);
        }
    };

    const handleSave = async () => {
        if (!formData.nome || !htmlContent) {
            toast.error('Nome e conteúdo do template são obrigatórios');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                conteudoHtml: htmlContent,
                variaveisDetectadas,
                versao: isEditing ? (template.versao || 1) + 1 : 1
            };

            const url = isEditing ? `/api/v1/contract-templates/${template.id}` : '/api/v1/contract-templates';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Falha ao salvar');
            }

            toast.success(isEditing ? 'Template atualizado!' : 'Template criado com sucesso!');
            onSave();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error.message || 'Erro ao salvar template');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-200">
                    <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {isEditing ? <Edit2 className="w-6 h-6 text-emerald-600" /> : <FileText className="w-6 h-6 text-emerald-600" />}
                        {isEditing ? 'Editar Template de Contrato' : 'Novo Template de Contrato'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                    {/* Left Column - Form & Variables */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800">Configurações Básicas</h3>
                            
                            <div className="space-y-2">
                                <Label>Nome do Modelo *</Label>
                                <Input 
                                    value={formData.nome} 
                                    onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                                    placeholder="Ex: Contrato Locação Residencial"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOCACAO">Locação</SelectItem>
                                            <SelectItem value="VENDA">Venda</SelectItem>
                                            <SelectItem value="OUTROS">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Garantia Exigida</Label>
                                    <Select value={formData.garantia} onValueChange={(v) => setFormData({...formData, garantia: v})}>
                                        <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nenhuma">Nenhuma / Genérico</SelectItem>
                                            <SelectItem value="CAUCAO">Caução</SelectItem>
                                            <SelectItem value="FIADOR">Fiador</SelectItem>
                                            <SelectItem value="SEGURO_FIANCA">Seguro Fiança</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-450px)]">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Wand2 className="w-4 h-4 text-emerald-500" /> Variáveis Mágicas
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Clique para inserir no texto. Elas serão substituídas automaticamente na geração.
                            </p>
                            
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-6">
                                    {VARIABLE_GROUPS.map((group, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{group.name}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {group.vars.map(v => (
                                                    <Badge 
                                                        key={v.id} 
                                                        variant="outline" 
                                                        className="cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                                                        onClick={() => insertVariable(v.id)}
                                                    >
                                                        {v.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Right Column - Editor */}
                    <div className="w-full md:w-2/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center border-b border-slate-100 bg-slate-50/50 p-2 px-4">
                                <TabsList className="bg-slate-200/50">
                                    <TabsTrigger value="editor" className="gap-2"><Code className="w-4 h-4" /> Código HTML</TabsTrigger>
                                    <TabsTrigger value="preview" className="gap-2"><Eye className="w-4 h-4" /> Visualização</TabsTrigger>
                                </TabsList>
                                
                                <div>
                                    <input 
                                        type="file" 
                                        accept=".docx,.pdf" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isParsing}
                                    >
                                        {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {isParsing ? 'Processando...' : 'Importar DOCX / PDF'}
                                    </Button>
                                </div>
                            </div>
                            
                            {errorMessage && (
                                <div className="bg-red-50 text-red-600 p-3 text-sm border-b border-red-100 flex items-center justify-between">
                                    <span><strong>Erro:</strong> {errorMessage}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setErrorMessage('')} className="h-6 px-2 text-red-600 hover:bg-red-100">Limpar</Button>
                                </div>
                            )}
                            
                            <TabsContent value="editor" className="flex-1 m-0 p-0 relative">
                                <Textarea 
                                    ref={editorRef}
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                    className="w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 p-6 font-mono text-sm bg-slate-900 text-slate-100"
                                    placeholder="Cole ou digite o HTML do contrato aqui. Use o botão acima para importar um arquivo Word (.docx)."
                                />
                            </TabsContent>
                            
                            <TabsContent value="preview" className="flex-1 m-0 overflow-y-auto p-8 bg-slate-200/50">
                                <div className="max-w-3xl mx-auto bg-white p-12 min-h-[800px] shadow-lg rounded-sm border border-slate-200 text-slate-800 contract-preview prose prose-slate max-w-none">
                                    {htmlContent ? (
                                        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                    ) : (
                                        <div className="text-center text-slate-400 mt-20">Nenhum conteúdo para visualizar.</div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                        
                        {/* Status Bar */}
                        <div className="bg-slate-50 border-t border-slate-100 p-3 px-6 flex justify-between items-center text-xs text-slate-500">
                            <div className="flex gap-4">
                                <span>Caracteres: {htmlContent.length}</span>
                                <span className="flex items-center gap-1">
                                    Variáveis Mapeadas: 
                                    <Badge variant="secondary" className="h-5 text-[10px]">{variaveisDetectadas.length}</Badge>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-slate-200">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button 
                        onClick={handleSave} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[120px]"
                        disabled={isSaving || !formData.nome || !htmlContent}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
