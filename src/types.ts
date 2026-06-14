export interface StoreSetting {
  storeName: string;
  pixKey: string;
  whatsappNumber: string;
  whatsappMessage: string;
  updatedAt?: string;
}

export type ProductLifecycleType = 'same_day' | 'industrial';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  stockInitial?: number;
  stockAvailable?: number;
  costPrice?: number;
  lifecycleType?: ProductLifecycleType;
  cycleStartedAt?: string | null;
  cycleClosedAt?: string | null;
  cycleUnsoldQuantity?: number;
  category: string;
  emoji: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface CustomerRegistration {
  id?: string;
  uid: string;
  name: string;
  email: string;
  workplace: string;
  shiftHours: string;
  photoUrl: string;
  createdAt: string;
}
