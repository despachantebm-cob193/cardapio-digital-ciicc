import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { Product, StoreSetting, OperationType, ProductBatch } from './types';

const SETTINGS_PATH = 'settings';
const SETTINGS_DOC = 'store';
const PRODUCTS_PATH = 'products';

// Default values to fallback on if database is empty
export const DEFAULT_SETTINGS: StoreSetting = {
  storeName: 'Bistrô & Hamburgueria Delícia',
  pixKey: '12.345.678/0001-99',
  whatsappNumber: '5511999999999',
  whatsappMessage: 'Olá! Gostaria de fazer um pedido do cardápio digital.'
};

export const INITIAL_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Hambúrguer Gourmet Double',
    description: 'Dois hambúrgueres de 150g, muito queijo cheddar derretido, bacon crocante, cebola caramelizada e molho da casa.',
    price: 38.90,
    available: true,
    category: '🍔 Hambúrgueres',
    emoji: '🍔'
  },
  {
    name: 'Cheese Salada Clássico',
    description: 'Hambúrguer de 150g, queijo prato, alface americana fresca, tomate maduro, picles de pepino e maionese artesanal.',
    price: 29.90,
    available: true,
    category: '🍔 Hambúrgueres',
    emoji: '🍔'
  },
  {
    name: 'Batata Rústica Especial',
    description: 'Porção grande de batatas rústicas fritas na hora, salpicadas com páprica defumada, alecrim e maionese de alho.',
    price: 19.90,
    available: true,
    category: '🍟 Acompanhamentos',
    emoji: '🍟'
  },
  {
    name: 'Anéis de Cebola Crocantes',
    description: 'Anéis de cebola gigantes empanados com farinha panko super crocante, servidos com molho barbecue.',
    price: 18.50,
    available: false,
    category: '🍟 Acompanhamentos',
    emoji: '🧅'
  },
  {
    name: 'Suco Natural de Laranja',
    description: 'Espremido na hora, copo de 400ml super gelado e totalmente natural, sem adição de conservantes.',
    price: 10.00,
    available: true,
    category: '🥤 Bebidas',
    emoji: '🥤'
  },
  {
    name: 'Refrigerante em Lata',
    description: 'Coca-cola original, zero ou Guaraná Antarctica bem gelada para acompanhar seu pedido.',
    price: 6.50,
    available: true,
    category: '🥤 Bebidas',
    emoji: '🥤'
  },
  {
    name: 'Petit Gâteau Creamy',
    description: 'Bolo quente de chocolate belga recheado de calda quente, acompanhado de uma bola de sorvete de baunilha.',
    price: 22.90,
    available: true,
    category: '🍰 Sobremesas',
    emoji: '🍰'
  }
];

