import { supabase } from './supabaseClient';

const CLOUD_KEYS = [
  'car-care-configured',
  'car-care-taller-name',
  'car-care-logo',
  'car-care-primary-color',
  'car-care-text-color',
  'car-care-background-color',
  'car-care-body-text-color',
  'car-care-font-family',
  'car-care-oil-types',
  'car-care-oil-brands',
  'car-care-oil-viscosities',
  'car-care-vehicles',
  'car-care-maintenance',
  'car-care-oil-changes',
];

let dirty = false;
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

function snapshot() {
  const data: Record<string, string> = {};
  CLOUD_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return data;
}

function applySnapshot(data: Record<string, string> | null) {
  if (!data) return;
  CLOUD_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      localStorage.setItem(key, data[key]);
    }
  });
}

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function hydrateCloudState() {
  const user = await currentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_state')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  applySnapshot((data?.data || {}) as Record<string, string>);

  localStorage.setItem('car-care-active-user', JSON.stringify({
    id: user.id,
    name: user.user_metadata?.full_name || user.email || 'Usuario',
    cedula: user.user_metadata?.identification || '',
    email: user.email,
  }));
  dirty = false;
  return true;
}

export async function flushCloudState() {
  if (!dirty) return;
  const user = await currentUser();
  if (!user) return;

  const { error } = await supabase.from('user_state').upsert({
    user_id: user.id,
    data: snapshot(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  dirty = false;
}

export async function startCloudSync() {
  if (started) return;
  started = true;

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && CLOUD_KEYS.includes(key)) dirty = true;
  };
  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem.call(this, key);
    if (this === localStorage && CLOUD_KEYS.includes(key)) dirty = true;
  };

  try {
    await hydrateCloudState();
  } catch (error) {
    console.error('No se pudo descargar la información de Supabase:', error);
  }

  timer = setInterval(() => {
    flushCloudState().catch((error) =>
      console.error('No se pudo sincronizar con Supabase:', error)
    );
  }, 2500);

  window.addEventListener('beforeunload', () => {
    void flushCloudState();
  });

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('car-care-active-user');
      if (timer) clearInterval(timer);
    }
  });
}
