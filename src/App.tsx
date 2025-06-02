import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AddVehicle from './pages/AddVehicle';
import SearchVehicles from './pages/SearchVehicles';
import VehicleDetails from './pages/VehicleDetails';
import ProtectedInstall from './components/ProtectedInstall';
import InitialSetup from './pages/InitialSetup';
import GuideAddVehicle from './pages/GuideAddVehicle';

const App = () => {
  const isConfigured = localStorage.getItem('car-care-configured') === 'true';

  const tallerName = localStorage.getItem('car-care-taller-name') || 'Taller';
  const logo = localStorage.getItem('car-care-logo');

  return (
    <ProtectedInstall>
      <div>
        <header style={{ display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#e0e0e0' }}>
          {logo && (
            <img src={logo} alt="Logo Taller" style={{ height: '50px', marginRight: '15px' }} />
          )}
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{tallerName}</h1>
        </header>

        <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0', marginBottom: '1rem' }}>
          <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', padding: 0, margin: 0 }}>
            <li><Link to="/1">Inicio</Link></li>
            <li><Link to="/search">Buscar Vehículo</Link></li>
            <li><Link to="/add-vehicle-guided">Agregar Vehículo </Link></li>

          </ul>
        </nav>

        <Routes>
          <Route path="/" element={isConfigured ? <Navigate to="/1" /> : <InitialSetup />} />
          <Route path="/1" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<SearchVehicles />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
          <Route path="/add-vehicle-guided" element={<GuideAddVehicle />} />
          <Route path="/vehicle/:plate" element={<VehicleDetails />} />

        </Routes>
      </div>
    </ProtectedInstall>
  );
};

export default App;