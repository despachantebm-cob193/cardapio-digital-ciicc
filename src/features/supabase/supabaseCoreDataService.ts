import { supabase } from '../../lib/supabaseClient';
import type { Product, StoreSetting } from '../../types';

export interface SupabaseSaleItem {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
  emoji: string;
}

export interface SupabaseSale {
  id: string;
  customerProfileId: string;
  customerName: string;
  customerEmail: string;
  customerWorkplace: string;
  customerShiftHours: string;
  customerPhotoUrl: string;
  totalAmount: number;
  paymentMethod: 'later' | 'pix';
  paymentProofUrl: string | null;
  createdAt: string;
  items: SupabaseSaleItem[];
}


export type SupabaseCustomerProfile = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  workplace: string;
  shiftHours: string;
  photoUrl: string;
  role: 'customer' | 'admin';
  status: 'active' | 'inactive' | 'blocked';
  createdAt?: string;
  updatedAt?: string;
};

export type SupabaseAdminProfile = SupabaseCustomerProfile;

export type SupabaseProfileRole = 'customer' | 'admin';

export type SupabaseProfileStatus = 'active' | 'inactive' | 'blocked';

export type SupabaseSaleItemInput = {
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
  emoji?: string;
};

export type SupabaseSaleInput = {
  customerProfile: SupabaseCustomerProfile;
  items: SupabaseSaleItemInput[];
  totalAmount: number;
  paymentMethod: 'later' | 'pix';
  paymentProofUrl?: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  emoji: string | null;
  image_url: string | null;
  available: boolean | null;
  stock_initial: number | null;
  stock_available: number | null;
  cost_price: number | null;
  lifecycle_type: string | null;
  cycle_started_at: string | null;
  cycle_closed_at: string | null;
  cycle_unsold_quantity: number | null;
  sort_order: number | null;
};

type StoreSettingsRow = {
  id: string;
  store_name: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  pix_key: string | null;
};

type SaleRow = {
  id: string;
  customer_profile_id: string;
  customer_name: string;
  customer_email: string;
  customer_workplace: string;
  customer_shift_hours: string;
  customer_photo_url: string;
  total_amount: number;
  payment_method: 'later' | 'pix';
  payment_proof_url: string | null;
  created_at: string;
};

type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  price: number;
  emoji: string;
};

type ProfileRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  display_name: string | null;
  workplace: string | null;
  shift_hours: string | null;
  photo_url: string | null;
  role: 'customer' | 'admin';
  status: 'active' | 'inactive' | 'blocked';
  created_at?: string;
  updated_at?: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Cliente Supabase indisponível. Verifique a configuração do ambiente.');
  }

  return supabase;
}

function toProductPayload(product: Omit<Product, 'id'> | Partial<Product>) {
  const payload: Record<string, unknown> = {};

  if (product.name !== undefined) payload.name = product.name;
  if (product.description !== undefined) payload.description = product.description;
  if (product.price !== undefined) payload.price = product.price;
  if (product.category !== undefined) payload.category = product.category;
  if (product.emoji !== undefined) payload.emoji = product.emoji;
  if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
  if (product.available !== undefined) payload.available = product.available;
  if (product.stockInitial !== undefined) payload.stock_initial = product.stockInitial;
  if (product.stockAvailable !== undefined) payload.stock_available = product.stockAvailable;
  if (product.costPrice !== undefined) payload.cost_price = product.costPrice;
  if (product.lifecycleType !== undefined) payload.lifecycle_type = product.lifecycleType;
  if (product.cycleStartedAt !== undefined) payload.cycle_started_at = product.cycleStartedAt;
  if (product.cycleClosedAt !== undefined) payload.cycle_closed_at = product.cycleClosedAt;
  if (product.cycleUnsoldQuantity !== undefined) payload.cycle_unsold_quantity = product.cycleUnsoldQuantity;

  return payload;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    category: row.category || 'Geral',
    emoji: row.emoji || '🍽️',
    imageUrl: row.image_url || '',
    available: row.available ?? true,
    stockInitial: row.stock_initial ?? 0,
    stockAvailable: row.stock_available ?? 0,
    costPrice: row.cost_price ?? 0,
    lifecycleType: row.lifecycle_type === 'same_day' ? 'same_day' : 'industrial',
    cycleStartedAt: row.cycle_started_at,
    cycleClosedAt: row.cycle_closed_at,
    cycleUnsoldQuantity: row.cycle_unsold_quantity ?? 0,
  };
}

