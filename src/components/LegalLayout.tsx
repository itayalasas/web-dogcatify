import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

type Section = { id: string; label: string };

export function LegalLayout({ title, eyebrow, intro, summary, sections, current, description, children }: {
  title: string; eyebrow: string; intro: string; summary: string; sections: Section[];
  current: 'privacidad' | 'terminos'; description: string; children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} | DogCatiFy`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previous = meta?.content;
    if (meta) meta.content = description;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://dogcatify.com/${current}`;
    return () => {
      document.title = 'DogCatiFy | Todo para cuidar mejor a tu mascota';
      if (meta && previous) meta.content = previous;
      canonical!.href = 'https://dogcatify.com/';
    };
  }, [current, description, title]);

  return (
    <main className="legal-page">
      <a className="legal-skip" href="#contenido">Saltar al contenido</a>
      <header className="legal-header">
        <div className="legal-shell legal-header-inner">
          <Link className="legal-brand" to="/"><img src="/logo-transp.png" alt="" /><span>DogCatiFy</span></Link>
          <nav aria-label="Navegación principal">
            <Link to="/">Inicio</Link><a href="/#todo">Todo para tu mascota</a><a href="/#servicios">Servicios</a><a href="/#aliados">Para aliados</a>
          </nav>
          <Link className="legal-business" to="/login">Soy un negocio</Link>
        </div>
      </header>
      <section className="legal-hero">
        <div className="legal-shell">
          <Link className="legal-back" to="/">← Volver al inicio</Link>
          <p className="legal-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="legal-intro">{intro}</p>
          <p className="legal-date">Última actualización · 24 de julio de 2026</p>
        </div>
      </section>
      <div className="legal-shell legal-layout" id="contenido">
        <aside><p>En esta página</p><nav aria-label={`Índice de ${title}`}>{sections.map((s, i) => <a key={s.id} href={`#${s.id}`}><span>{String(i + 1).padStart(2, '0')}</span>{s.label}</a>)}</nav></aside>
        <article><div className="legal-summary"><span>En resumen</span><p>{summary}</p></div>{children}</article>
      </div>
      <footer>
        <div className="legal-shell legal-footer-grid">
          <div><Link className="legal-brand" to="/"><img src="/logo-transp.png" alt="" /><span>DogCatiFy</span></Link><p>Su mundo, mejor cuidado.</p></div>
          <nav><a href="/#todo">La app</a><a href="/#servicios">Servicios</a><a href="/#aliados">Aliados</a><a href="mailto:info@dogcatify.com">Contacto</a></nav>
          <nav><Link className={current === 'privacidad' ? 'active' : ''} to="/privacidad">Privacidad</Link><Link className={current === 'terminos' ? 'active' : ''} to="/terminos">Términos</Link><a href="mailto:soporte@dogcatify.com">Soporte</a></nav>
        </div>
        <div className="legal-shell legal-footer-bottom"><span>© 2026 DogCatiFy. Todos los derechos reservados.</span><span>Hecho en Uruguay para quienes aman a sus mascotas.</span></div>
      </footer>
    </main>
  );
}
