import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface VehicleRecord {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number | null;
  generation: string | null;
  plate: string | null;
  vin: string | null;
  current_mileage: number;
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  service_date: string;
  mileage: number | null;
  cost: number | null;
  notes: string | null;
  performed_by: string | null;
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MileageLogRecord {
  id: string;
  vehicle_id: string;
  mileage: number;
  recorded_at: string;
  notes: string | null;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  plate: string;
  year?: number | null;
  generation?: string | null;
  currentMileage?: number;
  vin?: string | null;
  nickname?: string | null;
}

export interface CreateMaintenanceInput {
  vehicleId: string;
  maintenanceType: string;
  serviceDate?: string;
  mileage?: number | null;
  cost?: number | null;
  notes?: string | null;
  details?: Record<string, unknown>;
}

const getClient = () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado en esta instalación.');
  }
  return supabase;
};

export const normalizePlate = (plate: string) =>
  plate.trim().replace(/\s+/g, '').toUpperCase();

export const getCurrentUser = async (): Promise<User> => {
  const client = getClient();
  const { data, error } = await client.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error('Debes iniciar sesión para continuar.');

  return data.user;
};

const getCurrentDisplayName = async (user: User): Promise<string> => {
  const client = getClient();
  const { data } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    data?.full_name ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    user.email ||
    'Usuario'
  );
};

const updateCurrentMileage = async (vehicleId: string, mileage: number) => {
  const client = getClient();
  const safeMileage = Math.max(0, mileage);

  const { data: vehicle, error: vehicleError } = await client
    .from('vehicles')
    .select('current_mileage')
    .eq('id', vehicleId)
    .maybeSingle();

  if (vehicleError) throw vehicleError;

  if (vehicle && safeMileage > (vehicle.current_mileage ?? 0)) {
    const { error } = await client
      .from('vehicles')
      .update({ current_mileage: safeMileage })
      .eq('id', vehicleId);

    if (error) throw error;
  }
};

export const createVehicle = async (input: CreateVehicleInput): Promise<VehicleRecord> => {
  const client = getClient();
  const user = await getCurrentUser();
  const plate = normalizePlate(input.plate);
  const currentMileage = Math.max(0, input.currentMileage ?? 0);

  if (!plate) throw new Error('La placa es obligatoria.');

  const { data, error } = await client
    .from('vehicles')
    .insert({
      user_id: user.id,
      make: input.make.trim(),
      model: input.model.trim(),
      year: input.year ?? null,
      generation: input.generation?.trim() || null,
      plate,
      vin: input.vin?.trim() || null,
      current_mileage: currentMileage,
      nickname: input.nickname?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un vehículo con esa placa en tu cuenta.');
    }
    throw error;
  }

  const vehicle = data as VehicleRecord;

  if (currentMileage > 0) {
    const { error: mileageError } = await client.from('mileage_logs').insert({
      vehicle_id: vehicle.id,
      mileage: currentMileage,
      notes: 'Kilometraje inicial al registrar el vehículo',
    });

    if (mileageError) {
      console.warn('El vehículo se guardó, pero no se pudo crear el kilometraje inicial.', mileageError);
    }
  }

  return vehicle;
};

export const listVehicles = async (): Promise<VehicleRecord[]> => {
  const client = getClient();
  const user = await getCurrentUser();

  const { data, error } = await client
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as VehicleRecord[];
};

export const findVehicleByPlate = async (plateInput: string): Promise<VehicleRecord | null> => {
  const client = getClient();
  const user = await getCurrentUser();
  const plate = normalizePlate(plateInput);

  if (!plate) return null;

  const { data, error } = await client
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .eq('plate', plate)
    .maybeSingle();

  if (error) throw error;
  return (data as VehicleRecord | null) ?? null;
};

export const listMaintenances = async (vehicleId: string): Promise<MaintenanceRecord[]> => {
  const client = getClient();

  const { data, error } = await client
    .from('maintenances')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MaintenanceRecord[];
};

export const listAllMaintenances = async (): Promise<MaintenanceRecord[]> => {
  const client = getClient();
  await getCurrentUser();

  const { data, error } = await client
    .from('maintenances')
    .select('*')
    .order('service_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MaintenanceRecord[];
};

export const createMaintenance = async (
  input: CreateMaintenanceInput
): Promise<MaintenanceRecord> => {
  const client = getClient();
  const user = await getCurrentUser();
  const performedBy = await getCurrentDisplayName(user);
  const mileage = input.mileage == null ? null : Math.max(0, input.mileage);

  const { data, error } = await client
    .from('maintenances')
    .insert({
      vehicle_id: input.vehicleId,
      maintenance_type: input.maintenanceType.trim(),
      service_date: input.serviceDate || new Date().toISOString().slice(0, 10),
      mileage,
      cost: input.cost ?? null,
      notes: input.notes?.trim() || null,
      performed_by: performedBy,
      details: input.details ?? {},
    })
    .select('*')
    .single();

  if (error) throw error;

  if (mileage != null) {
    const { error: logError } = await client.from('mileage_logs').insert({
      vehicle_id: input.vehicleId,
      mileage,
      recorded_at: `${input.serviceDate || new Date().toISOString().slice(0, 10)}T12:00:00Z`,
      notes: `Mantenimiento: ${input.maintenanceType.trim()}`,
    });

    if (logError) {
      console.warn('El mantenimiento se guardó, pero no se pudo registrar el kilometraje histórico.', logError);
    }

    try {
      await updateCurrentMileage(input.vehicleId, mileage);
    } catch (mileageError) {
      console.warn('El mantenimiento se guardó, pero no se pudo actualizar el kilometraje.', mileageError);
    }
  }

  return data as MaintenanceRecord;
};

export const listMileageLogs = async (vehicleId: string): Promise<MileageLogRecord[]> => {
  const client = getClient();

  const { data, error } = await client
    .from('mileage_logs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MileageLogRecord[];
};

export const recordMileage = async (
  vehicleId: string,
  mileage: number,
  notes?: string
): Promise<MileageLogRecord> => {
  const client = getClient();
  await getCurrentUser();
  const safeMileage = Math.max(0, mileage);

  const { data, error } = await client
    .from('mileage_logs')
    .insert({
      vehicle_id: vehicleId,
      mileage: safeMileage,
      notes: notes?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw error;

  await updateCurrentMileage(vehicleId, safeMileage);
  return data as MileageLogRecord;
};
