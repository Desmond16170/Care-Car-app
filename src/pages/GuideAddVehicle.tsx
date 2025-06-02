
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';

interface Marca {
  nombre: string;
}

interface Modelo {
  nombre: string;
  generaciones: {
    nombre: string;
    desde: number;
    hasta: number;
  }[];
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
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const allMarcas: Marca[] = [
      { nombre: 'Acura' }, { nombre: 'Audi' }, { nombre: 'BAIC' }, { nombre: 'BMW' },
      { nombre: 'BYD' }, { nombre: 'Changan' }, { nombre: 'Chery' }, { nombre: 'Chevrolet' },
      { nombre: 'Chrysler' }, { nombre: 'DFSK' }, { nombre: 'Dodge' }, { nombre: 'Dongfeng' },
      { nombre: 'Faw' }, { nombre: 'Fiat' }, { nombre: 'Ford' }, { nombre: 'Foton' },
      { nombre: 'GAC' }, { nombre: 'Geely' }, { nombre: 'GWM' }, { nombre: 'Genesis' },
      { nombre: 'Haval' }, { nombre: 'Honda' }, { nombre: 'Hyundai' }, { nombre: 'Infiniti' },
      { nombre: 'Isuzu' }, { nombre: 'JAC' }, { nombre: 'Jeep' }, { nombre: 'Kia' },
      { nombre: 'Lada' }, { nombre: 'Land Rover' }, { nombre: 'Lexus' }, { nombre: 'Lincoln' },
      { nombre: 'Mazda' }, { nombre: 'Mercedes-Benz' }, { nombre: 'MG' }, { nombre: 'Mini' },
      { nombre: 'Mitsubishi' }, { nombre: 'Nissan' }, { nombre: 'Opel' }, { nombre: 'Peugeot' },
      { nombre: 'Porsche' }, { nombre: 'Renault' }, { nombre: 'Seat' }, { nombre: 'Skoda' },
      { nombre: 'Subaru' }, { nombre: 'Suzuki' }, { nombre: 'Tesla' }, { nombre: 'Toyota' },
      { nombre: 'Volkswagen' }, { nombre: 'Volvo' }
    ];
    setMarcas(allMarcas);
  }, []);

  const handleSelectMarca = (marca: string) => {
    setSelectedMarca(marca);
    setSelectedModelo(null);
    setSelectedGeneracion(null);
    fetch(`./data/${marca.toLowerCase().replace(/ /g, '-')}.json`)
      .then(res => res.json())
      .then(data => {
        const modelosTransformados: Modelo[] = Object.entries(data.modelos).map(
          ([nombre, generaciones]: [string, any]) => ({
            nombre,
            generaciones
          })
        );
        setModelos(modelosTransformados);
      })
      .catch(() => setModelos([]));
  };

  const handleSelectModelo = (modelo: string) => {
    setSelectedModelo(modelo);
    const modeloInfo = modelos.find(m => m.nombre === modelo);
    if (modeloInfo) {
      const gens = modeloInfo.generaciones.map(gen => `${gen.nombre} (${gen.desde}-${gen.hasta})`);
      setGeneraciones(gens);
    } else {
      setGeneraciones([]);
    }
  };

  const handleSaveVehicle = () => {
    const activeUser = JSON.parse(localStorage.getItem('car-care-active-user') || 'null');
    if (!activeUser || !selectedMarca || !selectedModelo || !selectedGeneracion || !placa) {
      setMessage('Por favor completa todos los campos.');
      return;
    }

    const vehicle = {
      make: selectedMarca,
      model: selectedModelo,
      year: selectedGeneracion,
      mileage: kilometraje,
      plate: placa,
      registeredBy: activeUser.name,
    };

    const allVehicles = JSON.parse(localStorage.getItem('car-care-vehicles') || '{}');
    const userVehicles = allVehicles[activeUser.name] || [];

    if (userVehicles.some((v: any) => v.plate === placa)) {
      setMessage('Ya existe un vehículo con esa placa.');
      return;
    }

    userVehicles.push(vehicle);
    allVehicles[activeUser.name] = userVehicles;
    localStorage.setItem('car-care-vehicles', JSON.stringify(allVehicles));
    navigate(`/vehicle/${placa}`);
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Modo Guiado: Agregar Vehículo</h2>

      {!selectedMarca && (
        <>
          <p>Selecciona una marca:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            {marcas.map(marca => (
              <button key={marca.nombre} onClick={() => handleSelectMarca(marca.nombre)} style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '10px',
                width: '100px',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={`./logos/${marca.nombre.toLowerCase().replace(/ /g, '_')}.png`}
                  alt={marca.nombre}
                  style={{ width: '50px', height: '40px' }}
                />
                <span style={{ fontSize: '12px' }}>{marca.nombre}</span>
              </button>
            ))}
          </div>
          <ThemedButton
  onClick={() => navigate('/add-vehicle')}
  style={{
    border: '2px dashed gray',
    borderRadius: '8px',
    padding: '10px',
    width: '100px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    color: '#555',
    fontSize: '12px',
  }}
>
  <span style={{ fontSize: '24px', marginBottom: '5px' }}>＋</span>
  otro
</ThemedButton>

        </>
      )}

      {selectedMarca && !selectedModelo && (
        <>
          <p>Selecciona un modelo:</p>
          {modelos.length === 0 && <p>No hay modelos disponibles.</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            {modelos.map(modelo => (
              <ThemedButton
  key={modelo.nombre}
  onClick={() => handleSelectModelo(modelo.nombre)}
  style={{
    maxWidth: '300px',  // límite de ancho
    width: '90%',        // ancho relativo adaptable
    margin: '0 auto'     // centrar horizontalmente
  }}
>
  {modelo.nombre}
</ThemedButton>
            ))}
          </div>
        </>
      )}

      {selectedModelo && (
        <>
          <p>Selecciona una generación:</p>
          <select onChange={e => setSelectedGeneracion(e.target.value)} value={selectedGeneracion || ''} style={{ padding: '10px', marginBottom: '10px' }}>
            <option value="">Selecciona generación</option>
            {generaciones.map((gen, idx) => (
              <option key={idx} value={gen}>{gen}</option>
            ))}
          </select>
          <input
  type="text"
  placeholder="Placa"
  value={placa}
  onChange={(e) => setPlaca(e.target.value)}
  style={{
    padding: '10px',
    width: '90%',
    maxWidth: '300px',
    display: 'block',
    margin: '10px auto',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial'
  }}
/>

<input
  type="number"
  placeholder="Kilometraje"
  value={kilometraje}
  onChange={(e) => setKilometraje(e.target.value)}
  style={{
    padding: '10px',
    width: '90%',
    maxWidth: '300px',
    display: 'block',
    margin: '10px auto',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial'
  }}
/>

<ThemedButton
  onClick={handleSaveVehicle}
  style={{
    maxWidth: '300px',
    width: '90%',
    margin: '1rem auto 0 auto',
    display: 'block'
  }}
>
  Guardar Vehículo
</ThemedButton>
          {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
        </>
      )}
    </div>
  );
};

export default GuidedAddVehicle;
