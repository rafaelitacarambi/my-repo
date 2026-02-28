import React, { useState } from 'react';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    UserCheck,
    CheckSquare,
    FileCheck,
    Trash2,
    RotateCcw,
    ChevronDown,
    ChevronRight,
    XCircle,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { DEFAULT_PROPONENT_DOCUMENTS, PROPONENT_CHECKLIST_QUESTIONS } from '@/config/financing-constants';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { CopyButton } from '@/components/ui/CopyButton';

interface ProponentChecklistCardProps {
    proponentId: string;
    role: string;
    name: string;
    cpf: string;
    spouseRef?: string;
    allProponents?: Array<{ clientRef: string; name: string; cpf: string }>;
    checklist?: any; // ChecklistdosProponentes
    documents?: any[]; // DocumentosProponentes
    onUpdateChecklist: (proponentId: string, field: string, value: boolean | null) => void;
    onUpdateDocument: (proponentId: string, docName: string, received: boolean, isMandatory: boolean) => void;
    onDeleteDocument?: (proponentId: string, docName: string) => void;
    onRestoreDocument?: (proponentId: string, docName: string) => void;
    onUpdateRole?: (proponentId: string, newRole: string) => void;
    onUpdateSpouse?: (proponentId: string, spouseId: string) => void;
    onRemove?: () => void;
}

