import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Download, Eye, Save, X, Globe, User, Percent, HelpCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ContractEngine } from '@/services/ContractEngine';
import { DEFAULT_TEMPLATES } from '@/services/templates/defaultTemplates';
import { Imveis } from '@/entities';

interface PropertyAuthorizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Partial<Imveis>;
    onSuccess: () => void;
}

export default function PropertyAuthorizationModal({ isOpen, onClose, property, onSuccess }: PropertyAuthorizationModalProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    
    // Form fields
    const [ownerName, setOwnerName] = useState(property.nomeProprietario || '');
    const [ownerCpf, setOwnerCpf] = useState('');
    const [ownerRg, setOwnerRg] = useState('');
    const [ownerNationality, setOwnerNationality] = useState('brasileiro');
    const [ownerMaritalStatus, setOwnerMaritalStatus] = useState('solteiro');
    const [ownerProfession, setOwnerProfession] = useState('');
    const [ownerAddress, setOwnerAddress] = useState('');
    
    const [finalidade, setFinalidade] = useState(property.pretensao || 'Venda');
    const [exclusividade, setExclusividade] = useState(false);
    const [comissaoPercentual, setComissaoPercentual] = useState('6%');
    const [comissaoLocacao, setComissaoLocacao] = useState('1 aluguel');
    
    const [previewContent, setPreviewContent] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch templates to find the database version of the template if it exists
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoadingTemplates(true);
                const res = await fetch('/api/v1/contract-templates');
                if (res.ok) {
                    const json = await res.json();
                    setTemplates(json.items || []);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    // Live preview generator
    useEffect(() => {
        if (!isOpen) return;

        // Find the right template
        const dbTemplate = templates.find(t => (t.tipoOperacao === 'AutorizacaoDivulgacao' || t.contractType === 'AutorizacaoDivulgacao') && (t.ativo || t.isActive));
        const templateRaw = dbTemplate?.conteudoHtml || dbTemplate?.templateBody || DEFAULT_TEMPLATES.AutorizacaoDivulgacao;

        // Construct owner address
        const propAddress = [
            property.logradouro || property.enderecoRua,
            property.numero ? `nº ${property.numero}` : '',
            property.complemento || property.enderecoComplemento,
            property.bairro || property.enderecoBairro,
            property.cidade || property.enderecoCidade,
            property.estado || property.enderecoEstado,
        ].filter(Boolean).join(', ');

        const clientData = {
            _id: 'temp_owner',
            name: ownerName,
            clientName: ownerName,
            cpfCnpj: ownerCpf,
            document: ownerCpf,
            rg: ownerRg,
            nationality: ownerNationality,
            maritalStatus: ownerMaritalStatus,
            profession: ownerProfession,
            address: ownerAddress,
            gender: 'Masculino' as const // generic fallback
        };

        const extraData = {
            LOCADORES_IDS: ['temp_owner'],
            PARTICIPANT_DETAILS: {
                'temp_owner': {
                    name: ownerName,
                    cpf: ownerCpf,
                    rg: ownerRg,
                    nationality: ownerNationality,
                    maritalStatus: ownerMaritalStatus,
                    profession: ownerProfession,
                    address: ownerAddress,
                }
            },
            FINALIDADE: finalidade,
            MATRICULA: 'sob consulta',
            OPCIONAIS: {
                EXCLUSIVIDADE: exclusividade
            },
            DATA_DOCUMENTO: new Date().toLocaleDateString('pt-BR'),
            CIDADE_ASSINATURA: 'Poá',
            CONTRACT_TYPE: 'AutorizacaoDivulgacao'
        };

        // Render via ContractEngine
        // MapEntitiesToData(atendimento, clientes, imovel, extraData, contractType)
        const mappedData = ContractEngine.mapEntitiesToData(
            null, // no atendimento
            [clientData], // clientes list
            {
                ...property,
                enderecoRua: property.logradouro || property.enderecoRua,
                numero: property.numero,
                enderecoBairro: property.bairro || property.enderecoBairro,
                enderecoCidade: property.cidade || property.enderecoCidade,
                enderecoEstado: property.estado || property.enderecoEstado,
                cep: property.cep
            }, // imovel
            extraData, // extraData
            'AutorizacaoDivulgacao'
        );

        // Customize comissao text in rendered preview
        const comissaoText = finalidade.toLowerCase().includes('loc') 
            ? comissaoLocacao 
            : comissaoPercentual;
            
        // Overrides
        mappedData.COMISSAO_PERSONALIZADA = comissaoText;

        const rendered = ContractEngine.renderContract(templateRaw, mappedData);
        
        // Dynamically replace comissao text if default comissao text exists in template
        let customRendered = rendered.replace(
            /6% \(seis por cento\) do valor total da venda, ou o valor correspondente a 1 \(um\) aluguel integral/g,
            comissaoText
        );
        
        setPreviewContent(customRendered);
    }, [
        isOpen,
        templates,
        ownerName,
        ownerCpf,
        ownerRg,
        ownerNationality,
        ownerMaritalStatus,
        ownerProfession,
        ownerAddress,
        finalidade,
        exclusividade,
        comissaoPercentual,
        comissaoLocacao,
        property
    ]);

    // PDF Geração & Quebra de página
    const generatePDF = async () => {
        const parserContainer = document.createElement('div');
        parserContainer.innerHTML = previewContent;
        
        // Setup images for cross-origin
        const images = parserContainer.querySelectorAll('img');
        images.forEach(img => img.setAttribute('crossorigin', 'anonymous'));

        const pages: HTMLElement[] = [];
        let currentPage = document.createElement('div');

        const setupPageStyles = (page: HTMLElement, forMeasurement = false) => {
            page.style.width = '794px';
            if (forMeasurement) {
                page.style.height = 'auto';
                page.style.minHeight = '0px';
                page.style.maxHeight = 'none';
            } else {
                page.style.height = '1122px';
                page.style.minHeight = '1122px';
                page.style.maxHeight = '1122px';
            }
            page.style.padding = '65px 70px 75px 70px';
            page.style.boxSizing = 'border-box';
            page.style.background = 'white';
            page.style.position = 'relative';
            page.style.overflow = 'hidden';
            page.style.display = 'block';
            page.style.fontFamily = 'Arial, sans-serif';
            page.style.color = '#333';
        };

        setupPageStyles(currentPage, true);
        document.body.appendChild(currentPage);

        const flattenHTMLNode = (node: Node): HTMLElement[] => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (!node.textContent?.trim()) return [];
                const span = document.createElement('span');
                span.textContent = node.textContent;
                return [span];
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return [];
            
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();
            const isFlex = el.style?.display === 'flex';
            const isKeepTogether = el.classList?.contains('keep-together');
            const isLeafBlock = isFlex || isKeepTogether || ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'ul', 'ol'].includes(tagName);
            
            const childrenArr = Array.from(el.childNodes);
            const hasBlockChildren = childrenArr.some(child => {
                if (child.nodeType !== Node.ELEMENT_NODE) return false;
                const childTag = (child as HTMLElement).tagName.toLowerCase();
                return ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'ul', 'ol', 'div'].includes(childTag);
            });
            
            if (isLeafBlock || !hasBlockChildren) {
                return [el.cloneNode(true) as HTMLElement];
            }
            
            const result: HTMLElement[] = [];
            for (const child of childrenArr) {
                const flattened = flattenHTMLNode(child);
                for (const flatChild of flattened) {
                    const parentClone = el.cloneNode(false) as HTMLElement;
                    parentClone.style.marginTop = '0px';
                    parentClone.style.marginBottom = '0px';
                    parentClone.style.paddingTop = '0px';
                    parentClone.style.paddingBottom = '0px';
                    parentClone.style.border = 'none';
                    parentClone.appendChild(flatChild);
                    result.push(parentClone);
                }
            }
            return result;
        };

        const flatElements: HTMLElement[] = [];
        Array.from(parserContainer.childNodes).forEach(node => {
            flatElements.push(...flattenHTMLNode(node));
        });

        for (const child of flatElements) {
            const clone = child.cloneNode(true);
            currentPage.appendChild(clone);
            
            if (currentPage.scrollHeight > 1020 && currentPage.childNodes.length > 1) {
                currentPage.removeChild(clone);
                document.body.removeChild(currentPage);
                setupPageStyles(currentPage, false);
                pages.push(currentPage);
                
                currentPage = document.createElement('div');
                setupPageStyles(currentPage, true);
                document.body.appendChild(currentPage);
                currentPage.appendChild(clone);
            }
        }

        document.body.removeChild(currentPage);
        setupPageStyles(currentPage, false);
        pages.push(currentPage);

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        for (let i = 0; i < pages.length; i++) {
            const pageContainer = pages[i];
            
            // Header
            const header = document.createElement('div');
            header.style.position = 'absolute';
            header.style.top = '20px';
            header.style.left = '70px';
            header.style.right = '70px';
            header.style.borderBottom = '1px solid #f1f5f9';
            header.style.paddingBottom = '5px';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.fontSize = '9px';
            header.style.color = '#94a3b8';
            header.style.fontWeight = 'bold';
            header.style.textTransform = 'uppercase';
            header.innerHTML = `<span>R.Sales Imóveis</span><span>Autorização de Divulgação</span>`;
            pageContainer.appendChild(header);

            // Footer
            const footer = document.createElement('div');
            footer.style.position = 'absolute';
            footer.style.bottom = '20px';
            footer.style.left = '70px';
            footer.style.right = '70px';
            footer.style.borderTop = '1px solid #f1f5f9';
            footer.style.paddingTop = '5px';
            footer.style.display = 'flex';
            footer.style.justifyContent = 'space-between';
            footer.style.fontSize = '9px';
            footer.style.color = '#94a3b8';
            footer.innerHTML = `<span>Autorização - Código: ${property.codImovel || ''}</span><span>Página ${i + 1} de ${pages.length}</span>`;
            pageContainer.appendChild(footer);

            document.body.appendChild(pageContainer);
            await new Promise(resolve => setTimeout(resolve, 80));

            const canvas = await html2canvas(pageContainer, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                windowWidth: 800,
                backgroundColor: '#ffffff'
            });
            
            document.body.removeChild(pageContainer);
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            
            if (i > 0) pdf.addPage();
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        return pdf;
    };

    const handleSave = async (download = false) => {
        if (!ownerName) {
            toast.error('Preencha o Nome do Proprietário.');
            return;
        }

        setIsSaving(true);
        try {
            // Find template ID or use seeded default
            const dbTemplate = templates.find(t => (t.tipoOperacao === 'AutorizacaoDivulgacao' || t.contractType === 'AutorizacaoDivulgacao'));
            if (!dbTemplate) {
                throw new Error('Template "AutorizacaoDivulgacao" não encontrado no sistema.');
            }

            // Generate PDF URL (Data URI string)
            const pdfObj = await generatePDF();
            const pdfBase64 = pdfObj.output('datauristring');

            if (download) {
                pdfObj.save(`Autorizacao_Divulgacao_${property.codImovel || 'Imovel'}.pdf`);
            }

            // Save in DB
            const res = await fetch('/api/v1/generated-contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: property._id,
                    templateId: dbTemplate.id || dbTemplate._id,
                    nomeDocumento: `Autorizacao_Divulgacao_${property.codImovel}_v${Date.now().toString().slice(-4)}`,
                    conteudoFinalHtml: previewContent,
                    status: 'GERADO'
                })
            });

            if (!res.ok) {
                throw new Error('Erro ao salvar no banco de dados.');
            }

            toast.success('Autorização de Divulgação gerada com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving authorization:', error);
            toast.error(error.message || 'Erro ao gerar documento.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 bg-background overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/10 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="font-heading text-xl text-primary flex items-center gap-2">
                            <Globe className="w-5 h-5 text-secondary" />
                            Gerador de Autorização de Divulgação
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">Imóvel Código: <strong className="font-mono text-secondary">{property.codImovel}</strong></p>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Left Panel: Form */}
                    <div className="w-1/2 p-6 overflow-y-auto border-r space-y-6 bg-slate-50/50">
                        {/* Session 1: Owner */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <User className="w-4 h-4 text-secondary" />
                                <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Dados do Proprietário</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Nome Completo</Label>
                                    <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="h-9" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">CPF / CNPJ</Label>
                                    <Input value={ownerCpf} onChange={(e) => setOwnerCpf(e.target.value)} placeholder="000.000.000-00" className="h-9" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">RG</Label>
                                    <Input value={ownerRg} onChange={(e) => setOwnerRg(e.target.value)} className="h-9" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Nacionalidade</Label>
                                    <Input value={ownerNationality} onChange={(e) => setOwnerNationality(e.target.value)} className="h-9" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Estado Civil</Label>
                                    <Input value={ownerMaritalStatus} onChange={(e) => setOwnerMaritalStatus(e.target.value)} className="h-9" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Profissão</Label>
                                    <Input value={ownerProfession} onChange={(e) => setOwnerProfession(e.target.value)} className="h-9" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Endereço de Residência</Label>
                                    <Input value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade - UF" className="h-9" />
                                </div>
                            </div>
                        </div>

                        {/* Session 2: Marketing & Comissao */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Percent className="w-4 h-4 text-secondary" />
                                <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Comercialização</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Finalidade</Label>
                                    <Select value={finalidade} onValueChange={setFinalidade}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Venda">Venda</SelectItem>
                                            <SelectItem value="Locacao">Locação</SelectItem>
                                            <SelectItem value="Venda e Locacao">Venda e Locação</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <Checkbox id="exclusividade" checked={exclusividade} onCheckedChange={(c) => setExclusividade(!!c)} />
                                    <Label htmlFor="exclusividade" className="text-xs font-semibold cursor-pointer">Exclusividade por 90 dias</Label>
                                </div>

                                {finalidade !== 'Locacao' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">Comissão de Venda</Label>
                                        <Input value={comissaoPercentual} onChange={(e) => setComissaoPercentual(e.target.value)} placeholder="Ex: 6%" className="h-9" />
                                    </div>
                                )}

                                {finalidade !== 'Venda' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">Comissão de Locação</Label>
                                        <Input value={comissaoLocacao} onChange={(e) => setComissaoLocacao(e.target.value)} placeholder="Ex: 1 aluguel" className="h-9" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Live Preview */}
                    <div className="w-1/2 p-6 flex flex-col h-full bg-slate-200">
                        <div className="flex items-center justify-between mb-3 text-slate-700">
                            <span className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                                <Eye className="w-4 h-4 text-slate-500" />
                                Pré-visualização do Documento
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Ajusta dinamicamente</span>
                        </div>
                        <div className="flex-1 bg-white border rounded-2xl shadow-inner overflow-hidden p-1">
                            <ScrollArea className="h-full bg-white p-8">
                                {loadingTemplates ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-2 py-20">
                                        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
                                        <span className="text-xs text-muted-foreground">Carregando templates...</span>
                                    </div>
                                ) : (
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: previewContent }} 
                                        className="prose prose-sm max-w-none text-left"
                                    />
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/5" onClick={() => handleSave(true)} disabled={isSaving || loadingTemplates}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Gerando PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Salvar e Baixar PDF
                            </>
                        )}
                    </Button>
                    <Button onClick={() => handleSave(false)} disabled={isSaving || loadingTemplates}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Documento
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
