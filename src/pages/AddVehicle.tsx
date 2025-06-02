import React, { useState, useEffect } from 'react';
import ThemedButton from '../components/ThemedButton';
import PasswordInput from '../components/PasswordInput';

const AddVehicle = () => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [plate, setPlate] = useState('');
  const [message, setMessage] = useState('');
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('car-care-active-user') || 'null');
    setActiveUser(loggedUser);
  }, []);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeUser || !activeUser.name) {
      setMessage('Debes iniciar sesión para agregar vehículos.');
      return;
    }

    const vehicle = {
      make,
      model,
      year,
      mileage,
      plate,
      registeredBy: activeUser.name,
    };

    const allVehicles = JSON.parse(localStorage.getItem('car-care-vehicles') || '{}');
    const userVehicles = allVehicles[activeUser.name] || [];

    const duplicate = userVehicles.find((v: any) => v.plate === plate);
    if (duplicate) {
      setMessage('Ya existe un vehículo con esa placa.');
      return;
    }

    userVehicles.push(vehicle);
    allVehicles[activeUser.name] = userVehicles;
    localStorage.setItem('car-care-vehicles', JSON.stringify(allVehicles));

    setMessage('¡Vehículo guardado con éxito!');
    setMake('');
    setModel('');
    setYear('');
    setMileage('');
    setPlate('');
  };

  if (!activeUser) {
    return <p style={{ color: 'red', textAlign: 'center' }}>Debes iniciar sesión para acceder a esta página.</p>;
  }

  const inputStyle = {
    padding: '10px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '10px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleAddVehicle} style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Agregar Vehículo</h2>

        <input type="text" placeholder="Placa" value={plate} onChange={e => setPlate(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Marca" value={make} onChange={e => setMake(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Modelo" value={model} onChange={e => setModel(e.target.value)} required style={inputStyle} />
        <input type="number" placeholder="Año" value={year} onChange={e => setYear(e.target.value)} required style={inputStyle} />
        <input type="number" placeholder="Kilometraje" value={mileage} onChange={e => setMileage(e.target.value)} required style={inputStyle} />

        <ThemedButton
          type="submit"
          style={{
            marginTop: '1rem',
            padding: '10px 24px',
            width: 'auto',
            minWidth: '160px',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          Guardar Vehículo
        </ThemedButton>

        {message && (
          <p style={{ marginTop: '10px', color: message.includes('éxito') ? 'green' : 'red', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AddVehicle;
