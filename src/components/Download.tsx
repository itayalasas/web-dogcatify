import React from 'react';
import { Smartphone, Apple } from 'lucide-react';

const Download = () => {
  return (
    <section id="descargar" className="bg-gradient-to-br from-teal-600 to-cyan-600 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Descarga DogCatify
            </h2>
            <p className="text-xl text-teal-50 leading-relaxed">
              Disponible en todas las plataformas. Comienza a cuidar mejor de tus mascotas hoy mismo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-8">
            <a
              href="https://play.google.com/store/apps/details?id=com.dogcatify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-gray-900 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-teal-100 p-4 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <Smartphone className="h-10 w-10 text-teal-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-600">Disponible en</div>
                  <div className="text-2xl font-bold">Google Play</div>
                </div>
              </div>
            </a>

            <a
              href="https://apps.apple.com/app/dogcatify/id123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-gray-900 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-teal-100 p-4 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <Apple className="h-10 w-10 text-teal-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-600">Descarga en</div>
                  <div className="text-2xl font-bold">App Store</div>
                </div>
              </div>
            </a>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-teal-500">
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-teal-100 text-sm">Gratis</div>
            </div>
            <div>
              <div className="text-3xl font-bold">4.9</div>
              <div className="text-teal-100 text-sm">Calificación</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-teal-100 text-sm">Descargas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Download;
