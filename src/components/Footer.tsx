import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/logo-dogcatify.jpg" alt="DogCatify" className="h-10 w-10" />
              <h3 className="text-2xl font-bold">DogCatify</h3>
            </div>
            <p className="text-gray-400">
              La aplicación más completa para el cuidado integral de tus mascotas. 
              Conectando amor, tecnología y bienestar animal.
            </p>
            <div className="flex items-center text-gray-400">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Hecho con amor para las mascotas
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="#inicio" className="text-gray-400 hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#caracteristicas" className="text-gray-400 hover:text-white transition-colors">Características</a></li>
              <li><a href="#servicios" className="text-gray-400 hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#contacto" className="text-gray-400 hover:text-white transition-colors">Contacto</a></li>
              <li>
                <Link 
                  to="/privacidad"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link 
                  to="/terminos"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Términos de Servicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Atención Veterinaria</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Peluquería Canina</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tienda Online</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Lugares Pet-Friendly</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Red de Aliados</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-3" />
                info@dogcatify.com
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-3" />
                *598 92519111
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-3" />
                Soporte en la app
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 DogCatify. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacidad"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacidad
              </Link>
              <Link 
                to="/terminos"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Términos
              </Link>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
