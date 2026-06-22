import React, { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Imveis, UsuriosdoSistema } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Search, MapPin, Plus, FileText, Download, Eye, Globe, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import PropertyAuthorizationModal from './PropertyAuthorizationModal';

interface PropertyFormProps {
    initialData?: Partial<Imveis>;
    onSubmit: (data: Partial<Imveis>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const AMENIDADES_GRUPOS = {
    '🏠 Características do Imóvel': [
        { id: 'mobiliado', label: 'Mobiliado' },
        { id: 'dormitorioReversivel', label: 'Dormitório reversível' },
        { id: 'escritorio', label: 'Escritório' },
        { id: 'aceitaPet', label: 'Aceita pet' },
        { id: 'edicula', label: 'Edícula' },
        { id: 'despensa', label: 'Despensa' },
        { id: 'adega', label: 'Adega' },
        { id: 'lavanderia', label: 'Lavanderia' },
        { id: 'vestiario', label: 'Vestiário' },
        { id: 'closet', label: 'Closet' },
        { id: 'suiteHidro', label: 'Suíte com hidro' },
        { id: 'banheira', label: 'Banheira' },
        { id: 'peDireitoDuplo', label: 'Pé-direito duplo' },
        { id: 'homeOffice', label: 'Home office' },
        { id: 'salaEstar', label: 'Salas' },
        { id: 'cozinhaAmericana', label: 'Cozinha americana' },
        { id: 'cozinhaPlanejada', label: 'Cozinha planejada' },
        { id: 'ilha', label: 'Ilha' },
        { id: 'lareira', label: 'Lareira' },
        { id: 'arCondicionado', label: 'Ar-condicionado' },
        { id: 'aquecimentoGas', label: 'Aquecimentos' },
        { id: 'energiaSolar', label: 'Energia solar' },
        { id: 'automacao', label: 'Automação' },
        { id: 'iluminacaoLed', label: 'LED' },
        { id: 'persianas', label: 'Persianas' },
        { id: 'fechaduraEletronica', label: 'Fechadura eletrônica' },
        { id: 'deposito', label: 'Depósito' },
    ],
    '🌿 Área Externa Privativa': [
        { id: 'quintal', label: 'Quintal' },
        { id: 'jardim', label: 'Jardim' },
        { id: 'pergolado', label: 'Pergolado' },
        { id: 'espacoZen', label: 'Espaço zen' },
        { id: 'firePit', label: 'Fire pit' },
        { id: 'redario', label: 'Redário' },
        { id: 'pomar', label: 'Pomar' },
        { id: 'horta', label: 'Horta' },
        { id: 'espacoPet', label: 'Pet' },
        { id: 'canil', label: 'Canil' },
        { id: 'lounge', label: 'Lounge' },
        { id: 'gazebo', label: 'Gazebo' },
        { id: 'espacoDescanso', label: 'Descanso' },
        { id: 'solarium', label: 'Solarium' },
    ],
    '🍖 Lazer Privativo': [
        { id: 'churrasqueira', label: 'Churrasqueira' },
        { id: 'varandaGourmet', label: 'Varanda gourmet' },
        { id: 'piscina', label: 'Piscina' },
        { id: 'ofuro', label: 'Ofurô' },
        { id: 'sauna', label: 'Sauna' },
    ],
    '🏢 Condomínio / Lazer Coletivo': [
        { id: 'playground', label: 'Playground' },
        { id: 'quadraPoliesportiva', label: 'Quadras' },
        { id: 'salaoFestas', label: 'Salões' },
        { id: 'academia', label: 'Academia' },
        { id: 'piscinaCondominio', label: 'Piscinas' },
        { id: 'spa', label: 'Spa' },
        { id: 'cinema', label: 'Cinema' },
        { id: 'coworking', label: 'Coworking' },
        { id: 'biblioteca', label: 'Biblioteca' },
        { id: 'loungeCondominio', label: 'Lounges' },
    ],
    '🚗 Infraestrutura & Conveniência': [
        { id: 'vagasVisitantes', label: 'Vagas visitantes' },
        { id: 'carroEletrico', label: 'Carro elétrico' },
        { id: 'bicicletario', label: 'Bicicletário' },
        { id: 'portaria24h', label: 'Portaria' },
        { id: 'seguranca', label: 'Segurança' },
        { id: 'elevador', label: 'Elevadores' },
        { id: 'acessibilidade', label: 'Acesso PCD' },
    ],
    '🌎 Sustentabilidade & Bem-estar': [
        { id: 'coletaSeletiva', label: 'Coleta seletiva' },
        { id: 'reusoAgua', label: 'Reuso de água' },
        { id: 'captacaoChuva', label: 'Captação chuva' },
        { id: 'telhadoVerde', label: 'Telhado verde' },
        { id: 'ventilacaoCruzada', label: 'Ventilação cruzada' },
        { id: 'iluminacaoNatural', label: 'Iluminação natural' },
        { id: 'tratamentoAcustico', label: 'Tratamento acústico' },
        { id: 'isolamentoTermico', label: 'Isolamento térmico' },
    ]
};

export default function PropertyForm({ initialData, onSubmit, onCancel, isLoading }: PropertyFormProps) {
    const [data, setData] = useState<Partial<Imveis>>(initialData || {
        statusImovel: 'Ativo',
        tipoImovel: 'Apartamento',
        pretensao: 'Venda',
        finalidade: 'Residencial',
        periodicidadeIPTU: 'Anual',
        permiteFinanciamento: true,
    });

    const [activeTab, setActiveTab] = useState('basico');
    const [cepLoading, setCepLoading] = useState(false);
    const [corretores, setCorretores] = useState<UsuriosdoSistema[]>([]);
    
    // Autorizações de Divulgação States & Logic
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authorizations, setAuthorizations] = useState<any[]>([]);
    const [loadingAuths, setLoadingAuths] = useState(false);
    const [selectedAuth, setSelectedAuth] = useState<any | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const loadAuthorizations = async () => {
        const propId = initialData?._id;
        if (!propId) return;
        setLoadingAuths(true);
        try {
            const res = await fetch(`/api/v1/generated-contracts?propertyId=${propId}`);
            if (res.ok) {
                const json = await res.json();
                setAuthorizations(json.items || []);
            }
        } catch (error) {
            console.error("Error loading property authorizations:", error);
        } finally {
            setLoadingAuths(false);
        }
    };

    useEffect(() => {
        loadAuthorizations();
    }, [initialData?._id]);

    const handleDownloadPdf = async (auth: any) => {
        setDownloadingId(auth._id);
        try {
            const parserContainer = document.createElement('div');
            parserContainer.innerHTML = auth.conteudoFinalHtml;
            
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
                footer.innerHTML = `<span>Autorização - Código: ${data.codImovel || ''}</span><span>Página ${i + 1} de ${pages.length}</span>`;
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

            pdf.save(`${auth.nomeDocumento || 'Autorizacao_Divulgacao'}.pdf`);
            toast.success('PDF baixado com sucesso!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erro ao gerar arquivo PDF.');
        } finally {
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        const fetchCorretores = async () => {
            try {
                const result = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
                // Handle PaginatedResult
                const users = (result as any).data || (result as any).items || (Array.isArray(result) ? result : []);

                // Filter for active users
                setCorretores(users.filter((u: UsuriosdoSistema) => u.ativo !== false));
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchCorretores();
    }, []);

    const handleCepSearch = async () => {
        const cep = data.cep?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
            alert('CEP inválido. Digite apenas números ou formato 00000-000.');
            return;
        }
        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const addressData = await response.json();
            if (addressData.erro) {
                alert('CEP não encontrado.');
                return;
            }
            setData(prev => ({
                ...prev,
                logradouro: addressData.logradouro,
                bairro: addressData.bairro,
                cidade: addressData.localidade,
                estado: addressData.uf,
            }));
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro de conexão ao buscar CEP.');
        } finally {
            setCepLoading(false);
        }
    };

    // Helper to update fields
    const updateField = (field: keyof Imveis, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const formatCurrency = (value: number | string | undefined) => {
        if (value === undefined || value === null || value === '') return '';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(num);
    };

    const parseCurrency = (value: string): number => {
        const cleanValue = value.replace(/[^\d]/g, '');
        const num = parseInt(cleanValue) / 100;
        return isNaN(num) ? 0 : num;
    };

    const handleCurrencyChange = (field: keyof Imveis, value: string) => {
        const num = parseCurrency(value);
        updateField(field, num);
    };

    const handleNumericChange = (field: keyof Imveis, value: string) => {
        const num = parseFloat(value);
        updateField(field, isNaN(num) ? 0 : num);
    };

    const toggleCheck = (field: keyof Imveis) => {
        updateField(field, !data[field]);
    };

    const isVenda = data.pretensao?.includes('Venda');
    const isLocacao = data.pretensao?.includes('Locação') || data.pretensao?.includes('Locacao');

    return (
        <div className="flex flex-col h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                <div className="px-6 pt-6 pb-2 border-b bg-muted/20">
                    <TabsList className="grid w-full grid-cols-7 h-auto p-1">
                        <TabsTrigger value="basico" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Básico</TabsTrigger>
                        <TabsTrigger value="imovel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Imóvel</TabsTrigger>
                        <TabsTrigger value="valores" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Valores</TabsTrigger>
                        <TabsTrigger value="caracteristicas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Características</TabsTrigger>
                        <TabsTrigger value="amenidades" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Amenidades</TabsTrigger>
                        <TabsTrigger value="midia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Mídia</TabsTrigger>
                        <TabsTrigger value="interno" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">Interno</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 px-6 py-4">
                    <form id="property-form" onSubmit={(e) => { e.preventDefault(); onSubmit(data); }}>

                        {/* --- TAB BÁSICO --- */}
                        <TabsContent value="basico" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg text-primary">Status e Responsáveis</h3>
                                            {data.codImovel && (
                                                <span className="bg-primary/10 text-primary font-mono font-bold px-3 py-1 rounded-full border border-primary/20">
                                                    {data.codImovel}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status do Imóvel</Label>
                                            <Select value={data.statusImovel} onValueChange={(v) => updateField('statusImovel', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Ativo">🟢 Ativo</SelectItem>
                                                    <SelectItem value="Suspenso">🟡 Suspenso</SelectItem>
                                                    <SelectItem value="Vendido">🔴 Vendido</SelectItem>
                                                    <SelectItem value="Locado">🔵 Locado</SelectItem>
                                                    <SelectItem value="Desatualizado">⚪ Desatualizado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Corretor Captador</Label>
                                            <Select
                                                value={data.corretorResponsavelId || ''}
                                                onValueChange={(v) => updateField('corretorResponsavelId', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o captador..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {corretores.map((corretor) => (
                                                        <SelectItem key={corretor._id} value={corretor._id}>
                                                            {corretor.name || corretor.emailLogin || 'Sem Nome'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Mídia de Origem</Label>
                                            <Select value={data.midiaOrigem} onValueChange={(v) => updateField('midiaOrigem', v)}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Captacao">🕵️ Captação</SelectItem>
                                                    <SelectItem value="Indicacao">🤝 Indicação</SelectItem>
                                                    <SelectItem value="Portal">🌐 Portal</SelectItem>
                                                    <SelectItem value="Proprietario">👤 Proprietário</SelectItem>
                                                    <SelectItem value="Outros">Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Situação do Imóvel</Label>
                                            <Select value={data.situacaoImovel} onValueChange={(v) => updateField('situacaoImovel', v)}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Desocupado">Desocupado</SelectItem>
                                                    <SelectItem value="Ocupado">Ocupado</SelectItem>
                                                    <SelectItem value="Reservado">Reservado</SelectItem>
                                                    <SelectItem value="Em construção">Em construção</SelectItem>
                                                    <SelectItem value="Lançamento">Lançamento</SelectItem>
                                                    <SelectItem value="Novo">Novo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        <h3 className="font-semibold text-lg text-primary">Proprietário</h3>
                                        <div className="space-y-2">
                                            <Label>Nome do Proprietário</Label>
                                            <Input value={data.nomeProprietario || ''} onChange={(e) => updateField('nomeProprietario', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Telefone</Label>
                                            <Input value={data.telefoneProprietario || ''} onChange={(e) => updateField('telefoneProprietario', e.target.value)} placeholder="(XX) XXXXX-XXXX" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={data.emailProprietario || ''} onChange={(e) => updateField('emailProprietario', e.target.value)} type="email" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* --- TAB IMÓVEL --- */}
                        <TabsContent value="imovel" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Finalidade</Label>
                                    <Select value={data.finalidade} onValueChange={(v) => updateField('finalidade', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Residencial">Residencial</SelectItem>
                                            <SelectItem value="Comercial">Comercial</SelectItem>
                                            <SelectItem value="Industrial">Industrial</SelectItem>
                                            <SelectItem value="Rural">Rural</SelectItem>
                                            <SelectItem value="Temporada">Temporada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Imóvel</Label>
                                    <Select value={data.tipoImovel} onValueChange={(v) => updateField('tipoImovel', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Casa">Casa</SelectItem>
                                            <SelectItem value="Apartamento">Apartamento</SelectItem>
                                            <SelectItem value="Sobrado">Sobrado</SelectItem>
                                            <SelectItem value="Kitnet">Kitnet</SelectItem>
                                            <SelectItem value="Terreno">Terreno</SelectItem>
                                            <SelectItem value="Chacara">Chácara</SelectItem>
                                            <SelectItem value="Sitio">Sítio</SelectItem>
                                            <SelectItem value="Area">Área</SelectItem>
                                            <SelectItem value="Edicula">Edícula</SelectItem>
                                            <SelectItem value="Cobertura">Cobertura</SelectItem>
                                            <SelectItem value="Galpao">Galpão</SelectItem>
                                            <SelectItem value="Loja">Loja</SelectItem>
                                            <SelectItem value="Sala">Sala Comercial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Pretensão</Label>
                                    <Select value={data.pretensao} onValueChange={(v) => updateField('pretensao', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Venda">Venda</SelectItem>
                                            <SelectItem value="Locacao">Locação</SelectItem>
                                            <SelectItem value="Venda e Locacao">Venda e Locação</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <h3 className="font-semibold text-lg text-primary">Localização</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label>CEP</Label>
                                    <div className="flex gap-2">
                                        <Input value={data.cep || ''} onChange={(e) => updateField('cep', e.target.value)} placeholder="00000-000" />
                                        <Button size="icon" variant="outline" type="button" onClick={handleCepSearch} disabled={cepLoading}>
                                            {cepLoading ? <span className="animate-spin">⌛</span> : <Search className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="md:col-span-8 space-y-2">
                                    <Label>Logradouro</Label>
                                    <Input value={data.logradouro || ''} onChange={(e) => updateField('logradouro', e.target.value)} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Número</Label>
                                    <Input value={data.numero || ''} onChange={(e) => updateField('numero', e.target.value)} />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Bairro</Label>
                                    <Input value={data.bairro || ''} onChange={(e) => updateField('bairro', e.target.value)} />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Cidade</Label>
                                    <Input value={data.cidade || ''} onChange={(e) => updateField('cidade', e.target.value)} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Estado</Label>
                                    <Select value={data.estado} onValueChange={(v) => updateField('estado', v)}>
                                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                                        <SelectContent>
                                            {ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Complemento</Label>
                                    <Input value={data.complemento || ''} onChange={(e) => updateField('complemento', e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- TAB VALORES --- */}
                        <TabsContent value="valores" className="space-y-6">
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="pt-6 space-y-4">
                                    <h3 className="font-semibold text-lg text-primary">Valor Geral</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Valor do Imóvel (R$)</Label>
                                            <Input
                                                type="text"
                                                value={formatCurrency(data.price)}
                                                onChange={(e) => handleCurrencyChange('price', e.target.value)}
                                                className="font-bold text-lg border-primary/30"
                                                placeholder="R$ 0,00"
                                            />
                                            <p className="text-xs text-muted-foreground">Este valor será exibido como o preço principal do imóvel.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(isVenda || data.pretensao === 'Venda e Locacao') && (
                                    <Card className="border-green-100 bg-green-50/20">
                                        <CardContent className="pt-6 space-y-4">
                                            <h3 className="font-semibold text-lg text-green-700">Valores de Venda</h3>
                                            <div className="space-y-2">
                                                <Label>Valor de Venda (R$)</Label>
                                                <Input
                                                    type="text"
                                                    value={formatCurrency(data.precoVenda)}
                                                    onChange={(e) => handleCurrencyChange('precoVenda', e.target.value)}
                                                    className="font-bold text-lg"
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Valor Mínimo de Entrada (R$)</Label>
                                                <Input
                                                    type="text"
                                                    value={formatCurrency(data.entradaMinimaEstimada)}
                                                    onChange={(e) => handleCurrencyChange('entradaMinimaEstimada', e.target.value)}
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-2">
                                                <Checkbox checked={data.aceitaFinanciamento} onCheckedChange={() => toggleCheck('aceitaFinanciamento')} />
                                                <Label>Aceita Financiamento</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox checked={data.aceitaFgts} onCheckedChange={() => toggleCheck('aceitaFgts')} />
                                                <Label>Aceita FGTS</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox checked={data.investimentoOportunidade} onCheckedChange={() => toggleCheck('investimentoOportunidade')} />
                                                <Label>Investimento / Oportunidade</Label>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {(isLocacao || data.pretensao === 'Venda e Locacao') && (
                                    <Card className="border-blue-100 bg-blue-50/20">
                                        <CardContent className="pt-6 space-y-4">
                                            <h3 className="font-semibold text-lg text-blue-700">Valores de Locação</h3>
                                            <div className="space-y-2">
                                                <Label>Valor Aluguel (R$)</Label>
                                                <Input
                                                    type="text"
                                                    value={formatCurrency(data.precoLocacao)}
                                                    onChange={(e) => handleCurrencyChange('precoLocacao', e.target.value)}
                                                    className="font-bold text-lg"
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pacote Locação (R$)</Label>
                                                <Input
                                                    type="text"
                                                    value={formatCurrency(data.pacoteLocacao)}
                                                    onChange={(e) => handleCurrencyChange('pacoteLocacao', e.target.value)}
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        <h3 className="font-semibold text-lg text-primary">Custos Fixos</h3>

                                        <div className="flex items-center gap-2 pb-2">
                                            <Checkbox checked={data.imovelCondominio} onCheckedChange={() => toggleCheck('imovelCondominio')} />
                                            <Label className="font-semibold">Imóvel em Condomínio</Label>
                                        </div>

                                        {data.imovelCondominio && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <Label>Valor Condomínio (R$)</Label>
                                                <Input
                                                    type="text"
                                                    value={formatCurrency(data.valorCondominio)}
                                                    onChange={(e) => handleCurrencyChange('valorCondominio', e.target.value)}
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="space-y-2">
                                            <Label>Valor IPTU (R$)</Label>
                                            <Input
                                                type="text"
                                                value={formatCurrency(data.valorIPTU)}
                                                onChange={(e) => handleCurrencyChange('valorIPTU', e.target.value)}
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Periodicidade IPTU</Label>
                                            <Select value={data.periodicidadeIPTU} onValueChange={(v) => updateField('periodicidadeIPTU', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Mensal">Mensal</SelectItem>
                                                    <SelectItem value="Anual">Anual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* --- TAB CARACTERÍSTICAS --- */}
                        <TabsContent value="caracteristicas" className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Área Útil (m²)</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.areaConstruida || ''} onChange={(e) => handleNumericChange('areaConstruida', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Área Terreno (m²)</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.areaTerreno || ''} onChange={(e) => handleNumericChange('areaTerreno', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Dormitórios</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.dormitorios || ''} onChange={(e) => handleNumericChange('dormitorios', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Suítes</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.suites || ''} onChange={(e) => handleNumericChange('suites', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Banheiros</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.banheiros || ''} onChange={(e) => handleNumericChange('banheiros', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Vagas Cobertas</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.vagasCobertas || ''} onChange={(e) => handleNumericChange('vagasCobertas', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Vagas Descobertas</Label>
                                        <Input type="number" className="text-center font-bold text-lg" value={data.vagasDescobertas || ''} onChange={(e) => handleNumericChange('vagasDescobertas', e.target.value)} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Label className="block mb-2 text-muted-foreground">Ano Construção</Label>
                                        <Input type="number" className="text-center font-bold text-lg" placeholder="2024" />
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* --- TAB AMENIDADES --- */}
                        <TabsContent value="amenidades" className="space-y-8">
                            {Object.entries(AMENIDADES_GRUPOS).map(([grupoKey, itens]) => (
                                <div key={grupoKey}>
                                    <h3 className="font-heading text-lg text-primary capitalize mb-4 border-b pb-1">
                                        {grupoKey}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {itens.map((item) => (
                                            <div key={item.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={item.id}
                                                    checked={(data as any)[item.id] || false}
                                                    onCheckedChange={() => toggleCheck(item.id as keyof Imveis)}
                                                />
                                                <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </TabsContent>

                        {/* --- TAB MÍDIA --- */}
                        <TabsContent value="midia" className="space-y-6">
                            <div className="space-y-4">
                                <Label>Título / Resumo do Imóvel</Label>
                                <Input value={data.resumoImovel || ''} onChange={(e) => updateField('resumoImovel', e.target.value)} />

                                <Label>Descrição Detalhada do Anúncio</Label>
                                <Textarea value={data.descricaoAnuncio || ''} onChange={(e) => updateField('descricaoAnuncio', e.target.value)} className="min-h-[200px]" />

                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('photo-upload')?.click()}
                                >
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">Clique para fazer upload de fotos ou arraste aqui.</p>
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            files.forEach(file => {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const base64 = event.target?.result as string;
                                                    const currentGallery = data.galeriaFotos || [];
                                                    updateField('galeriaFotos', [...currentGallery, base64]);
                                                };
                                                reader.readAsDataURL(file);
                                            });
                                        }}
                                    />
                                </div>

                                {data.galeriaFotos && data.galeriaFotos.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Galeria de Fotos ({data.galeriaFotos.length})</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {data.galeriaFotos.map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                                                    <img src={url} alt={`Foto ${idx + 1}`} className="object-cover w-full h-full" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => {
                                                            const newGallery = data.galeriaFotos?.filter((_, i) => i !== idx);
                                                            updateField('galeriaFotos', newGallery);
                                                        }}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Label>Link Tour Virtual</Label>
                                    <Input value={data.tourVirtual || ''} onChange={(e) => updateField('tourVirtual', e.target.value)} placeholder="https://..." />

                                    <Label>Link Vídeo (YouTube/Vimeo)</Label>
                                    <Input placeholder="https://..." />
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- TAB INTERNO --- */}
                        <TabsContent value="interno" className="space-y-6">
                            <div className="space-y-4">
                                <Label>Comentários Internos (Visível apenas para equipe)</Label>
                                <Textarea value={data.comentariosInternos || ''} onChange={(e) => updateField('comentariosInternos', e.target.value)} className="min-h-[120px] bg-yellow-50/50" prefix="🔒" />

                                <Label>Localização das Chaves</Label>
                                <Input value={data.localChaves || ''} onChange={(e) => updateField('localChaves', e.target.value)} placeholder="Ex: Portaria, Claviculário 02" />
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="font-heading text-lg text-primary flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-secondary" />
                                            Autorização de Divulgação
                                        </h3>
                                        <p className="text-xs text-muted-foreground">Vincule e gerencie as autorizações de comercialização do imóvel.</p>
                                    </div>
                                    {initialData?._id && (
                                        <Button
                                            type="button"
                                            onClick={() => setShowAuthModal(true)}
                                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-9 text-xs"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Gerar Autorização
                                        </Button>
                                    )}
                                </div>

                                {!initialData?._id ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-6 text-center text-xs text-muted-foreground">
                                            ⚠️ Salve o imóvel primeiro para poder emitir a autorização de divulgação.
                                        </CardContent>
                                    </Card>
                                ) : loadingAuths ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                                    </div>
                                ) : authorizations.length === 0 ? (
                                    <Card className="border-dashed bg-slate-50/50">
                                        <CardContent className="py-8 text-center text-xs text-muted-foreground space-y-3">
                                            <FileText className="w-8 h-8 mx-auto text-muted-foreground/50" />
                                            <p>Nenhuma autorização de divulgação emitida para este imóvel.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {authorizations.map((auth) => (
                                            <div
                                                key={auth._id}
                                                className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-sm text-slate-800">{auth.nomeDocumento}</h4>
                                                        <p className="text-2xs text-muted-foreground">
                                                            Gerado em: {new Date(auth.createdAt).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-primary"
                                                        onClick={() => setSelectedAuth(auth)}
                                                        title="Visualizar Prévia"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 text-secondary border-secondary/20 hover:bg-secondary/5"
                                                        onClick={() => handleDownloadPdf(auth)}
                                                        disabled={downloadingId === auth._id}
                                                        title="Baixar PDF"
                                                    >
                                                        {downloadingId === auth._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                    </form>
                </div >

                <div className="p-4 border-t bg-background flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={() => onSubmit(data)} disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Imóvel'}
                    </Button>
                </div>
            </Tabs >

            {/* Modal para gerar autorização */}
            {initialData?._id && (
                <PropertyAuthorizationModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    property={initialData}
                    onSuccess={loadAuthorizations}
                />
            )}

            {/* Dialog para visualização de PDF/HTML existente */}
            <Dialog open={!!selectedAuth} onOpenChange={(open) => !open && setSelectedAuth(null)}>
                <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 bg-background overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 border-b bg-muted/10 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="font-heading text-lg text-primary flex items-center gap-2">
                                <FileText className="w-5 h-5 text-secondary" />
                                Visualizar Autorização de Divulgação
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground mt-1">Código: <span className="font-mono">{data.codImovel}</span></p>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex flex-col">
                        <div className="flex-1 bg-white border rounded-2xl shadow-inner overflow-hidden p-1">
                            <ScrollArea className="h-full bg-white p-8">
                                <div 
                                    dangerouslySetInnerHTML={{ __html: selectedAuth?.conteudoFinalHtml || '' }} 
                                    className="prose prose-sm max-w-none text-left"
                                />
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setSelectedAuth(null)}>
                            Fechar
                        </Button>
                        <Button onClick={() => handleDownloadPdf(selectedAuth)} disabled={downloadingId === selectedAuth?._id}>
                            {downloadingId === selectedAuth?._id ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar PDF
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
