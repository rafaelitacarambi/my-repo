import { useState, useRef, useEffect } from 'react';
import { User, PenTool, Trash2, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Participant {
    id: string;
    name: string;
    role: string;
    cpf: string;
    email: string;
    phone?: string;
}

interface SignaturePosition {
    signerId: string;
    signerName: string;
    role: string;
    type: 'signature' | 'rubrica';
    x: number; // percentage
    y: number; // percentage
}

interface SignaturePositioningProps {
    previewHtml: string;
    participants: Participant[];
    onConfirm: (positions: SignaturePosition[], autoRubrica: boolean) => void;
    onCancel: () => void;
}

export function SignaturePositioning({ previewHtml, participants, onConfirm, onCancel }: SignaturePositioningProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(participants[0] || null);
    const [positionType, setPositionType] = useState<'signature' | 'rubrica'>('signature');
    const [positions, setPositions] = useState<SignaturePosition[]>([]);
    const [autoRubrica, setAutoRubrica] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter participants that are fully set up
    const validParticipants = participants.filter(p => p.id && p.name);

    useEffect(() => {
        if (validParticipants.length > 0 && !selectedParticipant) {
            setSelectedParticipant(validParticipants[0]);
        }
    }, [validParticipants, selectedParticipant]);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!selectedParticipant || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        
        // Calculate relative coordinates in percentage
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const xPercent = parseFloat(((clickX / rect.width) * 100).toFixed(2));
        const yPercent = parseFloat(((clickY / rect.height) * 100).toFixed(2));

        // Check if this type of marker already exists for this signer
        const exists = positions.some(p => p.signerId === selectedParticipant.id && p.type === positionType);
        if (exists && positionType === 'signature') {
            toast.warning(`A assinatura para ${selectedParticipant.name} já foi posicionada. Você pode removê-la para posicionar novamente.`);
            return;
        }

        const newPosition: SignaturePosition = {
            signerId: selectedParticipant.id,
            signerName: selectedParticipant.name,
            role: selectedParticipant.role,
            type: positionType,
            x: xPercent,
            y: yPercent
        };

        setPositions([...positions, newPosition]);
        toast.success(`${positionType === 'signature' ? 'Assinatura' : 'Rubrica'} de ${selectedParticipant.name} posicionada!`);
    };

    const removePosition = (index: number) => {
        const removed = positions[index];
        setPositions(positions.filter((_, i) => i !== index));
        toast.info(`${removed.type === 'signature' ? 'Assinatura' : 'Rubrica'} de ${removed.signerName} removida.`);
    };

    const handleSave = () => {
        // Validation: Every participant must have at least a signature positioned
        const missingSignatures = validParticipants.filter(p => 
            !positions.some(pos => pos.signerId === p.id && pos.type === 'signature')
        );

        if (missingSignatures.length > 0 && !autoRubrica) {
            toast.error(`Por favor, posicione a assinatura de: ${missingSignatures.map(p => p.name).join(', ')} antes de prosseguir.`);
            return;
        }

        onConfirm(positions, autoRubrica);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950 text-slate-100 rounded-[32px] border border-slate-800">
            {/* Left Hand Document Viewer */}
            <div className="flex-1 overflow-y-auto p-8 border-r border-slate-800 flex flex-col items-center custom-scrollbar">
                <div className="mb-4 text-center max-w-lg">
                    <h4 className="text-lg font-black text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                        Espaço de Posicionamento Visual
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                        Selecione um participante na barra lateral, defina o tipo (assinatura ou rubrica) e clique no documento para posicionar.
                    </p>
                </div>

                {/* Simulated Document Sheet (A4 ratio look) */}
                <div 
                    ref={containerRef}
                    onClick={handleContainerClick}
                    className="relative w-full max-w-[800px] min-h-[1100px] h-fit flex-shrink-0 bg-white text-slate-900 shadow-2xl rounded-2xl p-12 cursor-crosshair border border-slate-200 select-none mb-10"
                >
                    {/* Render HTML preview inside document */}
                    <div 
                        className="prose prose-slate max-w-none text-sm pointer-events-none text-slate-900 prose-headings:text-slate-900 prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800"
                        style={{ color: '#0f172a' }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }} 
                    />

                    {/* Placed signature/rubrica badges */}
                    {positions.map((pos, index) => (
                        <div
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation(); // prevent adding a new marker
                                removePosition(index);
                            }}
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border cursor-pointer select-none text-white transition-all hover:scale-105 active:scale-95 ${
                                pos.type === 'signature'
                                    ? 'bg-orange-500 border-orange-400 hover:bg-orange-600'
                                    : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-700'
                            }`}
                        >
                            <PenTool className="w-3.5 h-3.5" />
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-black uppercase leading-tight tracking-wider">
                                    {pos.type === 'signature' ? 'Assinatura' : 'Rubrica'}
                                </span>
                                <span className="text-xs font-bold leading-none truncate max-w-[100px]">
                                    {pos.signerName}
                                </span>
                            </div>
                            <Trash2 className="w-3.5 h-3.5 ml-1 opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Hand Control Panel */}
            <div className="w-full lg:w-[380px] bg-slate-900 p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest block">Painel de Configuração</span>
                        <h4 className="text-xl font-black text-white">Participantes e Ações</h4>
                    </div>

                    {/* Step 1: Choose Participant */}
                    <div className="space-y-4">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                            1. Escolher Participante
                        </label>
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {validParticipants.map((p) => {
                                const isSelected = selectedParticipant?.id === p.id;
                                const hasSig = positions.some(pos => pos.signerId === p.id && pos.type === 'signature');
                                const hasRub = positions.some(pos => pos.signerId === p.id && pos.type === 'rubrica');

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedParticipant(p)}
                                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                            isSelected
                                                ? 'bg-slate-800 border-secondary'
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                isSelected ? 'bg-secondary text-white' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 leading-none mt-1">{p.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            {hasSig && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-md border border-orange-500/30">
                                                    Assin
                                                </span>
                                            )}
                                            {hasRub && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/30">
                                                    Rubr
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Choose Position Type */}
                    <div className="space-y-4">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                            2. Tipo de Marcação
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPositionType('signature')}
                                className={`h-11 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                                    positionType === 'signature'
                                        ? 'bg-orange-500 border-orange-400 text-white'
                                        : 'bg-slate-850 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <PenTool className="w-4 h-4" />
                                Assinatura
                            </button>
                            <button
                                type="button"
                                onClick={() => setPositionType('rubrica')}
                                className={`h-11 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                                    positionType === 'rubrica'
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-850 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <Check className="w-4 h-4" />
                                Rubrica
                            </button>
                        </div>
                    </div>

                    {/* Auto Rubrica Feature */}
                    <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex items-start gap-3">
                        <Checkbox 
                            id="autoRubrica" 
                            checked={autoRubrica} 
                            onCheckedChange={(checked) => setAutoRubrica(!!checked)}
                            className="mt-1 border-slate-600 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                        />
                        <div className="space-y-1 text-left">
                            <label htmlFor="autoRubrica" className="text-xs font-bold text-white cursor-pointer select-none">
                                Rubrica automática em todas as páginas
                            </label>
                            <p className="text-[10px] text-slate-400 leading-normal">
                                Aplica a rubrica do signatário no rodapé de todas as páginas do contrato automaticamente ao assinar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 border-t border-slate-800 space-y-3 mt-6">
                    <Button
                        className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 font-black text-white shadow-xl shadow-secondary/10"
                        onClick={handleSave}
                    >
                        Confirmar e Enviar Documento
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full h-12 rounded-xl text-slate-450 hover:text-white hover:bg-slate-800 font-bold"
                        onClick={onCancel}
                    >
                        Voltar para Opções
                    </Button>
                </div>
            </div>
        </div>
    );
}
