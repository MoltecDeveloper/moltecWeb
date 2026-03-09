/* ============================================
   COMPONENTE CARRUSEL - MOLTEC S.A.
   Carrusel automático de imágenes con indicadores
   ============================================ */

import React, { useState, useEffect, useCallback } from "react";
import "./carrusel2.css";

/* ============================================
   CONFIGURACIÓN DE IMÁGENES
   Agrega o quita imágenes según necesites
   ============================================ */
const images = [
  {
    src: "/imagesCarrusel/carrusel1.webp",
    alt: "Proyecto MOLTEC 1",
  },
  {
    src: "/imagesCarrusel/carrusel2.webp",
    alt: "Proyecto MOLTEC 2 ",
  },
  {
    src:"/imagesCarrusel/carrusel3.webp",
    alt: "Proyecto MOLTEC 3",
  },
  {
    src: "/imagesCarrusel/carrusel4.webp",
    alt: "Proyecto MOLTEC 4",
  },
];

/* ============================================
   CONFIGURACIÓN DEL CARRUSEL
   ============================================ */
const AUTOPLAY_INTERVAL = 5000; // 5 segundos entre cambios automáticos

const ImageCarousel = () => {
  // Estado: índice de la imagen actual
  const [current, setCurrent] = useState(0);
  
  // Estado: indica si las imágenes están cargando
  const [loading, setLoading] = useState(true);

  /* ============================================
     FUNCIÓN: Ir a la siguiente imagen
     ============================================ */
  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, []);

  /* ============================================
     FUNCIÓN: Ir a la imagen anterior
     ============================================ */
  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, []);

  /* ============================================
     FUNCIÓN: Ir a una imagen específica
     ============================================ */
  const goToSlide = useCallback((index) => {
    setCurrent(index);
  }, []);

  /* ============================================
     EFECTO: Auto-reproducción del carrusel
     Cambia automáticamente cada X segundos
     ============================================ */
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    // Cleanup: limpia el intervalo al desmontar
    return () => clearInterval(timer);
  }, [nextSlide]);

  /* ============================================
     EFECTO: Pre-carga de imágenes
     Mejora el rendimiento cargando todas las imágenes
     ============================================ */
  useEffect(() => {
    const imagePromises = images.map((img) => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = img.src;
        image.onload = resolve;
        image.onerror = reject;
      });
    });

    Promise.all(imagePromises)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error cargando imágenes del carrusel:", error);
        setLoading(false);
      });
  }, []);

  /* ============================================
     MANEJO DE TECLADO (Accesibilidad)
     Permite navegar con flechas del teclado
     ============================================ */
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "ArrowLeft") {
        prevSlide();
      } else if (event.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    // Cleanup: remueve el listener al desmontar
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [nextSlide, prevSlide]);

  return (
    <div className="carousel-moltec" role="region" aria-label="Carrusel de proyectos MOLTEC">
      {/* ============================================
          INDICADOR DE CARGA
          Muestra mientras las imágenes cargan
          ============================================ */}
      {loading && <div className="carousel-moltec-loading" />}

      {/* ============================================
          IMÁGENES DEL CARRUSEL
          Solo muestra la imagen activa
          ============================================ */}
      {images.map((img, index) => (
        <img
          key={index}
          src={img.src}
          alt={img.alt}
          className={`carousel-moltec-image ${index === current ? "active" : ""}`}
          loading={index === 0 ? "eager" : "lazy"} // Primera imagen carga inmediato
          aria-hidden={index !== current} // Accesibilidad
        />
      ))}

      {/* ============================================
          CONTROLES DE NAVEGACIÓN (FLECHAS) - OPCIONAL
          Descomenta si quieres agregar flechas
          ============================================ */}
      {/* 
      <button
        className="carousel-moltec-control carousel-moltec-control-prev"
        onClick={prevSlide}
        aria-label="Imagen anterior"
      >
        ‹
      </button>
      <button
        className="carousel-moltec-control carousel-moltec-control-next"
        onClick={nextSlide}
        aria-label="Siguiente imagen"
      >
        ›
      </button>
      */}

      {/* ============================================
          INDICADORES (DOTS)
          Puntos para navegar manualmente
          ============================================ */}
      <div className="carousel-moltec-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`carousel-moltec-dot ${index === current ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a imagen ${index + 1}`}
            aria-current={index === current ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;