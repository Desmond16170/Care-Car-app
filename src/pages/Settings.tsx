import React, { useEffect, useState } from 'react';
import ThemedButton from '../components/ThemedButton';
import { getModuleConfig, ModuleConfig, saveModuleConfig } from '../lib/modules';

type OilTypeMap = { [key: string]: { km: number; mi: number } };

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'workshop' | 'modules' | 'oil' | 'theme'>('workshop');
  const [tallerName, setTallerName] = useState('Care Car');
  const [modules, setModules] = useState<ModuleConfig>(getModuleConfig());
  const [oilTypes, setOilTypes] = useState<OilTypeMap>({});
  const [newType, setNewType] = useState('');
  const [newTypeKm, setNewTypeKm] = useState('');
  const [newTypeMi, setNewTypeMi] = useState('');
  const [oilBrands, setOilBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');
  const [viscosities, setViscosities] = useState<string[]>([]);
  const [newViscosity, setNewViscosity] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#FFA500');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [logo, setLogo] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTallerName(localStorage.getItem('car-care-taller-name') || 'Care Car');
    setModules(getModuleConfig());
    setOilTypes(JSON.parse(localStorage.getItem('car-care-oil-types') || '{}'));
    setOilBrands(JSON.parse(localStorage.getItem('car-care-oil-brands') || '[]'));
    setViscosities(JSON.parse(localStorage.getItem('car-care-oil-viscosities') || '[]'));
    setLogo(localStorage.getItem('car-care-logo') || '');
    setPrimaryColor(localStorage.getItem('car-care-primary-color') || '#FFA500');
    setTextColor(localStorage.getItem('car-care-text-color') || '#FFFFFF');
  }, []);

  const showSaved = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const saveWorkshop = () => {
    localStorage.setItem('car-care-taller-name', tallerName.trim() || 'Care Car');
    showSaved('Datos del taller guardados.');
  };

  const saveModules = () => {
    saveModuleConfig(modules);
    showSaved('Módulos de esta instalación actualizados.');
  };

  const saveOilConfig = () => {
    localStorage.setItem('car-care-oil-types', JSON.stringify(oilTypes));
    localStorage.setItem('car-care-oil-brands', JSON.stringify(oilBrands));
    localStorage.setItem('car-care-oil-viscosities', JSON.stringify(viscosities));
    showSaved('Configuración de aceites guardada.');
  };

  const saveThemeConfig = () => {
    localStorage.setItem('car-care-primary-color', primaryColor);
    localStorage.setItem('car-care-text-color', textColor);
    if (logo) localStorage.setItem('car-care-logo', logo);
    document.documentElement.style.setProperty('--custom-button-bg', primaryColor);
    document.documentElement.style.setProperty('--custom-button-text', textColor);
    showSaved('Configuración visual guardada.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeOilType = (key: string) => {
    const copy = { ...oilTypes };
    delete copy[key];
    setOilTypes(copy);
  };

  const addOilType = () => {
    if (!newType.trim() || !newTypeKm || !newTypeMi) return;
    setOilTypes(current => ({ ...current, [newType.trim()]: { km: Number(newTypeKm), mi: Number(newTypeMi) } }));
    setNewType('');
    setNewTypeKm('');
    setNewTypeMi('');
  };

  const toggleModule = (key: keyof ModuleConfig) => {
    setModules(current => ({ ...current, [key]: !current[key] }));
  };

  return (
    <section className="cc-page cc-settings-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Preferencias</div>
          <h1 className="cc-page-title">Configuración</h1>
          <p className="cc-page-subtitle">Ajustes locales de esta instalación y datos del taller.</p>
        </div>
      </div>

      {message && <div className="cc-alert cc-alert-info">{message}</div>}

      <div className="cc-settings-layout">
        <aside className="cc-card cc-settings-tabs">
          <button className={activeTab === 'workshop' ? 'active' : ''} onClick={() => setActiveTab('workshop')}>Taller</button>
          <button className={activeTab === 'modules' ? 'active' : ''} onClick={() => setActiveTab('modules')}>Módulos</button>
          <button className={activeTab === 'oil' ? 'active' : ''} onClick={() => setActiveTab('oil')}>Aceites</button>
          <button className={activeTab === 'theme' ? 'active' : ''} onClick={() => setActiveTab('theme')}>Apariencia</button>
        </aside>

        <div className="cc-card cc-panel cc-settings-content">
          {activeTab === 'workshop' && (
            <>
              <div className="cc-panel-head"><div><h2>Datos del taller</h2><p>Se usan en el encabezado y documentos impresos.</p></div></div>
              <label className="cc-field"><span>Nombre del taller</span><input className="cc-input" value={tallerName} onChange={e => setTallerName(e.target.value)} placeholder="Care Car" /></label>
              <div className="cc-settings-note">Los datos operativos de clientes, vehículos y mantenimientos se guardan en Supabase. Estas preferencias permanecen locales en el dispositivo.</div>
              <ThemedButton onClick={saveWorkshop} style={{ marginTop: '16px', width: 'auto' }}>Guardar datos</ThemedButton>
            </>
          )}

          {activeTab === 'modules' && (
            <>
              <div className="cc-panel-head"><div><h2>Módulos de esta instalación</h2><p>Oculta funciones que este taller no necesita sin eliminar información.</p></div></div>
              <div className="cc-settings-note">Desactivar un módulo no borra clientes, recepciones, vehículos ni historial. Solo desaparece de esta instalación hasta volver a activarlo.</div>
              <div className="cc-module-list">
                <button className={`cc-module-row${modules.dashboard ? ' enabled' : ''}`} onClick={() => toggleModule('dashboard')}>
                  <div><strong>Resumen / Dashboard</strong><span>Métricas, actividad y vista general del taller.</span></div><span>{modules.dashboard ? 'Activo' : 'Desactivado'}</span>
                </button>
                <button className={`cc-module-row${modules.customers ? ' enabled' : ''}`} onClick={() => toggleModule('customers')}>
                  <div><strong>Clientes</strong><span>Directorio, fichas, vehículos y visitas.</span></div><span>{modules.customers ? 'Activo' : 'Desactivado'}</span>
                </button>
                <button className={`cc-module-row${modules.tramado ? ' enabled' : ''}`} onClick={() => toggleModule('tramado')}>
                  <div><strong>Tramado / Recepción</strong><span>Ingreso, inspección, fotos, firma y estados.</span></div><span>{modules.tramado ? 'Activo' : 'Desactivado'}</span>
                </button>
              </div>
              <ThemedButton onClick={saveModules} style={{ marginTop: '16px', width: 'auto' }}>Guardar módulos</ThemedButton>
            </>
          )}

          {activeTab === 'oil' && (
            <>
              <div className="cc-panel-head"><div><h2>Aceites y viscosidades</h2><p>Catálogos rápidos para acelerar el registro de cambios de aceite.</p></div></div>
              <div className="cc-settings-section">
                <h3>Tipos de aceite</h3>
                <div className="cc-settings-inline-form cc-settings-inline-form-3">
                  <input className="cc-input" placeholder="Nombre" value={newType} onChange={e => setNewType(e.target.value)} />
                  <input className="cc-input" type="number" min="0" placeholder="KM sugerido" value={newTypeKm} onChange={e => setNewTypeKm(e.target.value)} />
                  <input className="cc-input" type="number" min="0" placeholder="Millas sugeridas" value={newTypeMi} onChange={e => setNewTypeMi(e.target.value)} />
                  <ThemedButton onClick={addOilType} style={{ width: 'auto' }}>Agregar</ThemedButton>
                </div>
                <div className="cc-settings-list">
                  {Object.entries(oilTypes).map(([name, range]) => <div className="cc-settings-row" key={name}><div><strong>{name}</strong><span>{range.km.toLocaleString()} km · {range.mi.toLocaleString()} mi</span></div><button onClick={() => removeOilType(name)}>Eliminar</button></div>)}
                  {Object.keys(oilTypes).length === 0 && <div className="cc-empty-inline">No hay tipos configurados.</div>}
                </div>
              </div>
              <div className="cc-settings-section"><h3>Marcas</h3><div className="cc-settings-inline-form"><input className="cc-input" placeholder="Nueva marca" value={newBrand} onChange={e => setNewBrand(e.target.value)} /><ThemedButton onClick={() => { if (newBrand.trim()) { setOilBrands(current => [...current, newBrand.trim()]); setNewBrand(''); } }} style={{ width: 'auto' }}>Agregar</ThemedButton></div><div className="cc-tag-list">{oilBrands.map((brand, index) => <span className="cc-tag" key={`${brand}-${index}`}>{brand}<button onClick={() => setOilBrands(current => current.filter((_, i) => i !== index))}>×</button></span>)}</div></div>
              <div className="cc-settings-section"><h3>Viscosidades</h3><div className="cc-settings-inline-form"><input className="cc-input" placeholder="Ej. 10W-30" value={newViscosity} onChange={e => setNewViscosity(e.target.value)} /><ThemedButton onClick={() => { if (newViscosity.trim()) { setViscosities(current => [...current, newViscosity.trim()]); setNewViscosity(''); } }} style={{ width: 'auto' }}>Agregar</ThemedButton></div><div className="cc-tag-list">{viscosities.map((item, index) => <span className="cc-tag" key={`${item}-${index}`}>{item}<button onClick={() => setViscosities(current => current.filter((_, i) => i !== index))}>×</button></span>)}</div></div>
              <ThemedButton onClick={saveOilConfig} style={{ marginTop: '16px', width: 'auto' }}>Guardar aceites</ThemedButton>
            </>
          )}

          {activeTab === 'theme' && (
            <>
              <div className="cc-panel-head"><div><h2>Apariencia</h2><p>Personaliza la identidad visual de esta instalación.</p></div></div>
              <div className="cc-field-grid"><label className="cc-field"><span>Color principal</span><input className="cc-color-input" type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} /></label><label className="cc-field"><span>Texto sobre botones</span><input className="cc-color-input" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} /></label></div>
              <div className="cc-settings-section"><h3>Logo del taller</h3><label className="cc-file-drop"><input type="file" accept="image/*" onChange={handleLogoUpload} /><span>{logo ? 'Cambiar logo' : 'Seleccionar imagen'}</span></label>{logo && <div className="cc-logo-preview"><img src={logo} alt="Vista previa del logo" /></div>}</div>
              <ThemedButton onClick={saveThemeConfig} style={{ marginTop: '16px', width: 'auto' }}>Guardar apariencia</ThemedButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Settings;
