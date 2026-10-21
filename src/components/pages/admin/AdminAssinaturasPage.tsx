import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
    Search, 
    FileText, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Send, 
    PenTool, 
    ShieldCheck, 
    Calendar, 
    Globe, 
    HelpCircle, 
    RefreshCw, 
    Mail, 
    MessageSquare, 
    AlertCircle, 
    ChevronRight,
    Play,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Signer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    cpf: string;
    role: string;
    status: 'PENDENTE' | 'ASSINADO' | 'REJEITADO';
    signedAt?: string;
    ipAddress?: string;
    certificateDetails?: string;
    coordsJson?: string;
}

interface AuditHistory {
    id: string;
    event: 'GERACAO' | 'ENVIO' | 'ABERTURA' | 'ASSINATURA' | 'REENVIO' | 'CANCELAMENTO' | 'CONCLUIDO';
    description: string;
    signerName?: string;
    signerEmail?: string;
    ipAddress?: string;
    createdAt: string;
}

interface Contract {
    id: string;
    _id: string;
    nomeDocumento: string;
    pdfUrl?: string;
    status: 'GERADO' | 'PARCIAL' | 'ASSINADO' | 'CANCELADO' | 'EXPIRADO';
    method?: string;
    createdAt: string;
    updatedAt: string;
    lead?: {
        id: string;
        fullName: string;
    };
    property?: {
        id: string;
        code: string;
        street?: string;
        number?: string;
        neighborhood?: string;
    };
    signers: Signer[];
    histories: AuditHistory[];
}

