// pages/HerramientasCRUD.jsx - CRUD de herramientas con CSS externo
import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import herramientasApi from "../services/herramientasApi";
import reportesService from "../services/reportesService";
import "./CRUDStyles2.css";

const HerramientasCRUD = () => {
  const [herramientas, setHerramientas] = useState([]);
  const [herramientasFiltradas, setHerramientasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalHerramientas: 0,
    stockCritico: 0,
    stockBajo: 0,
    stockNormal: 0,
    herramientasNuevas: 0,
    herramientasBuenEstado: 0,
    herramientasDesgastadas: 0,
    herramientasEnReparacion: 0,
    herramientasBaja: 0,
  });
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({
    estadoStock: "todos",
    estadoHerramienta: "todos",
    fechaIngreso: "",
    fechaActualizacion: "",
  });
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalStock, setMostrarModalStock] = useState(false);
  const [mostrarModalReportes, setMostrarModalReportes] = useState(false);
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState("ingreso");
  const [formData, setFormData] = useState({
    nombre: "",
    marca: "",
    modelo: "",
    descripcion: "",
    medida: "",
    cantidadActual: 0,
    cantidadMinima: 0,
    estado: "Nuevo",
  });
  const [movimientoData, setMovimientoData] = useState({
    cantidad: "",
    motivo: "",
  });
  const [configuracionReporte, setConfiguracionReporte] = useState({
    tipoReporte: "completo",
    estadoSeleccionado: "todos",
    nivelStockSeleccionado: "todos",
    incluirFechas: true,
    incluirDetalles: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    try {
      const filtradas = herramientasApi.buscarHerramientas(
        herramientas,
        busqueda
      );
      let herramientasFiltradas = filtradas;
      if (filtros.estadoStock !== "todos") {
        herramientasFiltradas = herramientasFiltradas.filter((herramienta) => {
          const estado = determinarEstadoStock(
            herramienta.cantidadActual,
            herramienta.cantidadMinima
          );
          return estado === filtros.estadoStock;
        });
      }
      if (filtros.estadoHerramienta !== "todos") {
        herramientasFiltradas = herramientasFiltradas.filter(
          (herramienta) => herramienta.estado === filtros.estadoHerramienta
        );
      }
      if (filtros.fechaIngreso) {
        const fechaFiltro = new Date(filtros.fechaIngreso + "T00:00:00");
        herramientasFiltradas = herramientasFiltradas.filter((herramienta) => {
          if (!herramienta.fechaIngreso) return false;
          const fechaHerramienta = new Date(herramienta.fechaIngreso);
          return fechaHerramienta >= fechaFiltro;
        });
      }
      if (filtros.fechaActualizacion) {
        const fechaFiltro = new Date(filtros.fechaActualizacion + "T00:00:00");
        herramientasFiltradas = herramientasFiltradas.filter((herramienta) => {
          if (!herramienta.fechaActualizacion) return false;
          const fechaHerramienta = new Date(herramienta.fechaActualizacion);
          return fechaHerramienta >= fechaFiltro;
        });
      }
      setHerramientasFiltradas(herramientasFiltradas);
    } catch (error) {
      console.error("Error al filtrar herramientas:", error);
      setHerramientasFiltradas(herramientas);
    }
  }, [herramientas, busqueda, filtros]);

  const manejarCambioFiltro = (tipoFiltro, valor) => {
    setFiltros((prev) => ({ ...prev, [tipoFiltro]: valor }));
  };
  const resetearFiltros = () => {
    setFiltros({
      estadoStock: "todos",
      estadoHerramienta: "todos",
      fechaIngreso: "",
      fechaActualizacion: "",
    });
  };
  const determinarEstadoStock = (cantidadActual, cantidadMinima) => {
    const actual = Number(cantidadActual ?? 0);
    const minimo = Number(cantidadMinima ?? 0);

    if (actual < minimo) return "critico"; // stock menor al mínimo
    if (actual <= minimo * 2) return "bajo"; // desde el mínimo hasta 2x
    return "normal"; // mayor a 2x
  };
  const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return "N/A";
    try {
      const [year, month, day] = fechaString.split("-");
      const fecha = new Date(year, month - 1, day);
      return fecha.toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };
  // ── Colores de badge para tema oscuro MOLTEC ─────────────────────────────
  // Los colores de herramientasApi.getEstadoStock() y getEstadoColor()
  // vienen con valores del tema claro. Como son estilos inline, ningún CSS
  // puede sobreescribirlos. Esta función devuelve los colores oscuros correctos.

  // Badge de Stock (igual que Materiales)
  const getBadgeStock = (texto) => {
    const t = (texto || "").toLowerCase();
    if (t.includes("crítico") || t.includes("critico"))
      return { backgroundColor: "#c53030", color: "#ffffff" };
    if (t.includes("bajo"))
      return { backgroundColor: "#c05621", color: "#ffffff" };
    if (t.includes("normal"))
      return { backgroundColor: "#276749", color: "#ffffff" };
    return { backgroundColor: "#553c9a", color: "#ffffff" };
  };

  // Badge de Estado de Herramienta
  // Colores basados en la gráfica pie del dashboard (versión oscura para mejor contraste)
  const getBadgeEstado = (texto) => {
    const t = (texto || "").toLowerCase();
    if (t.includes("nuevo"))
      return { backgroundColor: "#276749", color: "#ffffff" };       // verde oscuro    (gráfica: #48bb78)
    if (t.includes("buen estado") || t.includes("buen"))
      return { backgroundColor: "#2b6cb0", color: "#ffffff" };       // azul oscuro     (gráfica: #4299e1)
    if (t.includes("desgastado"))
      return { backgroundColor: "#c05621", color: "#ffffff" };       // naranja oscuro  (gráfica: #ed8936)
    if (t.includes("reparaci") || t.includes("reparacion"))
      return { backgroundColor: "#b7791f", color: "#ffffff" };       // amarillo oscuro (gráfica: #ecc94b)
    if (t.includes("baja"))
      return { backgroundColor: "#c53030", color: "#ffffff" };       // rojo oscuro     (gráfica: #e53e3e)
    return { backgroundColor: "#2d3748", color: "#ffffff" };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [herramientasResponse, statsResponse] = await Promise.all([
        herramientasApi.obtenerHerramientas(),
        herramientasApi.obtenerEstadisticas(),
      ]);
      if (herramientasResponse.success) {
        setHerramientas(herramientasResponse.data);
        setHerramientasFiltradas(herramientasResponse.data);
      }
      if (statsResponse.success) {
        setEstadisticas(statsResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar las herramientas");
    } finally {
      setLoading(false);
    }
  };

  const recargarDatos = async () => {
    try {
      toast.info("Recargando datos...");
      setFiltros({
        estadoStock: "todos",
        estadoHerramienta: "todos",
        fechaIngreso: "",
        fechaActualizacion: "",
      });
      setBusqueda("");
      await cargarDatos();
      toast.success("Datos actualizados");
    } catch (error) {
      console.error("Error al recargar datos:", error);
      toast.error("Error al actualizar los datos");
    }
  };

  const crearHerramienta = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await herramientasApi.crearHerramienta(formData);
      if (response.success) {
        toast.success("Herramienta creada exitosamente");
        await cargarDatos();
        cerrarModalCrear();
      }
    } catch (error) {
      toast.error(error.message || "Error al crear la herramienta");
    } finally {
      setLoading(false);
    }
  };

  const actualizarHerramienta = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await herramientasApi.actualizarHerramienta(
        herramientaSeleccionada.id,
        formData
      );
      if (response.success) {
        toast.success("Herramienta actualizada exitosamente");
        await cargarDatos();
        cerrarModalEditar();
      }
    } catch (error) {
      toast.error(error.message || "Error al actualizar la herramienta");
    } finally {
      setLoading(false);
    }
  };

  const procesarMovimientoStock = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const cantidad = parseFloat(movimientoData.cantidad);
      const { motivo } = movimientoData;
      let response;
      if (tipoMovimiento === "ingreso") {
        response = await herramientasApi.ingresoStock(
          herramientaSeleccionada.id,
          cantidad,
          motivo
        );
      } else {
        response = await herramientasApi.salidaStock(
          herramientaSeleccionada.id,
          cantidad,
          motivo
        );
      }
      if (response.success) {
        const tipoTexto = tipoMovimiento === "ingreso" ? "Ingreso" : "Salida";
        toast.success(`${tipoTexto} registrado exitosamente`);
        await cargarDatos();
        cerrarModalStock();
      }
    } catch (error) {
      toast.error(error.message || "Error al procesar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  const eliminarHerramienta = async (herramienta) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${herramienta.nombre}"?`)) {
      return;
    }
    try {
      setLoading(true);
      const response = await herramientasApi.eliminarHerramienta(
        herramienta.id
      );
      if (response.success) {
        toast.success("Herramienta eliminada exitosamente");
        await cargarDatos();
      }
    } catch (error) {
      toast.error(error.message || "Error al eliminar la herramienta");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setFormData({
      nombre: "",
      marca: "",
      modelo: "",
      descripcion: "",
      medida: "",
      cantidadActual: 1,
      cantidadMinima: 0,
      estado: "Nuevo",
    });
    setMostrarModalCrear(true);
  };
  const cerrarModalCrear = () => {
    setMostrarModalCrear(false);
    setFormData({
      nombre: "",
      marca: "",
      modelo: "",
      descripcion: "",
      medida: "",
      cantidadActual: 1,
      cantidadMinima: 0,
      estado: "Nuevo",
    });
  };
  const abrirModalEditar = (herramienta) => {
    setHerramientaSeleccionada(herramienta);
    setFormData({
      nombre: herramienta.nombre,
      marca: herramienta.marca || "",
      modelo: herramienta.modelo || "",
      descripcion: herramienta.descripcion || "",
      medida: herramienta.medida || "",
      cantidadActual: herramienta.cantidadActual,
      cantidadMinima: Number(herramienta.cantidadMinima),
      estado: herramienta.estado,
    });
    setMostrarModalEditar(true);
  };
  const cerrarModalEditar = () => {
    setMostrarModalEditar(false);
    setHerramientaSeleccionada(null);
  };
  const abrirModalStock = (herramienta, tipo) => {
    setHerramientaSeleccionada(herramienta);
    setTipoMovimiento(tipo);
    setMovimientoData({ cantidad: "", motivo: "" });
    setMostrarModalStock(true);
  };
  const cerrarModalStock = () => {
    setMostrarModalStock(false);
    setHerramientaSeleccionada(null);
    setMovimientoData({ cantidad: "", motivo: "" });
  };
  const abrirModalReportes = () => {
    setConfiguracionReporte({
      tipoReporte: "completo",
      estadoSeleccionado: "todos",
      nivelStockSeleccionado: "todos",
      incluirFechas: true,
      incluirDetalles: true,
    });
    setMostrarModalReportes(true);
  };
  const cerrarModalReportes = () => {
    setMostrarModalReportes(false);
  };

  const validarConfiguracionReporte = () => {
    if (
      configuracionReporte.tipoReporte === "por-estado" &&
      configuracionReporte.estadoSeleccionado === "todos"
    ) {
      toast.warning(
        "Selecciona un estado específico para este tipo de reporte"
      );
      return false;
    }
    if (
      configuracionReporte.tipoReporte === "por-stock" &&
      configuracionReporte.nivelStockSeleccionado === "todos"
    ) {
      toast.warning(
        "Selecciona un nivel de stock específico para este tipo de reporte"
      );
      return false;
    }
    return true;
  };

  const generarReportePersonalizado = async () => {
    try {
      if (!validarConfiguracionReporte()) {
        return;
      }
      setLoading(true);
      let herramientasFiltradas = [...herramientas];
      if (configuracionReporte.estadoSeleccionado !== "todos") {
        herramientasFiltradas = herramientasFiltradas.filter(
          (h) => h.estado === configuracionReporte.estadoSeleccionado
        );
      }
      if (configuracionReporte.nivelStockSeleccionado !== "todos") {
        herramientasFiltradas = herramientasFiltradas.filter((h) => {
          const estadoStock = herramientasApi.getEstadoStock(
            h.cantidadActual,
            h.cantidadMinima
          );
          switch (configuracionReporte.nivelStockSeleccionado) {
            case "critico":
              return estadoStock.texto === "Stock Crítico";
            case "bajo":
              return estadoStock.texto === "Stock Bajo";
            case "normal":
              return estadoStock.texto === "Stock Normal";
            default:
              return true;
          }
        });
      }
      if (herramientasFiltradas.length === 0) {
        toast.warning(
          "No hay herramientas que coincidan con los filtros seleccionados"
        );
        return;
      }
      toast.info(
        `Generando reporte personalizado (${herramientasFiltradas.length} herramientas)...`,
        { autoClose: 2000 }
      );
      await reportesService.generarReporteCompletoHerramientas(
        herramientasFiltradas,
        estadisticas,
        configuracionReporte
      );
      toast.success("Reporte personalizado descargado exitosamente");
      cerrarModalReportes();
    } catch (error) {
      console.error("Error al generar reporte personalizado:", error);
      toast.error(error.message || "Error al generar el reporte personalizado");
    } finally {
      setLoading(false);
    }
  };

  if (loading && herramientas.length === 0) {
    return (
      <div className="crud-loading-container">
        <div className="crud-spinner"></div>
        <h2>Cargando herramientas...</h2>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-title-section">
          <h1 className="crud-title">
            <Wrench size={32} />
            Inventario de Herramientas
          </h1>
          <p className="crud-subtitle">
            Gestión completa del inventario de herramientas y equipos
          </p>
        </div>
        <div className="crud-header-actions">
          <button
            className="crud-btn crud-btn-info"
            onClick={abrirModalReportes}
            disabled={loading || herramientas.length === 0}
            title="Descargar reporte completo en PDF"
          >
            <FileText size={16} />
            Reporte PDF
          </button>
          <button
            className="crud-btn crud-btn-secondary"
            onClick={recargarDatos}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button
            className="crud-btn crud-btn-primary"
            onClick={abrirModalCrear}
          >
            <Plus size={16} />
            Nueva Herramienta
          </button>
        </div>
      </div>

      <div className="crud-stats-container">
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Total Herramientas</h3>
          <p className="crud-stat-number">
            {estadisticas.totalHerramientas || herramientas.length}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Stock Crítico</h3>
          <p className="crud-stat-number" style={{ color: "#e53e3e" }}>
            {estadisticas.stockCritico || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Stock Bajo</h3>
          <p className="crud-stat-number" style={{ color: "#dd6b20" }}>
            {estadisticas.stockBajo || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Stock Normal</h3>
          <p className="crud-stat-number" style={{ color: "#38a169" }}>
            {estadisticas.stockNormal || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Nuevas</h3>
          <p className="crud-stat-number" style={{ color: "#48bb78" }}>
            {estadisticas.herramientasNuevas || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Buen Estado</h3>
          <p className="crud-stat-number" style={{ color: "#4299e1" }}>
            {estadisticas.herramientasBuenEstado || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Desgastadas</h3>
          <p className="crud-stat-number" style={{ color: "#ed8936" }}>
            {estadisticas.herramientasDesgastadas || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">En Reparación</h3>
          <p className="crud-stat-number" style={{ color: "#ecc94b" }}>
            {estadisticas.herramientasEnReparacion || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Dadas de Baja</h3>
          <p className="crud-stat-number" style={{ color: "#f56565" }}>
            {estadisticas.herramientasBaja || 0}
          </p>
        </div>
      </div>

      <div className="crud-search-container">
        <div className="crud-search-box">
          <Search size={20} color="#6c757d" />
          <input
            type="text"
            className="crud-search-input"
            placeholder="Buscar herramientas por nombre, marca, modelo, descripción o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="crud-filters-container">
        <div className="crud-filters-row">
          <div className="crud-filter-group">
            <label className="crud-filter-label">Estado del Stock:</label>
            <select
              className="crud-filter-input"
              value={filtros.estadoStock}
              onChange={(e) =>
                manejarCambioFiltro("estadoStock", e.target.value)
              }
            >
              <option value="todos">📦 Todos los estados</option>
              <option value="critico">🔴 Stock Crítico</option>
              <option value="bajo">🟡 Stock Bajo</option>
              <option value="normal">🟢 Stock Normal</option>
            </select>
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label">Desgaste Herramienta:</label>
            <select
              className="crud-filter-input"
              value={filtros.estadoHerramienta}
              onChange={(e) =>
                manejarCambioFiltro("estadoHerramienta", e.target.value)
              }
            >
              <option value="todos">🔧 Todos los desgastes</option>
              <option value="Nuevo">✨ Nuevo</option>
              <option value="En buen estado">👍 En buen estado</option>
              <option value="Desgastado">⚠️ Desgastado</option>
              <option value="En reparación">🔨 En reparación</option>
              <option value="Baja">❌ Baja</option>
            </select>
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label">Ingresadas desde:</label>
            <input
              type="date"
              className="crud-filter-input"
              value={filtros.fechaIngreso}
              onChange={(e) =>
                manejarCambioFiltro("fechaIngreso", e.target.value)
              }
            />
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label">Actualizadas desde:</label>
            <input
              type="date"
              className="crud-filter-input"
              value={filtros.fechaActualizacion}
              onChange={(e) =>
                manejarCambioFiltro("fechaActualizacion", e.target.value)
              }
            />
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label crud-filter-label-invisible">
              Resetear
            </label>
            <button
              className="crud-btn crud-btn-light crud-filter-reset-btn"
              onClick={resetearFiltros}
              title="Resetear todos los filtros"
            >
              <RefreshCw size={16} />
              Resetear
            </button>
          </div>
        </div>
        {(filtros.estadoStock !== "todos" ||
          filtros.estadoHerramienta !== "todos" ||
          filtros.fechaIngreso ||
          filtros.fechaActualizacion) && (
          <div className="crud-active-filters">
            <span className="crud-active-filters-text">
              Filtros activos:
              {filtros.estadoStock !== "todos" && (
                <span className="crud-filter-tag">
                  Stock: {filtros.estadoStock}
                </span>
              )}
              {filtros.estadoHerramienta !== "todos" && (
                <span className="crud-filter-tag">
                  Desgaste: {filtros.estadoHerramienta}
                </span>
              )}
              {filtros.fechaIngreso && (
                <span className="crud-filter-tag">
                  Desde: {formatearFechaLocal(filtros.fechaIngreso)}
                </span>
              )}
              {filtros.fechaActualizacion && (
                <span className="crud-filter-tag">
                  Actualizadas:{" "}
                  {formatearFechaLocal(filtros.fechaActualizacion)}
                </span>
              )}
            </span>
            <span className="crud-results-count">
              ({herramientasFiltradas.length} herramientas encontradas)
            </span>
          </div>
        )}
      </div>

      <div className="crud-table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th className="crud-th">Herramienta</th>
              <th className="crud-th">Marca/Modelo</th>
              <th className="crud-th">Descripción</th>
              <th className="crud-th">Medida</th>
              <th className="crud-th">Stock Actual</th>
              <th className="crud-th">Stock Mínimo</th>
              <th className="crud-th">Estado Stock</th>
              <th className="crud-th">Desgaste</th>
              <th className="crud-th">Fecha Ingreso</th>
              <th className="crud-th">Última Actualización</th>
              <th className="crud-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {herramientasFiltradas.length > 0 ? (
              herramientasFiltradas.map((herramienta) => {
                const estadoStock = herramientasApi.getEstadoStock(
                  herramienta.cantidadActual,
                  herramienta.cantidadMinima
                );
                const estadoHerramienta = herramientasApi.getEstadoColor(
                  herramienta.estado
                );
                return (
                  <tr key={herramienta.id} className="crud-table-row">
                    <td className="crud-td">
                      <strong>{herramienta.nombre}</strong>
                    </td>
                    <td className="crud-td">
                      {herramienta.marca || herramienta.modelo ? (
                        <div>
                          {herramienta.marca && <div>{herramienta.marca}</div>}
                          {herramienta.modelo && (
                            <small style={{ color: "rgba(255,255,255,0.55)" }}>
                              Modelo: {herramienta.modelo}
                            </small>
                          )}
                        </div>
                      ) : (
                        "Sin especificar"
                      )}
                    </td>
                    <td className="crud-td">
                      {herramienta.descripcion || "Sin descripción"}
                    </td>
                    <td className="crud-td">
                      {herramienta.medida || "No definida"}
                    </td>
                    <td className="crud-td" style={{ fontWeight: "bold" }}>
                      {herramienta.cantidadActual}
                    </td>
                    <td className="crud-td">{herramienta.cantidadMinima}</td>
                    <td className="crud-td">
                      <span
                        className="crud-badge"
                        style={getBadgeStock(estadoStock.texto)}
                      >
                        {estadoStock.texto}
                      </span>
                    </td>
                    <td className="crud-td">
                      <span
                        className="crud-badge"
                        style={getBadgeEstado(herramienta.estado)}
                      >
                        {herramienta.estado}
                      </span>
                    </td>
                    <td className="crud-td">
                      {formatearFecha(herramienta.fechaIngreso)}
                    </td>
                    <td className="crud-td">
                      {formatearFecha(herramienta.fechaActualizacion)}
                    </td>
                    <td className="crud-td">
                      <div className="crud-table-actions">
                        <button
                          className="crud-btn crud-btn-icon crud-btn-primary"
                          title="Ingreso de Stock"
                          onClick={() =>
                            abrirModalStock(herramienta, "ingreso")
                          }
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-warning"
                          title="Salida de Stock"
                          onClick={() => abrirModalStock(herramienta, "salida")}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-secondary"
                          title="Editar"
                          onClick={() => abrirModalEditar(herramienta)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-danger"
                          title="Eliminar"
                          onClick={() => eliminarHerramienta(herramienta)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="crud-no-results">
                  {busqueda
                    ? `No se encontraron herramientas que coincidan con "${busqueda}"`
                    : "No hay herramientas registradas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModalReportes && (
        <div className="crud-modal-overlay" onClick={cerrarModalReportes}>
          <div
            className="crud-modal-content"
            style={{ maxWidth: "700px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">
              Generar Reporte de Herramientas
            </h3>
            <div className="crud-report-config">
              <div className="crud-form-group">
                <label className="crud-label">Tipo de Reporte</label>
                <select
                  className="crud-select"
                  value={configuracionReporte.tipoReporte}
                  onChange={(e) => {
                    setConfiguracionReporte({
                      ...configuracionReporte,
                      tipoReporte: e.target.value,
                      estadoSeleccionado:
                        e.target.value === "por-estado" ? "Nuevo" : "todos",
                      nivelStockSeleccionado:
                        e.target.value === "por-stock" ? "critico" : "todos",
                    });
                  }}
                >
                  <option value="completo">📊 Reporte Completo</option>
                  <option value="por-estado">
                    🔧 Por Desgaste de Herramienta
                  </option>
                  <option value="por-stock">📦 Por Nivel de Stock</option>
                </select>
              </div>
              {configuracionReporte.tipoReporte === "por-estado" && (
                <div className="crud-form-group">
                  <label className="crud-label">Desgaste de Herramienta</label>
                  <select
                    className="crud-select"
                    value={configuracionReporte.estadoSeleccionado}
                    onChange={(e) =>
                      setConfiguracionReporte({
                        ...configuracionReporte,
                        estadoSeleccionado: e.target.value,
                      })
                    }
                  >
                    <option value="Nuevo">✨ Nuevo</option>
                    <option value="En buen estado">👍 En buen estado</option>
                    <option value="Desgastado">⚠️ Desgastado</option>
                    <option value="En reparación">🔨 En reparación</option>
                    <option value="Baja">❌ Baja</option>
                  </select>
                </div>
              )}
              {configuracionReporte.tipoReporte === "por-stock" && (
                <div className="crud-form-group">
                  <label className="crud-label">Nivel de Stock</label>
                  <select
                    className="crud-select"
                    value={configuracionReporte.nivelStockSeleccionado}
                    onChange={(e) =>
                      setConfiguracionReporte({
                        ...configuracionReporte,
                        nivelStockSeleccionado: e.target.value,
                      })
                    }
                  >
                    <option value="critico">🔴 Stock Crítico</option>
                    <option value="bajo">🟡 Stock Bajo</option>
                    <option value="normal">🟢 Stock Normal</option>
                  </select>
                </div>
              )}
              <div className="crud-form-group">
                <label className="crud-label">Opciones del Reporte</label>
                <div className="crud-checkbox-group">
                  <label className="crud-checkbox-label">
                    <input
                      type="checkbox"
                      className="crud-checkbox"
                      checked={configuracionReporte.incluirFechas}
                      onChange={(e) =>
                        setConfiguracionReporte({
                          ...configuracionReporte,
                          incluirFechas: e.target.checked,
                        })
                      }
                    />
                    Incluir fechas de ingreso
                  </label>
                  <label className="crud-checkbox-label">
                    <input
                      type="checkbox"
                      className="crud-checkbox"
                      checked={configuracionReporte.incluirDetalles}
                      onChange={(e) =>
                        setConfiguracionReporte({
                          ...configuracionReporte,
                          incluirDetalles: e.target.checked,
                        })
                      }
                    />
                    Incluir descripción y medida
                  </label>
                </div>
              </div>
              <div className="crud-preview-section">
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  Vista Previa del Reporte
                </h4>
                <div className="crud-preview-content">
                  <p style={{ margin: "8px 0" }}>
                    <strong>Tipo:</strong>{" "}
                    {(() => {
                      switch (configuracionReporte.tipoReporte) {
                        case "completo":
                          return "Reporte completo";
                        case "por-estado":
                          return `Filtrado por estado: ${configuracionReporte.estadoSeleccionado}`;
                        case "por-stock":
                          return `Filtrado por stock: ${configuracionReporte.nivelStockSeleccionado}`;
                        default:
                          return "Sin definir";
                      }
                    })()}
                  </p>
                  <p style={{ margin: "8px 0" }}>
                    <strong>Herramientas estimadas:</strong>{" "}
                    {(() => {
                      let filtradas = herramientas;
                      if (configuracionReporte.estadoSeleccionado !== "todos") {
                        filtradas = filtradas.filter(
                          (h) =>
                            h.estado === configuracionReporte.estadoSeleccionado
                        );
                      }
                      if (
                        configuracionReporte.nivelStockSeleccionado !== "todos"
                      ) {
                        filtradas = filtradas.filter((h) => {
                          const estadoStock = herramientasApi.getEstadoStock(
                            h.cantidadActual,
                            h.cantidadMinima
                          );
                          switch (configuracionReporte.nivelStockSeleccionado) {
                            case "critico":
                              return estadoStock.texto === "Stock Crítico";
                            case "bajo":
                              return estadoStock.texto === "Stock Bajo";
                            case "normal":
                              return estadoStock.texto === "Stock Normal";
                            default:
                              return true;
                          }
                        });
                      }
                      return filtradas.length;
                    })()}{" "}
                    herramientas
                  </p>
                </div>
              </div>
            </div>
            <div className="crud-modal-actions">
              <button
                type="button"
                className="crud-btn crud-btn-light"
                onClick={cerrarModalReportes}
              >
                Cancelar
              </button>
              <button
                className="crud-btn crud-btn-primary"
                onClick={generarReportePersonalizado}
                disabled={loading}
              >
                {loading ? "Generando..." : "Generar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalCrear && (
        <div className="crud-modal-overlay" onClick={cerrarModalCrear}>
          <div
            className="crud-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">Crear Nueva Herramienta</h3>
            <form onSubmit={crearHerramienta}>
              <div className="crud-modal-form">
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">
                      Nombre de la Herramienta*
                    </label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        required
                        maxLength={30}
                        placeholder="Ej: Martillo, Taladro, Llave inglesa..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.nombre.length > 25
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.nombre.length >= 30
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.nombre.length}/30
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Marca</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.marca}
                        onChange={(e) =>
                          setFormData({ ...formData, marca: e.target.value })
                        }
                        maxLength={15}
                        placeholder="Ej: Stanley, DeWalt, Bosch..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.marca.length > 12
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.marca.length >= 15
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.marca.length}/15
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Modelo</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.modelo}
                        onChange={(e) =>
                          setFormData({ ...formData, modelo: e.target.value })
                        }
                        maxLength={15}
                        placeholder="Ej: ST-16, DCD771C2..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.modelo.length > 12
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.modelo.length >= 15
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.modelo.length}/15
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Cantidad Inicial</label>
                    <input
                      type="number"
                      className="crud-input"
                      value={formData.cantidadActual}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadActual: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="any"
                      max="99999999.99"
                    />
                  </div>
                </div>
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Descripción</label>
                    <div className="crud-input-with-counter">
                      <textarea
                        className="crud-textarea"
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        maxLength={40}
                        placeholder="Descripción breve..."
                        rows={2}
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.descripcion.length > 35
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.descripcion.length >= 40
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.descripcion.length}/40
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Medida/Tamaño</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.medida}
                        onChange={(e) =>
                          setFormData({ ...formData, medida: e.target.value })
                        }
                        maxLength={20}
                        placeholder="Ej: 16 oz, 18V, 10mm..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.medida.length > 17
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.medida.length >= 20
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.medida.length}/20
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Desgaste</label>
                    <select
                      className="crud-select"
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({ ...formData, estado: e.target.value })
                      }
                    >
                      {herramientasApi.getEstadosValidos().map((estado) => (
                        <option key={estado.valor} value={estado.valor}>
                          {estado.texto}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Stock Mínimo</label>
                    <input
                      type="number"
                      className="crud-input"
                      value={formData.cantidadMinima}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadMinima: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="any"
                      max="99999999.99"
                    />
                  </div>
                </div>
              </div>
              <div className="crud-modal-actions">
                <button
                  type="button"
                  className="crud-btn crud-btn-light"
                  onClick={cerrarModalCrear}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="crud-btn crud-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Herramienta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEditar && (
        <div className="crud-modal-overlay" onClick={cerrarModalEditar}>
          <div
            className="crud-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">Editar Herramienta</h3>
            <form onSubmit={actualizarHerramienta}>
              <div className="crud-modal-form">
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">
                      Nombre de la Herramienta*
                    </label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        required
                        maxLength={30}
                        placeholder="Ej: Martillo, Taladro, Llave inglesa..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.nombre.length > 25
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.nombre.length >= 30
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.nombre.length}/30
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Marca</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.marca}
                        onChange={(e) =>
                          setFormData({ ...formData, marca: e.target.value })
                        }
                        maxLength={15}
                        placeholder="Ej: Stanley, Dewalt..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.marca.length > 12
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.marca.length >= 15
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.marca.length}/15
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Modelo</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.modelo}
                        onChange={(e) =>
                          setFormData({ ...formData, modelo: e.target.value })
                        }
                        maxLength={15}
                        placeholder="Ej: ST-16, DCD771C2..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.modelo.length > 12
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.modelo.length >= 15
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.modelo.length}/15
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Stock Mínimo</label>
                    <input
                      type="number"
                      className="crud-input"
                      value={formData.cantidadMinima}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadMinima: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="any"
                      max="99999999.99"
                    />
                  </div>
                </div>
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Descripción</label>
                    <div className="crud-input-with-counter">
                      <textarea
                        className="crud-textarea"
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        maxLength={40}
                        placeholder="Descripcion breve..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.descripcion.length > 35
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.descripcion.length >= 40
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.descripcion.length}/40
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Medida/Tamaño</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.medida}
                        onChange={(e) =>
                          setFormData({ ...formData, medida: e.target.value })
                        }
                        maxLength={20}
                        placeholder="Ej: 16 oz, 18V, 10mm..."
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.medida.length > 17
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.medida.length >= 20
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.medida.length}/20
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Desgaste</label>
                    <select
                      className="crud-select"
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({ ...formData, estado: e.target.value })
                      }
                    >
                      {herramientasApi.getEstadosValidos().map((estado) => (
                        <option key={estado.valor} value={estado.valor}>
                          {estado.texto}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Stock Actual</label>
                    <div
                      className="crud-input"
                      style={{
                        backgroundColor: "#1a2d3d",
                        color: "#ffffff",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                      }}
                    >
                      {herramientaSeleccionada?.cantidadActual} unidades
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        margin: "4px 0 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      💡 Para modificar el stock usa los botones de
                      Ingreso/Salida
                    </p>
                  </div>
                </div>
                <div className="crud-info-box crud-modal-full-width">
                  <p
                    style={{ margin: "0", fontSize: "14px", color: "#ffffff" }}
                  >
                    <strong>Herramienta seleccionada:</strong>{" "}
                    {herramientaSeleccionada?.nombre}
                  </p>
                </div>
              </div>
              <div className="crud-modal-actions">
                <button
                  type="button"
                  className="crud-btn crud-btn-light"
                  onClick={cerrarModalEditar}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="crud-btn crud-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar Herramienta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalStock && (
        <div className="crud-modal-overlay" onClick={cerrarModalStock}>
          <div
            className="crud-modal-content"
            style={{ maxWidth: "450px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">
              {tipoMovimiento === "ingreso"
                ? "Ingreso de Stock"
                : "Salida de Stock"}
            </h3>
            <div className="crud-form-group">
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                {herramientaSeleccionada?.nombre}
              </p>
              <p
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                }}
              >
                Stock actual:{" "}
                <strong>{herramientaSeleccionada?.cantidadActual}</strong>{" "}
                unidades
              </p>
            </div>
            <form onSubmit={procesarMovimientoStock}>
              <div className="crud-form-group">
                <label className="crud-label">
                  Cantidad a{" "}
                  {tipoMovimiento === "ingreso" ? "ingresar" : "sacar"} *
                </label>
                <input
                  type="number"
                  className="crud-input"
                  value={movimientoData.cantidad}
                  onChange={(e) =>
                    setMovimientoData({
                      ...movimientoData,
                      cantidad: e.target.value,
                    })
                  }
                  min="0"
                  step="any"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="crud-form-group">
                <label className="crud-label">Motivo (opcional)</label>
                <input
                  type="text"
                  className="crud-input"
                  value={movimientoData.motivo}
                  onChange={(e) =>
                    setMovimientoData({
                      ...movimientoData,
                      motivo: e.target.value,
                    })
                  }
                  maxLength={40}
                  placeholder={
                    tipoMovimiento === "ingreso"
                      ? "ej: Compra, Devolución"
                      : "ej: Proyecto ABC, Venta"
                  }
                />
              </div>
              {tipoMovimiento === "salida" &&
                parseFloat(movimientoData.cantidad) >
                  herramientaSeleccionada?.cantidadActual && (
                  <div className="crud-warning-message">
                    <span>⚠️</span>
                    <span>
                      No hay suficiente stock. Disponible:{" "}
                      {herramientaSeleccionada?.cantidadActual}
                    </span>
                  </div>
                )}
              <div className="crud-modal-actions">
                <button
                  type="button"
                  className="crud-btn crud-btn-light"
                  onClick={cerrarModalStock}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="crud-btn crud-btn-primary"
                  style={{
                    backgroundColor:
                      tipoMovimiento === "ingreso" ? "#48bb78" : "#ed8936",
                  }}
                  disabled={
                    loading ||
                    !movimientoData.cantidad ||
                    parseFloat(movimientoData.cantidad) <= 0 ||
                    (tipoMovimiento === "salida" &&
                      parseFloat(movimientoData.cantidad) >
                        herramientaSeleccionada?.cantidadActual)
                  }
                >
                  {loading ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HerramientasCRUD;