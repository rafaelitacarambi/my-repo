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
  /** @wixFieldType text */
  spouseRef?: string;
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
  statusResultadoFinanciamento?: string;
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
  /** @wixFieldType boolean */
  isArchived?: boolean;
  /** @wixFieldType boolean */
  ehEmpreendimento?: boolean;
  /** @wixFieldType text */
  spouseRef?: string;
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
  /** @wixFieldType text */
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  rg?: string;
  nationality?: string;
  profession?: string;
  maritalStatus?: string;
}


/**
 * Collection ID: contratos_legacy? (Removing duplication and focusing on the newer Contracts structure)
 */


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
 * Collection ID: documentosproponentes
 * Interface for ProponentDocuments
 */
export interface ProponentDocuments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  financingCaseRef?: string;
  /** @wixFieldType text */
  proponentRef?: string;
  /** @wixFieldType text */
  documentName?: string;
  /** @wixFieldType boolean */
  isReceived?: boolean;
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType boolean */
  isMandatory?: boolean;
  /** @wixFieldType url */
  fileUrl?: string;
  /** @wixFieldType text */
  notes?: string;
  /** @wixFieldType datetime */
  uploadDate?: Date | string;
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
  statusImovel?: string; // Ativo, Suspenso, Vendido, Locado, Desatualizado
  /** @wixFieldType text */
  midiaOrigem?: string;
  /** @wixFieldType text */
  codImovel?: string;
  /** @wixFieldType text */
  codigoReference?: string;

  // PROPRIETÁRIO
  /** @wixFieldType text */
  nomeProprietario?: string;
  /** @wixFieldType text */
  telefoneProprietario?: string;
  /** @wixFieldType text */
  emailProprietario?: string;

  // CORRETOR
  /** @wixFieldType text */
  corretorResponsavelId?: string; // ID do usuário
  /** @wixFieldType text */
  origemCaptacao?: string; // R.Sales | Corretor Interno | Proprietário | Corretor Externo
  /** @wixFieldType text */
  corretorExternoNome?: string; // Nome do corretor externo (quando origemCaptacao = 'Corretor Externo')
  /** @wixFieldType text */
  corretorExternoContato?: string; // Contato do corretor externo

  // IMÓVEL INFO
  /** @wixFieldType text */
  finalidade?: string; // Residencial, Comercial, etc
  /** @wixFieldType text */
  tipoImovel?: string; // Casa, Apartamento, etc
  /** @wixFieldType text */
  pretensao?: string; // Venda, Locação, Venda e Locação

  // VALORES
  /** @wixFieldType number */
  entradaMinimaEstimada?: number;
  /** @wixFieldType number */
  precoVenda?: number;
  /** @wixFieldType number */
  precoLocacao?: number;
  /** @wixFieldType number */
  pacoteLocacao?: number;
  /** @wixFieldType boolean */
  imovelCondominio?: boolean;
  /** @wixFieldType number */
  valorCondominio?: number;
  /** @wixFieldType number */
  valorIPTU?: number;
  /** @wixFieldType text */
  periodicidadeIPTU?: string; // Mensal, Anual

  // LOCALIZAÇÃO
  /** @wixFieldType text */
  cep?: string;
  /** @wixFieldType text */
  logradouro?: string;
  /** @wixFieldType text */
  numero?: string;
  /** @wixFieldType text */
  complemento?: string;
  /** @wixFieldType text */
  bairro?: string;
  /** @wixFieldType text */
  cidade?: string;
  /** @wixFieldType text */
  estado?: string;
  /** @wixFieldType text */
  address?: string; // Campo legado/Full address

  // TÉCNICO
  /** @wixFieldType number */
  areaTerreno?: number;
  /** @wixFieldType number */
  areaConstruida?: number; // ou areaUtil
  /** @wixFieldType number */
  dormitorios?: number;
  /** @wixFieldType number */
  banheiros?: number;
  /** @wixFieldType number */
  lavabos?: number;
  /** @wixFieldType number */
  vagasCobertas?: number;
  /** @wixFieldType number */
  vagasDescobertas?: number;

  // IMPORT SPECIFIC FIELDS (Not in legacy)
  /** @wixFieldType number */
  quartos?: number;
  /** @wixFieldType number */
  vagas?: number;
  /** @wixFieldType number */
  areaTotal?: number;
  /** @wixFieldType text */
  enderecoBairro?: string;
  /** @wixFieldType text */
  enderecoRua?: string;
  /** @wixFieldType text */
  enderecoCidade?: string;
  /** @wixFieldType text */
  enderecoComplemento?: string;
  /** @wixFieldType text */
  enderecoEstado?: string;

  // AMENIDADES (JSON Stringified List or Boolean fields - Using Booleans as requested)
  // CARACTERÍSTICAS
  /** @wixFieldType boolean */
  mobiliado?: boolean;
  /** @wixFieldType boolean */
  dormitorioReversivel?: boolean;
  /** @wixFieldType boolean */
  escritorio?: boolean;
  /** @wixFieldType boolean */
  aceitaPet?: boolean;
  /** @wixFieldType boolean */
  edicula?: boolean;
  /** @wixFieldType boolean */
  despensa?: boolean;
  /** @wixFieldType boolean */
  adega?: boolean;
  /** @wixFieldType boolean */
  lavanderia?: boolean;
  /** @wixFieldType boolean */
  vestiario?: boolean;

  // AMBIENTES INTERNOS
  /** @wixFieldType boolean */
  closet?: boolean;
  /** @wixFieldType boolean */
  suiteHidro?: boolean;
  /** @wixFieldType boolean */
  banheira?: boolean;
  /** @wixFieldType boolean */
  peDireitoDuplo?: boolean;
  /** @wixFieldType boolean */
  homeOffice?: boolean;
  /** @wixFieldType boolean */
  salaJantar?: boolean; // Salas genérico?
  /** @wixFieldType boolean */
  salaEstar?: boolean;
  /** @wixFieldType boolean */
  cozinhaAmericana?: boolean;
  /** @wixFieldType boolean */
  cozinhaPlanejada?: boolean;
  /** @wixFieldType boolean */
  ilha?: boolean;
  /** @wixFieldType boolean */
  lareira?: boolean;
  /** @wixFieldType boolean */
  arCondicionado?: boolean;
  /** @wixFieldType boolean */
  aquecimentoGas?: boolean; // Aquecimentos genérico
  /** @wixFieldType boolean */
  energiaSolar?: boolean;
  /** @wixFieldType boolean */
  automacao?: boolean;
  /** @wixFieldType boolean */
  iluminacaoLed?: boolean;
  /** @wixFieldType boolean */
  persianas?: boolean;
  /** @wixFieldType boolean */
  fechaduraEletronica?: boolean;
  /** @wixFieldType boolean */
  deposito?: boolean;

  // EXTERNA PRIVATIVA
  /** @wixFieldType boolean */
  quintal?: boolean;
  /** @wixFieldType boolean */
  jardim?: boolean;
  /** @wixFieldType boolean */
  pergolado?: boolean;
  /** @wixFieldType boolean */
  espacoZen?: boolean;
  /** @wixFieldType boolean */
  firePit?: boolean;
  /** @wixFieldType boolean */
  redario?: boolean;
  /** @wixFieldType boolean */
  pomar?: boolean;
  /** @wixFieldType boolean */
  horta?: boolean;
  /** @wixFieldType boolean */
  canil?: boolean;
  /** @wixFieldType boolean */
  lounge?: boolean;
  /** @wixFieldType boolean */
  gazebo?: boolean;
  /** @wixFieldType boolean */
  solarium?: boolean;
  /** @wixFieldType boolean */
  espacoPet?: boolean;
  /** @wixFieldType boolean */
  espacoDescanso?: boolean;

  // LAZER PRIVATIVO
  /** @wixFieldType boolean */
  churrasqueira?: boolean;
  /** @wixFieldType boolean */
  varandaGourmet?: boolean;
  /** @wixFieldType boolean */
  piscina?: boolean; // Privativa
  /** @wixFieldType boolean */
  ofuro?: boolean;
  /** @wixFieldType boolean */
  sauna?: boolean;

  // CONDOMÍNIO / LAZER COLETIVO
  /** @wixFieldType boolean */
  playground?: boolean;
  /** @wixFieldType boolean */
  quadraPoliesportiva?: boolean;
  /** @wixFieldType boolean */
  quadraTenis?: boolean;
  /** @wixFieldType boolean */
  salaoFestas?: boolean;
  /** @wixFieldType boolean */
  salaoJogos?: boolean;
  /** @wixFieldType boolean */
  academia?: boolean;
  /** @wixFieldType boolean */
  piscinaCondominio?: boolean;
  /** @wixFieldType boolean */
  spa?: boolean;
  /** @wixFieldType boolean */
  cinema?: boolean;
  /** @wixFieldType boolean */
  coworking?: boolean;
  /** @wixFieldType boolean */
  biblioteca?: boolean;
  /** @wixFieldType boolean */
  loungeCondominio?: boolean;

  // INFRAESTRUTURA
  /** @wixFieldType boolean */
  vagasVisitantes?: boolean;
  /** @wixFieldType boolean */
  carroEletrico?: boolean;
  /** @wixFieldType boolean */
  bicicletario?: boolean;
  /** @wixFieldType boolean */
  portaria24h?: boolean;
  /** @wixFieldType boolean */
  seguranca?: boolean;
  /** @wixFieldType boolean */
  elevador?: boolean;
  /** @wixFieldType boolean */
  acessibilidade?: boolean;

  // SUSTENTABILIDADE
  /** @wixFieldType boolean */
  coletaSeletiva?: boolean;
  /** @wixFieldType boolean */
  reusoAgua?: boolean;
  /** @wixFieldType boolean */
  captacaoChuva?: boolean;
  /** @wixFieldType boolean */
  telhadoVerde?: boolean;
  /** @wixFieldType boolean */
  ventilacaoCruzada?: boolean;
  /** @wixFieldType boolean */
  iluminacaoNatural?: boolean;
  /** @wixFieldType boolean */
  tratamentoAcustico?: boolean;
  /** @wixFieldType boolean */
  isolamentoTermico?: boolean;

  // SITUAÇÃO
  /** @wixFieldType text */
  situacaoImovel?: string; // Desocupado, Ocupado, etc

  // FINANCIAMENTO
  /** @wixFieldType boolean */
  aceitaFinanciamento?: boolean;
  /** @wixFieldType boolean */
  aceitaFgts?: boolean; // Manter compatibilidade

  // INTERNO
  /** @wixFieldType text */
  comentariosInternos?: string;
  /** @wixFieldType text */
  localChaves?: string;

  // DESCRIÇÃO
  /** @wixFieldType text */
  resumoImovel?: string; // Manter
  /** @wixFieldType text */
  descricaoAnuncio?: string; // Novo
  /** @wixFieldType text */
  description?: string; // Legado (manter sync)

  // MÍDIA
  /** @wixFieldType array */
  galeriaFotos?: string[]; // Manter
  /** @wixFieldType array */
  propertyImages?: string[]; // Legado
  /** @wixFieldType url */
  tourVirtual?: string;
  /** @wixFieldType url */
  plantaBaixa?: string;
  /** @wixFieldType url */
  keyQrCodeUrl?: string;

  // AUDITORIA
  /** @wixFieldType text */
  cadastradoOuAtualizadoPor?: string;

  // Legado mantido para não quebrar compatibilidade imediata
  propertyName?: string;
  /** @wixFieldType text */
  propertyType?: string; // Manter sync com tipoImovel
  /** @wixFieldType text */
  transactionType?: string; // Manter sync com pretensao
  /** @wixFieldType number */
  price?: number; // Manter sync com precoVenda
  /** @wixFieldType number */
  bedrooms?: number; // Manter sync
  /** @wixFieldType number */
  bathrooms?: number;
  /** @wixFieldType number */
  area?: number;
  /** @wixFieldType text */
  status?: string; // Manter sync com statusImovel
  /** @wixFieldType text */
  segmentoCompra?: string;
  /** @wixFieldType text */
  posicaoSol?: string;
  /** @wixFieldType number */
  apartmentsPerFloor?: number;
  /** @wixFieldType number */
  suites?: number;
  /** @wixFieldType number */
  andar?: number;
  /** @wixFieldType number */
  numeroPavimentos?: number;
  /** @wixFieldType number */
  areaUtil?: number;
  /** @wixFieldType number */
  valorSinal?: number;
  /** @wixFieldType number */
  iptuAnual?: number;
  /** @wixFieldType boolean */
  investimentoOportunidade?: boolean;
  /** @wixFieldType boolean */
  permiteFinanciamento?: boolean;
  /** @wixFieldType boolean */
  aceitaFinanciamentoCaixa?: boolean;
  /** @wixFieldType boolean */
  armariosPlanejados?: boolean;
  /** @wixFieldType boolean */
  sacadaVaranda?: boolean;
  /** @wixFieldType boolean */
  seguranca24h?: boolean;
  /** @wixFieldType text */
  diferenciais?: string;
  /** @wixFieldType text */
  proprietarioId?: string; // Referencia ID da tabela Users ou texto livre antigo? Vamos usar os novos campos de proprietário.
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
  contractType?: 'LocacaoResidencial' | 'LocacaoComercial' | 'CompraEVenda' | 'EntregaChaves' | 'AutorizacaoDivulgacao';
  /** @wixFieldType number */
  version?: number;
  /** @wixFieldType text */
  templateFormat: 'HTML' | 'DOCX';
  /** @wixFieldType text */
  templateContent?: string; // HTML body or reference
  /** @wixFieldType text */
  templateBody?: string; // Full HTML content
  /** @wixFieldType text */
  placeholders?: string[]; // List of expected placeholders
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType text */
  requiredFields?: string[]; // Lista de slugs de campos obrigatórios
  /** @wixFieldType text */
  conditionalRules?: string; // JSON stringificando as regras
}