export default function AdminAssinaturasPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchClient, setSearchClient] = useState('');
    const [searchCPF, setSearchCPF] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [searchDocType, setSearchDocType] = useState('');
    const [searchService, setSearchService] = useState('');

    // Detail Panel Modal State
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Simulation Modal State
    const [simulatingSigner, setSimulatingSigner] = useState<Signer | null>(null);
    const [simulationMethod, setSimulationMethod] = useState<'Eletronica' | 'Digital'>('Eletronica');
    const [isSimulationOpen, setIsSimulationOpen] = useState(false);
    const [smsCode, setSmsCode] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState('AC SOLUTI Multipla G5 - Validade 2028');
    const [certPin, setCertPin] = useState('');

    // Load Contracts
    const loadContracts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/generated-contracts');
            if (res.ok) {
                const data = await res.json();
                setContracts(data.items || []);
            } else {
                toast.error('Erro ao carregar documentos enviados.');
            }
        } catch (error) {
            console.error('Error loading contracts:', error);
            toast.error('Erro ao conectar à API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContracts();
    }, []);

    // Filter and Search Logic
    const filteredContracts = contracts.filter(contract => {
        // Status Filter
        if (statusFilter === 'AGUARDANDO' && contract.status !== 'GERADO' && contract.status !== 'PARCIAL') return false;
        if (statusFilter === 'PARCIAL' && contract.status !== 'PARCIAL') return false;
        if (statusFilter === 'ASSINADO' && contract.status !== 'ASSINADO') return false;
        if (statusFilter === 'CANCELADO' && contract.status !== 'CANCELADO') return false;
        if (statusFilter === 'EXPIRADO' && contract.status !== 'EXPIRADO') return false;

        // Search Filters
        if (searchClient && !contract.lead?.fullName?.toLowerCase().includes(searchClient.toLowerCase()) && !contract.signers.some(s => s.name.toLowerCase().includes(searchClient.toLowerCase()))) return false;
        if (searchCPF && !contract.signers.some(s => s.cpf.replace(/\D/g, '').includes(searchCPF.replace(/\D/g, '')))) return false;
        if (searchAddress && !contract.property?.street?.toLowerCase().includes(searchAddress.toLowerCase()) && !contract.property?.code?.toLowerCase().includes(searchAddress.toLowerCase())) return false;
        if (searchDocType && !contract.nomeDocumento.toLowerCase().includes(searchDocType.toLowerCase())) return false;
        if (searchService && contract.lead?.id !== searchService && contract.id !== searchService) return false;

        return true;
    });

    const handleOpenDetail = (contract: Contract) => {
        setSelectedContract(contract);
        setIsDetailOpen(true);
    };

    const handleResend = async (signerId: string, channel: 'Email' | 'WhatsApp') => {
        if (!selectedContract) return;
        try {
            const res = await fetch(`/api/v1/generated-contracts/${selectedContract.id}/resend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signerId, channel })
            });

            if (res.ok) {
                const updated = await res.json();
                setSelectedContract(updated);
                // Sync main list
                setContracts(contracts.map(c => c.id === updated.id ? updated : c));
                toast.success(`Notificação enviada com sucesso para o participante via ${channel}!`);
            } else {
                const detail = await res.json().catch(() => ({}));
                toast.error(detail.error || 'Erro ao reenviar notificação.');
            }
        } catch (error) {
            toast.error('Erro de conexão ao reenviar notificação.');
        }
    };

    const startSignatureSimulation = (signer: Signer, method: string) => {
        setSimulatingSigner(signer);
        setSimulationMethod(method === 'Digital' ? 'Digital' : 'Eletronica');
        setIsSimulationOpen(true);
    };

    const handleExecuteSimulation = async () => {
        if (!selectedContract || !simulatingSigner) return;

        if (simulationMethod === 'Eletronica' && !smsCode) {
            toast.error('Por favor, insira o código SMS recebido para assinar.');
            return;
        }

        if (simulationMethod === 'Digital' && !certPin) {
            toast.error('Por favor, insira o PIN do certificado digital.');
            return;
        }

        try {
            const payload = {
                signerId: simulatingSigner.id,
                method: simulationMethod === 'Digital' ? 'ICP-Brasil (Certificado Digital)' : 'Eletrônica (Sms/OTP)',
                ipAddress: '179.184.22.45',
                userAgent: navigator.userAgent,
                certificateDetails: simulationMethod === 'Digital' ? `${selectedCertificate} | SHA-256: ${Math.random().toString(16).substring(2, 10).toUpperCase()}` : undefined
            };

            const res = await fetch(`/api/v1/generated-contracts/${selectedContract.id}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updated = await res.json();
                setSelectedContract(updated);
                setContracts(contracts.map(c => c.id === updated.id ? updated : c));
                toast.success(`Assinatura de ${simulatingSigner.name} simulada e registrada com sucesso!`);
                setIsSimulationOpen(false);
                setSmsCode('');
                setCertPin('');
                setSimulatingSigner(null);
            } else {
                const detail = await res.json().catch(() => ({}));
                toast.error(detail.error || 'Erro ao simular assinatura.');
            }
        } catch (error) {
            toast.error('Erro de conexão ao simular assinatura.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'GERADO':
                return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20 px-3 py-1 font-bold">Aguardando Envio</Badge>;
            case 'PARCIAL':
                return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/20 px-3 py-1 font-bold">Parcialmente Assinado</Badge>;
            case 'ASSINADO':
                return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 px-3 py-1 font-bold">Concluído</Badge>;
            case 'CANCELADO':
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20 px-3 py-1 font-bold">Cancelado</Badge>;
            case 'EXPIRADO':
                return <Badge className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/10 border-slate-500/20 px-3 py-1 font-bold">Expirado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AdminLayout>
            <div className="flex-1 bg-[#f8f9fa] p-8 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assinaturas Digitais</h1>
                        <p className="text-sm text-slate-500 mt-1">Acompanhe, gerencie e audite o status de assinaturas dos contratos imobiliários.</p>
                    </div>
                    <Button 
                        onClick={loadContracts} 
                        className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 h-11 px-5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
                        Atualizar Painel
                    </Button>
                </div>

                {/* Filters Area */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6 mb-8">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
                        {[
                            { id: 'ALL', label: 'Todos os Documentos' },
                            { id: 'AGUARDANDO', label: 'Pendente Assinatura' },
                            { id: 'PARCIAL', label: 'Parcialmente Assinado' },
                            { id: 'ASSINADO', label: 'Concluído' },
                            { id: 'CANCELADO', label: 'Cancelado' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-4 py-2 text-xs font-black uppercase rounded-lg tracking-wider border transition-all ${
                                    statusFilter === tab.id
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Nome do Cliente..."
                                value={searchClient}
                                onChange={e => setSearchClient(e.target.value)}
                                className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="CPF..."
                                value={searchCPF}
                                onChange={e => setSearchCPF(e.target.value)}
                                className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Endereço / Cód. Imóvel..."
                                value={searchAddress}
                                onChange={e => setSearchAddress(e.target.value)}
                                className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tipo de Documento..."
                                value={searchDocType}
                                onChange={e => setSearchDocType(e.target.value)}
                                className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="N° Atendimento/Contrato..."
                                value={searchService}
                                onChange={e => setSearchService(e.target.value)}
                                className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Table / List */}
                {loading ? (
                    <div className="bg-white p-20 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <RefreshCw className="w-10 h-10 animate-spin text-secondary" />
                        <p className="text-sm font-bold">Carregando documentos...</p>
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <div className="bg-white p-20 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <FileText className="w-12 h-12 opacity-30" />
                        <p className="text-sm font-bold">Nenhum contrato encontrado com os filtros selecionados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredContracts.map(contract => {
                            const signedCount = contract.signers.filter(s => s.status === 'ASSINADO').length;
                            const totalCount = contract.signers.length;
                            const pct = totalCount > 0 ? (signedCount / totalCount) * 100 : 0;

                            return (
                                <div 
                                    key={contract.id}
                                    className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                                >
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-base font-black text-slate-800 tracking-tight">{contract.nomeDocumento}</h3>
                                            {getStatusBadge(contract.status)}
                                            <Badge variant="outline" className="text-[10px] font-black uppercase bg-slate-50 px-2 py-0.5 border-slate-200">
                                                {contract.method === 'Digital' ? 'Certificado Digital (ICP)' : 'Eletrônica (Sms/OTP)'}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-1 gap-x-6 text-xs text-slate-500 font-bold">
                                            <p className="flex items-center gap-1.5 truncate">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                Criado em: {new Date(contract.createdAt).toLocaleDateString('pt-BR')} às {new Date(contract.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="flex items-center gap-1.5 truncate">
                                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                Imóvel: {contract.property?.code || 'N/A'}
                                            </p>
                                            <p className="flex items-center gap-1.5 truncate">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                Cliente: {contract.lead?.fullName || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Area */}
                                    <div className="w-full lg:w-[220px] flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-xs font-black text-slate-700">
                                            <span>Progresso Assinaturas</span>
                                            <span>{signedCount}/{totalCount} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <Progress value={pct} className="h-2 bg-slate-100 [&>div]:bg-secondary" />
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleOpenDetail(contract)}
                                            className="bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl h-11 px-6 flex items-center gap-2 shadow-sm"
                                        >
                                            Visualizar Detalhes
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        {contract.pdfUrl && (
                                            <a 
                                                href={contract.pdfUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="h-11 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center rounded-xl text-xs font-bold shadow-sm"
                                            >
                                                Visualizar PDF
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Document Details Drawer (Dialog used as a side panel overlay) */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-[850px] w-full p-0 overflow-hidden rounded-[32px] border-none bg-slate-50 flex flex-col h-[90vh]">
                    {selectedContract && (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Drawer Header */}
                            <div className="p-8 bg-white border-b border-slate-150 flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedContract.nomeDocumento}</h2>
                                        {getStatusBadge(selectedContract.status)}
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">
                                        ID do Envelope: {selectedContract.id} | Atendimento: {selectedContract.lead?.fullName || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Drawer Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* 1. Signers Monitoring Panel */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <PenTool className="w-4 h-4 text-secondary" />
                                        Painel de Acompanhamento de Assinaturas
                                    </h3>
                                    <div className="bg-white rounded-[24px] border border-slate-150 p-6 space-y-4 shadow-sm">
                                        {selectedContract.signers.map(signer => (
                                            <div 
                                                key={signer.id}
                                                className="p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        signer.status === 'ASSINADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {signer.status === 'ASSINADO' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-black text-slate-800 leading-tight">{signer.name}</p>
                                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                                                {signer.role}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-450 mt-1 leading-none">CPF: {signer.cpf} | Email: {signer.email}</p>
                                                        {signer.signedAt && (
                                                            <p className="text-[9px] text-slate-400 mt-2 font-bold flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                Assinado em: {new Date(signer.signedAt).toLocaleString('pt-BR')} | IP: {signer.ipAddress}
                                                            </p>
                                                        )}
                                                        {signer.certificateDetails && (
                                                            <p className="text-[9px] text-blue-600 font-bold bg-blue-50/50 border border-blue-100 px-2 py-1 rounded mt-1.5 flex items-center gap-1.5">
                                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                                {signer.certificateDetails}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {signer.status === 'PENDENTE' ? (
                                                        <>
                                                            {/* Re-send Trigger Panel */}
                                                            <div className="flex gap-1.5">
                                                                <button
                                                                    onClick={() => handleResend(signer.id, 'Email')}
                                                                    title="Reenviar por Email"
                                                                    className="w-9 h-9 border border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-xl text-slate-650 transition-colors"
                                                                >
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleResend(signer.id, 'WhatsApp')}
                                                                    title="Reenviar por WhatsApp"
                                                                    className="w-9 h-9 border border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-xl text-slate-650 transition-colors"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {/* Signature Simulator button */}
                                                            <Button
                                                                onClick={() => startSignatureSimulation(signer, selectedContract.method || 'Eletronica')}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black h-9 rounded-xl px-3 flex items-center gap-1"
                                                            >
                                                                <Play className="w-3 h-3" />
                                                                Simular Assinatura
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Assinado
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Audit Timeline History */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-secondary" />
                                        Histórico / Trilha de Auditoria
                                    </h3>
                                    <div className="bg-white rounded-[24px] border border-slate-150 p-6 shadow-sm space-y-6 relative overflow-hidden">
                                        {selectedContract.histories.length === 0 ? (
                                            <p className="text-xs text-slate-400 font-bold text-center py-4">Nenhum evento registrado ainda.</p>
                                        ) : (
                                            <div className="space-y-6 before:absolute before:left-9 before:top-8 before:bottom-8 before:w-0.5 before:bg-slate-100">
                                                {selectedContract.histories.map(event => (
                                                    <div key={event.id} className="relative pl-10 flex gap-4 text-left">
                                                        <div className={`absolute left-4 top-1 w-4.5 h-4.5 rounded-full border-4 border-white flex items-center justify-center shadow-sm -translate-x-1/2 ${
                                                            event.event === 'CONCLUIDO' || event.event === 'ASSINATURA'
                                                                ? 'bg-emerald-500 shadow-emerald-250'
                                                                : event.event === 'REENVIO'
                                                                    ? 'bg-indigo-500'
                                                                    : 'bg-blue-500'
                                                        }`}>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-black uppercase text-slate-400">
                                                                {new Date(event.createdAt).toLocaleString('pt-BR')}
                                                            </span>
                                                            <p className="text-xs font-bold text-slate-800 leading-normal">{event.description}</p>
                                                            {event.ipAddress && (
                                                                <p className="text-[9px] text-slate-450 flex items-center gap-1 font-bold">
                                                                    <Globe className="w-3 h-3 text-slate-400" />
                                                                    Conectado via IP: {event.ipAddress}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Sandbox Simulation Modal */}
            <Dialog open={isSimulationOpen} onOpenChange={setIsSimulationOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 text-white flex flex-col gap-5">
                    {simulatingSigner && selectedContract && (
                        <div className="space-y-6 text-left">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                                    Sandbox de Assinatura Digital
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-xs">
                                    Simule o fluxo legal do ponto de vista do signatário <strong className="text-white">{simulatingSigner.name}</strong> ({simulatingSigner.role}).
                                </DialogDescription>
                            </DialogHeader>

                            {simulationMethod === 'Eletronica' ? (
                                /* SMS/OTP Simulation interface */
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-center gap-3">
                                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                                        <div className="text-xs">
                                            <p className="font-bold text-white leading-none">Token SMS Enviado</p>
                                            <p className="text-slate-450 mt-1 leading-normal">
                                                Enviamos um token de verificação para {simulatingSigner.phone || '(11) 9****-1234'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                            Insira o Código de 6 dígitos (Digite: 123456)
                                        </label>
                                        <Input
                                            type="text"
                                            maxLength={6}
                                            value={smsCode}
                                            onChange={e => setSmsCode(e.target.value)}
                                            placeholder="123456"
                                            className="bg-slate-955 border-slate-700 rounded-xl h-11 text-center font-bold tracking-widest text-lg text-emerald-400"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* ICP-Brasil Certificate simulation interface */
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center gap-3">
                                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                                        <div className="text-xs">
                                            <p className="font-bold text-white leading-none">Certificado ICP-Brasil Detectado</p>
                                            <p className="text-slate-450 mt-1 leading-normal">
                                                Validando trilha de certificados instalados no token ou nuvem do signatário.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                                Selecione o Certificado ICP-Brasil
                                            </label>
                                            <select
                                                value={selectedCertificate}
                                                onChange={e => setSelectedCertificate(e.target.value)}
                                                className="w-full h-11 bg-slate-955 border border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none"
                                            >
                                                <option value="AC SOLUTI Multipla G5 - Validade 2028">
                                                    e-CPF: {simulatingSigner.name} - Soluti G5
                                                </option>
                                                <option value="AC CERTISIGN Multipla - Validade 2027">
                                                    e-CPF: {simulatingSigner.name} - Certisign G6
                                                </option>
                                                <option value="AC SERASA e-CPF - Validade 2029">
                                                    e-CPF: {simulatingSigner.name} - Serasa Experian
                                                </option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                                Digite a Senha/PIN do Certificado (Digite: 1234)
                                            </label>
                                            <Input
                                                type="password"
                                                maxLength={8}
                                                value={certPin}
                                                onChange={e => setCertPin(e.target.value)}
                                                placeholder="Senha PIN"
                                                className="bg-slate-955 border-slate-700 rounded-xl h-11 text-xs font-bold text-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={handleExecuteSimulation}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl"
                                >
                                    Assinar Documento
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsSimulationOpen(false);
                                        setSimulatingSigner(null);
                                    }}
                                    className="border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-bold h-11 rounded-xl"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
