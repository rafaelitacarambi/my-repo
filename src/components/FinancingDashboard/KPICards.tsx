import { ServiceRecords } from '@/entities';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KPICardsProps {
  serviceRecords: ServiceRecords[];
}

export default function KPICards({ serviceRecords }: KPICardsProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Processos em andamento
  const ongoingCount = serviceRecords.filter(
    s => s.status !== 'Concluído' && s.status !== 'Cancelado'
  ).length;

  // Processos concluídos no mês
  const completedThisMonth = serviceRecords.filter(s => {
    if (!s.dataConclusao) return false;
    const conclusionDate = new Date(s.dataConclusao);
    return isWithinInterval(conclusionDate, { start: monthStart, end: monthEnd });
  }).length;

  // Processos em atraso
  const overdueCount = serviceRecords.filter(s => {
    if (s.status === 'Concluído' || s.status === 'Cancelado') return false;
    if (!s.dataPrevistaConclusao) return false;
    const dueDate = new Date(s.dataPrevistaConclusao);
    return dueDate < now;
  }).length;

  const kpis = [
    {
      label: 'Processos em Andamento',
      value: ongoingCount,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      label: 'Concluídos este Mês',
      value: completedThisMonth,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    {
      label: 'Em Atraso',
      value: overdueCount,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {kpis.map((kpi, idx) => (
        <div key={idx} className={`${kpi.color} border rounded-lg p-6`}>
          <p className="text-sm text-dark-gray mb-2">{kpi.label}</p>
          <p className={`text-3xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
