import React, { useState } from 'react';
import { authRedirectUrl } from '../auth/redirects';
import { supabase } from '../services/supabaseClient';

const PasswordRecoveryModal = ({ onClose, initialEmail = '' }: { onClose: () => void; initialEmail?: string }) => {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUrl('reset-password'),
    });
    setIsError(Boolean(error));
    setMessage(error ? 'No pudimos enviar el enlace. Revisa el correo e intenta otra vez.' : 'Listo. Revisa tu correo para crear una contraseña nueva.');
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <p className="eyebrow">RECUPERAR ACCESO</p>
        <h2 id="recovery-title">Restablece tu contraseña</h2>
        <p>Te enviaremos un enlace seguro al correo de tu cuenta.</p>
        <form className="auth-form" onSubmit={handleRecovery}>
          <div className="field-group"><label htmlFor="recovery-email">Correo electrónico</label>
            <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          {message && <div className={isError ? 'form-error' : 'form-success'} role="status">{message}</div>}
          <button className="primary-action" type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar enlace'}</button>
        </form>
      </section>
    </div>
  );
};

export default PasswordRecoveryModal;
