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
  /** @wixFieldType text */
  contactName?: string;
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
  /** @wixFieldType number */
  precoVenda?: number;
  /** @wixFieldType number */
  precoLocacao?: number;
  /** @wixFieldType number */
  valorCondominio?: number;
  /** @wixFieldType number */
  iptuAnual?: number;
  /** @wixFieldType number */
  valorSinal?: number;
  /** @wixFieldType number */
  suites?: number;
  /** @wixFieldType number */
  andar?: number;
  /** @wixFieldType number */
  areaUtil?: number;
  /** @wixFieldType number */
  numeroPavimentos?: number;
  /** @wixFieldType text */
  posicaoSol?: string;
  /** @wixFieldType boolean */
  permiteFinanciamento?: boolean;
  /** @wixFieldType boolean */
  aceitaFgts?: boolean;
  /** @wixFieldType boolean */
  aceitaFinanciamentoCaixa?: boolean;
  /** @wixFieldType boolean */
  armariosPlanejados?: boolean;
  /** @wixFieldType boolean */
  sacadaVaranda?: boolean;
  /** @wixFieldType boolean */
  elevador?: boolean;
  /** @wixFieldType boolean */
  academia?: boolean;
  /** @wixFieldType boolean */
  churrasqueira?: boolean;
  /** @wixFieldType boolean */
  piscina?: boolean;
  /** @wixFieldType boolean */
  playground?: boolean;
  /** @wixFieldType boolean */
  seguranca24h?: boolean;
  /** @wixFieldType boolean */
  acessibilidade?: boolean;
  /** @wixFieldType text */
  diferenciais?: string;
  /** @wixFieldType text */
  resumoImovel?: string;
  /** @wixFieldType text */
  proprietarioId?: string;
  /** @wixFieldType text */
  corretorResponsavelId?: string;
  /** @wixFieldType text */
  segmentosCompra?: string;
  /** @wixFieldType image */
  galeriaFotos?: string;
  /** @wixFieldType url */
  plantaBaixa?: string;
  /** @wixFieldType url */
  tourVirtual?: string;
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
