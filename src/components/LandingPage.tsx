import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import CrmWebchatWidget from './CrmWebchatWidget';
import './landing.css';

const APP_URL = 'https://app-dogcatify.netlify.app';

const capabilities = [
  {
    number: '01',
    eyebrow: 'Salud',
    title: 'Su historia clínica, siempre cerca',
    description:
      'Organizá vacunas, controles, peso, alergias y recordatorios. Compartí la información importante cuando más la necesites.',
  },
  {
    number: '02',
    eyebrow: 'Servicios',
    title: 'Reservas simples y profesionales de confianza',
    description:
      'Encontrá veterinarias, peluquerías, paseadores, guarderías y otros servicios; compará opciones y gestioná tus reservas.',
  },
  {
    number: '03',
    eyebrow: 'Comunidad',
    title: 'Una comunidad que entiende ese vínculo',
    description:
      'Compartí momentos, descubrí adopciones, activá alertas de mascotas perdidas y conectá con personas que aman a los animales.',
  },
];

const services = [
  ['Veterinarias', 'Controles, consultas y cuidado profesional.'],
  ['Estética y bienestar', 'Peluquería, baño y servicios especializados.'],
  ['Paseos y estadías', 'Paseadores, guarderías y hospedaje temporal.'],
  ['Tiendas', 'Alimento, accesorios y productos para cada etapa.'],
  ['Adopciones', 'Mascotas que buscan una familia responsable.'],
  ['Lugares pet-friendly', 'Parques, restaurantes y espacios para disfrutar juntos.'],
];

