import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { logAction, logError } from '../services/audit.service';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Credenciales incorrectas. Por favor verifica tu email y contraseña.');

        logError(
          'LOGIN_FAILED',
          'Credenciales incorrectas',
          {
            error_code: error.status || 'unknown',
            error_message: error.message || 'Invalid credentials'
          },
          email
        );
      } else {
        logAction('LOGIN', {
          email: email,
          method: 'email_password'
        });
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError('Ocurrió un error al iniciar sesión. Intenta de nuevo.');

      const message = err instanceof Error ? err.message : 'Error desconocido al iniciar sesión';

      logError(
        'LOGIN_ERROR',
        message,
        {
          error_type: 'exception'
        },
        email
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center px-4 py-6 sm:py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-5 sm:px-8 py-8 sm:py-12 text-center">
            <img
              src="/logo-transp.png"
              alt="DogCatify"
              className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 bg-white rounded-full p-1.5 sm:p-2"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bienvenido</h1>
            <p className="text-teal-100">Inicia sesión en tu cuenta</p>
          </div>

          <div className="px-5 sm:px-8 py-8 sm:py-10">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                ¿Olvidaste tu contraseña?{' '}
                <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
                  Recuperar contraseña
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 font-medium py-2"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
