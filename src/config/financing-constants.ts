
import { ChecklistAnswer } from './FinancingChecklists';

export interface FinancingColumn {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    checklistItems?: string[];
}

// Financing Columns Configuration - Trello-style (neutral colors)
export const FINANCING_COLUMNS: FinancingColumn[] = [
    {
        id: 'novos-clientes', name: 'Novos clientes', color: 'bg-blue-100 border-blue-300', bgColor: 'bg-blue-100', borderColor: 'border-blue-300',
        checklistItems: []
    },
    {
        id: 'cadastro-cliente', name: 'Cadastro de cliente', color: 'bg-purple-100 border-purple-300', bgColor: 'bg-purple-100', borderColor: 'border-purple-300',
        checklistItems: []
    },
    {
        id: 'avaliacao-risco', name: 'Avaliação de risco', color: 'bg-orange-100 border-orange-300', bgColor: 'bg-orange-100', borderColor: 'border-orange-300',
        checklistItems: []
    },
    {
        id: 'aprovados', name: 'Aprovados', color: 'bg-green-50 border-green-200', bgColor: 'bg-green-50', borderColor: 'border-green-200',
        checklistItems: ['Cliente comunicado', 'Seguir para Engenharia']
    },
    {
        id: 'engenharia', name: 'Engenharia', color: 'bg-indigo-100 border-indigo-300', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300',
        checklistItems: []
    },
    {
        id: 'fgts', name: 'FGTS', color: 'bg-gray-100 border-gray-300', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
        checklistItems: []
    },
    {
        id: 'siopi', name: 'SIOPI', color: 'bg-cyan-100 border-cyan-300', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300',
        checklistItems: []
    },
    {
        id: 'formularios', name: 'Assinatura de Formulários', color: 'bg-teal-100 border-teal-300', bgColor: 'bg-teal-100', borderColor: 'border-teal-300',
        checklistItems: []
    },
    {
        id: 'sictd', name: 'SICTD', color: 'bg-slate-100 border-slate-300', bgColor: 'bg-slate-100', borderColor: 'border-slate-300',
        checklistItems: []
    },
    {
        id: 'entrevista', name: 'Entrevista', color: 'bg-violet-100 border-violet-300', bgColor: 'bg-violet-100', borderColor: 'border-violet-300',
        checklistItems: []
    },
    {
        id: 'assinatura-minuta', name: 'Minuta', color: 'bg-fuchsia-100 border-fuchsia-300', bgColor: 'bg-fuchsia-100', borderColor: 'border-fuchsia-300',
        checklistItems: []
    },
    {
        id: 'itbi', name: 'ITBI', color: 'bg-lime-100 border-lime-300', bgColor: 'bg-lime-100', borderColor: 'border-lime-300',
        checklistItems: []
    },
    {
        id: 'cartorio-rsales', name: 'Cartório R.Sales', color: 'bg-rose-100 border-rose-300', bgColor: 'bg-rose-100', borderColor: 'border-rose-300',
        checklistItems: []
    },
    {
        id: 'garantia', name: 'Garantia', color: 'bg-emerald-100 border-emerald-300', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300',
        checklistItems: []
    },
    {
        id: 'concluido', name: 'Concluído', color: 'bg-green-100 border-green-300', bgColor: 'bg-green-100', borderColor: 'border-green-300',
        checklistItems: []
    },
    {
        id: 'acompanhamento-obra', name: 'Acompanhamento de obra', color: 'bg-gray-100 border-gray-300', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
        checklistItems: ['Medição mensal', 'Liberar parcelas']
    },
    {
        id: 'aguardando-imovel', name: 'Aguardando o imóvel', color: 'bg-gray-100 border-gray-300', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
        checklistItems: [
            'Cliente enviou opções?',
            'Agendar visitas?',
            'Validar documentação básica do imóvel?'
        ]
    },
    {
        id: 'condicionados', name: 'Condicionados', color: 'bg-yellow-100 border-yellow-300', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300',
        checklistItems: ['Resolver pendências da condicionante', 'Reenviar para análise']
    },
    {
        id: 'reprovados', name: 'Reprovados', color: 'bg-red-100 border-red-300', bgColor: 'bg-red-100', borderColor: 'border-red-300',
        checklistItems: ['Motivo da reprovação registrado', 'Cliente comunicado', 'Verificar possibilidade de nova tentativa futura']
    }
];

// Special display order for the History/Checklist tab
export const CHECKLIST_DISPLAY_ORDER = [
    'novos-clientes',
    'cadastro-cliente',
    'avaliacao-risco',
    'aprovados',
    'engenharia',
    'fgts',
    'siopi',
    'formularios',
    'sictd',
    'entrevista',
    'assinatura-minuta',
    'itbi',
    'cartorio-rsales',
    'garantia',
    'concluido',
    'acompanhamento-obra',
    'aguardando-imovel',
    'condicionados',
    'reprovados'
];

export const RESPONSIBLE_TYPES = ['Interno', 'Cliente', 'Parceiro Externo', 'Construtora', 'Caixa', 'Cartório', 'Sistema/Prazo legal'];
export const PRIORITY_LEVELS = ['Alta', 'Média', 'Baixa'];
export const PENDING_STATUS = ['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'];
export const TASK_STATUS = ['Pendente', 'Em Progresso', 'Concluída', 'Atrasada'];

// Default document types for each proponent
export const DEFAULT_PROPONENT_DOCUMENTS = [
    { documentName: 'Documento de Identificação (RG, CPF ou CNH)', isMandatory: true },
    { documentName: 'Comprovante de residência atual (Se houver)', isMandatory: false },
    { documentName: 'Certidão de nascimento ou casamento (Se houver)', isMandatory: false },
    { documentName: 'Holerite dos últimos 2 meses (se houver)', isMandatory: false },
    { documentName: 'Pró-labore dos últimos 3 meses (se houver)', isMandatory: false },
    { documentName: 'Extrato do FGTS (se houver)', isMandatory: false },
    { documentName: 'Declaração de Imposto de Renda (se houver)', isMandatory: false }
];

export const MODALIDADE_OPTIONS = [
    'MCMV faixa 1 Empreendimento caixa',
    'MCMV faixa 2 Empreendimento caixa',
    'MCMV faixa 3 Empreendimento caixa',
    'NPMCMV faixa 4 Empreendimento caixa',
    'SBPE Empreendimento caixa',
    'MCMV faixa 1',
    'MCMV faixa 2',
    'MCMV faixa 3',
    'NPMCMV faixa 4',
    'SBPE',
    'Aquisição de terreno e construção',
    'Aquisição de terreno',
    'Construção',
    'Leilão'
];

export const PROPONENT_CHECKLIST_QUESTIONS = [
    { id: 'contrib_fgts', text: 'Possui 3 anos de contribuição FGTS?' },
    { id: 'dependente', text: 'Possui dependente ou participante?' },
    { id: 'ir', text: 'Declara imposto de renda?' },
    { id: 'imovel', text: 'Possui imóvel?' },
    { id: 'financ_ativo', text: 'Possui financiamento ativo?' },
    { id: 'primeira_aquisicao', text: 'Primeira aquisição no âmbito SFH?' }
];
