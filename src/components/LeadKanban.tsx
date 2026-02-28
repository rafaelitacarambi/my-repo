import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Mail,
    Phone,
    Calendar,
    MessageSquare,
    TrendingUp,
    CheckCircle2,
    Clock,
    MoreVertical,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BaseCrudService } from '@/integrations';
import { LeadsdeContato } from '@/entities';

interface LeadKanbanProps {
    leads: LeadsdeContato[];
    onUpdateStatus: (leadId: string, newStatus: string) => Promise<void>;
    onRefresh: () => void;
}

interface KanbanColumn {
    id: string;
    title: string;
    leads: LeadsdeContato[];
    color: string;
}

export function LeadKanban({ leads, onUpdateStatus, onRefresh }: LeadKanbanProps) {
    const [columns, setColumns] = useState<Record<string, KanbanColumn>>({
        'Novo': {
            id: 'Novo',
            title: 'Novos',
            leads: [],
            color: 'bg-blue-500'
        },
        'Em Atendimento': {
            id: 'Em Atendimento',
            title: 'Em Atendimento',
            leads: [],
            color: 'bg-orange-500'
        }
    });

    useEffect(() => {
        const novos = leads.filter(l => l.leadStatus === 'Novo');
        const emAtendimento = leads.filter(l =>
            l.leadStatus === 'Em Contato' ||
            l.leadStatus === 'Qualificado' ||
            l.leadStatus === 'Em Atendimento'
        );

        setColumns({
            'Novo': {
                id: 'Novo',
                title: 'Novos',
                leads: novos,
                color: 'bg-blue-500'
            },
            'Em Atendimento': {
                id: 'Em Atendimento',
                title: 'Em Atendimento',
                leads: emAtendimento,
                color: 'bg-orange-500'
            }
        });
    }, [leads]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId === 'Em Atendimento' ? 'Em Contato' : 'Novo';
        await onUpdateStatus(draggableId, newStatus);
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-[calc(100vh-350px)] min-h-[500px] overflow-x-auto pb-4">
                {Object.values(columns).map((column) => (
                    <div key={column.id} className="flex-1 min-w-[350px] flex flex-col bg-primary-foreground/5 rounded-2xl border border-primary-foreground/10 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-primary-foreground/10 bg-secondary/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                                    {column.title}
                                </h3>
                                <Badge variant="outline" className="bg-primary-foreground/10 border-none text-primary-foreground/60">
                                    {column.leads.length}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/40">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-3 transition-colors ${snapshot.isDraggingOver ? 'bg-secondary/5' : ''} overflow-y-auto space-y-3`}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {column.leads.map((lead, index) => (
                                            <Draggable key={lead._id} draggableId={lead._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={provided.draggableProps.style}
                                                        className={`${snapshot.isDragging ? 'z-50' : ''}`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.2 }}
                                                            className={`bg-primary focus-within:ring-2 focus-within:ring-secondary/50 rounded-xl p-4 border border-primary-foreground/10 shadow-sm hover:border-secondary/30 transition-shadow ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-105 border-secondary' : ''}`}
                                                        >
                                                            <div className="space-y-3">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className="font-heading text-base text-primary-foreground font-medium line-clamp-1">
                                                                        {lead.fullName}
                                                                    </h4>
                                                                    <Badge className="bg-secondary/20 text-secondary border-none text-[10px] h-5 px-1.5 uppercase shrink-0">
                                                                        {lead.interessePrincipal || 'Geral'}
                                                                    </Badge>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center gap-2 text-primary-foreground/60">
                                                                        <Mail className="w-3.5 h-3.5" />
                                                                        <span className="text-xs truncate">{lead.email}</span>
                                                                    </div>
                                                                    {lead.phoneNumber && (
                                                                        <div className="flex items-center gap-2 text-primary-foreground/60">
                                                                            <Phone className="w-3.5 h-3.5" />
                                                                            <span className="text-xs">{lead.phoneNumber}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {lead.message && (
                                                                    <div className="bg-primary-foreground/5 rounded-lg p-2 mt-2">
                                                                        <p className="text-[11px] text-primary-foreground/70 line-clamp-2 italic italic-leading-relaxed">
                                                                            "{lead.message}"
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/5 mt-2">
                                                                    <div className="flex items-center gap-1.5 text-primary-foreground/40 text-[10px]">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span>{formatDate(lead.submissionDate)}</span>
                                                                    </div>
                                                                    <div className="flex -space-x-1.5">
                                                                        <div className="w-6 h-6 rounded-full bg-secondary/30 border border-primary text-[10px] flex items-center justify-center text-secondary-foreground font-bold">
                                                                            {lead.fullName?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    </AnimatePresence>
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        <div className="p-3 bg-primary-foreground/5 border-t border-primary-foreground/5">
                            <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-primary-foreground/50 hover:text-secondary hover:bg-secondary/10 text-sm font-medium">
                                <Plus className="w-4 h-4" />
                                Novo Lead
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
