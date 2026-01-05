/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
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
