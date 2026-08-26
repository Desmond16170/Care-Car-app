import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { createVehicle, getCurrentUser, normalizePlate } from '../services/carCareData';

const AddVehicle = () => {
  const navigate = useNavigate();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then(() => mounted && setIsAuthenticated(true))
      .catch(() => mounted && setIsAuthenticated(false));
    return () => { mounted = false; };
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const parsedYear = Number(year);
    const parsedMileage = Number(mileage);
    if (!normalizePlate(plate) || !make.trim() || !model.trim()) {
      setSaving(false);
      setMessage('Placa, marca y modelo son obligatorios.');
      return;
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 1886 || parsedYear > 2200) {
      setSaving(false);
      setMessage('Ingresa un año válido.');
      return;
    }
    if (!Number.isFinite(parsedMileage) || parsedMileage < 0) {
      setSaving(false);
      setMessage('Ingresa un kilometraje válido.');
      return;
    }

    try {
      const vehicle = await createVehicle({
        make,
        model,
        year: parsedYear,
        currentMileage: parsedMileage,
        plate,
        vin,
        nickname,
      });
      navigate(`/vehicle/${encodeURIComponent(vehicle.plate || normalizePlate(plate))}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el vehículo.');
    } finally {
      setSaving(false);
    }
  };

  if (isAuthenticated === null) return <div className="cc-card cc-empty">Comprobando sesión...</div>;
  if (!isAuthenticated) return <div className="cc-alert cc-alert-danger">Debes iniciar sesión para registrar vehículos.</div>;

  return (
    <section className="cc-page cc-form-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Registro manual</div>
          <h1 className="cc-page-title">Agregar vehículo</h1>
          <p className="cc-page-subtitle">Úsalo cuando no encuentres la marca o el modelo en el modo guiado.</p>
        </div>
        <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>
          Volver al modo guiado
        </ThemedButton>
      </div>

      <form onSubmit={handleAddVehicle} className="cc-card cc-form-shell">
        <div className="cc-panel-head"><div><h2>Datos principales</h2><p>Completa solo los datos que tengas disponibles.</p></div></div>

        <div className="cc-field-grid">
          <label className="cc-field">
            <span>Placa</span>
            <input className="cc-input cc-plate-input" type="text" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC123" required />
          </label>
          <label className="cc-field">
            <span>Apodo</span>
            <input className="cc-input" type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Opcional" />
          </label>
          <label className="cc-field">
            <span>Marca</span>
            <input className="cc-input" type="text" value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" required />
          </label>
          <label className="cc-field">
            <span>Modelo</span>
            <input className="cc-input" type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Corolla" required />
          </label>
          <label className="cc-field">
            <span>Año</span>
            <input className="cc-input" type="number" value={year} onChange={e => setYear(e.target.value)} min="1886" max="2200" placeholder="2020" required />
          </label>
          <label className="cc-field">
            <span>Kilometraje actual</span>
            <input className="cc-input" type="number" value={mileage} onChange={e => setMileage(e.target.value)} min="0" placeholder="0" required />
          </label>
          <label className="cc-field cc-field-full">
            <span>VIN</span>
            <input className="cc-input" type="text" value={vin} onChange={e => setVin(e.target.value.toUpperCase())} placeholder="Opcional" />
          </label>
        </div>

        {message && <div className="cc-alert cc-alert-danger" style={{ marginTop: '16px' }}>{message}</div>}

        <div className="cc-form-actions">
          <ThemedButton type="button" onClick={() => navigate('/search')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Cancelar</ThemedButton>
          <ThemedButton type="submit" disabled={saving} style={{ width: 'auto', minWidth: '170px' }}>{saving ? 'Guardando...' : 'Guardar vehículo'}</ThemedButton>
        </div>
      </form>
    </section>
  );
};

export default AddVehicle;
