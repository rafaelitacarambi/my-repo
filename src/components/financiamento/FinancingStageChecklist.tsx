import React, { useState } from 'react';
import { Check, X, Minus, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { STAGE_CHECKLISTS, ChecklistItem, ChecklistAnswer } from '@/config/FinancingChecklists';
import { cn } from '@/lib/utils'; // Assuming this exists, standard in shadcn

interface FinancingStageChecklistProps {
    caseData: any;
    onUpdateAnswer: (stageId: string, itemId: string, answer: ChecklistAnswer) => void;
    answers?: Record<string, Record<string, ChecklistAnswer>>;
    onConclude?: () => void;
}

export function FinancingStageChecklist({ caseData, onUpdateAnswer, answers = {}, onConclude }: FinancingStageChecklistProps) {
    const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

    const getAnswer = (stageId: string, itemId: string): ChecklistAnswer => {
        return answers[stageId]?.[itemId] || { checked: false, status: 'unchecked' };
    };

    const isItemVisible = (item: ChecklistItem) => {
        if (!item.isConditional) return true;
        if (item.conditionType === 'fgts') return caseData.useFgts === true;
        if (item.conditionType === 'empreendimento_caixa') return caseData.ehImovelEmpreendimentoCaixa === true;
        if (item.conditionType === 'nao_empreendimento_caixa') return caseData.ehImovelEmpreendimentoCaixa === false;
        if (item.conditionType === 'cartorio_rsales') {
            const parentAnswer = getAnswer('cartorio-rsales', 'nos_faremos_cartorio');
            return parentAnswer.status === 'checked';
        }
        return true;
    };

    const handleToggle = (stageId: string, itemId: string) => {
        const current = getAnswer(stageId, itemId);
        let nextStatus: 'checked' | 'unchecked' | 'irrelevant' | 'failed' = 'checked';
        if (current.status === 'unchecked') nextStatus = 'checked';
        else if (current.status === 'checked') nextStatus = 'failed';
        else if (current.status === 'failed') nextStatus = 'irrelevant';
        else if (current.status === 'irrelevant') nextStatus = 'unchecked';
        onUpdateAnswer(stageId, itemId, { checked: nextStatus === 'checked', status: nextStatus });
    };

    const toggleExpand = (stageId: string) => {
        setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
    };

    const STAGE_ORDER = [
        'novos-clientes', 'cadastro-cliente', 'avaliacao-risco', 'aprovados', 'condicionados', 'reprovados',
        'fgts', 'engenharia', 'siopi', 'formularios', 'sictd', 'aguardando-conformidade',
        'entrevista', 'assinatura-minuta', 'itbi', 'cartorio-rsales', 'garantia', 'acompanhamento-obra', 'aguardando-imovel', 'concluido'
    ];

    // Filter visible stages to calculate correct indices
    const visibleStages = STAGE_ORDER.filter(stageId => {
        if (stageId === 'fgts' && !caseData.useFgts) return false;
        const items = STAGE_CHECKLISTS[stageId];
        return items && items.length > 0;
    });

    const renderStatusIcon = (status: string) => {
        switch (status) {
            case 'checked': return <Check className="w-3.5 h-3.5 text-white bg-green-600 rounded-full p-0.5" />;
            case 'failed': return <X className="w-3.5 h-3.5 text-white bg-red-600 rounded-full p-0.5" />;
            case 'irrelevant': return <Minus className="w-3.5 h-3.5 text-slate-400" />;
            default: return <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleStages.map((stageId, index) => {
                    const items = STAGE_CHECKLISTS[stageId];
                    const stageAnswers = answers[stageId] || {};
                    const visibleItems = items.filter(i => isItemVisible(i));
                    const totalItems = visibleItems.length;

                    // Count checked, failed, and irrelevant as "completed" interaction? 
                    // Usually progress implies "done". Let's count 'checked' and 'irrelevant'. 'failed' implies needs attention?
                    // For progress bar: (checked + irrelevant) / total
                    const completedCount = visibleItems.filter(i => {
                        const s = stageAnswers[i.id]?.status;
                        return s === 'checked' || s === 'irrelevant';
                    }).length;

                    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
                    const isComplete = progress === 100;
                    const isExpanded = expandedStages[stageId];

                    // Card Colors
                    const bgColor = isComplete ? 'bg-emerald-500' : 'bg-cyan-500';
                    const hoverColor = isComplete ? 'hover:bg-emerald-600' : 'hover:bg-cyan-600';

                    return (
                        <div key={stageId} className="flex flex-col rounded-lg shadow-md overflow-hidden bg-white border border-slate-100 transition-all duration-200 hover:shadow-lg">
                            {/* Header / Card Face */}
                            <div
                                className={cn(
                                    "p-4 cursor-pointer relative min-h-[100px] flex flex-col justify-between transition-colors",
                                    bgColor, hoverColor
                                )}
                                onClick={() => toggleExpand(stageId)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col text-white">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium opacity-90 uppercase tracking-wide">Fase {index + 1}</span>
                                            {(caseData?.faseAtual === stageId || caseData?.faseFinanciamento === stageId) && (
                                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 animate-pulse" />
                                            )}
                                        </div>
                                        <span className="text-lg font-bold capitalize leading-tight mt-0.5">
                                            {stageId.replace(/-/g, ' ')}
                                        </span>
                                    </div>
                                    {isExpanded ? <ChevronUp className="text-white w-5 h-5 opacity-80" /> : <ChevronDown className="text-white w-5 h-5 opacity-80" />}
                                </div>

                                <div className="space-y-1.5 mt-3">
                                    <Progress value={progress} className="h-2 bg-black/20" indicatorClassName="bg-white" />
                                    <div className="flex justify-between items-center text-white text-xs font-medium">
                                        <span>{Math.round(progress)}% concluído</span>
                                    </div>
                                </div>
                            </div>

                            {/* Checklist Items (Collapsible) */}
                            {isExpanded && (
                                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    {visibleItems.map(item => {
                                        const ans = getAnswer(stageId, item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-start gap-2 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-colors ${ans.status === 'irrelevant' ? 'opacity-60' : ''}`}
                                                onClick={() => handleToggle(stageId, item.id)}
                                            >
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {renderStatusIcon(ans.status)}
                                                </div>
                                                <span className={`text-xs leading-snug select-none ${ans.status === 'irrelevant' ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {stageId === 'garantia' && onConclude && (
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); onConclude(); }}
                                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                                            size="sm"
                                        >
                                            <Check className="w-3.5 h-3.5 mr-1.5" />
                                            Concluir Processo
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
