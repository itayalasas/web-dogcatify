import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logAction, logError } from '../services/audit.service';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError('Credenciales incorrectas. Verificá tu correo y contraseña.');
        logError('LOGIN_FAILED', 'Credenciales incorrectas', {
          error_code: 'status' in authError ? String(authError.status) : 'unknown',
          error_message: authError.message || 'Invalid credentials',
        }, email);
        return;
      }
      logAction('LOGIN', { email, method: 'email_password' });
      navigate('/dashboard');
    } catch (reason) {
      setError('Ocurrió un error al iniciar sesión. Intentá nuevamente.');
      logError('LOGIN_ERROR', reason instanceof Error ? reason.message : 'Error desconocido', {
        error_type: 'exception',
      }, email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="partner-login">
      <a href="#acceso" className="partner-login-skip">Saltar al formulario</a>
      <section className="partner-login-story">
        <button type="button" onClick={() => navigate('/')} className="partner-login-brand">
          <img src="/logo-transp.png" alt="" /><span>DogCatiFy</span>
        </button>
        <div className="partner-login-copy">
          <p className="partner-login-eyebrow">Portal de aliados</p>
          <h1>Tu negocio,<br /><em>más cerca.</em></h1>
          <p>Gestioná reservas, servicios y oportunidades desde un espacio pensado para hacer crecer tu propuesta.</p>
          <ul>
            <li><Check /> Reservas y agenda en un solo lugar</li>
            <li><Check /> Servicios, productos y promociones</li>
            <li><Check /> Métricas claras para decidir mejor</li>
          </ul>
        </div>
        <p className="partner-login-note">Hecho en Uruguay para quienes cuidan a nuestras mascotas.</p>
      </section>

      <section className="partner-login-access" id="acceso">
        <div className="partner-login-card">
          <button type="button" onClick={() => navigate('/')} className="partner-login-back"><ArrowLeft /> Volver al inicio</button>
          <div className="partner-login-heading">
            <p className="partner-login-eyebrow">Acceso seguro</p>
            <h2>Bienvenido de nuevo.</h2>
            <p>Ingresá con tu cuenta de administrador o aliado.</p>
          </div>
          {error && <div className="partner-login-error" role="alert"><AlertCircle /><p>{error}</p></div>}
          <form onSubmit={handleSubmit} className="partner-login-form" aria-busy={loading}>
            <div>
              <label htmlFor="email">Correo electrónico</label>
              <div className="partner-login-input"><Mail aria-hidden="true" /><input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" placeholder="nombre@negocio.com" required /></div>
            </div>
            <div>
              <div className="partner-login-label-row"><label htmlFor="password">Contraseña</label><a href="#">¿La olvidaste?</a></div>
              <div className="partner-login-input"><Lock aria-hidden="true" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
            </div>
            <button type="submit" disabled={loading} className="partner-login-submit">{loading ? <><span className="partner-login-spinner" /> Iniciando sesión...</> : <>Iniciar sesión <LogIn /></>}</button>
          </form>
          <div className="partner-login-help"><p>¿Todavía no sos aliado?</p><a href="mailto:info@dogcatify.com">Quiero sumar mi negocio →</a></div>
        </div>
      </section>
    </main>
  );
};

export default Login;
