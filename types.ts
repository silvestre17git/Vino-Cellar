
export enum WineType {
  RED = 'Red',
  WHITE = 'White',
  ROSE = 'Rosé',
  CHAMPAGNE = 'Champagne/Sparkling',
  OTHER = 'Other'
}

export interface CustomField {
  label: string;
  value: string;
}

export interface WineEntry {
  id: string;
  imageUrls: string[];
  name: string;
  maker: string;
  year: string;
  type: WineType;
  price: string;
  description: string;
  binNumber: string;
  notes: string;
  customFields: CustomField[];
  createdAt: number;
  deletedAt?: number; // Added for trash bin functionality
}

export interface AIWineResponse {
  name: string;
  maker: string;
  year: string;
  type: WineType;
  description: string;
}