// Settings functions
export async function getStoreSettings(): Promise<StoreSetting> {
  const path = `${SETTINGS_PATH}/${SETTINGS_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_PATH, SETTINGS_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as StoreSetting;
    } else {
      // Return defaults but don't force write yet
      return { ...DEFAULT_SETTINGS };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { ...DEFAULT_SETTINGS }; // unreachable but TS needs it
  }
}

export async function saveStoreSettings(settings: StoreSetting): Promise<void> {
  const path = `${SETTINGS_PATH}/${SETTINGS_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_PATH, SETTINGS_DOC);
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to settings for real-time updates
export function subscribeStoreSettings(onUpdate: (settings: StoreSetting) => void, onError: (err: any) => void) {
  const docRef = doc(db, SETTINGS_PATH, SETTINGS_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as StoreSetting);
      } else {
        onUpdate(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_PATH}/${SETTINGS_DOC}`, false);
      onError(error);
    }
  );
}

// Products functions
export async function getProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_PATH), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((res) => {
      products.push({ id: res.id, ...res.data() } as Product);
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_PATH);
    return [];
  }
}

// Subscribe to products list for real-time updates
export function subscribeProducts(onUpdate: (products: Product[]) => void, onError: (err: any) => void) {
  const q = query(collection(db, PRODUCTS_PATH), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((res) => {
        products.push({ id: res.id, ...res.data() } as Product);
      });
      onUpdate(products);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_PATH, false);
      onError(error);
    }
  );
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const id = 'prod_' + Math.random().toString(36).substr(2, 9);
  const path = `${PRODUCTS_PATH}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_PATH, id);
    const data: Product = {
      ...product,
      id,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, data);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
  const path = `${PRODUCTS_PATH}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_PATH, id);
    await updateDoc(docRef, product);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const path = `${PRODUCTS_PATH}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Seeder to populate initial tasty products
export async function seedInitialDataIfNeeded(): Promise<boolean> {
  try {
    const existingProds = await getProducts();
    if (existingProds.length === 0) {
      console.log('Nenhum produto encontrado. Semeando dados iniciais...');
      for (const item of INITIAL_PRODUCTS) {
        await addProduct(item);
      }
      // Seed default settings too
      await saveStoreSettings(DEFAULT_SETTINGS);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao semear dados iniciais:', error);
    return false;
  }
}

// Customer Onboarding / Registrations
const REGISTRATIONS_PATH = 'customer_registrations';

export interface CustomerRegistration {
  uid: string;
  name: string;
  email: string;
  workplace: string;
  shiftHours: string;
  photoUrl: string; // base64
  createdAt: string;
}

export async function saveCustomerRegistration(reg: Omit<CustomerRegistration, 'createdAt'>): Promise<void> {
  const path = `${REGISTRATIONS_PATH}/${reg.uid}`;
  try {
    const docRef = doc(db, REGISTRATIONS_PATH, reg.uid);
    const data: CustomerRegistration = {
      ...reg,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function getCustomerRegistration(uid: string): Promise<CustomerRegistration | null> {
  const path = `${REGISTRATIONS_PATH}/${uid}`;
  try {
    const docRef = doc(db, REGISTRATIONS_PATH, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CustomerRegistration;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeCustomerRegistrations(onUpdate: (regs: CustomerRegistration[]) => void, onError: (err: any) => void) {
  const q = query(collection(db, REGISTRATIONS_PATH), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const regs: CustomerRegistration[] = [];
      snapshot.forEach((res) => {
        regs.push(res.data() as CustomerRegistration);
      });
      onUpdate(regs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, REGISTRATIONS_PATH, false);
      onError(error);
    }
  );
}

// Sales & Order Tracking
const SALES_PATH = 'sales';

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  emoji?: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerWorkplace: string;
  customerShiftHours: string;
  customerPhotoUrl?: string; // Compulsory selfie fallback or URL
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'later' | 'pix';
  createdAt: string;
}

export async function createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<string> {
  const id = 'sale_' + Math.random().toString(36).substr(2, 9);
  const path = `${SALES_PATH}/${id}`;
  try {
    const docRef = doc(db, SALES_PATH, id);
    const data: Sale = {
      ...sale,
      id,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, data);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export function subscribeSales(onUpdate: (sales: Sale[]) => void, onError: (err: any) => void) {
  const q = query(collection(db, SALES_PATH), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const sales: Sale[] = [];
      snapshot.forEach((res) => {
        sales.push(res.data() as Sale);
      });
      onUpdate(sales);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, SALES_PATH, false);
      onError(error);
    }
  );
}

export async function deleteSale(id: string): Promise<void> {
  const path = `${SALES_PATH}/${id}`;
  try {
    const docRef = doc(db, SALES_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Product Batches (Lotes de Produtos)
const BATCHES_PATH = 'batches';

export async function addProductBatch(batch: Omit<ProductBatch, 'id' | 'createdAt'>): Promise<string> {
  const id = 'batch_' + Math.random().toString(36).substr(2, 9);
  const path = `${BATCHES_PATH}/${id}`;
  try {
    const docRef = doc(db, BATCHES_PATH, id);
    const data: ProductBatch = {
      ...batch,
      id,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, data);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateProductBatch(id: string, batch: Partial<ProductBatch>): Promise<void> {
  const path = `${BATCHES_PATH}/${id}`;
  try {
    const docRef = doc(db, BATCHES_PATH, id);
    await updateDoc(docRef, batch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteProductBatch(id: string): Promise<void> {
  const path = `${BATCHES_PATH}/${id}`;
  try {
    const docRef = doc(db, BATCHES_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export function subscribeProductBatches(
  onUpdate: (batches: ProductBatch[]) => void,
  onError: (err: any) => void
) {
  const q = query(collection(db, BATCHES_PATH), orderBy('batchDate', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const batches: ProductBatch[] = [];
      snapshot.forEach((res) => {
        batches.push(res.data() as ProductBatch);
      });
      onUpdate(batches);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, BATCHES_PATH, false);
      onError(error);
    }
  );
}


