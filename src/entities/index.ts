/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: agendamentos
 * Interface for Appointments
 */
export interface Appointments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType datetime */
  appointmentDateTime?: Date | string;
  /** @wixFieldType text */
  serviceType?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType number */
  duration?: number;
  /** @wixFieldType text */
  notes?: string;
}


/**
 * Collection ID: atendimentos
 * Interface for ServiceRecords
 */
export interface ServiceRecords {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType boolean */
  alertaAtraso?: boolean;
  /** @wixFieldType text */
  responsavelExterno?: string;
  /** @wixFieldType date */
  dataPrevistaConclusao?: Date | string;
  /** @wixFieldType text */
  contactName?: string;
  /** @wixFieldType text */
  responsavelInternoId?: string;
  /** @wixFieldType text */
  faseFinanciamento?: string;
  /** @wixFieldType text */
  contactEmail?: string;
  /** @wixFieldType text */
  contactPhone?: string;
  /** @wixFieldType text */
  serviceType?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  notes?: string;
  /** @wixFieldType datetime */
  creationDate?: Date | string;
  /** @wixFieldType text */
  priority?: string;
}


/**
 * Collection ID: clientes
 * Interface for Clients
 */
export interface Clients {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType text */
  notes?: string;
}


/**
 * Collection ID: corretores
 * Interface for RealEstateBrokers
 */
