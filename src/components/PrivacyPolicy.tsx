import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart, Mail, Phone, Home, ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-teal-600 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al inicio
            </Link>
            <div className="flex items-center space-x-3">
              <img src="/logo-dogcatify.png" alt="DogCatify" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-teal-800">DogCatify</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
            <Shield className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-teal-800 mb-4">Política de Privacidad</h1>
          <p className="text-xl text-teal-600 max-w-2xl mx-auto">
            En DogCatify, tu privacidad y la de tus mascotas es nuestra prioridad. 
            Conoce cómo protegemos y utilizamos tu información.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-teal-800 mb-4 flex items-center">
                <Heart className="h-6 w-6 mr-3 text-teal-500" />
                Introducción
              </h2>
              <div className="prose prose-teal max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  DogCatify se compromete a proteger la privacidad de nuestros usuarios y sus mascotas. 
                  Esta política describe cómo recopilamos, utilizamos, almacenamos y protegemos tu información 
                  personal cuando utilizas nuestra aplicación integral de gestión de mascotas.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Información que Recopilamos</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-teal-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Información Personal</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Nombre y apellidos</li>
                    <li>• Correo electrónico</li>
                    <li>• Número de teléfono personal</li>
                    <li>• Dirección de residencia</li>
                    <li>• Fotografía de perfil</li>
                  </ul>
                </div>
                
                <div className="bg-cyan-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Información de Mascotas</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Datos básicos (nombre, raza, edad)</li>
                    <li>• Fotografías de mascotas</li>
                    <li>• Historial médico y de salud</li>
                    <li>• Registros de comportamiento</li>
                    <li>• Historial de citas y servicios</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Cómo Utilizamos tu Información</h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Gestión de Perfil y Mascotas</h3>
                  <p className="text-gray-700">
                    Utilizamos tu información para crear y mantener tu perfil de usuario, gestionar los perfiles 
                    de tus mascotas, y permitirte agregar, modificar o eliminar información según sea necesario.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Servicios de Salud y Citas</h3>
                  <p className="text-gray-700">
                    Procesamos la información de salud de tus mascotas para ayudarte a gestionar citas veterinarias, 
                    servicios de peluquería, baño, y mantener un registro completo del bienestar de tus mascotas.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Tienda Online y Servicios</h3>
                  <p className="text-gray-700">
                    Tu información se utiliza para procesar compras en nuestra tienda online, gestionar 
                    contratación de servicios, y proporcionar recomendaciones personalizadas de productos.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Red de Aliados y Lugares Pet-Friendly</h3>
                  <p className="text-gray-700">
                    Facilitamos conexiones con negocios aliados y te ayudamos a descubrir lugares pet-friendly 
                    basados en tu ubicación y preferencias.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Protección de Datos</h2>
              
              <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-teal-800 mb-3">Medidas de Seguridad</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Encriptación de datos en tránsito y reposo</li>
                      <li>• Autenticación de dos factores</li>
                      <li>• Auditorías de seguridad regulares</li>
                      <li>• Acceso restringido a información sensible</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-teal-800 mb-3">Almacenamiento</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Servidores seguros certificados</li>
                      <li>• Respaldos automáticos encriptados</li>
                      <li>• Retención de datos según normativas</li>
                      <li>• Eliminación segura cuando corresponda</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Tus Derechos</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-teal-800 mb-2">Acceso</h3>
                  <p className="text-sm text-gray-600">Solicitar una copia de tus datos personales</p>
                </div>
                
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold text-teal-800 mb-2">Rectificación</h3>
                  <p className="text-sm text-gray-600">Corregir información inexacta o incompleta</p>
                </div>
                
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-teal-800 mb-2">Eliminación</h3>
                  <p className="text-sm text-gray-600">Solicitar la eliminación de tus datos</p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-3 text-teal-500" />
                Contacto
              </h2>
              
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg p-6 text-white">
                <p className="text-lg mb-6">
                  Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, 
                  no dudes en contactarnos:
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Email</div>
                      <div className="text-teal-100">info@dogcatify.com</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Teléfono</div>
                      <div className="text-teal-100">*598 92519111</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Home className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Soporte</div>
                      <div className="text-teal-100">Soporte en la app</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Actualizaciones de la Política</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">
                  Nos reservamos el derecho de actualizar esta política de privacidad periódicamente. 
                  Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico. 
                  Te recomendamos revisar esta política regularmente para mantenerte informado sobre cómo 
                  protegemos tu información.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-teal-100 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <img src="/logo-dogcatify.png" alt="DogCatify" className="h-8 w-8 mr-3" />
            <span className="text-teal-800 font-semibold">DogCatify</span>
            <span className="text-gray-500 ml-2">- Cuidando a tus mascotas con amor</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;