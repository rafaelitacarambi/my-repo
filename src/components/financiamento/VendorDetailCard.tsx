import React, { useState } from 'react';
import {
    UserCheck,
    Building2,
    CheckCircle,
    X,
    FileCheck,
    Trash2,
    XCircle,
    RotateCcw,
    ChevronsUpDown,
    Check,
    ChevronDown,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Interfaces (aligned with those used in AdminFinancingKanbanPage)
interface Vendor {
    _id: string;
    clientRef: string;
    name: string;
    cpf: string;
    email?: string;
    contato?: string;
    estadoCivil?: string;
    ehConjugeDe?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: string;
    chavePix?: string;
}

interface VendorDocument {
    _id: string;
    docTipo: string;
    recebido: boolean;
    arquivo?: string;
    ativo: boolean;
    observacoes?: string;
    obrigatorio?: boolean;
}

interface VendorDetailCardProps {
    vendor: Vendor;
    allVendors: Vendor[];
    documents: VendorDocument[];
    onUpdateVendorData: (clientRef: string, field: string, value: any) => void;
    onUpdateDocument: (clientRef: string, docId: string, data: Partial<VendorDocument>) => void;
    onRestoreDocument: (clientRef: string, docId: string) => void;
    onDeleteDocument: (clientRef: string, docId: string) => void;
}

export const VendorDetailCard: React.FC<VendorDetailCardProps> = ({
    vendor,
    allVendors,
    documents,
    onUpdateVendorData,
    onUpdateDocument,
    onRestoreDocument,
    onDeleteDocument
}) => {
    // Deduplicate documents: Group by 'docTipo' and keep the most relevant one (e.g. active, received)
    // This fixes the persistent duplication issue where multiple docs of the same type exist with different IDs
    const uniqueDocumentsMap = new Map<string, VendorDocument>();

    documents.forEach(doc => {
        const existing = uniqueDocumentsMap.get(doc.docTipo);
        if (!existing) {
            uniqueDocumentsMap.set(doc.docTipo, doc);
        } else {
            // Priority logic: Active > Received > existing
            if (!existing.ativo && doc.ativo) {
                uniqueDocumentsMap.set(doc.docTipo, doc);
            } else if (existing.ativo === doc.ativo && !existing.recebido && doc.recebido) {
                uniqueDocumentsMap.set(doc.docTipo, doc);
            }
        }
    });

    const uniqueDocuments = Array.from(uniqueDocumentsMap.values());

    const activeDocs = uniqueDocuments.filter(d => d.ativo);
    const inactiveDocs = uniqueDocuments.filter(d => !d.ativo);

    const [open, setOpen] = React.useState(false);
    const [isRestorableOpen, setIsRestorableOpen] = useState(false);

    return (
        <Card className="h-full border-0 shadow-none">
            <CardContent className="p-0 space-y-6">

                {/* Header / Personal Data */}
                <div className="bg-white rounded-lg p-6 border border-border-gray shadow-sm">
                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                        <UserCheck className="w-5 h-5 text-secondary" />
                        Dados do Vendedor
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">Nome *</Label>
                            <Input
                                value={vendor.name}
                                disabled
                                className="h-10 bg-light-gray/50"
                            />
                        </div>
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">CPF *</Label>
                            <Input
                                value={vendor.cpf}
                                disabled
                                className="h-10 bg-light-gray/50"
                            />
                        </div>
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">Contato (Telefone/WhatsApp) *</Label>
                            <Input
                                value={vendor.contato || ''}
                                onChange={(e) => onUpdateVendorData(vendor.clientRef, 'contato', e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">E-mail *</Label>
                            <Input
                                value={vendor.email || ''}
                                onChange={(e) => onUpdateVendorData(vendor.clientRef, 'email', e.target.value)}
                                placeholder="email@exemplo.com"
                                className="h-10"
                            />
                        </div>

                        {/* Estado Civil */}
                        <div className="md:col-span-2">
                            <Label className="font-paragraph text-sm mb-2 block font-semibold">
                                Estado Civil do Vendedor *
                            </Label>
                            <Select
                                value={vendor.estadoCivil || ''}
                                onValueChange={(value) => onUpdateVendorData(vendor.clientRef, 'estadoCivil', value)}
                            >
                                <SelectTrigger className={`h-10 ${!vendor.estadoCivil ? 'border-red-500 border-2' : ''}`}>
                                    <SelectValue placeholder="Selecione o estado civil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                    <SelectItem value="União Estável">União Estável</SelectItem>
                                </SelectContent>
                            </Select>
                            {!vendor.estadoCivil && (
                                <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Campo obrigatório
                                </p>
                            )}
                        </div>

                        {/* Spouse Link */}
                        {allVendors.length > 1 && (
                            <div className="md:col-span-2 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                                <Label className="font-paragraph text-sm mb-3 block font-semibold">
                                    Este vendedor é cônjuge de algum dos vendedores já cadastrados?
                                </Label>
                                <RadioGroup
                                    value={vendor.ehConjugeDe ? 'sim' : 'nao'}
                                    onValueChange={(value) => {
                                        if (value === 'nao') {
                                            onUpdateVendorData(vendor.clientRef, 'ehConjugeDe', '');
                                        }
                                    }}
                                    className="flex gap-6 mb-3"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sim" id={`spouse-sim-${vendor.clientRef}`} />
                                        <Label htmlFor={`spouse-sim-${vendor.clientRef}`} className="cursor-pointer font-medium">Sim</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="nao" id={`spouse-nao-${vendor.clientRef}`} />
                                        <Label htmlFor={`spouse-nao-${vendor.clientRef}`} className="cursor-pointer font-medium">Não</Label>
                                    </div>
                                </RadioGroup>

                                {vendor.ehConjugeDe === '' && allVendors.length > 1 && (
                                    <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Selecione o cônjuge</Label>
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="w-full justify-between bg-white"
                                                >
                                                    {vendor.ehConjugeDe
                                                        ? allVendors.find((v) => v.clientRef === vendor.ehConjugeDe)?.name
                                                        : "Procurar vendedor..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Procurar vendedor..." />
                                                    <CommandEmpty>Nenhum vendedor encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {allVendors.filter(v => v.clientRef !== vendor.clientRef).map((v) => (
                                                            <CommandItem
                                                                key={v.clientRef}
                                                                value={v.name}
                                                                onSelect={() => {
                                                                    onUpdateVendorData(vendor.clientRef, 'ehConjugeDe', v.clientRef);
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        vendor.ehConjugeDe === v.clientRef ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {v.name} - {v.cpf}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}

                                {vendor.ehConjugeDe && (() => {
                                    const spouse = allVendors.find(v => v.clientRef === vendor.ehConjugeDe);
                                    return spouse ? (
                                        <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-800">
                                                    Vínculo conjugal com: {spouse.name}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onUpdateVendorData(vendor.clientRef, 'ehConjugeDe', '')}
                                                className="h-7 text-xs"
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Remover vínculo
                                            </Button>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bank Data */}
                <div className="bg-white rounded-lg p-6 border border-border-gray shadow-sm">
                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                        <Building2 className="w-5 h-5 text-secondary" />
                        Dados Bancários
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">Banco *</Label>
                            <Input
                                value={vendor.banco || ''}
                                onChange={(e) => onUpdateVendorData(vendor.clientRef, 'banco', e.target.value)}
                                placeholder="Ex: Banco do Brasil"
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">Agência *</Label>
                            <Input
                                value={vendor.agencia || ''}
                                onChange={(e) => onUpdateVendorData(vendor.clientRef, 'agencia', e.target.value)}
                                placeholder="Ex: 1234-5"
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">Conta *</Label>
                            <Input
                                value={vendor.conta || ''}
                                onChange={(e) => onUpdateVendorData(vendor.clientRef, 'conta', e.target.value)}
                                placeholder="Ex: 12345-6"
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="font-paragraph text-sm mb-2 block">Tipo de Conta *</Label>
                            <Select
                                value={vendor.tipoConta || 'Corrente'}
                                onValueChange={(value) => onUpdateVendorData(vendor.clientRef, 'tipoConta', value)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Corrente">Corrente</SelectItem>
                                    <SelectItem value="Poupança">Poupança</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label className="font-paragraph text-sm mb-2 block">Chave Pix (se houver)</Label>
                            <Input
                                value={vendor.chavePix || ''}
                                onChange={(e) => onUpdateVendorData(vendor.clientRef, 'chavePix', e.target.value)}
                                placeholder="CPF, e-mail, telefone ou chave aleatória"
                                className="h-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Documents - Simplified */}
                <div className="bg-white rounded-lg p-6 border border-border-gray shadow-sm">
                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                        <FileCheck className="w-5 h-5 text-secondary" />
                        Checklist de Documentos do Vendedor
                    </h5>

                    <div className="space-y-4">
                        {/* Document items - List only */}
                        <div className="space-y-3">
                            {activeDocs.map((doc) => {
                                const docNames: Record<string, string> = {
                                    'IDENTIFICACAO': 'Documento de Identificação (RG, CPF ou CNH)',
                                    'CERTIDAO': 'Certidão de Casamento ou Nascimento',
                                    'ENDERECO': 'Comprovante de Endereço'
                                };

                                return (
                                    <motion.div
                                        key={doc._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-lg border-2 transition-all ${doc.recebido
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-white border-border-gray hover:border-secondary/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <Checkbox
                                                    checked={doc.recebido}
                                                    onCheckedChange={(checked) =>
                                                        onUpdateDocument(vendor.clientRef, doc._id, {
                                                            recebido: checked as boolean
                                                        })
                                                    }
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Label className={`font-paragraph text-sm font-semibold cursor-pointer ${doc.recebido ? 'text-green-700' : 'text-foreground'
                                                            }`}>
                                                            {docNames[doc.docTipo] || doc.docTipo}
                                                        </Label>
                                                        {doc.obrigatorio && (
                                                            <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                                                                OBRIGATÓRIO
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {doc.recebido && (
                                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Documento recebido
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!doc.obrigatorio && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onDeleteDocument(vendor.clientRef, doc._id)}
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    title="Excluir item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Deleted documents section - RESTORE functionality (Collapsible) */}
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
                                        {inactiveDocs.map((doc) => {
                                            const docNames: Record<string, string> = {
                                                'IDENTIFICACAO': 'Documento de Identificação (RG, CPF ou CNH)',
                                                'CERTIDAO': 'Certidão de Casamento ou Nascimento',
                                                'ENDERECO': 'Comprovante de Endereço'
                                            };

                                            return (
                                                <div
                                                    key={doc._id}
                                                    className="p-3 rounded-lg border-2 border-dashed border-border-gray bg-gray-50 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <XCircle className="w-4 h-4 text-foreground/40" />
                                                        <span className="text-sm text-foreground/60 line-through">
                                                            {docNames[doc.docTipo] || doc.docTipo}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onRestoreDocument(vendor.clientRef, doc._id)}
                                                        className="h-8 text-xs bg-white hover:bg-secondary/10 border-secondary/30"
                                                    >
                                                        <RotateCcw className="w-3 h-3 mr-1" />
                                                        Restaurar
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
