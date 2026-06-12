export interface StoreSetting {
  storeName: string;
  pixKey: string;
  whatsappNumber: string;
  whatsappMessage: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string;
  emoji: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  productName: string;
  batchDate: string; // e.g. YYYY-MM-DD
  initialQuantity: number; 
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
