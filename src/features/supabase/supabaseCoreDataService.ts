import { supabase } from '../../lib/supabaseClient';
import type { Product, StoreSetting } from '../../types';

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
  sort_order: number | null;
};

type StoreSettingsRow = {
  id: string;
  store_name: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  pix_key: string | null;
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
    .select('id, name, description, price, category, emoji, image_url, available, sort_order')
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

export async function createSupabaseSale(input: SupabaseSaleInput): Promise<string> {
  const client = requireSupabase();

  const { data: sale, error: saleError } = await client
    .from('sales')
    .insert({
      customer_profile_id: input.customerProfile.id,
      customer_name: input.customerProfile.displayName,
      customer_email: input.customerProfile.email,
      customer_workplace: input.customerProfile.workplace,
      customer_shift_hours: input.customerProfile.shiftHours,
      customer_photo_url: input.customerProfile.photoUrl,
      total_amount: input.totalAmount,
      payment_method: input.paymentMethod,
    })
    .select('id')
    .single<{ id: string }>();

  if (saleError) {
    throw saleError;
  }

  const saleItems = input.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    emoji: item.emoji || '🍽️',
  }));

  const { error: itemsError } = await client
    .from('sale_items')
    .insert(saleItems);

  if (itemsError) {
    throw itemsError;
  }

  return sale.id;
}