/**
 * Collection ID: contratos
 * Interface for Contracts
 */
export interface Contracts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  atendimentoRef?: string;
  /** @wixFieldType text */
  imovelRef?: string;
  /** @wixFieldType text */
  parts?: string; // JSON string com a lista de participantes e papéis
  /** @wixFieldType text */
  contractType?: string;
  /** @wixFieldType text */
  templateRef?: string;
  /** @wixFieldType number */
  templateVersion?: number;
  /** @wixFieldType text */
  filledData?: string; // JSON com todos os valores preenchidos (payloadJson)
  /** @wixFieldType text */
  htmlFinal?: string; // The rendered HTML content
  /** @wixFieldType text */
  status?: 'Rascunho' | 'Gerado' | 'EmRevisao' | 'Assinado' | 'Cancelado';
  /** @wixFieldType url */
  generatedPdfUrl?: string; // (pdfFileRef)
  /** @wixFieldType url */
  generatedDocxUrl?: string;
  /** @wixFieldType text */
  createdBy?: string;
  /** @wixFieldType number */
  currentStep?: number;
}


/**
 * Collection ID: contratoassinaturas
 * Interface for ContractSignatures
 */
export interface ContractSignatures {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  contractRef?: string;
  /** @wixFieldType text */
  participantRef?: string;
  /** @wixFieldType text */
  role?: string;
  /** @wixFieldType text */
  status?: 'Pendente' | 'Assinado' | 'Rejeitado';
  /** @wixFieldType datetime */
  signatureDate?: Date | string;
  /** @wixFieldType text */
  ipAddress?: string;
  /** @wixFieldType text */
  method?: 'ICP' | 'Eletronica' | 'Manual';
}


/**
 * Collection ID: historicocontratos
 * Interface for ContractHistory
 */
export interface ContractHistory {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  contractRef?: string;
  /** @wixFieldType text */
  templateRef?: string;
  /** @wixFieldType text */
  action?: string;
  /** @wixFieldType text */
  performedBy?: string;
  /** @wixFieldType text */
  details?: string;
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
  /** @wixFieldType text */
  setores?: string[];
  /** @wixFieldType text */
  password?: string;
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
