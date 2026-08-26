import { supabase } from '../lib/supabase';
import { getCurrentUser, recordMileage } from './carCareData';

export type ReceptionStatus = 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export interface CustomerRecord {
  id: string;
  user_id: string;
  full_name: string;
  identification: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceptionRecord {
  id: string;
  user_id: string;
  reception_number: number;
  customer_id: string;
  vehicle_id: string;
  status: ReceptionStatus;
  received_at: string;
  mileage: number;
  fuel_level: number;
  reason: string;
  estimated_delivery_at: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  signature_path: string | null;
  signed_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceptionWithDetails extends ReceptionRecord {
  customer?: Pick<CustomerRecord, 'id' | 'full_name' | 'identification' | 'phone' | 'email'> | null;
  vehicle?: {
    id: string;
    plate: string | null;
    make: string;
    model: string;
    year: number | null;
    nickname: string | null;
  } | null;
}

export interface DamageRecord { zone: string; note?: string; }

export interface ReceptionInspectionRecord {
  id: string;
  user_id: string;
  reception_id: string;
  accessories: string[];
  damages: DamageRecord[];
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceptionPhotoRecord {
  id: string;
  user_id: string;
  reception_id: string;
  storage_path: string;
  photo_type: 'entry' | 'damage' | 'document' | 'other';
  caption: string | null;
  created_at: string;
}

export interface CreateCustomerInput {
  fullName: string;
  identification?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateReceptionInput {
  customerId: string;
  vehicleId: string;
  mileage: number;
  fuelLevel: number;
  reason: string;
  receivedAt?: string;
  estimatedDeliveryAt?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export interface UpsertInspectionInput {
  receptionId: string;
  accessories: string[];
  damages: DamageRecord[];
  observations?: string;
}

const getClient = () => {
  if (!supabase) throw new Error('Supabase no está configurado en esta instalación.');
  return supabase;
};

const cleanOptional = (value?: string) => value?.trim() || null;
export const formatReceptionNumber = (number: number) => `REC-${String(number).padStart(6, '0')}`;

export const getReceptionStatusLabel = (status: ReceptionStatus) => ({
  received: 'Recibido',
  in_progress: 'En trabajo',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}[status]);

export const searchCustomers = async (query = ''): Promise<CustomerRecord[]> => {
  const client = getClient();
  const user = await getCurrentUser();
  const { data, error } = await client.from('customers').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(75);
  if (error) throw error;
  const rows = (data ?? []) as CustomerRecord[];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows.slice(0, 12);
  return rows.filter(customer => [customer.full_name, customer.identification, customer.phone, customer.email].filter(Boolean).some(value => String(value).toLowerCase().includes(normalized))).slice(0, 12);
};

export const createCustomer = async (input: CreateCustomerInput): Promise<CustomerRecord> => {
  const client = getClient();
  const user = await getCurrentUser();
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error('El nombre del cliente es obligatorio.');

  const identification = cleanOptional(input.identification);
  if (identification) {
    const { data: existing, error: existingError } = await client.from('customers').select('*').eq('user_id', user.id).eq('identification', identification).limit(1).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return existing as CustomerRecord;
  }

  const { data, error } = await client.from('customers').insert({
    user_id: user.id,
    full_name: fullName,
    identification,
    phone: cleanOptional(input.phone),
    email: cleanOptional(input.email)?.toLowerCase() || null,
    notes: cleanOptional(input.notes),
  }).select('*').single();
  if (error) throw error;
  return data as CustomerRecord;
};

export const linkCustomerVehicle = async (customerId: string, vehicleId: string) => {
  const client = getClient();
  const user = await getCurrentUser();
  const { error } = await client.from('customer_vehicles').upsert({ user_id: user.id, customer_id: customerId, vehicle_id: vehicleId }, { onConflict: 'user_id,customer_id,vehicle_id', ignoreDuplicates: true });
  if (error) throw error;
};

export const createReception = async (input: CreateReceptionInput): Promise<ReceptionRecord> => {
  const client = getClient();
  const user = await getCurrentUser();
  const mileage = Math.max(0, Math.round(input.mileage));
  const fuelLevel = Math.min(100, Math.max(0, Math.round(input.fuelLevel)));
  const reason = input.reason.trim();
  if (!reason) throw new Error('Indica el motivo de ingreso del vehículo.');

  const { data: vehicle, error: vehicleError } = await client.from('vehicles').select('id,is_active').eq('id', input.vehicleId).eq('user_id', user.id).maybeSingle();
  if (vehicleError) throw vehicleError;
  if (!vehicle) throw new Error('El vehículo no pertenece a esta cuenta.');
  if (!vehicle.is_active) throw new Error('El vehículo está desactivado. Restáuralo antes de recibirlo.');

  const { data: customer, error: customerError } = await client.from('customers').select('id').eq('id', input.customerId).eq('user_id', user.id).maybeSingle();
  if (customerError) throw customerError;
  if (!customer) throw new Error('El cliente no pertenece a esta cuenta.');

  await linkCustomerVehicle(input.customerId, input.vehicleId);
  const { data, error } = await client.from('workshop_receptions').insert({
    user_id: user.id,
    customer_id: input.customerId,
    vehicle_id: input.vehicleId,
    mileage,
    fuel_level: fuelLevel,
    reason,
    received_at: input.receivedAt || new Date().toISOString(),
    estimated_delivery_at: cleanOptional(input.estimatedDeliveryAt),
    customer_notes: cleanOptional(input.customerNotes),
    internal_notes: cleanOptional(input.internalNotes),
    status: 'received',
  }).select('*').single();
  if (error) throw error;

  try { await recordMileage(input.vehicleId, mileage, `Recepción ${formatReceptionNumber(data.reception_number)}`); }
  catch (mileageError) { console.warn('La recepción se guardó, pero no se pudo registrar el kilometraje histórico.', mileageError); }
  return data as ReceptionRecord;
};

export const upsertReceptionInspection = async (input: UpsertInspectionInput): Promise<ReceptionInspectionRecord> => {
  const client = getClient();
  const user = await getCurrentUser();
  const { data: reception, error: receptionError } = await client.from('workshop_receptions').select('id').eq('id', input.receptionId).eq('user_id', user.id).maybeSingle();
  if (receptionError) throw receptionError;
  if (!reception) throw new Error('No se encontró la recepción en esta cuenta.');

  const { data, error } = await client.from('reception_inspections').upsert({
    user_id: user.id,
    reception_id: input.receptionId,
    accessories: input.accessories,
    damages: input.damages,
    observations: cleanOptional(input.observations),
  }, { onConflict: 'reception_id' }).select('*').single();
  if (error) throw error;
  return data as ReceptionInspectionRecord;
};

const safeFileName = (fileName: string) => fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(-100);
const makeObjectId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const uploadReceptionPhotos = async (receptionId: string, files: File[], photoType: ReceptionPhotoRecord['photo_type'] = 'entry'): Promise<ReceptionPhotoRecord[]> => {
  if (files.length === 0) return [];
  const client = getClient();
  const user = await getCurrentUser();
  const results: ReceptionPhotoRecord[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) throw new Error(`El archivo ${file.name} no es una imagen válida.`);
    if (file.size > 10 * 1024 * 1024) throw new Error(`La imagen ${file.name} supera el máximo de 10 MB.`);
    const path = `${user.id}/${receptionId}/${makeObjectId()}-${safeFileName(file.name || 'foto.jpg')}`;
    const { error: uploadError } = await client.storage.from('reception-photos').upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (uploadError) throw uploadError;

    const { data, error } = await client.from('reception_photos').insert({ user_id: user.id, reception_id: receptionId, storage_path: path, photo_type: photoType, caption: file.name || null }).select('*').single();
    if (error) { await client.storage.from('reception-photos').remove([path]); throw error; }
    results.push(data as ReceptionPhotoRecord);
  }
  return results;
};

export const saveReceptionSignature = async (receptionId: string, signatureFile: File): Promise<string> => {
  const client = getClient();
  const user = await getCurrentUser();
  const path = `${user.id}/${receptionId}/signature-${makeObjectId()}.png`;
  const { error: uploadError } = await client.storage.from('reception-photos').upload(path, signatureFile, { upsert: false, contentType: 'image/png' });
  if (uploadError) throw uploadError;

  const { error } = await client.from('workshop_receptions').update({ signature_path: path, signed_at: new Date().toISOString() }).eq('id', receptionId).eq('user_id', user.id);
  if (error) { await client.storage.from('reception-photos').remove([path]); throw error; }
  return path;
};

export const getPrivateImageUrl = async (path: string, expiresIn = 300): Promise<string> => {
  const client = getClient();
  const { data, error } = await client.storage.from('reception-photos').createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
};

export const listRecentReceptions = async (limit = 50): Promise<ReceptionWithDetails[]> => {
  const client = getClient();
  const user = await getCurrentUser();
  const { data, error } = await client.from('workshop_receptions')
    .select('*, customer:customers(id,full_name,identification,phone,email), vehicle:vehicles(id,plate,make,model,year,nickname)')
    .eq('user_id', user.id).order('received_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as ReceptionWithDetails[];
};

export const getReception = async (id: string): Promise<ReceptionWithDetails | null> => {
  const client = getClient();
  const user = await getCurrentUser();
  const { data, error } = await client.from('workshop_receptions')
    .select('*, customer:customers(id,full_name,identification,phone,email), vehicle:vehicles(id,plate,make,model,year,nickname)')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return (data as ReceptionWithDetails | null) ?? null;
};

export const getReceptionInspection = async (receptionId: string): Promise<ReceptionInspectionRecord | null> => {
  const client = getClient();
  const { data, error } = await client.from('reception_inspections').select('*').eq('reception_id', receptionId).maybeSingle();
  if (error) throw error;
  return (data as ReceptionInspectionRecord | null) ?? null;
};

export const updateReceptionStatus = async (id: string, status: ReceptionStatus): Promise<ReceptionRecord> => {
  const client = getClient();
  const user = await getCurrentUser();
  const patch: Record<string, unknown> = { status };
  if (status === 'delivered') patch.delivered_at = new Date().toISOString();
  if (status !== 'delivered') patch.delivered_at = null;
  const { data, error } = await client.from('workshop_receptions').update(patch).eq('id', id).eq('user_id', user.id).select('*').single();
  if (error) throw error;
  return data as ReceptionRecord;
};
