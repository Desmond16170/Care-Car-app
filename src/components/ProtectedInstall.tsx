import React, { useEffect, useState } from 'react';

const SECRET_KEY = '18293018082JZGTe30';

const isElectronRuntime = () =>
  typeof window !== 'undefined' && typeof (window as any).require === 'function';

const ProtectedInstall: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isValid, setIsValid] = useState(!isElectronRuntime());
  const [licenseChecked, setLicenseChecked] = useState(!isElectronRuntime());

  useEffect(() => {
    if (!isElectronRuntime()) return;

    const verificarLicencia = () => {
      try {
        const req = (window as any).require;
        const fs = req('fs');
        const path = req('path');
        const crypto = req('crypto');
        const remote = req('@electron/remote');
        const app = remote.app;
        const licensePath = path.join(app.getPath('userData'), 'license.json');

        if (!fs.existsSync(licensePath)) {
          console.warn('❌ license.json no encontrado');
          setLicenseChecked(true);
          return;
        }

        const licenseRaw = fs.readFileSync(licensePath, 'utf-8');
        const licenseData = JSON.parse(licenseRaw);
        const { signature, ...licenseInfo } = licenseData;
        const message = JSON.stringify(licenseInfo, Object.keys(licenseInfo).sort());
        const expectedSignature = crypto
          .createHmac('sha256', SECRET_KEY)
          .update(message)
          .digest('hex');
        const notExpired = new Date(licenseInfo.expires) >= new Date();

        if (expectedSignature === signature && notExpired) {
          setIsValid(true);
        } else {
          console.warn('⚠ Licencia inválida o expirada');
        }
      } catch (error) {
        console.error('🚨 Error al validar la licencia:', error);
      } finally {
        setLicenseChecked(true);
      }
    };

    verificarLicencia();
  }, []);

  const handleLoadLicense = async () => {
    if (!isElectronRuntime()) return;

    const req = (window as any).require;
    const fs = req('fs');
    const path = req('path');
    const remote = req('@electron/remote');
    const app = remote.app;
    const dialog = remote.dialog;
    const licensePath = path.join(app.getPath('userData'), 'license.json');

    const result = await dialog.showOpenDialog({
      title: 'Selecciona el archivo de licencia',
      filters: [{ name: 'Licencia', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const selectedPath = result.filePaths[0];
        const content = fs.readFileSync(selectedPath, 'utf-8');
        JSON.parse(content);
        fs.copyFileSync(selectedPath, licensePath);
        alert('✅ Licencia cargada. La app se reiniciará.');
        location.reload();
      } catch {
        alert('❌ Archivo inválido.');
      }
    }
  };

  if (!licenseChecked) {
    return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Verificando licencia...</p>;
  }

  if (!isValid) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>Licencia no válida</h2>
        <p>Por favor, selecciona el archivo <code>license.json</code> válido.</p>
        <button
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
          onClick={handleLoadLicense}
        >
          Cargar archivo de licencia
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedInstall;
