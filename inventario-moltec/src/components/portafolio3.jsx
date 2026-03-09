/* ============================================
   COMPONENTE PORTAFOLIO - MOLTEC S.A.
   Carrusel de proyectos con galería de imágenes
   
   OPTIMIZACIONES APLICADAS:
   1. Solo se renderizan las imágenes del proyecto ACTIVO (no las 24 de golpe)
   2. Skeleton loading — placeholder visual mientras carga cada imagen
   3. Precarga del proyecto siguiente en segundo plano (silenciosamente)
   4. Transición suave al cambiar de proyecto (fade in/out)
   5. Estado de carga individual por imagen
   ============================================ */

import React, { useState, useEffect, useCallback, useRef } from "react";
import "./portafolio4.css";

/* ============================================
   DATOS DE PROYECTOS
   Agregar o modificar proyectos aquí
   ============================================ */
const projects = [
  {
    id: 1,
    title: "OFICINAS CORPORATIVAS PERGAMINOS",
    location: "Zona 12 , Cdad. de Guatemala",
    description: "",
    images: [
      "/imagesPort/PergaminosZ12/perg1.webp",
      "/imagesPort/PergaminosZ12/perg2.webp",
      "/imagesPort/PergaminosZ12/perg3.webp",
      "/imagesPort/PergaminosZ12/perg4.webp",
    ],
  },
  {
    id: 2,
    title: "AMPLIACIÓN DE TERRAZA",
    location: "Zona 14 , Cdad. de Guatemala",
    description: "",
    images: [
      "/imagesPort/TerrazaZ14/terraza1.webp",
      "/imagesPort/TerrazaZ14/terraza2.webp",
      "/imagesPort/TerrazaZ14/terraza3.webp",
      "/imagesPort/TerrazaZ14/terraza4.webp",
    ],
  },
  {
    id: 3,
    title: "BODEGA",
    location: "Zona 12 , Cdad. de Guatemala",
    description: "",
    images: [
      "/imagesPort/BodegaZ12/bod1.webp",
      "/imagesPort/BodegaZ12/bod2.webp",
      "/imagesPort/BodegaZ12/bod3.webp",
      "/imagesPort/BodegaZ12/bod4.webp",
    ],
  },
  {
    id: 4,
    title: "CLÍNICA DENTAL DENTALE",
    location: "Zona 9 , Cdad. de Guatemala",
    description: "",
    images: [
      "/imagesPort/DentaleZ9/dentale1.webp",
      "/imagesPort/DentaleZ9/dentale2.webp",
      "/imagesPort/DentaleZ9/dentale3.webp",
      "/imagesPort/DentaleZ9/dentale4.webp",
    ],
  },
  {
    id: 5,
    title: "FLORISTERÍA SIEMBRA VISIÓN",
    location: "Zona 10 , Cdad. de Guatemala",
    description: "",
    images: [
      "/imagesPort/FloresZ10/flores1.webp",
      "/imagesPort/FloresZ10/flores2.webp",
      "/imagesPort/FloresZ10/flores3.webp",
      "/imagesPort/FloresZ10/flores4.webp",
    ],
  },
  {
    id: 6,
    title: "REMODELACIÓN LOBBY TADEUS",
    location: "Zona 14 , Cdad. de Guatemala",
    description: "",
    images: [
      "/imagesPort/TadeusZ14/tadeus1.webp",
      "/imagesPort/TadeusZ14/tadeus2.webp",
      "/imagesPort/TadeusZ14/tadeus3.webp",
      "/imagesPort/TadeusZ14/tadeus4.webp",
    ],
  },
];

/* ============================================
   COMPONENTE: ImagenConSkeleton
   
   Muestra un placeholder gris animado (skeleton)
   mientras la imagen todavía está cargando.
   Cuando termina de cargar, hace un fade-in suave.
   
   Props:
   - src: ruta de la imagen
   - alt: texto alternativo
   - className: clase CSS para el <img>
   - onClick: función al hacer click
   ============================================ */
