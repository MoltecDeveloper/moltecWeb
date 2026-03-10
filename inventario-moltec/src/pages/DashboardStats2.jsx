// pages/DashboardStats.jsx - Dashboard Optimizado con CSS Externo
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import dashboardAPI from "../services/dashboardApi";
import "./Dashboard2.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ─────────────────────────────────────────────────────────────────────────────
// PROP NUEVA: sidebarCollapsed (boolean)
//   El componente padre (App / Layout) debe pasar este prop cuando el sidebar
//   cambia entre expandido ↔ contraído, para que las gráficas se redimensionen.
//   Ejemplo en el padre:
//     <DashboardStats sidebarCollapsed={isCollapsed} />
// ─────────────────────────────────────────────────────────────────────────────
const DashboardStats = ({ sidebarCollapsed = false }) => {

  // ── Estado del ancho de ventana ───────────────────────────────────────────
  // Se usa solo para ajustar opciones de texto/ejes según breakpoints.
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // ── Clave única para forzar re-montaje de las gráficas de barras ──────────
  // Cuando este valor cambia, React desmonta y vuelve a montar los <Bar />,
  // lo que obliga a Chart.js a recalcular su tamaño desde cero.
  const [chartKey, setChartKey] = useState(0);

  // ── Estados de datos ──────────────────────────────────────────────────────
  const [datosDashboard, setDatosDashboard] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [lastUpdate, setLastUpdate]         = useState(null);

  // ── Referencia al contenedor de las gráficas de barras ───────────────────
  // ResizeObserver observa este elemento y detecta cuando su ancho cambia
  // (incluso si el ancho de la VENTANA no cambia, ej: al abrir/cerrar sidebar).
  const barrasContainerRef = useRef(null);

  // ── Timer para el "debounce" del resize ──────────────────────────────────
  // Evita que chartKey se incremente decenas de veces durante la animación
  // CSS del sidebar (que dura ~300 ms).  Solo actualiza 350 ms después de
  // que el tamaño deja de cambiar.
  const resizeTimerRef = useRef(null);

  // ── Callback que incrementa chartKey (con debounce) ──────────────────────
  const triggerChartResize = useCallback(() => {
    clearTimeout(resizeTimerRef.current);
    resizeTimerRef.current = setTimeout(() => {
      setChartKey((prev) => prev + 1); // nuevo valor → React re-monta <Bar />
    }, 350); // 350 ms > duración típica de la transición CSS del sidebar
  }, []);

  // ── Escuchar cambios en el ancho de la VENTANA ────────────────────────────
  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
      triggerChartResize();
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [triggerChartResize]);

  // ── Observar cambios en el CONTENEDOR de barras con ResizeObserver ────────
  // Este efecto es la clave de la corrección:
  //   - ResizeObserver detecta cuando el div padre de las gráficas cambia de
  //     tamaño, sin importar si fue por resize de ventana o por el sidebar.
  //   - Es más preciso que escuchar window.resize.
  useEffect(() => {
    const container = barrasContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // El contenedor cambió de tamaño → forzar re-render de las gráficas
      triggerChartResize();
    });

    observer.observe(container); // empezar a observar el div

    return () => observer.disconnect(); // limpiar al desmontar el componente
  }, [triggerChartResize]);

  // ── Reaccionar al prop sidebarCollapsed ───────────────────────────────────
  // Cuando el padre cambia isCollapsed, este efecto activa el re-render.
  // Es un respaldo adicional al ResizeObserver para garantizar compatibilidad.
  useEffect(() => {
    triggerChartResize();
  }, [sidebarCollapsed, triggerChartResize]);

  // ── Cargar datos al montar ────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Opciones responsivas para las gráficas de barras ─────────────────────
  // Se recalculan cada vez que windowWidth cambia, ajustando tamaños de
  // fuente, rotación de etiquetas y padding según el breakpoint actual.
  const getOpcionesBarrasResponsive = (titulo = "Datos") => {
    const isMobile      = windowWidth <= 768;
    const isSmallMobile = windowWidth <= 480;
    return {
      responsive:          true,  // la gráfica se adapta al contenedor
      maintainAspectRatio: false, // usa el alto fijo del div contenedor (CSS)
      animation: {
        duration: 200, // animación más rápida al redimensionar (ms)
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text:    titulo,
          color:   "#ffffff",
          font:    { size: isSmallMobile ? 12 : isMobile ? 13 : 14, weight: "bold" },
        },
        tooltip: {
          backgroundColor: "#1a2d3d",
          titleColor: "#ffffff",
          bodyColor:  "#ffffff",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: "#ffffff",
            font: { size: isSmallMobile ? 10 : isMobile ? 11 : 12 },
          },
          grid: { display: !isSmallMobile, color: "rgba(255,255,255,0.08)" },
        },
        x: {
          ticks: {
            maxRotation:   isSmallMobile ? 90  : 45,
            minRotation:   isSmallMobile ? 45  : 0,
            color: "#ffffff",
            font:          { size: isSmallMobile ? 9 : isMobile ? 10 : 11 },
            maxTicksLimit: isSmallMobile ? 5   : isMobile ? 8 : undefined,
          },
          grid: { display: !isSmallMobile, color: "rgba(255,255,255,0.08)" },
        },
      },
      layout: {
        padding: {
          top:    isMobile ? 10 : 20,
          bottom: isMobile ? 10 : 20,
          left:   isMobile ?  5 : 10,
          right:  isMobile ?  5 : 10,
        },
      },
    };
  };

  // ── Carga de datos desde la API ───────────────────────────────────────────
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📊 Cargando datos del dashboard...");
      const response = await dashboardAPI.obtenerDatosDashboard();
      if (response.success) {
        setDatosDashboard(response.data);
        setLastUpdate(new Date());
        console.log("✅ Datos del dashboard cargados exitosamente");
      } else {
        throw new Error(response.error || "Error al cargar datos");
      }
    } catch (error) {
      console.error("❌ Error al cargar dashboard:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecargar = () => cargarDatos();

  // ── Pantalla de carga ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading-container">
          <div className="dashboard-loading-spinner"></div>
          <h2 className="dashboard-loading-title">📊 Cargando Dashboard...</h2>
          <p className="dashboard-loading-text">
            Obteniendo datos estadísticos de MOLTEC S.A.
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla de error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error-container">
          <h2 className="dashboard-error-title">❌ Error al cargar Dashboard</h2>
          <p className="dashboard-error-message">{error}</p>
          <button onClick={handleRecargar} className="dashboard-btn-retry">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">

      {/* ── HEADER ── */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-header-title">📊 Dashboard - MOLTEC S.A.</h1>
          <div className="dashboard-header-actions">
            <button onClick={handleRecargar} className="dashboard-btn-refresh">
              🔄 Actualizar
            </button>
            {lastUpdate && (
              <span className="dashboard-last-update">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── RESUMEN GENERAL ── */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">📋 Resumen General</h2>
        <div className="dashboard-totales-grid">

          <div className="dashboard-total-card materiales">
            <div className="dashboard-card-icon">📦</div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Total Materiales</h3>
              <span className="dashboard-card-number">
                {datosDashboard?.totales?.materiales || 0}
              </span>
            </div>
          </div>

          <div className="dashboard-total-card herramientas">
            <div className="dashboard-card-icon">🔧</div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Total Herramientas</h3>
              <span className="dashboard-card-number">
                {datosDashboard?.totales?.herramientas || 0}
              </span>
            </div>
          </div>

          <div className="dashboard-total-card empleados">
            <div className="dashboard-card-icon">👥</div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Total Empleados</h3>
              <span className="dashboard-card-number">
                {datosDashboard?.totales?.empleados || 0}
              </span>
            </div>
          </div>

          <div className="dashboard-total-card clientes">
            <div className="dashboard-card-icon">👤</div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Total Clientes</h3>
              <span className="dashboard-card-number">
                {datosDashboard?.totales?.clientes || 0}
              </span>
            </div>
          </div>

          <div className="dashboard-total-card proyectos">
            <div className="dashboard-card-icon">🗂️</div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Proyectos Activos</h3>
              <span className="dashboard-card-number">
                {datosDashboard?.totales?.proyectosActivos || 0}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── GRÁFICAS PIE ── */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">📊 Gráficas de Estado</h2>
        <div className="dashboard-graficas-pie-grid">

          <div className="dashboard-grafica-card">
            <h3 className="dashboard-grafica-title">🔧 Estado de Herramientas</h3>
            <div className="dashboard-chart-container">
              <Pie
                data={dashboardAPI.formatearDatosPie(
                  datosDashboard?.graficasPie?.estadoHerramientas,
                  "estadoHerramientas"
                )}
                options={dashboardAPI.getOpcionesPie()}
              />
            </div>
          </div>

          <div className="dashboard-grafica-card">
            <h3 className="dashboard-grafica-title">📊 Stock de Herramientas</h3>
            <div className="dashboard-chart-container">
              <Pie
                data={dashboardAPI.formatearDatosPie(
                  datosDashboard?.graficasPie?.stockHerramientas,
                  "stockHerramientas"
                )}
                options={dashboardAPI.getOpcionesPie()}
              />
            </div>
          </div>

          <div className="dashboard-grafica-card">
            <h3 className="dashboard-grafica-title">📦 Stock de Materiales</h3>
            <div className="dashboard-chart-container">
              <Pie
                data={dashboardAPI.formatearDatosPie(
                  datosDashboard?.graficasPie?.stockMateriales,
                  "stockMateriales"
                )}
                options={dashboardAPI.getOpcionesPie()}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── GRÁFICAS DE BARRAS ─────────────────────────────────────────────
           ref={barrasContainerRef} → el ResizeObserver observa este div.
           Cualquier cambio de ancho (sidebar, ventana, etc.) se detecta aquí.
      ── */}
      <div className="dashboard-section" ref={barrasContainerRef}>
        <h2 className="dashboard-section-title">📈 Análisis de Actividad</h2>
        <div className="dashboard-graficas-barras-grid">

          <div className="dashboard-grafica-card full-width">
            <h3 className="dashboard-grafica-title">
              🔝 Top 10 Materiales/Herramientas con más Salidas (Mes Actual)
            </h3>
            <div className="dashboard-chart-container-large">
              {/*
                key={chartKey} → cuando chartKey cambia, React desmonta este
                <Bar> y crea uno nuevo.  Esto fuerza a Chart.js a medir el
                contenedor y dibujarse al tamaño correcto.
                Ya NO usamos key={windowWidth} porque ese valor no cambia
                cuando solo se mueve el sidebar.
              */}
              <Bar
                key={`top-salidas-${chartKey}`}
                data={dashboardAPI.formatearDatosBarras(
                  datosDashboard?.graficasBarras?.topMaterialesHerramientas
                )}
                options={getOpcionesBarrasResponsive("Salidas del mes")}
              />
            </div>
          </div>

          <div className="dashboard-grafica-card full-width">
            <h3 className="dashboard-grafica-title">
              👥 Clientes Registrados por Semana (Mes Actual)
            </h3>
            <div className="dashboard-chart-container-medium">
              {/* Mismo patrón: key basado en chartKey, no en windowWidth */}
              <Bar
                key={`clientes-semana-${chartKey}`}
                data={dashboardAPI.formatearDatosBarras(
                  datosDashboard?.graficasBarras?.clientesDelMes
                )}
                options={getOpcionesBarrasResponsive("Nuevos clientes")}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="dashboard-footer">
        <p className="dashboard-footer-text">
          © {new Date().getFullYear()} MOLTEC S.A. - Sistema de Gestión de Inventario
        </p>
        <p className="dashboard-footer-text">Dashboard generado automáticamente</p>
      </div>

    </div>
  );
};

export default DashboardStats;