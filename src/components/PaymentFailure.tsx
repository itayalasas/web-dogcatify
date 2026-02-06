import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, Mail } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const externalRef = searchParams.get('external_reference');
    if (externalRef) {
      setOrderNumber(externalRef);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Pago No Procesado
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          No pudimos procesar tu pago en este momento
        </p>

        {orderNumber && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
            <p className="text-xl font-bold text-red-700">{orderNumber}</p>
          </div>
        )}

        <div className="space-y-3 mb-6 text-left">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">
              Posibles causas:
            </p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Fondos insuficientes</li>
              <li>Tarjeta rechazada</li>
              <li>Error en los datos ingresados</li>
              <li>Problema temporal del sistema de pagos</li>
            </ul>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Necesitas ayuda
              </p>
              <p className="text-xs text-gray-600">
                Contáctanos a soporte@dogcatify.com
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </button>

          <p className="text-xs text-gray-500">
            Puedes intentar realizar el pago nuevamente más tarde
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
