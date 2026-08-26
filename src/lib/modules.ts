export type ModuleKey = 'dashboard' | 'customers' | 'tramado';

export type ModuleConfig = Record<ModuleKey, boolean>;

const STORAGE_KEY = 'car-care-modules-v1';

export const DEFAULT_MODULES: ModuleConfig = {
  dashboard: true,
  customers: true,
  tramado: true,
};

export const getModuleConfig = (): ModuleConfig => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<ModuleConfig>;
    return { ...DEFAULT_MODULES, ...stored };
  } catch {
    return { ...DEFAULT_MODULES };
  }
};

export const isModuleEnabled = (key: ModuleKey) => getModuleConfig()[key] !== false;

export const saveModuleConfig = (config: ModuleConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('car-care-modules-changed', { detail: config }));
};