function mapStoreSettings(row: StoreSettingsRow | null): StoreSetting {
  return {
    storeName: row?.store_name || 'Cardápio Digital',
    whatsappNumber: row?.whatsapp_number || '',
    whatsappMessage: row?.whatsapp_message || '',
    pixKey: row?.pix_key || '',
  };
}

function mapSale(row: SaleRow, items: SaleItemRow[] = []): SupabaseSale {
  return {
    id: row.id,
    customerProfileId: row.customer_profile_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerWorkplace: row.customer_workplace,
    customerShiftHours: row.customer_shift_hours,
    customerPhotoUrl: row.customer_photo_url,
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    paymentProofUrl: row.payment_proof_url || null,
    createdAt: row.created_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      emoji: item.emoji,
    })),
  };
}

function mapProfile(row: ProfileRow): SupabaseCustomerProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email || '',
    displayName: row.display_name || '',
    workplace: row.workplace || '',
    shiftHours: row.shift_hours || '',
    photoUrl: row.photo_url || '',
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSupabaseProducts(): Promise<Product[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('products')
    .select('id, name, description, price, category, emoji, image_url, available, stock_initial, stock_available, cost_price, lifecycle_type, cycle_started_at, cycle_closed_at, cycle_unsold_quantity, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapProduct(row as ProductRow));
}

export async function getSupabaseStoreSettings(): Promise<StoreSetting> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('store_settings')
    .select('id, store_name, whatsapp_number, whatsapp_message, pix_key')
    .eq('id', 'default')
    .maybeSingle<StoreSettingsRow>();

  if (error) {
    throw error;
  }

  return mapStoreSettings(data);
}

export async function getCustomerProfileByAuthUserId(authUserId: string): Promise<SupabaseCustomerProfile | null> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .select('id, auth_user_id, email, display_name, workplace, shift_hours, photo_url, role, status, created_at, updated_at')
    .eq('auth_user_id', authUserId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data) : null;
}

export async function upsertCustomerProfile(input: {
  authUserId: string;
  email: string;
  displayName: string;
  workplace: string;
  shiftHours: string;
  photoUrl: string;
}): Promise<SupabaseCustomerProfile> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        auth_user_id: input.authUserId,
        email: input.email,
        display_name: input.displayName,
        workplace: input.workplace,
        shift_hours: input.shiftHours,
        photo_url: input.photoUrl,
        role: 'customer',
        status: 'active',
      },
      { onConflict: 'auth_user_id' },
    )
    .select('id, auth_user_id, email, display_name, workplace, shift_hours, photo_url, role, status, created_at, updated_at')
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

export async function updateCurrentCustomerProfile(input: {
  authUserId: string;
  displayName: string;
  workplace: string;
  shiftHours: string;
  photoUrl: string;
}): Promise<SupabaseCustomerProfile> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .update({
      display_name: input.displayName,
      workplace: input.workplace,
      shift_hours: input.shiftHours,
      photo_url: input.photoUrl,
    })
    .eq('auth_user_id', input.authUserId)
    .select('id, auth_user_id, email, display_name, workplace, shift_hours, photo_url, role, status, created_at, updated_at')
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

export async function createSupabaseSale(input: SupabaseSaleInput): Promise<string> {
  const client = requireSupabase();

  const { data: saleId, error } = await client.rpc('create_sale_with_stock', {
    p_customer_profile_id: input.customerProfile.id,
    p_customer_name: input.customerProfile.displayName,
    p_customer_email: input.customerProfile.email,
    p_customer_workplace: input.customerProfile.workplace,
    p_customer_shift_hours: input.customerProfile.shiftHours,
    p_customer_photo_url: input.customerProfile.photoUrl,
    p_total_amount: input.totalAmount,
    p_payment_method: input.paymentMethod,
    p_payment_proof_url: input.paymentProofUrl || null,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      emoji: item.emoji || '🍽️',
    })),
  });

  if (error) {
    throw error;
  }

  if (!saleId) {
    throw new Error('Aquisição registrada sem identificador de retorno.');
  }

  return String(saleId);
}


