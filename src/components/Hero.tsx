import React from 'react';
import { Heart, Star, Users, Shield } from 'lucide-react';

const Hero = () => {
  return (
    <section id="inicio" className="bg-gradient-to-br from-teal-50 to-cyan-50 py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium">
                <Heart className="h-4 w-4 mr-2" />
                La app #1 para el cuidado de mascotas
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Todo lo que tu
                <span className="text-teal-600"> mascota </span>
                necesita en una app
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Gestiona la salud, comportamiento, citas y bienestar de tus mascotas. 
                Conecta con veterinarios, encuentra lugares pet-friendly y accede a una 
                tienda especializada. Todo en un solo lugar.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">50K+</div>
                <div className="text-gray-600">Mascotas registradas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">1000+</div>
                <div className="text-gray-600">Veterinarios aliados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">4.9</div>
                <div className="text-gray-600 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  Rating
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Datos seguros
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Comunidad activa
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Soporte 24/7
              </div>
            </div>
          </div>

          {/* Image/Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <img src="/logo-dogcatify.jpg" alt="DogCatify" className="h-8 w-8" />
                  <div className="text-lg font-semibold text-gray-800">Mi Mascota</div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-teal-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">Max - Golden Retriever</div>
                        <div className="text-sm text-gray-600">Próxima cita: Veterinario</div>
                      </div>
                      <div className="w-12 h-12 bg-teal-200 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-cyan-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">Luna - Gato Persa</div>
                        <div className="text-sm text-gray-600">Recordatorio: Medicamento</div>
                      </div>
                      <div className="w-12 h-12 bg-cyan-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
