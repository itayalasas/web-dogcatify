import React from 'react';
import { 
  Heart, 
  Calendar, 
  ShoppingBag, 
  MapPin, 
  Users, 
  Shield,
  Camera,
  Bell,
  Stethoscope
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Heart,
      title: "Gestión Completa de Mascotas",
      description: "Registra, edita y gestiona toda la información de tus mascotas en un solo lugar.",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Stethoscope,
      title: "Historial Médico",
      description: "Mantén un registro completo de salud, vacunas, medicamentos y comportamiento.",
      color: "bg-teal-100 text-teal-600"
    },
    {
      icon: Calendar,
      title: "Gestión de Citas",
      description: "Agenda citas para veterinario, peluquería, baño y otros servicios especializados.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: ShoppingBag,
      title: "Tienda Online",
      description: "Accede a productos especializados para mascotas con entrega a domicilio.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: MapPin,
      title: "Lugares Pet-Friendly",
      description: "Descubre restaurantes, parques y lugares que reciben mascotas cerca de ti.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Users,
      title: "Red de Aliados",
      description: "Conecta con veterinarios, peluquerías y servicios especializados de confianza.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Camera,
      title: "Galería de Recuerdos",
      description: "Guarda fotos y momentos especiales de tus mascotas organizados por fecha.",
      color: "bg-pink-100 text-pink-600"
    },
    {
      icon: Bell,
      title: "Recordatorios Inteligentes",
      description: "Recibe notificaciones para medicamentos, citas y cuidados importantes.",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Shield,
      title: "Datos Seguros",
      description: "Tu información y la de tus mascotas están protegidas con encriptación avanzada.",
      color: "bg-gray-100 text-gray-600"
    }
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para cuidar a tus mascotas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            DogCatify ofrece una suite completa de herramientas para gestionar 
            la salud, bienestar y felicidad de tus compañeros peludos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.color} mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para comenzar?
            </h3>
            <p className="text-xl mb-6 text-teal-100">
              Únete a miles de dueños que ya cuidan mejor a sus mascotas con DogCatify
            </p>
            <button className="bg-white text-teal-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg">
              Descargar Ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;