const ImagenConSkeleton = ({ src, alt, className, onClick, role, tabIndex, onKeyPress, ariaLabel }) => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null); // referencia directa al elemento <img> en el DOM

  useEffect(() => {
    setCargando(true);
    setError(false);

    /* FIX: imagen pegada en gris (skeleton no desaparece)
    
       El problema: cuando una imagen WebP ya está en caché del navegador,
       se carga TAN RÁPIDO que el evento onLoad se dispara antes de que
       React haya terminado de montar el listener. React nunca se entera
       que la imagen ya cargó → el skeleton gris queda pegado para siempre.
       
       La solución: después de renderizar, revisamos img.complete directamente
       en el DOM. Si ya está lista (caché), ocultamos el skeleton de inmediato
       sin esperar el evento onLoad. */
    const verificarSiYaCargo = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        // La imagen ya estaba en caché — no esperar onLoad
        setCargando(false);
      }
    };

    // setTimeout(fn, 0) espera a que React termine el render actual
    // antes de revisar el DOM
    const timer = setTimeout(verificarSiYaCargo, 0);
    return () => clearTimeout(timer);
  }, [src]); // se ejecuta cada vez que cambia la imagen (cambio de proyecto)

  return (
    <div
      className={`portafolio-image-wrapper ${cargando ? "skeleton-activo" : ""}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onKeyPress={onKeyPress}
    >
      {/* Skeleton animado — visible solo mientras cargando === true */}
      {cargando && !error && (
        <div className="portafolio-skeleton" aria-hidden="true" />
      )}

      {!error ? (
        <img
          ref={imgRef}  // ← permite leer img.complete para detectar caché
          src={src}
          alt={alt}
          className={className}
          style={{
            opacity: cargando ? 0 : 1,       // invisible mientras carga, fade-in al aparecer
            transition: "opacity 0.4s ease",
          }}
          onLoad={() => setCargando(false)}  // imagen descargada normalmente (sin caché)
          onError={() => {
            setCargando(false);
            setError(true);
            console.error(`No se pudo cargar: ${src}`);
          }}
        />
      ) : (
        <div className="portafolio-imagen-error" aria-label="Imagen no disponible">
          📷 Imagen no disponible
        </div>
      )}

      {/* Overlay con lupa — aparece al hacer hover via CSS */}
      <div className="portafolio-overlay" aria-hidden="true">
        <span className="portafolio-zoom-icon">🔍</span>
      </div>
    </div>
  );
};

/* ============================================
   HOOK: usePrecargarProyecto
   
   Precarga silenciosamente las imágenes del
   SIGUIENTE proyecto para que cuando el usuario
   navegue ya estén en caché del navegador.
   ============================================ */
const usePrecargarProyecto = (indexActual) => {
  useEffect(() => {
    // Calcular cuál es el índice del proyecto siguiente
    const indexSiguiente = (indexActual + 1) % projects.length;
    const proyectoSiguiente = projects[indexSiguiente];

    // Crear objetos Image en memoria — el navegador los descarga
    // en segundo plano y los guarda en caché
    proyectoSiguiente.images.forEach((src) => {
      const img = new Image();
      img.src = src;
      // No hacemos nada con el resultado, solo forzamos la descarga
    });
  }, [indexActual]); // Se ejecuta cada vez que cambia el proyecto activo
};

/* ============================================
   COMPONENTE PRINCIPAL: Portafolio
   ============================================ */
const Portafolio = () => {
  // Índice del proyecto que se está mostrando actualmente
  const [proyectoActual, setProyectoActual] = useState(0);

  // Control del modal de imagen ampliada
  const [modalAbierto, setModalAbierto] = useState(false);
  const [imagenModal, setImagenModal] = useState("");
  const [imagenCargando, setImagenCargando] = useState(true);

  // Controla si la galería está en transición (fade out/in al cambiar proyecto)
  const [transicionando, setTransicionando] = useState(false);

  // Referencia al timeout de precarga para poder cancelarlo si es necesario
  const timeoutTransicion = useRef(null);

  // Proyecto que se muestra actualmente
  const proyecto = projects[proyectoActual];

  // Activa la precarga del proyecto siguiente en segundo plano
  usePrecargarProyecto(proyectoActual);

  /* ============================================
     FUNCIÓN: cambiarProyecto
     
     Hace un fade-out de la galería actual, cambia
     el proyecto, y hace fade-in del nuevo.
     
     dirección: 1 = siguiente, -1 = anterior
     ============================================ */
  const cambiarProyecto = useCallback((direccion) => {
    // Si ya hay una transición en curso, no hacer nada
    if (transicionando) return;

    setTransicionando(true); // Iniciar fade-out

    // Esperar a que termine el fade-out (300ms) antes de cambiar el proyecto
    timeoutTransicion.current = setTimeout(() => {
      setProyectoActual((prev) => {
        if (direccion === -1) {
          return prev === 0 ? projects.length - 1 : prev - 1;
        }
        return (prev + 1) % projects.length;
      });
      setTransicionando(false); // Iniciar fade-in con el nuevo proyecto
    }, 300);
  }, [transicionando]);

  const proyectoAnterior = useCallback(() => cambiarProyecto(-1), [cambiarProyecto]);
  const proyectoSiguiente = useCallback(() => cambiarProyecto(1), [cambiarProyecto]);

  /* ============================================
     FUNCIÓN: Abrir imagen en modal ampliado
     ============================================ */
  const abrirModal = useCallback((imagen) => {
    setImagenModal(imagen);
    setModalAbierto(true);
    setImagenCargando(true);
    document.body.style.overflow = "hidden"; // Bloquear scroll del fondo
  }, []);

  /* ============================================
     FUNCIÓN: Cerrar modal
     ============================================ */
  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setImagenModal("");
    setImagenCargando(false);
    document.body.style.overflow = "unset"; // Restaurar scroll
  }, []);

  /* ============================================
     EFECTO: Limpiar timeout al desmontar el componente
     Evita memory leaks si el usuario sale rápido
     ============================================ */
  useEffect(() => {
    return () => {
      if (timeoutTransicion.current) {
        clearTimeout(timeoutTransicion.current);
      }
    };
  }, []);

  /* ============================================
     EFECTO: Cerrar modal con tecla ESC
     ============================================ */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && modalAbierto) cerrarModal();
    };
    if (modalAbierto) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalAbierto, cerrarModal]);

  /* ============================================
     EFECTO: Navegar con flechas del teclado
     ============================================ */
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!modalAbierto) {
        if (e.key === "ArrowLeft") proyectoAnterior();
        else if (e.key === "ArrowRight") proyectoSiguiente();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [modalAbierto, proyectoAnterior, proyectoSiguiente]);

  /* ============================================
     EFECTO: Restaurar scroll si el componente se desmonta
     mientras el modal está abierto
     ============================================ */
  useEffect(() => {
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <section id="proyectos" className="portafolio-section">
      <div className="portafolio-container">

        {/* ── ENCABEZADO ── */}
        <div className="portafolio-header">
          <h2 className="portafolio-title">NUESTROS PROYECTOS</h2>
          <br />
          <p className="portafolio-subtitle">
            Descubre la calidad y excelencia en cada uno de nuestros desarrollos constructivos
          </p>
        </div>

        {/* ── CARRUSEL ── */}
        <div className="portafolio-carousel">

          {/* Botón: Proyecto anterior */}
          <button
            className="portafolio-nav-btn portafolio-nav-prev"
            onClick={proyectoAnterior}
            aria-label="Proyecto anterior"
            disabled={projects.length <= 1 || transicionando}
          >
            &#8249;
          </button>

          {/* ── CONTENIDO DEL PROYECTO ──
              La clase "transicionando" aplica opacity: 0 (fade-out)
              mientras se está cambiando de proyecto */}
          <div className={`portafolio-content ${transicionando ? "portafolio-transicionando" : ""}`}>

            {/* Información del proyecto */}
            <div className="portafolio-info">
              <h3 className="portafolio-project-title">{proyecto.title}</h3>
              <p className="portafolio-location">
                <span className="portafolio-location-icon">📍</span>
                {proyecto.location}
              </p>
            </div>

            {/* ── GALERÍA ──
                OPTIMIZACIÓN CLAVE: solo se renderizan las imágenes
                del proyecto ACTIVO. Antes se renderizaban las 24 de golpe. */}
            <div className="portafolio-gallery">
              {proyecto.images
                .filter(Boolean) // Elimina los `undefined` causados por comas dobles en el array original
                .map((imagen, index) => (
                  <ImagenConSkeleton
                    key={`${proyecto.id}-${index}`}
                    src={imagen}
                    alt={`${proyecto.title} - Imagen ${index + 1}`}
                    className="portafolio-image"
                    onClick={() => abrirModal(imagen)}
                    role="button"
                    tabIndex={0}
                    ariaLabel={`Ver imagen ${index + 1} de ${proyecto.title}`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") abrirModal(imagen);
                    }}
                  />
                ))}
            </div>
          </div>

          {/* Botón: Proyecto siguiente */}
          <button
            className="portafolio-nav-btn portafolio-nav-next"
            onClick={proyectoSiguiente}
            aria-label="Proyecto siguiente"
            disabled={projects.length <= 1 || transicionando}
          >
            &#8250;
          </button>
        </div>

        {/* ── INDICADOR DE POSICIÓN ── */}
        {projects.length > 1 && (
          <div style={{ textAlign: "center", marginTop: "1rem", color: "#6c757d", fontSize: "0.9rem" }}>
            Proyecto {proyectoActual + 1} de {projects.length}
          </div>
        )}
      </div>

      {/* ── MODAL DE IMAGEN AMPLIADA ── */}
      {modalAbierto && (
        <div
          className="portafolio-modal"
          onClick={cerrarModal}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada del proyecto"
        >
          <div
            className="portafolio-modal-content"
            onClick={(e) => e.stopPropagation()} // Evitar que el click en la imagen cierre el modal
          >
            {/* Botón cerrar */}
            <button
              className="portafolio-modal-close"
              onClick={cerrarModal}
              aria-label="Cerrar imagen ampliada"
            >
              ✕
            </button>

            {/* Indicador de carga dentro del modal */}
            {imagenCargando && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#6c757d" }}>
                Cargando...
              </div>
            )}

            {/* Imagen ampliada */}
            <img
              src={imagenModal}
              alt="Imagen ampliada del proyecto"
              className="portafolio-modal-image"
              style={{ opacity: imagenCargando ? 0 : 1, transition: "opacity 0.3s ease" }}
              onLoad={() => setImagenCargando(false)}
              onError={() => {
                setImagenCargando(false);
                console.error("Error al cargar imagen en modal");
              }}
            />

            {/* Info del proyecto en el modal */}
            <div className="portafolio-modal-info">
              <h4>{proyecto.title}</h4>
              <p>{proyecto.location}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Portafolio;