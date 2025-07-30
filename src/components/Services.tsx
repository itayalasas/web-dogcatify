import React from 'react';
import { 
  Stethoscope, 
  Scissors, 
  Droplets, 
  Heart, 
  Calendar,
  Star,
  MapPin,
  Users
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Stethoscope,
      title: "Atención Veterinaria",
      description: "Conecta con veterinarios certificados para consultas, emergencias y chequeos regulares.",
      features: ["Consultas virtuales", "Emergencias 24/7", "Especialistas", "Historial médico"],
      color: "from-teal-500 to-cyan-500"
    },
    {
      icon: Scissors,
      title: "Peluquería Canina",
      description: "Servicios profesionales de estética y cuidado para mantener a tu mascota hermosa.",
      features: ["Corte profesional", "Baño especializado", "Uñas y oídos", "Productos premium"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Droplets,
      title: "Baño y Spa",
      description: "Tratamientos relajantes y terapéuticos para el bienestar de tu mascota.",
      features: ["Baños terapéuticos", "Aromaterapia", "Masajes", "Tratamientos de piel"],
      color: "from-blue-500 to-teal-500"
    },
    {
      icon: Heart,
      title: "Cuidado Integral",
      description: "Servicios completos de cuidado diario y atención personalizada.",
      features: ["Paseos diarios", "Alimentación", "Medicamentos", "Compañía"],
      color: "from-red-500 to-pink-500"
    }
  ];

  return (
    <section id="servicios" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Servicios Profesionales para tu Mascota
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accede a una red de profesionales certificados y servicios especializados 
            para el cuidado completo de tus mascotas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className={`bg-gradient-to-r ${service.color} p-6`}>
                <div className="flex items-center text-white mb-4">
                  <service.icon className="h-8 w-8 mr-3" />
                  <h3 className="text-2xl font-bold">{service.title}</h3>
                </div>
                <p className="text-white/90 text-lg">
                  {service.description}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-gray-700">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-6 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  Agendar Servicio
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Agenda Flexible</h3>
            <p className="text-gray-600">
              Programa citas según tu disponibilidad con confirmación instantánea.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Servicio a Domicilio</h3>
            <p className="text-gray-600">
              Muchos servicios disponibles en la comodidad de tu hogar.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profesionales Certificados</h3>
            <p className="text-gray-600">
              Todos nuestros aliados están verificados y certificados.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;