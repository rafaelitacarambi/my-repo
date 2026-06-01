import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import {
    X, MoreHorizontal, Plus, Search, Filter, Download, FileText, History, MessageSquare, Upload,
    CheckCircle, AlertCircle, Settings, Eye, Trash2, File, Clock, Copy, CheckCircle2, AlertTriangle,
    UserCheck, DollarSign, LayoutGrid, Info, Save, Wrench, CheckSquare, Home, Users, FileCheck, Share2, Palette, Building2, Gavel, Hash, Phone,
    ChevronDown, XCircle, Edit2
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/layouts/AdminLayout';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF, handleCPFInput } from '@/lib/input-masks';
import AuctionNavigation from '../../AuctionNavigation';
import { TasksAndPendenciesTabs } from '@/components/admin/tasks/TasksAndPendenciesTabs';

// Types and Interfaces adapted for Leilão
interface LeilaoCase {
    _id: string;
    agencia?: string;
    proponentePrincipal: string;
    cpfProponentePrincipal?: string;
    pastaInterna?: string;
    status: string;
    faseAtual: string;
    faseAnterior?: string;
    dataEntradaFaseAtual?: string;
    diasNaFase: number;
    pendenciasAbertas: number;
    tarefasAbertas: number;
    serviceType: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    propertyRefs?: string[];

    // Blocking icons
    bloqueioDocumento?: boolean;
    bloqueioLicitacao?: boolean;

    // Data fields
    propertyValue?: number;
    bidValue?: number;
    notes?: string;
    interlinks?: {
        hasProperty: boolean;
        activeSales: number;
        activeRentals: number;
        activeFinancing: number;
        activeAuctions: number;
        relatedServices: {
            _id: string;
            serviceType: string;
            contactName: string;
            pastaInterna: string;
            status: string;
            imovelRef: string | null;
            imovelCod: string | null;
            imovelEndereco: string;
        }[];
    };
    documentosAnexos?: { name: string; url: string; size: number; type: string; uploadedAt: string }[];
    leilaoExtra?: Record<string, string>;
    pendenciasDescricao?: string[];
    tarefasDescricao?: string[];
}

const LEILAO_COLUMNS = [
    { id: 'Novos clientes', name: 'Novos clientes', color: 'bg-blue-100 border-blue-300', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
    { id: 'Em arrematação', name: 'Em arrematação', color: 'bg-amber-100 border-amber-300', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
    { id: 'Arrematado', name: 'Arrematado', color: 'bg-emerald-100 border-emerald-300', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
    { id: 'Em processo de Financiamento', name: 'Em processo de Financiamento', color: 'bg-indigo-100 border-indigo-300', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300' },
    { id: 'Documentos comprador', name: 'Documentos comprador', color: 'bg-violet-100 border-violet-300', bgColor: 'bg-violet-100', borderColor: 'border-violet-300' },
    { id: 'Kit documentos Caixa', name: 'Kit documentos Caixa', color: 'bg-pink-100 border-pink-300', bgColor: 'bg-pink-100', borderColor: 'border-pink-300' },
    { id: 'Enviar para escritura', name: 'Enviar para escritura', color: 'bg-rose-100 border-rose-300', bgColor: 'bg-rose-100', borderColor: 'border-rose-300' },
    { id: 'Aguardando assinatura', name: 'Aguardando assinatura', color: 'bg-orange-100 border-orange-300', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
    { id: 'Registro', name: 'Registro', color: 'bg-cyan-100 border-cyan-300', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300' },
    { id: 'Enviar pagamentos de débitos', name: 'Enviar pagamentos de débitos', color: 'bg-red-100 border-red-300', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
    { id: 'Aguardando pagamentos de débitos', name: 'Aguardando pagamentos de débitos', color: 'bg-slate-200 border-slate-400', bgColor: 'bg-slate-200', borderColor: 'border-slate-400' },
    { id: 'Nota fiscal', name: 'Nota fiscal', color: 'bg-teal-100 border-teal-300', bgColor: 'bg-teal-100', borderColor: 'border-teal-300' },
    { id: 'Enviar matrícula e IPTU', name: 'Enviar matrícula e IPTU', color: 'bg-lime-100 border-lime-300', bgColor: 'bg-lime-100', borderColor: 'border-lime-300' },
    { id: 'Documentos enviados para NF', name: 'Documentos enviados para NF', color: 'bg-fuchsia-100 border-fuchsia-300', bgColor: 'bg-fuchsia-100', borderColor: 'border-fuchsia-300' },
    { id: 'NF autorizada', name: 'NF autorizada', color: 'bg-yellow-100 border-yellow-300', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' },
    { id: 'Concluído', name: 'Concluído', color: 'bg-green-100 border-green-300', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
];

const BACKGROUND_OPTIONS = [
    { id: 'default', name: 'Padrão Claro', value: 'bg-slate-50', preview: '#F8FAFC' },
    { id: 'dark', name: 'Escuro', value: 'bg-slate-900', preview: '#0F172A' },
    { id: 'amber', name: 'Âmbar Clássico', value: 'bg-amber-50', preview: '#FFFBEB' },
    { id: 'gradient-amber', name: 'Gradiente Ouro', value: 'bg-gradient-to-br from-amber-50 to-orange-100', preview: 'linear-gradient(135deg, #fffbeb, #ffedd5)' },
    { id: 'image-gavel', name: 'Leilão', value: 'bg-[url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920)] bg-cover bg-center', preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400' },
];

export default function AdminLeilaoKanbanPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const scrollbarThumbRef = useRef<HTMLDivElement>(null);

    const [cases, setCases] = useState<LeilaoCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<LeilaoCase | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalTab, setModalTab] = useState('dados');
    const [searchTerm, setSearchTerm] = useState('');
    const [kanbanBackground, setKanbanBackground] = useState<string>('bg-slate-50');
    const [pasteArea, setPasteArea] = useState<string>('');
    const [pasteFeedback, setPasteFeedback] = useState<{ field: string; message: string; type: 'success' | 'warning' }[]>([]);
    const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: number; type: string; uploadedAt: string }[]>([]);
    const [isDraggingDoc, setIsDraggingDoc] = useState(false);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [isEditingPasta, setIsEditingPasta] = useState(false);
    const [pastaInputValue, setPastaInputValue] = useState('');
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
    const [showEmptyColumns, setShowEmptyColumns] = useState(true);
    type RelatedService = { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string };

    const [clients, setClients] = useState<Clients[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [leilaoFormData, setLeilaoFormData] = useState<Record<string, string>>({});
    const [isSavingLeilao, setIsSavingLeilao] = useState(false);

    // Quick action modals for card
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [showQuickPendingModal, setShowQuickPendingModal] = useState(false);
    const [quickActionCaseId, setQuickActionCaseId] = useState<string | null>(null);

    const [newTaskData, setNewTaskData] = useState({
        description: '',
        internalResponsibleId: '',
        dueDate: '',
        externalResponsibleName: '',
        responsibleType: 'Interno' as 'Interno' | 'Externo'
    });

    const [newPendingData, setNewPendingData] = useState({
        description: '',
        responsiblePartyType: 'Interno' as 'Interno' | 'Cliente',
        averageDaysToComplete: 7
    });

    // Custom Scrollbar Sync Logic
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const updateScrollbar = () => {
            if (!scrollbarRef.current || !scrollbarThumbRef.current) return;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;

            if (scrollWidth <= clientWidth) {
                scrollbarRef.current.style.display = 'none';
                return;
            }
            scrollbarRef.current.style.display = 'block';

            const thumbWidth = (clientWidth / scrollWidth) * clientWidth;
            scrollbarThumbRef.current.style.width = `${thumbWidth}px`;

            const maxScroll = scrollWidth - clientWidth;
            const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            const maxThumbPosition = clientWidth - thumbWidth;
            scrollbarThumbRef.current.style.transform = `translateX(${scrollPercentage * maxThumbPosition}px)`;
        };

        container.addEventListener('scroll', updateScrollbar);
        window.addEventListener('resize', updateScrollbar);
        updateScrollbar();
        
        // Initial sync after data load
        const timeout = setTimeout(updateScrollbar, 500);

        return () => {
            container.removeEventListener('scroll', updateScrollbar);
            window.removeEventListener('resize', updateScrollbar);
            clearTimeout(timeout);
        };
    }, [cases]);

    // Wheel and Drag Scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let isMouseDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('[data-rbd-draggable-id]') || target.closest('input') || target.closest('textarea') || target.closest('select')) return;
            isMouseDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        };

        const stopScrolling = () => {
            isMouseDown = false;
            container.style.cursor = 'grab';
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopScrolling);
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopScrolling);
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const leilaoTeam = users.filter(u => (u.setores?.includes('Leilão') || u.setores?.includes('Leilões')) && u.ativo !== false);

    useEffect(() => {
        loadData();
        const storedBg = localStorage.getItem('kanban-background-leilao');
        if (storedBg) setKanbanBackground(storedBg);

        const storedShowEmpty = localStorage.getItem('kanban-show-empty-leilao');
        if (storedShowEmpty !== null) setShowEmptyColumns(storedShowEmpty === 'true');
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [
                { items: clientsList },
                { items: usersList },
                { items: atendimentos },
                { items: pendingsList },
                { items: tasksList },
                { items: partiesList },
                { items: propertiesList },
                { items: propertyLinks }
            ] = await Promise.all([
                BaseCrudService.getAll<Clients>('clientes'),
                BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema'),
                BaseCrudService.getAll<ServiceRecords>('atendimentos'),
                BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasleilao'),
                BaseCrudService.getAll<FinancingTasks>('tarefasleilao'),
                BaseCrudService.getAll<ServiceParties>('atendimentopartes'),
                BaseCrudService.getAll<Imveis>('imoveis'),
                BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis')
            ]);

            setClients(clientsList);
            setUsers(usersList);

            const filteredAtendimentos = atendimentos
                .filter(a => ['Leilão'].includes(a.serviceType || '') && !a.isArchived)
                .sort((a, b) => {
                    const dateA = new Date(a._updatedDate || a._createdDate || 0).getTime();
                    const dateB = new Date(b._updatedDate || b._createdDate || 0).getTime();
                    return dateB - dateA;
                });

            const filteredCases = filteredAtendimentos.map(a => {
                const client = clientsList.find(c => c._id === a.clientePrincipalRef);
                const dataEntrada = a._updatedDate || a._createdDate || new Date();
                const diasNaFase = Math.floor((new Date().getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24));

                const casePendings = pendingsList.filter(p => p.atendimentoRef === a._id && p.status !== 'Resolvida');
                const caseTasks = tasksList.filter(t => t.atendimentoRef === a._id && t.status !== 'Concluída');

                const clientId = a.clientePrincipalRef;
                const otherPrimaryServices = atendimentos.filter(s => s.clientePrincipalRef === clientId && s._id !== a._id && !s.isArchived);
                const participantServicesRefs = partiesList.filter(p => p.clientRef === clientId).map(p => p.serviceRecordRef);
                const participationServices = atendimentos.filter(s => participantServicesRefs.includes(s._id) && s._id !== a._id && !s.isArchived);
                const clientPropertyIds = propertyLinks.filter(p => p.atendimentoRef === a._id).map(p => p.imovelRef);
                const propertyRelatedRefs = propertyLinks.filter(p => clientPropertyIds.includes(p.imovelRef) && p.atendimentoRef !== a._id).map(p => p.atendimentoRef);
                const propertyRelatedServices = atendimentos.filter(s => propertyRelatedRefs.includes(s._id) && !s.isArchived);

                const combinedServices = [...otherPrimaryServices, ...participationServices, ...propertyRelatedServices];
                const uniqueRelated = Array.from(new Map(combinedServices.map(s => [s._id, s])).values());

                const interlinks = {
                    hasProperty: clientPropertyIds.length > 0 || propertiesList.some(p => p.proprietarioId === clientId || p.emailProprietario === client?.emailPrincipal || p.telefoneProprietario === client?.phoneNumber),
                    activeSales: uniqueRelated.filter(s => ['Venda', 'Compra'].includes(s.serviceType || '')).length,
                    activeRentals: uniqueRelated.filter(s => ['Locação', 'Aluguel'].includes(s.serviceType || '')).length,
                    activeFinancing: uniqueRelated.filter(s => ['Financiamento', 'Crédito'].includes(s.serviceType || '')).length,
                    activeAuctions: uniqueRelated.filter(s => ['Leilão'].includes(s.serviceType || '')).length,
                    relatedServices: uniqueRelated.map(s => {
                        const plink = propertyLinks.find(pl => pl.atendimentoRef === s._id);
                        const prop = plink ? propertiesList.find(pr => pr._id === plink.imovelRef) : null;
                        return {
                            _id: s._id,
                            serviceType: s.serviceType || '',
                            contactName: s.contactName || '',
                            pastaInterna: (s as any).pastaInterna || '',
                            status: s.status || '',
                            imovelRef: plink ? plink.imovelRef : null,
                            imovelCod: prop ? (prop.codImovel || prop.codigoReference || '') : null,
                            imovelEndereco: prop ? (prop.enderecoRua || prop.logradouro || prop.enderecoBairro || prop.bairro || '') : ''
                        };
                    })
                };

                return {
                    _id: a._id,
                    agencia: a.unidadeResponsavelRef || '',
                    proponentePrincipal: a.contactName || client?.clientName || 'Sem nome',
                    contactName: a.contactName || client?.clientName || 'Sem nome',
                    cpfProponentePrincipal: client?.cpfCnpj || '',
                    pastaInterna: a.pastaInterna || a._id.substring(0, 8).toUpperCase(),
                    status: (a.status === 'Novos' || !a.status) ? 'Novos clientes' : a.status,
                    faseAtual: (a.status === 'Novos' || !a.status) ? 'Novos clientes' : a.status,
                    serviceType: a.serviceType || 'Leilão',
                    contactPhone: a.contactPhone || client?.phoneNumber || '',
                    contactEmail: a.contactEmail || client?.email || '',
                    diasNaFase,
                    pendenciasAbertas: casePendings.length,
                    tarefasAbertas: caseTasks.length,
                    bloqueioDocumento: casePendings.some(p => p.categoria === 'Documento'),
                    bloqueioLicitacao: casePendings.some(p => p.categoria === 'Licitação'),
                    propertyValue: (a as any).propertyValue || 0,
                    bidValue: (a as any).bidValue || (a as any).propertyValue || 0,
                    notes: a.notes || '',
                    propertyRefs: clientPropertyIds,
                    interlinks,
                    documentosAnexos: (a as any).documentosAnexos || [],
                    leilaoExtra: (a as any).leilaoExtra || {},
                    pendenciasDescricao: casePendings.map(p => p.description || p.title),
                    tarefasDescricao: caseTasks.map(t => t.description || t.titulo)
                };
            });

            setCases(filteredCases);
        } catch (error: any) {
            console.error('Error loading Leilão Kanban data:', error);
            toast.error(`Erro ao carregar dados do Kanban: ${error?.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const newStage = destination.droppableId;
        const updatedCases = Array.from(cases);
        const caseIndex = updatedCases.findIndex(c => c._id === draggableId);

        if (caseIndex !== -1) {
            const caseItem = updatedCases[caseIndex];
            caseItem.status = newStage;
            caseItem.faseAtual = newStage;
            setCases(updatedCases);
            try {
                await BaseCrudService.update('atendimentos', { _id: draggableId, status: newStage });
                toast.success('Processo movido com sucesso');
            } catch (error) {
                console.error('Error moving case:', error);
                toast.error('Erro ao mover processo');
                loadData();
            }
        }
    };

    const handleOpenDetails = (caseItem: LeilaoCase) => {
        setSelectedCase(caseItem);
        setLeilaoFormData(caseItem.leilaoExtra || {});
        setUploadedDocs(caseItem.documentosAnexos || []);
        setShowDetailsModal(true);
    };

    const handleSaveLeilaoData = async () => {
        if (!selectedCase) return;
        setIsSavingLeilao(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                leilaoExtra: leilaoFormData,
                documentosAnexos: uploadedDocs,
            });
            toast.success('Dados salvos com sucesso!');
        } catch {
            toast.error('Erro ao salvar dados.');
        } finally {
            setIsSavingLeilao(false);
        }
    };

    const handleSavePasta = async () => {
        if (!selectedCase) return;
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                pastaInterna: pastaInputValue
            });
            setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, pastaInterna: pastaInputValue } : c));
            setSelectedCase(prev => prev ? { ...prev, pastaInterna: pastaInputValue } : null);
            setIsEditingPasta(false);
            toast.success('Nome da pasta atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar nome da pasta:', error);
            toast.error('Erro ao atualizar nome da pasta.');
        }
    };

    const handleConcluirProcesso = async () => {
        if (!selectedCase) return;
        setIsSavingLeilao(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                status: 'Concluído',
                faseAtual: 'Concluído',
                isArchived: false,
            });
            toast.success('Processo concluído!');
            setShowDetailsModal(false);
            loadData();
        } catch {
            toast.error('Erro ao concluir processo.');
        } finally {
            setIsSavingLeilao(false);
        }
    };

    const handleExportToExcel = () => {
        try {
            const exportData = cases.map(c => ({
                'Cliente': c.contactName,
                'Pasta': c.pastaInterna,
                'Agência': c.agencia,
                'Fase': c.faseAtual,
                'Status': c.status,
                'CPF / CNPJ': c.cpfProponentePrincipal,
                'Telefone': c.contactPhone,
                'E-mail': c.contactEmail,
                'Lote/Item': c.leilaoExtra?.imoveLote || '',
                'Localidade': c.leilaoExtra?.imovelLocal || '',
                'Valor Avaliação': c.leilaoExtra?.finValorAvaliacao || '',
                'Valor Proposta': c.leilaoExtra?.finValorProposta || '',
                'PENDENCIAS E TAREFAS': [
                    ...(c.pendenciasDescricao || []),
                    ...(c.tarefasDescricao || [])
                ].join('; ')
            }));

            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Leilões');
            
            writeFile(wb, `Relatorio_Leilao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            toast.success('Excel exportado com sucesso!');
        } catch (error) {
            console.error('Error exporting to excel:', error);
            toast.error('Erro ao exportar para Excel');
        }
    };

    const handleMoveCase = async (caseId: string, newStatus: string) => {
        const caseItem = cases.find(c => c._id === caseId);
        if (!caseItem || caseItem.status === newStatus) return;

        // Optimistic update
        setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: newStatus, faseAtual: newStatus } : c));

        try {
            await BaseCrudService.update('atendimentos', { _id: caseId, status: newStatus });
            toast.success(`Fase alterada para ${newStatus}`);
        } catch (error) {
            console.error('Error moving case:', error);
            toast.error('Erro ao mover processo');
            loadData();
        }
    };

    const handleCreateQuickTask = async () => {
        if (!quickActionCaseId || !newTaskData.description) return;

        try {
            const now = new Date().toISOString();
            const dueDate = newTaskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const newTask: FinancingTasks = {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                titulo: newTaskData.description.substring(0, 100),
                description: newTaskData.description,
                status: 'A Fazer',
                responsibleType: 'Equipe Leilão',
                responsavelExternoRef: newTaskData.internalResponsibleId,
                dueDate,
                creationDate: now
            };

            await BaseCrudService.create('tarefasleilao', newTask); // Changed to tarefasleilao

            // Create history entry
            await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                tipoEvento: 'Tarefa_Criada',
                interactionType: 'Criação de tarefa',
                interactionDescription: `Nova tarefa criada: "${newTask.titulo}"`,
                interactionDate: now,
                autorTipo: 'Sistema'
            });

            // Reset and close
            setNewTaskData({
                description: '',
                internalResponsibleId: '',
                dueDate: '',
                externalResponsibleName: '',
                responsibleType: 'Interno'
            });
            setShowQuickTaskModal(false);
            setQuickActionCaseId(null);

            toast.success('Tarefa criada com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error creating quick task:', error);
            toast.error('Erro ao criar tarefa');
        }
    };

    const handleCreateQuickPending = async () => {
        if (!quickActionCaseId || !newPendingData.description) return;

        try {
            const now = new Date().toISOString();
            const dueDate = new Date(Date.now() + (newPendingData.averageDaysToComplete || 7) * 24 * 60 * 60 * 1000).toISOString();

            const newPending: PendnciasdoFinanciamento = {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                title: newPendingData.description.substring(0, 100),
                description: newPendingData.description,
                status: 'Pendente',
                priority: 'Média',
                dueDate,
                responsiblePartyType: newPendingData.responsiblePartyType,
                responsiblePartyDetails: '',
                taskAutomaticallyCreated: false,
                creationDate: now,
                bloqueiaFase: false,
                categoria: ''
            };

            await BaseCrudService.create('pendenciasleilao', newPending); // Changed to pendenciasleilao

            // Create history entry
            await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                tipoEvento: 'Pendencia_Criada',
                interactionType: 'Criação de pendência',
                interactionDescription: `Nova pendência criada: "${newPending.title}"`,
                interactionDate: now,
                autorTipo: 'Sistema'
            });

            // Reset and close
            setNewPendingData({
                description: '',
                responsiblePartyType: 'Interno',
                averageDaysToComplete: 7
            });
            setShowQuickPendingModal(false);
            setQuickActionCaseId(null);

            toast.success('Pendência criada com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error creating quick pending:', error);
            toast.error('Erro ao criar pendência');
        }
    };

    const handleAutoFill = () => {
        if (!pasteArea.trim()) return;
        const newData: any = { ...leilaoFormData };
        
        // Improved Regex and keyword extraction
        const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2})|(\d{11})/;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}-?\d{4})/;
        const moneyRegex = /(?:R\$|R\$\s)?(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/;
        const editalRegex = /(Edital|EDITAL)[:\s]+([^\n\r,]+)/i;
        const loteRegex = /(Lote|LOTE|Item|ITEM)[:\s]+([0-9A-Za-z.\-]+)/i;
        const localRegex = /(Local|Localização|Endereço)[:\s]+([^\n\r]+)/i;

        const cpfMatch = pasteArea.match(cpfRegex);
        if (cpfMatch) newData.clienteCpfCnpj = cpfMatch[0];
        
        const emailMatch = pasteArea.match(emailRegex);
        if (emailMatch) newData.clienteEmail = emailMatch[0];
        
        const phoneMatch = pasteArea.match(phoneRegex);
        if (phoneMatch) newData.clienteTelefone = phoneMatch[0];

        const editalMatch = pasteArea.match(editalRegex);
        if (editalMatch) newData.leilaoEdital = editalMatch[2].trim();

        const loteMatch = pasteArea.match(loteRegex);
        if (loteMatch) newData.imoveLote = loteMatch[2].trim();

        const localMatch = pasteArea.match(localRegex);
        if (localMatch) newData.imovelLocal = localMatch[2].trim();

        const moneyMatches = Array.from(pasteArea.matchAll(new RegExp(moneyRegex, 'g'))).map(m => m[1]);
        if (moneyMatches.length > 0) {
            const sorted = moneyMatches.map(m => parseFloat(m.replace(/\./g, '').replace(',', '.'))).sort((a, b) => b - a);
            // Higher value is usually evaluation, lower is opening bid or proposal
            newData.finValorAvaliacao = sorted[0].toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            if (sorted[1]) newData.finValorProposta = sorted[1].toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }

        // Try to find Name by looking for patterns like "Nome:" or "Proponente:"
        const nameRegex = /(Nome|Proponente|Cliente)[:\s]+([^\n\r,]+)/i;
        const nameMatch = pasteArea.match(nameRegex);
        if (nameMatch) newData.clienteNome = nameMatch[2].trim();

        const feedback: { field: string; message: string; type: 'success' | 'warning' }[] = [];
        if (cpfMatch) feedback.push({ field: 'CPF', message: 'CPF extraído com sucesso', type: 'success' });
        if (moneyMatches.length > 0) feedback.push({ field: 'Valores', message: 'Preços extraídos com sucesso', type: 'success' });
        if (nameMatch) feedback.push({ field: 'Nome', message: 'Nome extraído', type: 'success' });
        
        // Example of warning for non-matching or complex patterns
        if (pasteArea.toLowerCase().includes('condicionante') && !pasteArea.toLowerCase().includes('financiamento')) {
            feedback.push({ field: 'Atenção', message: 'Detectado termo "condicionante", verifique o campo de forma de pagamento.', type: 'warning' });
        }

        setPasteFeedback(feedback);
        setLeilaoFormData(newData);
        setPasteArea('');
        
        if (feedback.some(f => f.type === 'warning')) {
            toast.warning("Dados extraídos com alguns alertas. Verifique os campos.");
        } else if (feedback.length > 0) {
            toast.info("Dados inteligentes extraídos e preenchidos!");
        } else {
            toast.error("Não foi possível extrair dados automáticos deste texto.");
        }
    };

    const handleDocFileDrop = async (files: FileList | null) => {
        if (!files || !selectedCase) return;
        try {
            const newDocs = Array.from(files).map(f => ({
                name: f.name,
                url: URL.createObjectURL(f),
                size: f.size,
                type: f.type,
                uploadedAt: new Date().toISOString(),
            }));
            setUploadedDocs(prev => [...prev, ...newDocs]);
            toast.success(`${newDocs.length} documento(s) anexado(s)`);
        } catch (error) {
            toast.error("Erro ao processar documentos.");
        }
    };

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!selectedCase) return;
        if (selectedCase.status === newStatus) return;
        setIsSavingLeilao(true);
        try {
            await BaseCrudService.update('atendimentos', { _id: selectedCase._id, status: newStatus });
            setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, status: newStatus, faseAtual: newStatus } : c));
            setSelectedCase(prev => prev ? { ...prev, status: newStatus, faseAtual: newStatus } : null);
            toast.success(`Fase alterada para ${newStatus}`);
        } catch (error) {
            toast.error('Erro ao mudar fase');
            loadData();
        } finally {
            setIsSavingLeilao(false);
        }
    };

    return (
        <AdminLayout>
            <AuctionNavigation />
            <div className={`h-[calc(100vh-64px)] flex flex-col overflow-hidden transition-all duration-300 ${kanbanBackground}`}>
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Gavel className="w-6 h-6 text-amber-600" />
                            Kanban de Leilão
                        </h1>
                        <p className="text-slate-500 text-sm">Gestão de processos de leilões e licitações</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por cliente, pasta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-full border-slate-200 bg-white shadow-sm"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full shadow-sm transition-all ${!showEmptyColumns ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white text-slate-400'}`}
                            onClick={() => {
                                const nextValue = !showEmptyColumns;
                                setShowEmptyColumns(nextValue);
                                localStorage.setItem('kanban-show-empty-leilao', String(nextValue));
                            }}
                        >
                            {showEmptyColumns ? <LayoutGrid className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full bg-white shadow-sm" onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}>
                            <Palette className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={handleExportToExcel} className="h-10 rounded-full bg-white border-slate-200 text-slate-600 gap-2 px-6 shadow-sm hover:bg-slate-50 transition-all">
                            <Share2 className="w-4 h-4" /> Exportar Excel
                        </Button>
                        <Button className="h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white gap-2 px-6 shadow-md">
                            <Plus className="w-4 h-4" /> Novo Processo
                        </Button>
                    </div>
                </div>

                {/* Smart Paste Area (Added for auto-fill functionality) */}
                <div className="bg-white/40 backdrop-blur-sm border-b border-slate-200/50 px-6 py-3 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="relative flex-1">
                        <textarea
                            placeholder="Cole informações do leilão aqui para preenchimento automático inteligente..."
                            value={pasteArea}
                            onChange={(e) => setPasteArea(e.target.value)}
                            className="w-full h-10 px-4 py-2 rounded-xl border border-amber-200 bg-white/80 focus:ring-2 focus:ring-amber-500 transition-all resize-none text-xs"
                        />
                        {pasteArea && (
                            <Button 
                                size="sm" 
                                onClick={handleAutoFill}
                                className="absolute right-1.5 top-1.5 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white gap-1 px-3 text-[10px] font-bold shadow-sm"
                            >
                                <CheckSquare className="w-3 h-3" />
                                EXTRAIR DADOS
                            </Button>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium max-w-[200px] leading-tight">
                        Cole edital, Nome, CPF ou valores financeiros para preencher a ficha automaticamente.
                    </div>
                </div>

                <AnimatePresence>
                    {showBackgroundPicker && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-24 top-20 bg-white shadow-2xl rounded-2xl p-4 z-50 border border-slate-200 w-64">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 text-sm">Personalizar fundo</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowBackgroundPicker(false)}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {BACKGROUND_OPTIONS.map((bg) => (
                                    <button key={bg.id} onClick={() => { setKanbanBackground(bg.value); localStorage.setItem('kanban-background-leilao', bg.value); setShowBackgroundPicker(false); }} className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all ${kanbanBackground === bg.value ? 'border-amber-500 scale-95' : 'border-slate-100 hover:border-slate-200'}`}>
                                        <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-[8px] text-white font-medium text-center">{bg.name}</div>
                                        <div className="absolute inset-0 w-full h-full" style={{ background: bg.preview }} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 relative overflow-hidden group/board">
                    {/* Custom Scrollbar */}
                    <div ref={scrollbarRef} className="absolute bottom-4 left-6 right-6 h-2 bg-slate-900/10 rounded-full z-30 opacity-0 group-hover/board:opacity-100 transition-opacity">
                        <div ref={scrollbarThumbRef} className="h-full bg-slate-900/40 rounded-full cursor-grab active:cursor-grabbing hover:bg-slate-900/60 transition-colors" />
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing no-scrollbar scroll-smooth p-6"
                    >
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex h-full gap-6 min-w-max">
                                {LEILAO_COLUMNS.filter(column => showEmptyColumns || cases.some(c => c.faseAtual === column.id)).map((column) => (
                                    <div key={column.id} className="w-80 flex flex-col h-full rounded-2xl bg-slate-100/40 backdrop-blur-sm border border-slate-200/50">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${column.borderColor.replace('border', 'bg')}`} />
                                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{column.name}</h3>
                                                <Badge variant="secondary" className="bg-white/50 text-slate-600 rounded-lg text-[10px] px-2 h-5 border-none">
                                                    {cases.filter(c => c.faseAtual === column.id).length}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600 transition-colors"><Plus className="w-4 h-4" /></Button>
                                        </div>
                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 px-3 pb-4 overflow-y-auto no-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-amber-100/20' : ''}`}>
                                                    <div className="flex flex-col gap-3">
                                                        {cases.filter(c => c.faseAtual === column.id).filter(c => c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.pastaInterna?.toLowerCase().includes(searchTerm.toLowerCase())).map((caseItem, index) => (
                                                            <Draggable key={caseItem._id} draggableId={caseItem._id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => handleOpenDetails(caseItem)} className={`group relative p-4 bg-white border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all cursor-pointer rounded-2xl ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-amber-500 scale-105 rotate-2' : ''}`}>
                                                                        <div className="mb-3">
                                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{caseItem.pastaInterna}</span>
                                                                                    <span className="flex items-center gap-1 ml-2"><Building2 className="w-3 h-3" />{caseItem.agencia}</span>
                                                                                    {caseItem.status === 'Concluído' && (
                                                                                        <Badge className="bg-emerald-500 text-white border-none text-[8px] h-4 px-1.5 font-black uppercase tracking-tighter">CONCLUÍDO</Badge>
                                                                                    )}
                                                                                </div>
                                                                                <span className={`px-2 py-0.5 rounded-full text-white font-bold ${caseItem.diasNaFase > 15 ? 'bg-red-500' : caseItem.diasNaFase > 7 ? 'bg-orange-500' : 'bg-emerald-500'}`}>{caseItem.diasNaFase} d</span>
                                                                            </div>
                                                                            <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors">{caseItem.contactName}</h4>
                                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                                <Phone className="w-3 h-3 text-slate-400" />
                                                                                <span>{caseItem.contactPhone || 'S/ Tel'}</span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2 mb-3 mt-3">
                                                                                {caseItem.pendenciasAbertas > 0 && (
                                                                                    <Badge variant="outline" className="bg-red-50 border-red-100 text-red-600 text-[10px] gap-1 px-1.5 h-6">
                                                                                        <AlertCircle className="w-3 h-3" />
                                                                                        {caseItem.pendenciasAbertas} Pend.
                                                                                    </Badge>
                                                                                )}
                                                                                {caseItem.tarefasAbertas > 0 && (
                                                                                    <Badge variant="outline" className="bg-amber-50 border-amber-100 text-amber-600 text-[10px] gap-1 px-1.5 h-6">
                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                        {caseItem.tarefasAbertas} Tarefas
                                                                                    </Badge>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setQuickActionCaseId(caseItem._id);
                                                                                        setShowQuickPendingModal(true);
                                                                                    }}
                                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                                                                                >
                                                                                    <AlertCircle className="w-3 h-3" />
                                                                                    + Pend
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setQuickActionCaseId(caseItem._id);
                                                                                        setShowQuickTaskModal(true);
                                                                                    }}
                                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border border-amber-100"
                                                                                >
                                                                                    <CheckCircle className="w-3 h-3" />
                                                                                    + Tarefa
                                                                                </button>
                                                                                
                                                                                <Select 
                                                                                    value={caseItem.faseAtual} 
                                                                                    onValueChange={(value) => handleMoveCase(caseItem._id, value)}
                                                                                >
                                                                                    <SelectTrigger 
                                                                                        className="h-8 px-2 w-auto min-w-[70px] text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-100 bg-amber-50/30 flex items-center justify-center gap-1 focus:ring-0 focus:ring-offset-0"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <span>MOVER</span>
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {LEILAO_COLUMNS.map((col) => (
                                                                                            <SelectItem 
                                                                                                key={col.id} 
                                                                                                value={col.id}
                                                                                                className="text-xs font-semibold"
                                                                                            >
                                                                                                {col.name}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        </div>
                                                                    </Card>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                ))}
                            </div>
                        </DragDropContext>
                    </div>
                </div>

                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[32px] flex flex-col bg-white">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex flex-row items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                                Leilão — {selectedCase?.contactName}
                                            </DialogTitle>
                                            <Select 
                                                value={selectedCase?.status || ''} 
                                                onValueChange={(val) => handleMoveCase(selectedCase?._id || '', val)}
                                            >
                                                <SelectTrigger className="h-7 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-full px-4 w-auto min-w-[160px] transition-all">
                                                    <SelectValue placeholder="Mover Processo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LEILAO_COLUMNS.map((col) => (
                                                        <SelectItem key={col.id} value={col.id} className="text-[10px] font-bold uppercase tracking-wider">
                                                            {col.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <span className="text-[11px] font-bold text-slate-300 tracking-wider">•</span>
                                            {isEditingPasta ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={pastaInputValue}
                                                        onChange={(e) => setPastaInputValue(e.target.value)}
                                                        className="text-[10px] text-slate-750 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-400 h-5"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSavePasta();
                                                            if (e.key === 'Escape') setIsEditingPasta(false);
                                                        }}
                                                    />
                                                    <Button onClick={handleSavePasta} variant="ghost" className="h-5 w-5 p-0 text-emerald-500 hover:text-emerald-700">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button onClick={() => setIsEditingPasta(false)} variant="ghost" className="h-5 w-5 p-0 text-rose-500 hover:text-rose-700">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 group/pasta">
                                                    <span className="text-[11px] font-bold text-slate-400">{selectedCase?.pastaInterna || '—'}</span>
                                                    <Button
                                                        onClick={() => {
                                                            setPastaInputValue(selectedCase?.pastaInterna || '');
                                                            setIsEditingPasta(true);
                                                        }}
                                                        variant="ghost"
                                                        className="h-5 w-5 p-0 text-slate-400 hover:text-slate-650 opacity-100 sm:opacity-0 group-hover/pasta:opacity-100 transition-opacity"
                                                    >
                                                        <Edit2 className="w-2.5 h-2.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pasta: {selectedCase?.pastaInterna}</span>
                                            </div>
                                            {(() => {
                                                const propertyPills = selectedCase?.interlinks?.relatedServices?.filter(rel => 
                                                    rel.imovelRef && selectedCase.propertyRefs?.includes(rel.imovelRef)
                                                ) || [];
                                                if (propertyPills.length === 0) return null;
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mr-1">Vínculos:</span>
                                                        {propertyPills.map(rel => {
                                                            const routeMap: Record<string, string> = {
                                                                'Venda': '/admin/negocios/kanban',
                                                                'Compra': '/admin/negocios/kanban',
                                                                'Locação': '/admin/locacoes/kanban',
                                                                'Aluguel': '/admin/locacoes/kanban',
                                                                'Financiamento': '/admin/financiamento-kanban',
                                                                'Crédito': '/admin/financiamento-kanban',
                                                                'Leilão': '/admin/leilao/kanban'
                                                            };
                                                            const colorMap: Record<string, string> = {
                                                                'Venda': 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
                                                                'Compra': 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
                                                                'Locação': 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
                                                                'Aluguel': 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
                                                                'Financiamento': 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
                                                                'Crédito': 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
                                                                'Leilão': 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                            };
                                                            const firstType = (rel.serviceType || '').split(',').map(t => t.trim())[0] || '';
                                                            const route = routeMap[firstType];
                                                            if (!route) return null;
                                                            return (
                                                                <button 
                                                                    key={rel._id} 
                                                                    onClick={() => navigate(`${route}?openCard=${rel._id}`)} 
                                                                    className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all ${colorMap[firstType] || 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                                                >
                                                                    {rel.serviceType}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            {selectedCase?.interlinks?.relatedServices && selectedCase.interlinks.relatedServices.length > 0 && (
                                                <div className="flex items-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-7 w-auto px-3 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center gap-1.5 justify-start">
                                                                Outros cartões <ChevronDown className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-[350px] bg-white border-slate-200 p-2 flex flex-col gap-3 shadow-xl rounded-xl">
                                                            {(() => {
                                                                const groupsMap = new Map<string, {
                                                                    imovelRef: string | null;
                                                                    imovelCod: string | null;
                                                                    imovelEndereco: string;
                                                                    services: typeof selectedCase.interlinks.relatedServices;
                                                                }>();
                                                                const noPropertyGroup: typeof selectedCase.interlinks.relatedServices = [];

                                                                selectedCase.interlinks.relatedServices.forEach(rel => {
                                                                    if (rel.imovelRef) {
                                                                        if (!groupsMap.has(rel.imovelRef)) {
                                                                            groupsMap.set(rel.imovelRef, {
                                                                                imovelRef: rel.imovelRef,
                                                                                imovelCod: rel.imovelCod,
                                                                                imovelEndereco: rel.imovelEndereco,
                                                                                services: []
                                                                            });
                                                                        }
                                                                        groupsMap.get(rel.imovelRef)!.services.push(rel);
                                                                    } else {
                                                                        noPropertyGroup.push(rel);
                                                                    }
                                                                });

                                                                const groups = Array.from(groupsMap.values());
                                                                
                                                                const routeMap: Record<string, string> = {
                                                                    'Venda': '/admin/negocios/kanban', 'Compra': '/admin/negocios/kanban',
                                                                    'Locação': '/admin/locacoes/kanban', 'Aluguel': '/admin/locacoes/kanban',
                                                                    'Financiamento': '/admin/financiamento-kanban', 'Crédito': '/admin/financiamento-kanban',
                                                                    'Leilão': '/admin/leilao/kanban'
                                                                };
                                                                const iconMap: Record<string, string> = {
                                                                    'Venda': '💰', 'Compra': '💰', 'Locação': '🔑', 'Aluguel': '🔑',
                                                                    'Financiamento': '🏦', 'Crédito': '🏦', 'Leilão': '🔨'
                                                                };

                                                                return (
                                                                    <>
                                                                        {groups.map(group => (
                                                                            <div key={group.imovelRef} className="flex flex-col gap-1.5 font-sans normal-case">
                                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                                                                    <span>🏠</span>
                                                                                    <span className="truncate max-w-[280px]">
                                                                                        {group.imovelCod ? `${group.imovelCod} - ` : ''}{group.imovelEndereco || 'Imóvel sem endereço'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                                                                    {group.services.map(rel => {
                                                                                        const firstType = (rel.serviceType || '').split(',').map(t => t.trim())[0] || '';
                                                                                        const route = routeMap[firstType];
                                                                                        const icon = iconMap[firstType] || '📋';
                                                                                        const colorMap: Record<string, string> = {
                                                                                            'Venda': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                            'Compra': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                            'Locação': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                            'Aluguel': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                            'Financiamento': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                            'Crédito': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                            'Leilão': 'hover:bg-red-50 hover:border-red-200 border-slate-200'
                                                                                        };
                                                                                        const color = colorMap[firstType] || 'hover:bg-slate-50 hover:border-slate-300 border-slate-200';
                                                                                        if (!route) return null;
                                                                                        return (
                                                                                            <DropdownMenuItem
                                                                                                key={rel._id}
                                                                                                asChild
                                                                                                className="focus:bg-transparent p-0 border-none cursor-pointer flex-1 min-w-[140px]"
                                                                                            >
                                                                                                <button
                                                                                                    onClick={() => navigate(`${route}?openCard=${rel._id}`)}
                                                                                                    className={`flex items-center gap-2 p-2 rounded-lg border bg-white shadow-sm transition-all text-left ${color}`}
                                                                                                >
                                                                                                    <span className="text-sm">{icon}</span>
                                                                                                    <div className="flex flex-col min-w-0">
                                                                                                        <span className="font-bold text-slate-700 text-[11px] truncate leading-tight">{rel.serviceType}</span>
                                                                                                        <span className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">
                                                                                                            {rel.pastaInterna || rel.contactName}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </button>
                                                                                            </DropdownMenuItem>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {noPropertyGroup.length > 0 && (
                                                                            <div className="flex flex-col gap-1.5 font-sans normal-case">
                                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                                                                    <span>📋</span>
                                                                                    <span>Outros Serviços</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                                                                    {noPropertyGroup.map(rel => {
                                                                                        const firstType = (rel.serviceType || '').split(',').map(t => t.trim())[0] || '';
                                                                                        const route = routeMap[firstType];
                                                                                        const icon = iconMap[firstType] || '📋';
                                                                                        const colorMap: Record<string, string> = {
                                                                                            'Venda': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                            'Compra': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                            'Locação': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                            'Aluguel': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                            'Financiamento': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                            'Crédito': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                            'Leilão': 'hover:bg-red-50 hover:border-red-200 border-slate-200'
                                                                                        };
                                                                                        const color = colorMap[firstType] || 'hover:bg-slate-50 hover:border-slate-300 border-slate-200';
                                                                                        if (!route) return null;
                                                                                        return (
                                                                                            <DropdownMenuItem
                                                                                                key={rel._id}
                                                                                                asChild
                                                                                                className="focus:bg-transparent p-0 border-none cursor-pointer flex-1 min-w-[140px]"
                                                                                            >
                                                                                                <button
                                                                                                    onClick={() => navigate(`${route}?openCard=${rel._id}`)}
                                                                                                    className={`flex items-center gap-2 p-2 rounded-lg border bg-white shadow-sm transition-all text-left ${color}`}
                                                                                                >
                                                                                                    <span className="text-sm">{icon}</span>
                                                                                                    <div className="flex flex-col min-w-0">
                                                                                                        <span className="font-bold text-slate-700 text-[11px] truncate leading-tight">{rel.serviceType}</span>
                                                                                                        <span className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">
                                                                                                            {rel.pastaInterna || rel.contactName}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </button>
                                                                                            </DropdownMenuItem>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {selectedCase?.contactPhone && (
                                    <Button 
                                        variant="outline" 
                                        className="h-10 px-5 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition-all font-bold text-xs" 
                                        onClick={() => window.open(`https://wa.me/55${selectedCase.contactPhone?.replace(/\D/g, '')}`, '_blank')}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleSaveLeilaoData} 
                                    className="h-10 px-8 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-200 transition-all"
                                >
                                    <Save className="w-4 h-4 mr-2" /> Salvar
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100" onClick={() => setShowDetailsModal(false)}>
                                    <X className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <Tabs value={modalTab} onValueChange={setModalTab} className="flex-1 flex flex-col min-h-0 w-full">
                            <TabsList className="grid grid-cols-5 mb-6 bg-slate-100/50 p-1.5 rounded-[24px] h-14 shadow-inner flex-shrink-0 mx-8 mt-6">
                                        <TabsTrigger value="dados" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><FileText className="w-4 h-4" /> Dados</TabsTrigger>
                                        <TabsTrigger value="pendencias" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><AlertCircle className="w-4 h-4" /> Pendências</TabsTrigger>
                                        <TabsTrigger value="tarefas" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><CheckCircle className="w-4 h-4" /> Tarefas</TabsTrigger>
                                        <TabsTrigger value="documentos" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><Upload className="w-4 h-4" /> Arquivos</TabsTrigger>
                                        <TabsTrigger value="historico" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><History className="w-4 h-4" /> Linha do Tempo</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="dados" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div className="space-y-8">
                                            <Card className="p-6 border-amber-200 bg-amber-50/20 rounded-[32px] border-dashed border-2 shadow-sm">
                                                <div className="flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600"><Wrench className="w-4 h-4" /></div>
                                                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Assistente de Importação Inteligente</h3>
                                                    </div>
                                                    <Button onClick={handleAutoFill} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-2 font-bold transition-all px-5">Extrair e Preencher</Button>
                                                </div>
                                                <Textarea placeholder="Cole dados brutos do e-mail, portal ou edital aqui..." value={pasteArea} onChange={e => setPasteArea(e.target.value)} className="min-h-[140px] bg-white/80 border-amber-200 rounded-2xl text-sm italic shadow-inner focus:ring-amber-500" />
                                                
                                                {pasteFeedback.length > 0 && (
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {pasteFeedback.map((fb, idx) => (
                                                            <Badge key={idx} variant="outline" className={`text-[10px] gap-1 px-2 py-0.5 rounded-lg ${fb.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                                                {fb.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                                {fb.message}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5"><UserCheck className="w-4 h-4 text-blue-500" /> Identificação do Cliente</h3>
                                                        <CopyButton value={`Cliente: ${leilaoFormData.clienteNome}\nCPF: ${leilaoFormData.clienteCpfCnpj}\nTel: ${leilaoFormData.clienteTelefone}\nEmail: ${leilaoFormData.clienteEmail}`} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200" />
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nome do Proponente</Label><Input value={leilaoFormData.clienteNome || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteNome: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">CPF / CNPJ</Label><Input value={leilaoFormData.clienteCpfCnpj || ''} onChange={e => { const { displayValue } = handleCPFInput(e.target.value); setLeilaoFormData({...leilaoFormData, clienteCpfCnpj: displayValue}); }} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Contato</Label><Input value={leilaoFormData.clienteTelefone || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteTelefone: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                        </div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">E-mail Principal</Label><Input value={leilaoFormData.clienteEmail || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteEmail: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                    </div>
                                                </Card>

                                                <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5"><DollarSign className="w-4 h-4 text-emerald-500" /> Condições Financeiras</h3>
                                                        <CopyButton value={`Avaliação: ${leilaoFormData.finValorAvaliacao}\nLance: ${leilaoFormData.finValorProposta}\nForma: ${leilaoFormData.finFormaPagamento}`} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200" />
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Valor de Avaliação</Label><Input value={leilaoFormData.finValorAvaliacao || ''} onChange={e => setLeilaoFormData({...leilaoFormData, finValorAvaliacao: e.target.value})} className="h-11 rounded-xl bg-emerald-50/50 border-none font-black text-emerald-700" /></div>
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Valor do Lance</Label><Input value={leilaoFormData.finValorProposta || ''} onChange={e => setLeilaoFormData({...leilaoFormData, finValorProposta: e.target.value})} className="h-11 rounded-xl bg-amber-50/50 border-none font-black text-amber-700" /></div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Forma de Pagamento</Label>
                                                            <Select value={leilaoFormData.finFormaPagamento || ''} onValueChange={v => setLeilaoFormData({...leilaoFormData, finFormaPagamento: v})}>
                                                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent className="rounded-2xl shadow-2xl p-2 border-slate-100">
                                                                    <SelectItem value="À Vista" className="rounded-xl">À Vista</SelectItem>
                                                                    <SelectItem value="Financiamento" className="rounded-xl">Financiamento</SelectItem>
                                                                    <SelectItem value="Parcelado" className="rounded-xl">Parcelado Direto</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Observações de Pagamento</Label><Input value={leilaoFormData.finObsPagamento || ''} onChange={e => setLeilaoFormData({...leilaoFormData, finObsPagamento: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                    </div>
                                                </Card>

                                                <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5"><LayoutGrid className="w-4 h-4 text-indigo-500" /> Detalhes do Imóvel</h3>
                                                        <CopyButton value={`Lote: ${leilaoFormData.imoveLote}\nLocal: ${leilaoFormData.imovelLocal}\nEdital: ${leilaoFormData.leilaoEdital}`} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200" />
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Número do Item / Lote</Label><Input value={leilaoFormData.imoveLote || ''} onChange={e => setLeilaoFormData({...leilaoFormData, imoveLote: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-black" /></div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Localidade</Label><Input value={leilaoFormData.imovelLocal || ''} onChange={e => setLeilaoFormData({...leilaoFormData, imovelLocal: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Referência Edital</Label><Input value={leilaoFormData.leilaoEdital || ''} onChange={e => setLeilaoFormData({...leilaoFormData, leilaoEdital: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                    </div>
                                                </Card>
                                            </div>

                                            <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2.5"><Info className="w-4 h-4 text-amber-500" /> Observações Internas</h3>
                                                <Textarea 
                                                    value={leilaoFormData.observacoesInternas || ''} 
                                                    onChange={e => setLeilaoFormData({...leilaoFormData, observacoesInternas: e.target.value})} 
                                                    placeholder="Insira observações relevantes sobre este processo de leilão..."
                                                    className="min-h-[100px] rounded-2xl bg-slate-50 border-none font-medium text-sm focus:ring-amber-500"
                                                />
                                            </Card>

                                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-50">
                                                <Button variant="ghost" className="rounded-2xl px-6 text-slate-400 font-bold hover:bg-slate-50">Limpar Campos</Button>
                                                <Button onClick={handleSaveLeilaoData} disabled={isSavingLeilao} className="bg-amber-600 hover:bg-amber-700 text-white rounded-[18px] px-10 font-black shadow-lg shadow-amber-200 h-12 uppercase tracking-widest text-xs transition-all">
                                                    {isSavingLeilao ? 'Processando...' : 'Salvar Todas as Alterações'}
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="documentos" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div
                                            onDragOver={e => { e.preventDefault(); setIsDraggingDoc(true); }}
                                            onDragLeave={() => setIsDraggingDoc(false)}
                                            onDrop={e => { e.preventDefault(); setIsDraggingDoc(false); handleDocFileDrop(e.dataTransfer.files); }}
                                            onClick={() => docInputRef.current?.click()}
                                            className={`border-4 border-dashed rounded-[40px] p-20 text-center cursor-pointer transition-all mb-10 ${isDraggingDoc ? 'border-amber-400 bg-amber-50 scale-105 shadow-2xl' : 'border-slate-100 bg-slate-50/50 hover:border-amber-300 hover:bg-amber-50/30'}`}
                                        >
                                            <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all"><Upload className="w-10 h-10 text-amber-500" /></div>
                                            <p className="text-lg font-black text-slate-800 tracking-tight">Deposite documentos aqui</p>
                                            <p className="text-sm text-slate-400 mt-2 font-medium">Arquivos suportados: PDF, JPG, PNG, DOCX (Máx 20MB)</p>
                                            <input ref={docInputRef} type="file" multiple className="hidden" onChange={e => handleDocFileDrop(e.target.files)} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {uploadedDocs.length === 0 ? (
                                                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[40px] border border-slate-100 border-dashed">
                                                    <FileCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold italic">Nenhum documento anexado ao processo.</p>
                                                </div>
                                            ) : (
                                                uploadedDocs.map((doc, i) => (
                                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={i} className="group p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all flex flex-col justify-between">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><File className="w-6 h-6" /></div>
                                                                <div className="max-w-[140px]">
                                                                    <p className="text-sm font-black text-slate-800 truncate mb-0.5">{doc.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ (doc.size / 1024).toFixed(0) } KB • { new Date(doc.uploadedAt).toLocaleDateString('pt-BR') }</p>
                                                                </div>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-all"><Settings className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent className="p-2 rounded-xl border-slate-100 shadow-2xl">
                                                                    <DropdownMenuItem className="p-3 rounded-lg text-xs font-bold gap-3"><Eye className="w-4 h-4" /> Visualizar</DropdownMenuItem>
                                                                    <DropdownMenuItem className="p-3 rounded-lg text-xs font-bold text-red-500 gap-3" onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /> Excluir</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a href={doc.url} download={doc.name} className="flex-1"><Button variant="outline" className="w-full h-10 rounded-[14px] text-xs font-black gap-2 border-slate-100 hover:bg-slate-50 transition-all"><Download className="w-3.5 h-3.5" /> DOWNLOAD</Button></a>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="historico" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div className="max-w-3xl mx-auto space-y-12">
                                            <div className="relative pl-12 border-l-4 border-slate-100 space-y-12 pb-10">
                                                <div className="relative">
                                                    <div className="absolute -left-[58px] top-0 w-8 h-8 rounded-full bg-white border-4 border-amber-500 shadow-xl flex items-center justify-center text-amber-500 font-black text-[10px] z-10">01</div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> Hoje, às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <h4 className="text-base font-black text-slate-800 tracking-tight">Processo imortalizado no ecossistema</h4>
                                                    <div className="mt-3 p-5 bg-slate-50 rounded-[24px] border border-slate-100 shadow-inner">
                                                        <p className="text-sm text-slate-500 leading-relaxed">Registro inicial efetuado com status <span className="font-black text-slate-900">"{selectedCase?.status}"</span>. Todas as ramificações de inteligência de negócio foram ativadas para este contrato.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
                                                <div className="p-10 bg-emerald-50/50 rounded-[48px] border-4 border-emerald-100 border-dashed text-center max-w-sm">
                                                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200"><CheckCircle2 className="w-10 h-10" /></div>
                                                    <h3 className="text-xl font-black text-emerald-900 tracking-tight mb-3">Conclusão de Ciclo</h3>
                                                    <p className="text-xs text-emerald-700 font-medium mb-8 leading-relaxed">Ao arrematar, o processo será transposto para a categoria de conclusos, liberando recursos operacionais.</p>
                                                    <Button onClick={handleConcluirProcesso} disabled={isSavingLeilao || selectedCase?.status === 'Concluído'} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white gap-3 rounded-[24px] font-black shadow-2xl shadow-emerald-200 uppercase tracking-widest text-xs transition-all ring-offset-2 hover:ring-2 ring-emerald-500">
                                                        {isSavingLeilao ? 'Processando...' : 'Finalizar Processo'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="pendencias" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {selectedCase && (
                                            <TasksAndPendenciesTabs
                                                atendimentoRef={selectedCase._id}
                                                serviceType="leilao"
                                                tab="pendencias"
                                                clients={clients}
                                                users={users}
                                                onSuccess={loadData}
                                            />
                                        )}
                                    </TabsContent>

                                    <TabsContent value="tarefas" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {selectedCase && (
                                            <TasksAndPendenciesTabs
                                                atendimentoRef={selectedCase._id}
                                                serviceType="leilao"
                                                tab="tarefas"
                                                clients={clients}
                                                users={users}
                                                onSuccess={loadData}
                                            />
                                        )}
                                    </TabsContent>
                                </Tabs>
                    </DialogContent>
                </Dialog>
            </div>
            {/* Quick Task Modal */}
            <Dialog open={showQuickTaskModal} onOpenChange={setShowQuickTaskModal}>
                <DialogContent className="max-w-md p-6 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600">
                            <CheckCircle className="w-6 h-6" />
                            Nova Tarefa Rápida
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">O que precisa ser feito?</Label>
                            <Input 
                                placeholder="Descreva a tarefa..."
                                value={newTaskData.description}
                                onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                                className="h-12 rounded-xl focus:ring-amber-500 shadow-sm border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Responsável</Label>
                            <Select 
                                value={newTaskData.internalResponsibleId} 
                                onValueChange={(val) => setNewTaskData({...newTaskData, internalResponsibleId: val})}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Selecione o responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leilaoTeam.map(u => (
                                        <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Prazo (opcional)</Label>
                            <Input 
                                type="date"
                                value={newTaskData.dueDate}
                                onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                                className="h-12 rounded-xl border-slate-200"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button 
                                onClick={handleCreateQuickTask}
                                disabled={!newTaskData.description}
                                className="h-12 flex-1 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-bold shadow-lg shadow-amber-200"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Tarefa
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowQuickTaskModal(false);
                                    setQuickActionCaseId(null);
                                }}
                                className="h-12 px-6 rounded-xl border-slate-200 text-slate-500 font-bold"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quick Pending Modal */}
            <Dialog open={showQuickPendingModal} onOpenChange={setShowQuickPendingModal}>
                <DialogContent className="max-w-md p-6 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-6 h-6" />
                            Nova Pendência Rápida
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Qual a pendência?</Label>
                            <Input 
                                placeholder="Descreva a pendência..."
                                value={newPendingData.description}
                                onChange={(e) => setNewPendingData({...newPendingData, description: e.target.value})}
                                className="h-12 rounded-xl focus:ring-red-500 shadow-sm border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Responsável pela solução</Label>
                            <Select 
                                value={newPendingData.responsiblePartyType} 
                                onValueChange={(val: any) => setNewPendingData({...newPendingData, responsiblePartyType: val})}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Interno">Equipe R.Sales</SelectItem>
                                    <SelectItem value="Cliente">Cliente / Proponente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Prazo estimado (dias)</Label>
                            <Input 
                                type="number"
                                value={newPendingData.averageDaysToComplete}
                                onChange={(e) => setNewPendingData({...newPendingData, averageDaysToComplete: parseInt(e.target.value) || 7})}
                                className="h-12 rounded-xl border-slate-200"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button 
                                onClick={handleCreateQuickPending}
                                disabled={!newPendingData.description}
                                className="h-12 flex-1 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold shadow-lg shadow-red-200"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Pendência
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowQuickPendingModal(false);
                                    setQuickActionCaseId(null);
                                }}
                                className="h-12 px-6 rounded-xl border-slate-200 text-slate-500 font-bold"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