export async function saveSupabaseStoreSettings(settings: StoreSetting): Promise<void> {
  const client = requireSupabase();

  const { error } = await client
    .from('store_settings')
    .upsert({
      id: 'default',
      store_name: settings.storeName,
      whatsapp_number: settings.whatsappNumber,
      whatsapp_message: settings.whatsappMessage,
      pix_key: settings.pixKey,
    });

  if (error) {
    throw error;
  }
}

export async function addSupabaseProduct(product: Omit<Product, 'id'>): Promise<string> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('products')
    .insert(toProductPayload(product))
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateSupabaseProduct(id: string, product: Partial<Product>): Promise<void> {
  const client = requireSupabase();

  const { error } = await client
    .from('products')
    .update(toProductPayload(product))
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function deleteSupabaseProduct(id: string): Promise<void> {
  const client = requireSupabase();

  const { error } = await client
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function listSupabaseSales(): Promise<SupabaseSale[]> {
  const client = requireSupabase();

  const { data: salesRows, error: salesError } = await client
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (salesError) {
    throw salesError;
  }

  const saleIds = (salesRows || []).map((sale) => sale.id);

  if (saleIds.length === 0) {
    return [];
  }

  const { data: itemRows, error: itemsError } = await client
    .from('sale_items')
    .select('*')
    .in('sale_id', saleIds);

  if (itemsError) {
    throw itemsError;
  }

  return (salesRows as SaleRow[]).map((sale) =>
    mapSale(
      sale,
      (itemRows as SaleItemRow[]).filter((item) => item.sale_id === sale.id),
    ),
  );
}

export async function listSupabaseSalesByCustomerProfileId(customerProfileId: string): Promise<SupabaseSale[]> {
  const client = requireSupabase();

  if (!customerProfileId) {
    return [];
  }

  const { data: salesRows, error: salesError } = await client
    .from('sales')
    .select('*')
    .eq('customer_profile_id', customerProfileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (salesError) {
    throw salesError;
  }

  const saleIds = (salesRows || []).map((sale) => sale.id);

  if (saleIds.length === 0) {
    return [];
  }

  const { data: itemRows, error: itemsError } = await client
    .from('sale_items')
    .select('*')
    .in('sale_id', saleIds);

  if (itemsError) {
    throw itemsError;
  }

  return (salesRows as SaleRow[]).map((sale) =>
    mapSale(
      sale,
      (itemRows as SaleItemRow[]).filter((item) => item.sale_id === sale.id),
    ),
  );
}

export async function deleteSupabaseSale(id: string): Promise<void> {
  const client = requireSupabase();

  const { error } = await client
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}


export async function listSupabaseProfilesForAdmin(): Promise<SupabaseAdminProfile[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .select('id, auth_user_id, email, display_name, workplace, shift_hours, photo_url, role, status, created_at, updated_at')
    .order('role', { ascending: true })
    .order('display_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapProfile(row as ProfileRow));
}

export async function updateSupabaseProfileAdminAccess(
  profileId: string,
  changes: {
    role?: SupabaseProfileRole;
    status?: SupabaseProfileStatus;
  },
): Promise<SupabaseAdminProfile> {
  const client = requireSupabase();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (changes.role !== undefined) payload.role = changes.role;
  if (changes.status !== undefined) payload.status = changes.status;

  const { data, error } = await client
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
    .select('id, auth_user_id, email, display_name, workplace, shift_hours, photo_url, role, status, created_at, updated_at')
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}


export async function getCurrentSupabaseAuthUserId(): Promise<string | null> {
  const client = requireSupabase();

  const { data, error } = await client.auth.getUser();

  if (error) {
    return null;
  }

  return data.user?.id ?? null;
}