export function ProponentChecklistCard({
    proponentId,
    role,
    name,
    cpf,
    spouseRef,
    allProponents = [],
    checklist,
    documents = [],
    onUpdateChecklist,
    onUpdateDocument,
    onDeleteDocument,
    onRestoreDocument,
    onUpdateRole,
    onUpdateSpouse,
    onRemove
}: ProponentChecklistCardProps) {
    const [isRestorableOpen, setIsRestorableOpen] = useState(false);
    const [openSpouseSelect, setOpenSpouseSelect] = useState(false);

    // Filter documents into active and inactive (deleted)
    const activeDocs = DEFAULT_PROPONENT_DOCUMENTS.filter(defDoc => {
        const existingDoc = documents.find(d => d.documentName === defDoc.documentName);
        if (existingDoc && existingDoc.isActive === false) return false;
        return true;
    });

    const inactiveDocs = DEFAULT_PROPONENT_DOCUMENTS.filter(defDoc => {
        const existingDoc = documents.find(d => d.documentName === defDoc.documentName);
        return existingDoc && existingDoc.isActive === false;
    });

    return (
        <Card className="h-full border-0 shadow-none flex flex-col">
            <ScrollArea className="flex-1 h-full">
                <CardContent className="p-6 space-y-6">

                    {/* Dados do Proponente */}
                    <div className="bg-white rounded-lg p-6 border border-border-gray shadow-sm">
                        <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                            <UserCheck className="w-5 h-5 text-secondary" />
                            Dados do Proponente
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="group relative">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Nome</Label>
                                    <CopyButton value={name} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <Input
                                    value={name}
                                    disabled
                                    className="h-10 bg-light-gray/50 cursor-default"
                                />
                            </div>
                            <div className="group relative">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">CPF</Label>
                                    <CopyButton value={cpf} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <Input
                                    value={cpf}
                                    disabled
                                    className="h-10 bg-light-gray/50 cursor-default"
                                />
                            </div>

                        </div>

                        {/* Spouse Link Section */}
                        {allProponents.length > 1 && onUpdateSpouse && (
                            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg mt-6">
                                <Label className="font-paragraph text-sm mb-3 block font-semibold text-blue-900">
                                    Este proponente é cônjuge de outro participante?
                                </Label>

                                <RadioGroup
                                    value={spouseRef ? 'sim' : 'nao'}
                                    onValueChange={(value) => {
                                        if (value === 'nao') {
                                            onUpdateSpouse(proponentId, '');
                                        }
                                    }}
                                    className="flex gap-6 mb-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sim" id={`spouse-sim-${proponentId}`} className="border-blue-400 text-blue-600" />
                                        <Label htmlFor={`spouse-sim-${proponentId}`} className="cursor-pointer font-medium text-slate-700">Sim</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="nao" id={`spouse-nao-${proponentId}`} className="border-blue-400 text-blue-600" />
                                        <Label htmlFor={`spouse-nao-${proponentId}`} className="cursor-pointer font-medium text-slate-700">Não</Label>
                                    </div>
                                </RadioGroup>

                                {!spouseRef && (
                                    <div className={`transition-all duration-300 overflow-hidden ${spouseRef ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                                        <Popover open={openSpouseSelect} onOpenChange={setOpenSpouseSelect}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openSpouseSelect}
                                                    className="w-full justify-between bg-white border-blue-200 hover:bg-blue-50 text-slate-700"
                                                    disabled={!!spouseRef} // Disable if already linked (though hidden by UX choice typically, keeping for safety)
                                                >
                                                    {spouseRef
                                                        ? allProponents.find((p) => p.clientRef === spouseRef)?.name
                                                        : "Selecione o cônjuge..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Procurar proponente..." />
                                                    <CommandEmpty>Nenhum proponente encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {allProponents.filter(p => p.clientRef !== proponentId).map((p) => (
                                                            <CommandItem
                                                                key={p.clientRef}
                                                                value={p.name}
                                                                onSelect={() => {
                                                                    onUpdateSpouse(proponentId, p.clientRef);
                                                                    setOpenSpouseSelect(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        spouseRef === p.clientRef ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {p.name} - {p.cpf}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}

                                {spouseRef && (() => {
                                    const spouse = allProponents.find(p => p.clientRef === spouseRef);
                                    return spouse ? (
                                        <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-800">
                                                    Cônjuge de: {spouse.name}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onUpdateSpouse(proponentId, '')}
                                                className="h-7 text-xs hover:bg-green-100 hover:text-green-900 text-green-700"
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Desvincular
                                            </Button>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Perguntas Obrigatórias */}
                    <div className="bg-white rounded-lg p-6 border border-border-gray shadow-sm">
                        <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                            <CheckSquare className="w-5 h-5 text-secondary" />
                            Perguntas Obrigatórias
                        </h5>
                        <div className="space-y-4">
                            {PROPONENT_CHECKLIST_QUESTIONS.map((q) => {
                                // Map question IDs from constants to DB fields
                                const fieldMap: Record<string, string> = {
                                    'contrib_fgts': 'hasFgtsContribution',
                                    'dependente': 'hasDependent',
                                    'ir': 'declaresIncomeTax',
                                    'imovel': 'ownsProperty',
                                    'financ_ativo': 'hasActiveFinancing',
                                    'primeira_aquisicao': 'isFirstAcquisition'
                                };

                                const dbField = fieldMap[q.id] || q.id;
                                const currentVal = checklist?.[dbField]; // true, false, or undefined

                                return (
                                    <div key={q.id} className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100">
                                        <Label className="text-sm text-slate-700 font-medium flex-1 mr-4 leading-relaxed">{q.text}</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={currentVal === true ? "default" : "outline"}
                                                className={`h-8 w-12 ${currentVal === true ? 'bg-green-600 hover:bg-green-700' : 'text-slate-500 hover:text-green-600 border-slate-200'}`}
                                                onClick={() => onUpdateChecklist(proponentId, dbField, currentVal === true ? null : true)}
                                            >
                                                Sim
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={currentVal === false ? "default" : "outline"}
                                                className={`h-8 w-12 ${currentVal === false ? 'bg-red-600 hover:bg-red-700' : 'text-slate-500 hover:text-red-600 border-slate-200'}`}
                                                onClick={() => onUpdateChecklist(proponentId, dbField, currentVal === false ? null : false)}
                                            >
                                                Não
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Documentos Necessários */}
                    <div className="bg-white rounded-lg p-6 border border-border-gray shadow-sm">
                        <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                            <FileCheck className="w-5 h-5 text-secondary" />
                            Documentos Necessários
                        </h5>

                        <div className="space-y-4">
                            {/* Document Items */}
                            <div className="space-y-3">
                                {activeDocs.map((defDoc, idx) => {
                                    const existingDoc = documents.find(d => d.documentName === defDoc.documentName);
                                    const isChecked = existingDoc?.isReceived || false;

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-lg border-2 transition-all ${isChecked
                                                ? 'bg-green-50 border-green-300'
                                                : 'bg-white border-border-gray hover:border-secondary/40'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <Checkbox
                                                        id={`doc-${proponentId}-${defDoc.documentName}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(c) => onUpdateDocument(proponentId, defDoc.documentName, !!c, defDoc.isMandatory)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Label
                                                                htmlFor={`doc-${proponentId}-${defDoc.documentName}`}
                                                                className={`font-paragraph text-sm font-semibold cursor-pointer ${isChecked ? 'text-green-700' : 'text-foreground'}`}
                                                            >
                                                                {defDoc.documentName}
                                                            </Label>
                                                            {defDoc.isMandatory && !isChecked && (
                                                                <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                                                                    OBRIGATÓRIO
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {isChecked && (
                                                            <p className="text-xs text-green-600 flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Documento recebido
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Delete Button */}
                                                {!defDoc.isMandatory && onDeleteDocument && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onDeleteDocument(proponentId, defDoc.documentName)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        title="Excluir item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Deleted Documents Section */}
                            {inactiveDocs.length > 0 && (
                                <Collapsible
                                    open={isRestorableOpen}
                                    onOpenChange={setIsRestorableOpen}
                                    className="mt-6 pt-6 border-t-2 border-border-gray"
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="flex items-center justify-between w-full p-2 h-auto hover:bg-slate-100">
                                            <div className="flex items-center gap-2">
                                                <RotateCcw className="w-4 h-4 text-foreground/70" />
                                                <h6 className="font-heading text-sm font-bold text-foreground/70">
                                                    Documentos Excluídos (Restaurar)
                                                </h6>
                                            </div>
                                            {isRestorableOpen ? (
                                                <ChevronDown className="h-4 w-4 text-foreground/50" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-foreground/50" />
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="space-y-2 mt-3 pl-2">
                                            {inactiveDocs.map((defDoc, idx) => (
                                                <div
                                                    key={`inactive-${idx}`}
                                                    className="p-3 rounded-lg border-2 border-dashed border-border-gray bg-gray-50 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <XCircle className="w-4 h-4 text-foreground/40" />
                                                        <span className="text-sm text-foreground/60 line-through">
                                                            {defDoc.documentName}
                                                        </span>
                                                    </div>
                                                    {onRestoreDocument && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onRestoreDocument(proponentId, defDoc.documentName)}
                                                            className="h-8 text-xs bg-white hover:bg-secondary/10 border-secondary/30"
                                                        >
                                                            <RotateCcw className="w-3 h-3 mr-1" />
                                                            Restaurar
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </div>
                    </div>
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