const faqs = [
  [
    '¿Qué puedo hacer con DogCatiFy?',
    'Podés crear el perfil de tus mascotas, organizar su información de salud, recibir recordatorios, encontrar y reservar servicios, descubrir lugares pet-friendly, comprar productos y participar en una comunidad dedicada a los animales.',
  ],
  [
    '¿Puedo registrar más de una mascota?',
    'Sí. DogCatiFy está pensada para que organices la información y el cuidado de todas tus mascotas desde una única cuenta.',
  ],
  [
    '¿DogCatiFy reemplaza la consulta veterinaria?',
    'No. La app ayuda a organizar información y facilita el contacto con profesionales, pero no sustituye el diagnóstico ni la atención de un veterinario.',
  ],
  [
    '¿Cómo puede participar mi negocio?',
    'Veterinarias, peluquerías, paseadores, guarderías, tiendas y otros emprendimientos pueden registrarse como aliados para publicar su propuesta y gestionar oportunidades desde la plataforma.',
  ],
];

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="dogcatify-landing min-h-screen overflow-hidden bg-[#fffdf8] text-[#183432]">
      <a
        href="#contenido"
        className="fixed -top-24 left-5 z-[100] rounded-xl bg-[#183432] px-5 py-3 font-bold text-white transition-all focus:top-5"
      >
        Saltar al contenido
      </a>

      <header className="absolute inset-x-0 top-0 z-40 h-20 lg:h-24">
        <div className="mx-auto grid h-full w-[calc(100%_-_2rem)] max-w-[1320px] grid-cols-[1fr_auto] items-center gap-6 lg:grid-cols-[270px_1fr_180px]">
          <a
            href="#inicio"
            className="flex w-fit items-center gap-3 text-2xl font-extrabold tracking-[-0.04em] text-[#2D6A6F] lg:text-[28px]"
            aria-label="DogCatiFy, volver al inicio"
          >
            <img
              src="/logo-transp.png"
              alt=""
              width="58"
              height="58"
              className="h-12 w-12 object-contain lg:h-[58px] lg:w-[58px]"
            />
            <span>DogCatiFy</span>
          </a>

          <nav className="hidden items-center justify-center gap-7 text-[15px] font-bold lg:flex xl:gap-12" aria-label="Navegación principal">
            <a className="landing-nav-link is-active" href="#inicio">Inicio</a>
            <a className="landing-nav-link" href="#todo">Todo para tu mascota</a>
            <a className="landing-nav-link" href="#servicios">Servicios</a>
            <a className="landing-nav-link" href="#aliados">Para aliados</a>
          </nav>

          <Link
            to="/login"
            className="hidden min-h-12 items-center justify-center rounded-xl border-2 border-[#2D6A6F] px-5 text-[15px] font-extrabold text-[#2D6A6F] transition hover:-translate-y-0.5 hover:bg-[#DCEBE7] lg:flex"
          >
            Soy un negocio
          </Link>

          <button
            type="button"
            className="rounded-xl border border-[#2D6A6F] p-2.5 text-[#2D6A6F] lg:hidden"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {menuOpen && (
            <nav
              className="absolute right-4 top-[72px] grid w-[min(88vw,320px)] gap-1 rounded-2xl border border-[#2D6A6F]/15 bg-[#fffdf8] p-4 font-bold shadow-2xl lg:hidden"
              aria-label="Navegación móvil"
            >
              {[
                ['Todo para tu mascota', '#todo'],
                ['Servicios', '#servicios'],
                ['Para aliados', '#aliados'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-3 hover:bg-[#DCEBE7]"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link className="mt-2 rounded-lg bg-[#2D6A6F] px-3 py-3 text-center text-white" to="/login">
                Soy un negocio
              </Link>
            </nav>
          )}
        </div>
      </header>

      <section
        id="inicio"
        className="landing-hero relative min-h-[900px] overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-20 lg:pt-36"
      >
        <span className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[#DCEBE7]/80" aria-hidden="true" />
        <span className="absolute -right-20 top-24 h-44 w-44 rounded-full bg-[#DCEBE7]/60" aria-hidden="true" />

        <div
          id="contenido"
          className="mx-auto grid min-h-[675px] w-[calc(100%_-_2rem)] max-w-[1320px] items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16"
        >
          <div className="landing-rise relative z-10">
            <p className="landing-eyebrow">Una vida mejor, juntos</p>
            <h1 className="landing-serif m-0 max-w-[680px] text-[clamp(54px,14vw,76px)] font-semibold leading-[0.92] tracking-[-0.065em] text-[#183432] lg:text-[clamp(68px,6.5vw,96px)]">
              Su mundo,
              <em className="mt-3 block font-medium text-[#4B9991]">mejor cuidado.</em>
            </h1>
            <p className="mt-8 max-w-[560px] text-lg leading-[1.6] text-[#344b48] sm:text-xl">
              Cuidá su salud, reservá servicios de confianza, descubrí lugares
              pet-friendly y compartí sus mejores momentos. Todo en una sola app.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-button landing-button-primary"
              >
                Descargar la app <ArrowUpRight size={19} aria-hidden="true" />
              </a>
              <Link to="/login" className="landing-button landing-button-outline">
                Soy un negocio
              </Link>
            </div>
            <p className="mt-8 flex items-center gap-3 text-[15px] font-extrabold">
              <Heart className="text-[#F28C78]" size={28} strokeWidth={1.6} aria-hidden="true" />
              Tu mascota. Tu comunidad. Todo cerca.
            </p>
          </div>

          <div className="landing-image-in relative">
            <div className="landing-hero-image aspect-[1.18] w-full overflow-hidden shadow-[0_24px_70px_rgba(31,77,73,0.14)]">
              <img
                src="/hero-pets.png"
                alt="Un perro y un gato descansando juntos en un hogar"
                width="1448"
                height="1086"
                loading="eager"
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.012]"
              />
            </div>
            <span className="landing-coral landing-coral-one" aria-hidden="true" />
            <span className="landing-coral landing-coral-two" aria-hidden="true" />
            <span className="landing-coral landing-coral-three" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="border-y border-[#2D6A6F]/15 bg-[#fffdf8]" aria-label="Propuesta de DogCatiFy">
        <div className="mx-auto grid min-h-24 w-[calc(100%_-_2rem)] max-w-[1320px] grid-cols-1 items-center gap-4 py-6 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,auto)] lg:gap-8">
          <p className="landing-serif m-0 text-xl font-bold text-[#2D6A6F] sm:col-span-2 lg:col-span-1">
            Todo su cuidado, conectado
          </p>
          {['Perfiles e historial', 'Reservas y servicios', 'Comunidad y adopciones', 'Lugares pet-friendly'].map((item) => (
            <span key={item} className="flex items-center gap-3 text-[13px] font-bold text-[#58716d]">
              <span className="h-2 w-2 rounded-full bg-[#F28C78]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="todo" className="landing-section bg-[#fffdf8]">
        <div className="mx-auto w-[calc(100%_-_2rem)] max-w-[1320px]">
          <div className="mb-14 grid items-end gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:gap-20">
            <div>
              <p className="landing-eyebrow">Todo para tu mascota</p>
              <h2 className="landing-section-title max-w-[850px]">
                Cuidar mejor empieza por tener todo en orden.
              </h2>
            </div>
            <p className="m-0 text-lg leading-[1.7] text-[#58716d]">
              DogCatiFy reúne lo cotidiano y lo importante para acompañarte en
              cada etapa de su vida.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {capabilities.map((item, index) => (
              <article
                key={item.number}
                className={`landing-capability-card relative min-h-[400px] overflow-hidden rounded-3xl border border-[#2D6A6F]/15 p-7 ${
                  index === 1 ? 'bg-[#DCEBE7]' : 'bg-white'
                }`}
              >
                <div className="mb-14 flex items-center justify-between">
                  <span className="landing-serif text-3xl text-[#F28C78]">{item.number}</span>
                  <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#2D6A6F]">
                    {item.eyebrow}
                  </span>
                </div>
                <h3 className="landing-serif mb-5 max-w-[340px] text-[30px] font-semibold leading-[1.12] tracking-[-0.025em]">
                  {item.title}
                </h3>
                <p className="m-0 text-base leading-[1.7] text-[#58716d]">{item.description}</p>
                <span className="absolute bottom-6 right-6 grid h-11 w-11 place-items-center rounded-full border border-[#2D6A6F] text-[#2D6A6F]">
                  <ArrowUpRight size={18} aria-hidden="true" />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="landing-section bg-[#2D6A6F] text-white">
        <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1320px] gap-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-28">
          <div className="self-start lg:sticky lg:top-24">
            <p className="landing-eyebrow text-[#bfe2dc]">Cerca de vos</p>
            <h2 className="landing-section-title text-white">
              Lo que necesita, justo cuando lo necesita.
            </h2>
            <p className="my-7 text-lg leading-[1.7] text-[#c9dedb]">
              Explorá una red de opciones para cuidar, acompañar y disfrutar más
              con tu mascota.
            </p>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-b border-[#F28C78] py-2 font-extrabold">
              Explorar DogCatiFy <ArrowUpRight size={18} />
            </a>
          </div>

          <div>
            {services.map(([title, description], index) => (
              <article key={title} className="grid grid-cols-[40px_1fr] gap-3 border-b border-white/20 py-7 sm:grid-cols-[58px_1fr] sm:gap-6 first:pt-0">
                <span className="landing-serif text-lg text-[#F28C78]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="landing-serif mb-2 text-[27px] font-medium sm:text-[32px]">{title}</h3>
                  <p className="m-0 leading-6 text-[#bed6d2]">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section bg-[#F7F2E8]">
        <div className="mx-auto flex w-[calc(100%_-_2rem)] max-w-[1320px] flex-col-reverse items-center gap-16 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-28">
          <div className="landing-phone-stage relative grid min-h-[650px] w-full place-items-center">
            <div className="landing-phone relative z-10 min-h-[625px] w-[min(92vw,330px)] rotate-[-3deg] rounded-[46px] border-[10px] border-[#183432] bg-[#fffdf8] px-5 pb-5 pt-10 shadow-[0_30px_60px_rgba(24,52,50,0.22)]">
              <span className="absolute left-1/2 top-3 h-[18px] w-20 -translate-x-1/2 rounded-full bg-[#183432]" />
              <div className="flex items-center gap-3 px-1 pb-5 pt-3 text-sm font-extrabold">
                <img src="/logo-transp.png" alt="" width="42" height="42" className="h-10 w-10 object-contain" />
                Buenos días, Sofía
              </div>
              <div className="grid grid-cols-[46px_1fr] gap-3 rounded-[18px] bg-[#DCEBE7] p-4">
                <span className="landing-serif grid h-11 w-11 place-items-center rounded-full bg-[#F28C78] text-xl">M</span>
                <div className="grid"><strong>Mora</strong><small className="text-[#58716d]">Próximo cuidado</small></div>
                <b className="col-span-2 border-t border-[#2D6A6F]/15 pt-3 text-[13px]">Vacuna · 12 ago</b>
              </div>
              <p className="mb-2 mt-7 text-[13px] font-extrabold uppercase tracking-[0.08em]">Para hoy</p>
              {[
                ['09:30', 'Control veterinario', 'Veterinaria del Parque'],
                ['18:00', 'Paseo de Mora', 'Recordatorio activo'],
              ].map(([time, title, detail]) => (
                <div key={time} className="mb-2 grid grid-cols-[50px_1fr] gap-3 rounded-[14px] border border-[#2D6A6F]/15 bg-white p-3.5">
                  <span className="text-xs font-extrabold text-[#2D6A6F]">{time}</span>
                  <div className="grid">
                    <strong className="text-[13px]">{title}</strong>
                    <small className="text-[11px] text-[#58716d]">{detail}</small>
                  </div>
                </div>
              ))}
              <nav className="absolute inset-x-4 bottom-4 flex justify-around rounded-[18px] bg-white px-2 py-3.5 text-[10px] text-[#58716d] shadow-lg">
                <b className="text-[#2D6A6F]">Inicio</b><span>Mascotas</span><span>Servicios</span>
              </nav>
            </div>
          </div>

          <div>
            <p className="landing-eyebrow">Pensada para el día a día</p>
            <h2 className="landing-section-title">
              Menos cosas por recordar. Más momentos para disfrutar.
            </h2>
            <p className="my-7 max-w-[590px] text-lg leading-[1.7] text-[#58716d]">
              Un lugar claro para seguir sus cuidados, encontrar lo que necesitás
              y conservar la historia que construyen juntos.
            </p>
            <ul className="mb-8 grid list-none gap-4 p-0">
              {[
                'Recordatorios de vacunas, medicamentos y citas',
                'Historia clínica organizada y compartible',
                'Reservas, pedidos y novedades en un solo lugar',
                'Alertas y herramientas para tu comunidad',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-bold">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#DCEBE7] text-[#2D6A6F]">
                    <Check size={16} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="landing-button landing-button-primary">
              Empezar ahora <ArrowUpRight size={19} />
            </a>
          </div>
        </div>
      </section>

      <section id="aliados" className="landing-section bg-[#fffdf8]">
        <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1320px] gap-10 rounded-[36px] bg-[#183432] p-8 text-white sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 lg:p-[76px]">
          <div>
            <p className="landing-eyebrow text-[#bfe2dc]">Para negocios de mascotas</p>
            <h2 className="landing-section-title text-white">
              Tu trabajo merece estar más cerca de quienes te necesitan.
            </h2>
          </div>
          <div className="flex flex-col items-start justify-end">
            <p className="mb-7 text-[17px] leading-[1.7] text-[#c5d7d4]">
              Sumá tu veterinaria, peluquería, tienda, guardería o servicio a
              DogCatiFy. Mostrá tu propuesta, recibí reservas y gestioná tu
              presencia desde un solo lugar.
            </p>
            <Link to="/login" className="landing-button landing-button-coral">
              Quiero ser aliado <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      <section id="preguntas" className="landing-section border-t border-[#2D6A6F]/15 bg-[#fffdf8]">
        <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1320px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="landing-eyebrow">Preguntas frecuentes</p>
            <h2 className="landing-section-title">Antes de empezar.</h2>
            <p className="mt-4 text-[17px] text-[#58716d]">Lo esencial sobre la experiencia DogCatiFy.</p>
          </div>
          <div>
            {faqs.map(([question, answer]) => (
              <details key={question} className="landing-faq border-b border-[#2D6A6F]/15">
                <summary className="landing-serif flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-xl font-semibold sm:text-2xl">
                  {question}<ChevronDown className="shrink-0 text-[#F28C78] transition" />
                </summary>
                <p className="-mt-1 mb-7 max-w-[760px] leading-[1.7] text-[#58716d]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2D6A6F] py-24 text-center text-white lg:py-28">
        <div className="mx-auto w-[calc(100%_-_2rem)] max-w-[1320px]">
          <p className="landing-eyebrow text-[#bfe2dc]">El próximo paseo empieza acá</p>
          <h2 className="landing-serif mx-auto max-w-[920px] text-[clamp(52px,6vw,84px)] font-medium leading-[0.98] tracking-[-0.055em]">
            Todo su mundo, en buenas manos.
          </h2>
          <p className="mb-8 mt-6 text-lg text-[#c8dfdc]">
            Descubrí una forma más simple y cercana de cuidar a tu mascota.
          </p>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="landing-button landing-button-coral">
            Descargar DogCatiFy <ArrowUpRight size={19} />
          </a>
        </div>
      </section>

      <footer className="bg-[#132b29] pb-7 pt-16 text-white">
        <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1320px] gap-10 md:grid-cols-[1fr_auto_auto] md:gap-20">
          <div>
            <a href="#inicio" className="flex w-fit items-center gap-3 text-2xl font-extrabold tracking-[-0.04em]">
              <img src="/logo-transp.png" alt="" width="50" height="50" className="h-12 w-12 object-contain" />
              DogCatiFy
            </a>
            <p className="mt-4 text-[#96b5b1]">Su mundo, mejor cuidado.</p>
          </div>
          <nav className="grid min-w-[150px] gap-3 text-sm text-[#c3d4d1]">
            <a href="#todo" className="hover:text-[#F28C78]">La app</a>
            <a href="#servicios" className="hover:text-[#F28C78]">Servicios</a>
            <a href="#aliados" className="hover:text-[#F28C78]">Aliados</a>
            <a href="mailto:info@dogcatify.com" className="hover:text-[#F28C78]">Contacto</a>
          </nav>
          <nav className="grid min-w-[150px] gap-3 text-sm text-[#c3d4d1]">
            <Link to="/privacidad" className="hover:text-[#F28C78]">Privacidad</Link>
            <Link to="/terminos" className="hover:text-[#F28C78]">Términos</Link>
            <a href="mailto:soporte@dogcatify.com" className="hover:text-[#F28C78]">Soporte</a>
          </nav>
        </div>
        <div className="mx-auto mt-14 flex w-[calc(100%_-_2rem)] max-w-[1320px] flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#7fa19d] md:flex-row">
          <span>© 2026 DogCatiFy. Todos los derechos reservados.</span>
          <span>Hecho en Uruguay para quienes aman a sus mascotas.</span>
        </div>
      </footer>

      <CrmWebchatWidget />
    </main>
  );
};

export default LandingPage;
