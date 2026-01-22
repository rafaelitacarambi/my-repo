import { ServiceRecords, Clients } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/integrations';

interface ProcessDetailsModalProps {
  process: ServiceRecords;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProcessDetailsModal({
  process,
  isOpen,
  onClose,
}: ProcessDetailsModalProps) {
  const [client, setClient] = useState<Clients | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (process.clientePrincipalRef) {
      loadClient();
    } else {
      setIsLoading(false);
    }
  }, [process]);

  const loadClient = async () => {
    try {
      const clientData = await BaseCrudService.getById<Clients>(
        'clientes',
        process.clientePrincipalRef!
      );
      setClient(clientData);
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-gray sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-foreground">Detalhes do Processo</h2>
          <button
            onClick={onClose}
            className="text-dark-gray hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <p className="text-center text-dark-gray">Carregando...</p>
          ) : (
            <>
              {/* Client Info */}
              {client && (
                <div className="bg-light-gray p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Cliente Principal</h3>
                  <p className="text-sm text-dark-gray">{client.clientName}</p>
                  {client.email && (
                    <p className="text-sm text-dark-gray">{client.email}</p>
                  )}
                  {client.phoneNumber && (
                    <p className="text-sm text-dark-gray">{client.phoneNumber}</p>
                  )}
                </div>
              )}

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-dark-gray font-semibold">Tipo de Serviço</p>
                  <p className="text-sm text-foreground">{process.serviceType}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-gray font-semibold">Status</p>
                  <p className="text-sm text-foreground">{process.status}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-gray font-semibold">Prioridade</p>
                  <p className="text-sm text-foreground">{process.priority || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-gray font-semibold">Fase do Financiamento</p>
                  <p className="text-sm text-foreground">{process.faseFinanciamento || 'N/A'}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {process.creationDate && (
                  <div>
                    <p className="text-xs text-dark-gray font-semibold">Data de Criação</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(process.creationDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                {process.dataPrevistaConclusao && (
                  <div>
                    <p className="text-xs text-dark-gray font-semibold">Prazo Previsto</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(process.dataPrevistaConclusao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                {process.dataConclusao && (
                  <div>
                    <p className="text-xs text-dark-gray font-semibold">Data de Conclusão</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(process.dataConclusao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {process.notes && (
                <div>
                  <p className="text-xs text-dark-gray font-semibold">Observações</p>
                  <p className="text-sm text-foreground">{process.notes}</p>
                </div>
              )}

              {/* Contact Info */}
              {(process.contactName || process.contactEmail || process.contactPhone) && (
                <div className="bg-light-gray p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Contato</h3>
                  {process.contactName && (
                    <p className="text-sm text-dark-gray">{process.contactName}</p>
                  )}
                  {process.contactEmail && (
                    <p className="text-sm text-dark-gray">{process.contactEmail}</p>
                  )}
                  {process.contactPhone && (
                    <p className="text-sm text-dark-gray">{process.contactPhone}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border-gray">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
