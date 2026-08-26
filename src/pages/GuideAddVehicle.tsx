import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { createVehicle, normalizePlate } from '../services/carCareData';

interface Marca { nombre: string; }
interface Modelo {
  nombre: string;
  generaciones: { nombre: string; desde: number; hasta: number }[];
}

const GuidedAddVehicle = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [generaciones, setGeneraciones] = useState<string[]>([]);
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [selectedModelo, setSelectedModelo] = useState<string | null>(null);
  const [selectedGeneracion, setSelectedGeneracion] = useState<string | null>(null);
  const [kilometraje, setKilometraje] = useState('');
  const [placa, setPlaca] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMarcas([
      'Acura','Audi','BAIC','BMW','BYD','Changan','Chery','Chevrolet','Chrysler','DFSK','Dodge','Dongfeng',
      'Faw','Fiat','Ford','Foton','GAC','Geely','GWM','Genesis','Haval','Honda','Hyundai','Infiniti','Isuzu',
      'JAC','Jeep','Kia','Lada','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','MG','Mini','Mitsubishi',
      'Nissan','Opel','Peugeot','Porsche','Renault','Seat','Skoda','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo'
    ].map(nombre => ({ nombre })));
  }, []);

  const visibleBrands = useMemo(() => {
    const query = brandSearch.trim().toLowerCase();
    return query ? marcas.filter(m => m.nombre.toLowerCase().includes(query)) : marcas;
  }, [brandSearch, marcas]);

  const step = !selectedMarca ? 1 : !selectedModelo ? 2 : 3;

  const handleSelectMarca = (marca: string) => {
    setSelectedMarca(marca);
    setSelectedModelo(null);
    setSelectedGeneracion(null);
    setMessage('');
    fetch(`./data/${marca.toLowerCase().replace(/ /g, '-')}.json`)
      .then(res => {
        if (!res.ok) throw new Error('No disponible');
        return res.json();
      })
      .then(data => {
        const rows: Modelo[] = Object.entries(data.modelos || {}).map(
          ([nombre, generaciones]: [string, any]) => ({ nombre, generaciones })
        );
        setModelos(rows);
      })
      .catch(() => setModelos([]));
  };

  const handleSelectModelo = (modelo: string) => {
    setSelectedModelo(modelo);
    setSelectedGeneracion(null);
    const info = modelos.find(m => m.nombre === modelo);
    setGeneraciones(info ? info.generaciones.map(gen => `${gen.nombre} (${gen.desde}-${gen.hasta})`) : []);
  };

  const handleBack = () => {
    setMessage('');
    if (selectedModelo) {
      setSelectedModelo(null);
      setSelectedGeneracion(null);
      setGeneraciones([]);
    } else if (selectedMarca) {
      setSelectedMarca(null);
      setModelos([]);
    } else {
      navigate('/search');
    }
  };

  const handleSaveVehicle = async () => {
    if (!selectedMarca || !selectedModelo || !selectedGeneracion || !normalizePlate(placa)) {
      setMessage('Completa generación y placa antes de guardar.');
      return;
    }

    const mileage = Number(kilometraje || 0);
    if (!Number.isFinite(mileage) || mileage < 0) {
      setMessage('Ingresa un kilometraje válido.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const vehicle = await createVehicle({
        make: selectedMarca,
        model: selectedModelo,
        generation: selectedGeneracion,
        currentMileage: mileage,
        plate: placa,
      });
      navigate(`/vehicle/${encodeURIComponent(vehicle.plate || normalizePlate(placa))}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el vehículo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="cc-page cc-form-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Registro rápido</div>
          <h1 className="cc-page-title">Nuevo vehículo</h1>
          <p className="cc-page-subtitle">Tres pasos cortos para registrar sin detener el trabajo.</p>
        </div>
        <ThemedButton onClick={() => navigate('/add-vehicle')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>
          Registro manual
        </ThemedButton>
      </div>

      <div className="cc-stepper" aria-label="Progreso de registro">
        {['Marca', 'Modelo', 'Datos'].map((label, index) => {
          const number = index + 1;
          return (
            <div key={label} className={`cc-step${number === step ? ' current' : number < step ? ' done' : ''}`}>
              <span>{number}</span><strong>{label}</strong>
            </div>
          );
        })}
      </div>

      <div className="cc-card cc-form-shell">
        {step === 1 && (
          <>
            <div className="cc-panel-head">
              <div><h2>Selecciona la marca</h2><p>Puedes escribir para encontrarla más rápido.</p></div>
            </div>
            <input className="cc-input" type="search" placeholder="Buscar marca..." value={brandSearch} onChange={e => setBrandSearch(e.target.value)} />
            <div className="cc-brand-grid">
              {visibleBrands.map(marca => (
                <button key={marca.nombre} className="cc-brand-card" onClick={() => handleSelectMarca(marca.nombre)}>
                  <div className="cc-brand-logo-wrap">
                    <img src={`./logos/${marca.nombre.toLowerCase().replace(/ /g, '_')}.png`} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <strong>{marca.nombre}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="cc-selection-summary"><span>Marca</span><strong>{selectedMarca}</strong></div>
            <div className="cc-panel-head">
              <div><h2>Selecciona el modelo</h2><p>Escoge el modelo que corresponde al vehículo.</p></div>
            </div>
            {modelos.length === 0 ? (
              <div className="cc-empty-inline">No encontramos modelos para esta marca. Usa el registro manual si lo necesitas.</div>
            ) : (
              <div className="cc-option-grid">
                {modelos.map(modelo => (
                  <button key={modelo.nombre} className="cc-option-card" onClick={() => handleSelectModelo(modelo.nombre)}>{modelo.nombre}</button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="cc-selection-summary">
              <span>Vehículo</span><strong>{selectedMarca} {selectedModelo}</strong>
            </div>
            <div className="cc-panel-head">
              <div><h2>Completa los datos</h2><p>Solo lo necesario para poder empezar a trabajar con el vehículo.</p></div>
            </div>
            <div className="cc-field-grid">
              <label className="cc-field cc-field-full">
                <span>Generación</span>
                <select className="cc-input" value={selectedGeneracion || ''} onChange={e => setSelectedGeneracion(e.target.value)}>
                  <option value="">Selecciona una generación</option>
                  {generaciones.map(gen => <option key={gen} value={gen}>{gen}</option>)}
                </select>
              </label>
              <label className="cc-field">
                <span>Placa</span>
                <input className="cc-input cc-plate-input" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC123" autoCapitalize="characters" />
              </label>
              <label className="cc-field">
                <span>Kilometraje actual</span>
                <input className="cc-input" type="number" min="0" value={kilometraje} onChange={e => setKilometraje(e.target.value)} placeholder="0" />
              </label>
            </div>
          </>
        )}

        {message && <div className="cc-alert cc-alert-danger" style={{ marginTop: '16px' }}>{message}</div>}

        <div className="cc-form-actions">
          <ThemedButton onClick={handleBack} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>
            Atrás
          </ThemedButton>
          {step === 3 && (
            <ThemedButton onClick={handleSaveVehicle} disabled={saving} style={{ width: 'auto', minWidth: '170px' }}>
              {saving ? 'Guardando...' : 'Guardar vehículo'}
            </ThemedButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default GuidedAddVehicle;
