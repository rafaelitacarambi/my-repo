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
 * Collection ID: atendimentoimoveis
 * Interface for AtendimentoImveis
 */
export interface AtendimentoImveis {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  atendimentoRef?: string;
  /** @wixFieldType text */
  imovelRef?: string;
  /** @wixFieldType text */
  role?: string;
  /** @wixFieldType datetime */
  dateAdded?: Date | string;
  /** @wixFieldType text */
  notes?: string;
}


/**
 * Collection ID: atendimentopartes
 * Interface for ServiceParties
 */
export interface ServiceParties {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  serviceRecordRef?: string;
  /** @wixFieldType text */
  clientRef?: string;
  /** @wixFieldType text */
  roleInService?: string;
  /** @wixFieldType number */
  participationPercentage?: number;
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
  pastaInterna?: string;
  /** @wixFieldType text */
  clientePrincipalRef?: string;
  /** @wixFieldType text */
  canalOrigem?: string;
  /** @wixFieldType datetime */
  dataConclusao?: Date | string;
  /** @wixFieldType text */
  empresaResponsavelRef?: string;
  /** @wixFieldType text */
  unidadeResponsavelRef?: string;
  /** @wixFieldType text */
  corretorResponsavelRef?: string;
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
 * Collection ID: checklistproponentes
 * Interface for ChecklistdosProponentes
 */
export interface ChecklistdosProponentes {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  atendimentoRef?: string;
  /** @wixFieldType text */
  clientRef?: string;
  /** @wixFieldType boolean */
  hasFgtsContribution?: boolean;
  /** @wixFieldType boolean */
  hasDependent?: boolean;
  /** @wixFieldType boolean */
  declaresIncomeTax?: boolean;
  /** @wixFieldType boolean */
  ownsProperty?: boolean;
  /** @wixFieldType boolean */
  hasActiveFinancing?: boolean;
  /** @wixFieldType boolean */
  isFirstAcquisition?: boolean;
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
  papeis?: string;
  /** @wixFieldType text */
  tipoPessoa?: string;
  /** @wixFieldType text */
  whatsAppPrincipal?: string;
  /** @wixFieldType text */
  telefonePrincipal?: string;
  /** @wixFieldType text */
  emailPrincipal?: string;
  /** @wixFieldType text */
  nomeFantasia?: string;
  /** @wixFieldType text */
  nomeRazaoSocial?: string;
  /** @wixFieldType text */
  cpfCnpj?: string;
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
 * Collection ID: contratos
 * Interface for GeneratedContracts
 */
export interface GeneratedContracts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  serviceRecordRef?: string;
  /** @wixFieldType text */
  clientRefs?: string;
  /** @wixFieldType text */
  contractType?: string;
  /** @wixFieldType number */
  version?: number;
  /** @wixFieldType text */
  filledData?: string;
  /** @wixFieldType url */
  generatedPdf?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType datetime */
  creationDate?: Date | string;
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
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
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
  enviadoPor?: string;
  /** @wixFieldType text */
  origem?: string;
  /** @wixFieldType text */
  atendimentoRef?: string;
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
 * Collection ID: empresas
 * Interface for Companies
 */
export interface Companies {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  tradeName?: string;
  /** @wixFieldType text */
  legalName?: string;
  /** @wixFieldType text */
  cnpj?: string;
  /** @wixFieldType text */
  type?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: equipedistribuicao
 * Interface for EquipedeDistribuio
 */
export interface EquipedeDistribuio {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  userRef?: string;
  /** @wixFieldType text */
  leadSectorRefs?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType number */
  queueOrder?: number;
  /** @wixFieldType number */
  maxDailyCapacity?: number;
}


/**
 * Collection ID: financeirolancamentos
 * Interface for FinancialEntries
 */
export interface FinancialEntries {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  serviceRecordId?: string;
  /** @wixFieldType text */
  type?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType number */
  value?: number;
  /** @wixFieldType date */
  competenceDate?: Date | string;
  /** @wixFieldType date */
  paymentDate?: Date | string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  payerClientId?: string;
  /** @wixFieldType text */
  receiverName?: string;
  /** @wixFieldType text */
  receiverType?: string;
  /** @wixFieldType text */
  notes?: string;
  /** @wixFieldType number */
  brokerCommissionValue?: number;
  /** @wixFieldType number */
  partnerCommissionValue?: number;
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
 * Collection ID: financiamentodocsvendedor
 * Interface for FinancingVendorDocuments
 */
export interface FinancingVendorDocuments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  atendimentoRef?: string;
  /** @wixFieldType text */
  vendedorClienteRef?: string;
  /** @wixFieldType text */
  docTipo?: string;
  /** @wixFieldType boolean */
  recebido?: boolean;
  /** @wixFieldType url */
  arquivo?: string;
  /** @wixFieldType boolean */
  ativo?: boolean;
  /** @wixFieldType text */
  observacoes?: string;
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
  /** @wixFieldType text */
  autorTipo?: string;
  /** @wixFieldType text */
  autorRef?: string;
  /** @wixFieldType text */
  atendimentoRef?: string;
  /** @wixFieldType text */
  tipoEvento?: string;
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
  /** @wixFieldType number */
  rendaMinimaEstimada?: number;
  /** @wixFieldType number */
  entradaMinimaEstimada?: number;
  /** @wixFieldType text */
  bairro?: string;
  /** @wixFieldType text */
  cidade?: string;
  /** @wixFieldType url */
  tourVirtual?: string;
  /** @wixFieldType url */
  plantaBaixa?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
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
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
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
  /** @wixFieldType datetime */
  ultimaInteracao?: Date | string;
  /** @wixFieldType text */
  tipoImovelDesejado?: string;
  /** @wixFieldType text */
  urgencia?: string;
  /** @wixFieldType text */
  perfilCompra?: string;
  /** @wixFieldType number */
  rendaBruta?: number;
  /** @wixFieldType number */
  potencialEntrada?: number;
  /** @wixFieldType number */
  faixaValorMax?: number;
  /** @wixFieldType number */
  faixaValorMin?: number;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  bairroDesejado?: string;
  /** @wixFieldType text */
  cidadeDesejada?: string;
  /** @wixFieldType text */
  interessePrincipal?: string;
  /** @wixFieldType text */
  unidadeRef?: string;
  /** @wixFieldType text */
  responsavelRef?: string;
  /** @wixFieldType text */
  statusFunil?: string;
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
 * Collection ID: matches
 * Interface for LeadPropertyMatches
 */
export interface LeadPropertyMatches {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  leadRef?: string;
  /** @wixFieldType text */
  propertyRef?: string;
  /** @wixFieldType number */
  score?: number;
  /** @wixFieldType text */
  reason?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  responsibleAgentRef?: string;
  /** @wixFieldType date */
  matchDate?: Date | string;
  /** @wixFieldType boolean */
  notifiedWhatsApp?: boolean;
  /** @wixFieldType boolean */
  notifiedEmail?: boolean;
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
  concluidoPorRef?: string;
  /** @wixFieldType datetime */
  dataUltimaAtualizacao?: Date | string;
  /** @wixFieldType text */
  responsavelExternoRef?: string;
  /** @wixFieldType datetime */
  dataHoraConclusao?: Date | string;
  /** @wixFieldType text */
  responsavelEntidadeTexto?: string;
  /** @wixFieldType text */
  categoria?: string;
  /** @wixFieldType text */
  responsavelInternoRef?: string;
  /** @wixFieldType boolean */
  bloqueiaFase?: boolean;
  /** @wixFieldType text */
  tipo?: string;
  /** @wixFieldType text */
  atendimentoRef?: string;
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
 * Collection ID: preferenciaslead
 * Interface for LeadPreferences
 */
export interface LeadPreferences {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  leadReference?: string;
  /** @wixFieldType text */
  city?: string;
  /** @wixFieldType text */
  neighborhood?: string;
  /** @wixFieldType text */
  propertyType?: string;
  /** @wixFieldType number */
  minimumValue?: number;
  /** @wixFieldType number */
  maximumValue?: number;
  /** @wixFieldType number */
  minimumDownPayment?: number;
  /** @wixFieldType number */
  maximumDownPayment?: number;
  /** @wixFieldType text */
  purchaseProfile?: string;
  /** @wixFieldType boolean */
  acceptsOffPlan?: boolean;
  /** @wixFieldType boolean */
  acceptsRenovation?: boolean;
  /** @wixFieldType boolean */
  acceptsAuction?: boolean;
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
 * Collection ID: setoreslead
 * Interface for LeadSectors
 */
export interface LeadSectors {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  sectorName?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  defaultLeadInterest?: string;
  /** @wixFieldType number */
  priorityLevel?: number;
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
  responsavelExternoRef?: string;
  /** @wixFieldType text */
  canalNotificacao?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  titulo?: string;
  /** @wixFieldType text */
  atendimentoRef?: string;
  /** @wixFieldType text */
  pendenciaRef?: string;
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
 * Collection ID: templatescontratos
 * Interface for ContractTemplates
 */
export interface ContractTemplates {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  templateName?: string;
  /** @wixFieldType text */
  targetServiceType?: string;
  /** @wixFieldType number */
  version?: number;
  /** @wixFieldType text */
  templateContent?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: unidades
 * Interface for Units
 */
export interface Units {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  unitName?: string;
  /** @wixFieldType text */
  cityState?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  logo?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
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
  /** @wixFieldType boolean */
  ativo?: boolean;
  /** @wixFieldType text */
  unidadeRef?: string;
  /** @wixFieldType text */
  memberRef?: string;
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