export interface RealEstateBrokers {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType image */
  profilePicture?: string;
  /** @wixFieldType text */
  creciNumber?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  emailAddress?: string;
  /** @wixFieldType text */
  biography?: string;
  /** @wixFieldType url */
  whatsAppUrl?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: documentosfinanciamento
 * Interface for DocumentosdoFinanciamento
 */
export interface DocumentosdoFinanciamento {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  documentName?: string;
  /** @wixFieldType text */
  documentType?: string;
  /** @wixFieldType url */
  documentUrl?: string;
  /** @wixFieldType date */
  uploadDate?: Date | string;
  /** @wixFieldType text */
  documentStatus?: string;
  /** @wixFieldType text */
  description?: string;
}


/**
 * Collection ID: financiamentodetalhes
 * Interface for DetalhesdoFinanciamento
 */
export interface DetalhesdoFinanciamento {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  bankName?: string;
  /** @wixFieldType text */
  bankAccountNumber?: string;
  /** @wixFieldType text */
  financingContractNumber?: string;
  /** @wixFieldType number */
  financingAmount?: number;
  /** @wixFieldType number */
  interestRate?: number;
  /** @wixFieldType number */
  loanTermMonths?: number;
  /** @wixFieldType date */
  firstPaymentDate?: Date | string;
}


/**
 * Collection ID: historicofinanciamento
 * Interface for HistricodeMovimentaesdoFinanciamento
 */
export interface HistricodeMovimentaesdoFinanciamento {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  financingProcessId?: string;
  /** @wixFieldType text */
  originPhase?: string;
  /** @wixFieldType text */
  destinationPhase?: string;
  /** @wixFieldType datetime */
  movementDateTime?: Date | string;
  /** @wixFieldType text */
  changedBy?: string;
}


/**
 * Collection ID: historicointeracoes
 * Interface for HistricodeInteraes
 */
export interface HistricodeInteraes {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType datetime */
  interactionDate?: Date | string;
  /** @wixFieldType text */
  interactionType?: string;
  /** @wixFieldType text */
  interactionDescription?: string;
  /** @wixFieldType text */
  interactionOutcome?: string;
  /** @wixFieldType text */
  interactionMedium?: string;
}


/**
 * Collection ID: imoveis
 * Interface for Imveis
 */
export interface Imveis {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  resumoImovel?: string;
  /** @wixFieldType url */
  tourVirtual?: string;
  /** @wixFieldType url */
  plantaBaixa?: string;
  /** @wixFieldType image */
  galeriaFotos?: string;
  /** @wixFieldType text */
  segmentosCompra?: string;
  /** @wixFieldType text */
  corretorResponsavelId?: string;
  /** @wixFieldType text */
  proprietarioId?: string;
  /** @wixFieldType boolean */
  aceitaFgts?: boolean;
  /** @wixFieldType text */
  diferenciais?: string;
  /** @wixFieldType boolean */
  acessibilidade?: boolean;
  /** @wixFieldType boolean */
  seguranca24h?: boolean;
  /** @wixFieldType boolean */
  playground?: boolean;
  /** @wixFieldType boolean */
  piscina?: boolean;
  /** @wixFieldType boolean */
  churrasqueira?: boolean;
  /** @wixFieldType boolean */
  academia?: boolean;
  /** @wixFieldType boolean */
  elevador?: boolean;
  /** @wixFieldType boolean */
  sacadaVaranda?: boolean;
  /** @wixFieldType boolean */
  armariosPlanejados?: boolean;
  /** @wixFieldType boolean */
  aceitaFinanciamentoCaixa?: boolean;
  /** @wixFieldType number */
  andar?: number;
  /** @wixFieldType boolean */
  permiteFinanciamento?: boolean;
  /** @wixFieldType text */
  posicaoSol?: string;
  /** @wixFieldType number */
  numeroPavimentos?: number;
  /** @wixFieldType number */
  areaUtil?: number;
  /** @wixFieldType number */
  valorCondominio?: number;
  /** @wixFieldType number */
  suites?: number;
  /** @wixFieldType number */
  valorSinal?: number;
  /** @wixFieldType number */
  iptuAnual?: number;
  /** @wixFieldType number */
  precoVenda?: number;
  /** @wixFieldType number */
  precoLocacao?: number;
  /** @wixFieldType boolean */
  investimentoOportunidade?: boolean;
  /** @wixFieldType text */
  segmentoCompra?: string;
  /** @wixFieldType text */
  propertyName?: string;
  /** @wixFieldType text */
  propertyType?: string;
  /** @wixFieldType text */
  transactionType?: string;
  /** @wixFieldType number */
  price?: number;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType number */
  bedrooms?: number;
  /** @wixFieldType number */
  bathrooms?: number;
  /** @wixFieldType number */
  area?: number;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType image */
  propertyImages?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType url */
  keyQrCodeUrl?: string;
}


/**
 * Collection ID: leadsdecontato
 * Interface for LeadsdeContato
 */
export interface LeadsdeContato {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  message?: string;
  /** @wixFieldType text */
  propertyOfInterest?: string;
  /** @wixFieldType url */
  propertyUrl?: string;
  /** @wixFieldType text */
  leadSource?: string;
  /** @wixFieldType text */
  leadStatus?: string;
  /** @wixFieldType datetime */
  submissionDate?: Date | string;
}


/**
 * Collection ID: pendenciasfinanciamento
 * Interface for PendnciasdoFinanciamento
 */
export interface PendnciasdoFinanciamento {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  financingCaseId?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  priority?: string;
  /** @wixFieldType datetime */
  creationDate?: Date | string;
  /** @wixFieldType datetime */
  dueDate?: Date | string;
  /** @wixFieldType text */
  responsiblePartyType?: string;
  /** @wixFieldType text */
  responsiblePartyDetails?: string;
  /** @wixFieldType boolean */
  taskAutomaticallyCreated?: boolean;
  /** @wixFieldType datetime */
  resolvedDate?: Date | string;
}


/**
 * Collection ID: processosdevenda
 * Interface for ProcessosdeVenda
 */
export interface ProcessosdeVenda {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  processTitle?: string;
  /** @wixFieldType text */
  currentStatus?: string;
  /** @wixFieldType datetime */
  startDate?: Date | string;
  /** @wixFieldType datetime */
  lastUpdateDate?: Date | string;
  /** @wixFieldType text */
  processStage?: string;
  /** @wixFieldType date */
  expectedClosingDate?: Date | string;
  /** @wixFieldType text */
  notes?: string;
}


/**
 * Collection ID: tarefasfinanciamento
 * Interface for FinancingTasks
 */
export interface FinancingTasks {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  pendingItemReference?: string;
  /** @wixFieldType text */
  responsibleType?: string;
  /** @wixFieldType text */
  internalResponsibleId?: string;
  /** @wixFieldType text */
  externalResponsibleName?: string;
  /** @wixFieldType text */
  externalResponsibleContact?: string;
  /** @wixFieldType datetime */
  dueDate?: Date | string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType datetime */
  creationDate?: Date | string;
}


/**
 * Collection ID: usuariossistema
 * Interface for UsuriosdoSistema
 */
export interface UsuriosdoSistema {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  emailLogin?: string;
  /** @wixFieldType text */
  profile?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType datetime */
  inviteDate?: Date | string;
  /** @wixFieldType datetime */
  lastLogin?: Date | string;
}


/**
 * Collection ID: vinculosprocessos
 * Interface for ProcessBindings
 */
export interface ProcessBindings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  userId?: string;
  /** @wixFieldType text */
  serviceId?: string;
  /** @wixFieldType text */
  linkType?: string;
  /** @wixFieldType text */
  permission?: string;
  /** @wixFieldType datetime */
  bindingDate?: Date | string;
  /** @wixFieldType text */
  notes?: string;
}
