import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InitialSetup = () => {
  const [tallerName, setTallerName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');
  const [textColor, setTextColor] = useState('#ffffff');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const convertToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const logo = logoFile ? await convertToBase64(logoFile) : '';
      localStorage.setItem('car-care-taller-name', tallerName.trim());
      localStorage.setItem('car-care-logo', logo);
      localStorage.setItem('car-care-primary-color', primaryColor);
      localStorage.setItem('car-care-text-color', textColor);
      localStorage.setItem('car-care-background-color', '#f3f4f6');
      localStorage.setItem('car-care-body-text-color', '#111827');
      localStorage.setItem('car-care-font-family', 'Arial');
      localStorage.setItem('car-care-configured', 'true');
      navigate('/1', { replace: true });
    } catch {
      setError('No se pudo guardar la configuración. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="setup-page">
      <section className="setup-intro">
        <span className="eyebrow">CONFIGURACIÓN INICIAL</span>
        <h1>Preparemos tu taller</h1>
        <p>Estos datos identificarán la empresa en Windows y en la PWA. Podrás modificarlos después.</p>
        <ol className="setup-steps">
          <li className="setup-steps__active"><span>1</span> Identidad del taller</li>
          <li><span>2</span> Clientes y vehículos</li>
          <li><span>3</span> Comenzar a trabajar</li>
        </ol>
      </section>

      <section className="setup-card">
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="workshop-name">Nombre del taller</label>
            <input
              id="workshop-name"
              type="text"
              value={tallerName}
              onChange={event => setTallerName(event.target.value)}
              placeholder="Ej. Taller Herrera"
              required
              autoFocus
            />
            <small>Aparecerá en el encabezado y en documentos futuros.</small>
          </div>

          <div className="field-group">
            <label htmlFor="workshop-logo">Logo del taller <span>(opcional)</span></label>
            <input id="workshop-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setLogoFile(event.target.files?.[0] || null)} />
          </div>

          <div className="color-fields">
            <div className="field-group">
              <label htmlFor="primary-color">Color principal</label>
              <input id="primary-color" type="color" value={primaryColor} onChange={event => setPrimaryColor(event.target.value)} />
            </div>
            <div className="field-group">
              <label htmlFor="text-color">Texto del botón</label>
              <input id="text-color" type="color" value={textColor} onChange={event => setTextColor(event.target.value)} />
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default InitialSetup;
