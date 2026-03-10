import React, { useState, useEffect } from "react";
import {
  Package,
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
import materialesApi from "../services/materialesApi";
import reportesService from "../services/reportesService";
import "./CRUDStyles2.css";

const MaterialesCRUD = () => {
  const [materiales, setMateriales] = useState([]);
  const [materialesFiltrados, setMaterialesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalMateriales: 0,
    stockCritico: 0,
    stockBajo: 0,
    stockNormal: 0,
  });
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({
    estadoStock: "todos",
    fechaIngreso: "",
    fechaActualizacion: "",
  });
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalStock, setMostrarModalStock] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState("ingreso");
  const [mostrarModalReportes, setMostrarModalReportes] = useState(false);
  const [configuracionReporte, setConfiguracionReporte] = useState({
    tipoReporte: "completo",
    nivelStockSeleccionado: "todos",
    incluirFechas: true,
    incluirDetalles: true,
  });
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    medida: "",
    cantidadActual: 0,
    cantidadMinima: 0,
  });
  const [movimientoData, setMovimientoData] = useState({
    cantidad: "",
    motivo: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    try {
      const tieneFiltroApi =
        typeof materialesApi?.buscarMateriales === "function";
      let filtrados = tieneFiltroApi
        ? materialesApi.buscarMateriales(materiales, busqueda)
        : materiales.filter(
            (material) =>
              material.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
              material.descripcion
                ?.toLowerCase()
                .includes(busqueda.toLowerCase()) ||
              material.medida?.toLowerCase().includes(busqueda.toLowerCase())
          );
      if (filtros.estadoStock !== "todos") {
        filtrados = filtrados.filter((material) => {
          const estado = determinarEstadoStock(
            material.cantidadActual,
            material.cantidadMinima
          );
          return estado === filtros.estadoStock;
        });
      }
      if (filtros.fechaIngreso) {
        const fechaFiltro = new Date(filtros.fechaIngreso + "T00:00:00");
        filtrados = filtrados.filter((material) => {
          if (!material.fechaIngreso) return false;
          return new Date(material.fechaIngreso) >= fechaFiltro;
        });
      }
      if (filtros.fechaActualizacion) {
        const fechaFiltro = new Date(filtros.fechaActualizacion + "T00:00:00");
        filtrados = filtrados.filter((material) => {
          if (!material.fechaActualizacion) return false;
          return new Date(material.fechaActualizacion) >= fechaFiltro;
        });
      }
      setMaterialesFiltrados(filtrados || []);
    } catch (error) {
      console.error("Error al filtrar materiales:", error);
      setMaterialesFiltrados(materiales);
    }
  }, [materiales, busqueda, filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [materialesResponse, statsResponse] = await Promise.all([
        materialesApi.obtenerMateriales(),
        materialesApi.obtenerEstadisticas(),
      ]);
      if (materialesResponse.success) {
        setMateriales(materialesResponse.data);
        setMaterialesFiltrados(materialesResponse.data);
      }
      if (statsResponse.success) {
        setEstadisticas(statsResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los materiales");
    } finally {
      setLoading(false);
    }
  };

  const recargarDatos = async () => {
    try {
      toast.info("Recargando datos...");
      setFiltros({
        estadoStock: "todos",
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
  const crearMaterial = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await materialesApi.crearMaterial(formData);
      if (response.success) {
        toast.success("Material creado exitosamente");
        await cargarDatos();
        cerrarModalCrear();
      }
    } catch (error) {
      toast.error(error.message || "Error al crear el material");
    } finally {
      setLoading(false);
    }
  };
  const actualizarMaterial = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await materialesApi.actualizarMaterial(
        materialSeleccionado.id,
        formData
      );
      if (response.success) {
        toast.success("Material actualizado exitosamente");
        await cargarDatos();
        cerrarModalEditar();
      }
    } catch (error) {
      toast.error(error.message || "Error al actualizar el material");
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
      const response =
        tipoMovimiento === "ingreso"
          ? await materialesApi.ingresoStock(
              materialSeleccionado.id,
              cantidad,
              motivo
            )
          : await materialesApi.salidaStock(
              materialSeleccionado.id,
              cantidad,
              motivo
            );
      if (response.success) {
        toast.success(
          `${
            tipoMovimiento === "ingreso" ? "Ingreso" : "Salida"
          } registrado exitosamente`
        );
        await cargarDatos();
        cerrarModalStock();
      }
    } catch (error) {
      toast.error(error.message || "Error al procesar el movimiento");
    } finally {
      setLoading(false);
    }
  };
  const eliminarMaterial = async (material) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${material.nombre}"?`))
      return;
    try {
      setLoading(true);
      const response = await materialesApi.eliminarMaterial(material.id);
      if (response.success) {
        toast.success("Material eliminado exitosamente");
        await cargarDatos();
      }
    } catch (error) {
      toast.error(error.message || "Error al eliminar el material");
    } finally {
      setLoading(false);
    }
  };
  const generarReportePersonalizado = async () => {
    try {
      if (
        configuracionReporte.tipoReporte === "por-stock" &&
        configuracionReporte.nivelStockSeleccionado === "todos"
      ) {
        toast.warning("Selecciona un nivel de stock específico");
        return;
      }
      setLoading(true);
      let materialesFiltrados = [...materiales];
      if (configuracionReporte.nivelStockSeleccionado !== "todos") {
        materialesFiltrados = materialesFiltrados.filter((m) => {
          const estadoStock = materialesApi.getEstadoStock(
            m.cantidadActual,
            m.cantidadMinima
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
      if (materialesFiltrados.length === 0) {
        toast.warning("No hay materiales que coincidan con los filtros");
        return;
      }
      toast.info(
        `Generando reporte (${materialesFiltrados.length} materiales)...`,
        { autoClose: 2000 }
      );
      await reportesService.generarReporteCompletoMateriales(
        materialesFiltrados,
        estadisticas,
        configuracionReporte
      );
      toast.success("Reporte descargado exitosamente");
      cerrarModalReportes();
    } catch (error) {
      console.error("Error al generar reporte:", error);
      toast.error(error.message || "Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const manejarCambioFiltro = (tipoFiltro, valor) => {
    setFiltros((prev) => ({ ...prev, [tipoFiltro]: valor }));
  };
  const resetearFiltros = () => {
    setFiltros({
      estadoStock: "todos",
      fechaIngreso: "",
      fechaActualizacion: "",
    });
  };
  const determinarEstadoStock = (cantidadActual, cantidadMinima) => {
    const actual = Number(cantidadActual ?? 0);
  const minimo = Number(cantidadMinima ?? 0);

  if (isNaN(actual) || isNaN(minimo)) return "normal";

  if (actual < minimo) return "critico";
  if (actual <= minimo * 2) return "bajo";
  return "normal";
    // if (cantidadActual < cantidadMinima) return "critico";
    // if (cantidadActual <= cantidadMinima * 2) return "bajo";
    // return "normal";
  };
  // Colores de badge adaptados al tema oscuro de MOLTEC.
  // Sobreescribe los colores inline que devuelve materialesApi.getEstadoStock()
  // ya que los estilos inline tienen mayor prioridad que cualquier clase CSS.
  const getBadgeEstiloOscuro = (texto) => {
    const t = (texto || "").toLowerCase();
    if (t.includes("crítico") || t.includes("critico"))
      return { backgroundColor: "#c53030", color: "#ffffff" }; // rojo sólido
    if (t.includes("bajo"))
      return { backgroundColor: "#c05621", color: "#ffffff" }; // naranja sólido
    if (t.includes("normal"))
      return { backgroundColor: "#276749", color: "#ffffff" }; // verde sólido
    return { backgroundColor: "#553c9a", color: "#ffffff" };   // fallback morado
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
    } catch {
      return "Fecha inválida";
    }
  };
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    try {
      return new Date(fecha).toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };
  const abrirModalCrear = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      medida: "",
      cantidadActual: 1,
      cantidadMinima: 0,
    });
    setMostrarModalCrear(true);
  };
  const cerrarModalCrear = () => {
    setMostrarModalCrear(false);
    setFormData({
      nombre: "",
      descripcion: "",
      medida: "",
      cantidadActual: 1,
      cantidadMinima: 0,
    });
  };
  const abrirModalEditar = (material) => {
    setMaterialSeleccionado(material);
    setFormData({
      nombre: material.nombre,
      descripcion: material.descripcion || "",
      medida: material.medida,
      cantidadActual: material.cantidadActual,
      cantidadMinima: Number(material.cantidadMinima),
    });
    setMostrarModalEditar(true);
  };
  const cerrarModalEditar = () => {
    setMostrarModalEditar(false);
    setMaterialSeleccionado(null);
  };
  const abrirModalStock = (material, tipo) => {
    setMaterialSeleccionado(material);
    setTipoMovimiento(tipo);
    setMovimientoData({ cantidad: "", motivo: "" });
    setMostrarModalStock(true);
  };
  const cerrarModalStock = () => {
    setMostrarModalStock(false);
    setMaterialSeleccionado(null);
    setMovimientoData({ cantidad: "", motivo: "" });
  };
  const abrirModalReportes = () => {
    setConfiguracionReporte({
      tipoReporte: "completo",
      nivelStockSeleccionado: "todos",
      incluirFechas: true,
      incluirDetalles: true,
    });
    setMostrarModalReportes(true);
  };
  const cerrarModalReportes = () => {
    setMostrarModalReportes(false);
  };

  if (loading && materiales.length === 0) {
    return (
      <div className="crud-loading-container">
        <div className="crud-spinner"></div>
        <h2>Cargando materiales...</h2>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-title-section">
          <h1 className="crud-title">
            <Package size={32} />
            Inventario de Materiales
          </h1>
          <p className="crud-subtitle">
            Gestión completa del inventario de materiales de construcción
          </p>
        </div>
        <div className="crud-header-actions">
          <button
            className="crud-btn crud-btn-info"
            onClick={abrirModalReportes}
            disabled={loading || materiales.length === 0}
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
            Nuevo Material
          </button>
        </div>
      </div>

      <div className="crud-stats-container">
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Total Materiales</h3>
          <p className="crud-stat-number">
            {estadisticas.totalMateriales || materiales.length}
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
      </div>

      <div className="crud-search-container">
        <div className="crud-search-box">
          <Search size={20} color="#6c757d" />
          <input
            type="text"
            placeholder="Buscar materiales por nombre, descripción o medida..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="crud-search-input"
          />
        </div>
      </div>

      <div className="crud-filters-container">
        <div className="crud-filters-row">
          {/* Filtro 1: Estado del Stock */}
          <div className="crud-filter-group">
            <label className="crud-filter-label">Estado del Stock:</label>
            <select
              value={filtros.estadoStock}
              onChange={(e) =>
                manejarCambioFiltro("estadoStock", e.target.value)
              }
              className="crud-filter-input"
            >
              <option value="todos">📦 Todos los estados</option>
              <option value="critico">🔴 Stock Crítico</option>
              <option value="bajo">🟡 Stock Bajo</option>
              <option value="normal">🟢 Stock Normal</option>
            </select>
          </div>

          {/* Filtro 2: Fecha de Ingreso */}
          <div className="crud-filter-group">
            <label className="crud-filter-label">Ingresados desde:</label>
            <input
              type="date"
              value={filtros.fechaIngreso}
              onChange={(e) =>
                manejarCambioFiltro("fechaIngreso", e.target.value)
              }
              className="crud-filter-input"
            />
          </div>

          {/* Filtro 3: Fecha de Actualización */}
          <div className="crud-filter-group">
            <label className="crud-filter-label">Actualizados desde:</label>
            <input
              type="date"
              value={filtros.fechaActualizacion}
              onChange={(e) =>
                manejarCambioFiltro("fechaActualizacion", e.target.value)
              }
              className="crud-filter-input"
            />
          </div>

          {/* Filtro 4: Botón Resetear - Sin label para alinearse con los inputs */}
          <div className="crud-filter-group">
            <label className="crud-filter-label crud-filter-label-invisible">
              Acciones
            </label>
            <button
              onClick={resetearFiltros}
              className="crud-btn crud-btn-light crud-filter-reset-btn"
            >
              <RefreshCw size={16} />
              Resetear
            </button>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(filtros.estadoStock !== "todos" ||
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
              {filtros.fechaIngreso && (
                <span className="crud-filter-tag">
                  Desde: {formatearFechaLocal(filtros.fechaIngreso)}
                </span>
              )}
              {filtros.fechaActualizacion && (
                <span className="crud-filter-tag">
                  Actualizados:{" "}
                  {formatearFechaLocal(filtros.fechaActualizacion)}
                </span>
              )}
            </span>
            <span className="crud-results-count">
              ({materialesFiltrados.length} materiales encontrados)
            </span>
          </div>
        )}
      </div>

      <div className="crud-table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Descripción</th>
              <th>Medida</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
              <th>Fecha Ingreso</th>
              <th>Última Actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materialesFiltrados.length > 0 ? (
              materialesFiltrados.map((material) => {
                const estado = materialesApi.getEstadoStock(
                  material.cantidadActual,
                  material.cantidadMinima
                );
                return (
                  <tr key={material.id}>
                    <td>
                      <strong>{material.nombre}</strong>
                    </td>
                    <td>{material.descripcion || "Sin descripción"}</td>
                    <td>{material.medida}</td>
                    <td style={{ fontWeight: "bold" }}>
                      {material.cantidadActual}
                    </td>
                    <td>{material.cantidadMinima}</td>
                    <td>
                      <span
                        className="crud-badge"
                        style={getBadgeEstiloOscuro(estado.texto)}
                      >
                        {estado.icon} {estado.texto}
                      </span>
                    </td>
                    <td>{formatearFecha(material.fechaIngreso)}</td>
                    <td>{formatearFecha(material.fechaActualizacion)}</td>
                    <td>
                      <div className="crud-table-actions">
                        <button
                          className="crud-btn crud-btn-icon crud-btn-primary"
                          title="Ingreso de Stock"
                          onClick={() => abrirModalStock(material, "ingreso")}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-warning"
                          title="Salida de Stock"
                          onClick={() => abrirModalStock(material, "salida")}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-secondary"
                          title="Editar"
                          onClick={() => abrirModalEditar(material)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-danger"
                          title="Eliminar"
                          onClick={() => eliminarMaterial(material)}
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
                <td colSpan="9" className="crud-no-results">
                  {busqueda
                    ? `No se encontraron materiales que coincidan con "${busqueda}"`
                    : "No hay materiales registrados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModalCrear && (
        <div className="crud-modal-overlay" onClick={cerrarModalCrear}>
          <div
            className="crud-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">Crear Nuevo Material</h3>
            <form onSubmit={crearMaterial}>
              <div className="crud-modal-form">
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Nombre del Material *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          e.target.value.length <= 30 &&
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="crud-input"
                        required
                        maxLength={30}
                        placeholder="Arena, PVC..."
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
                    <label className="crud-label">Unidad de Medida *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        value={formData.medida}
                        onChange={(e) =>
                          e.target.value.length <= 30 &&
                          setFormData({ ...formData, medida: e.target.value })
                        }
                        className="crud-input"
                        required
                        maxLength={30}
                        placeholder="ej: Sacos, m³, Unidades"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.medida.length > 25
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.medida.length >= 30
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.medida.length}/30
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Cantidad Inicial</label>
                    <input
                      type="number"
                      value={formData.cantidadActual}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadActual: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="crud-input"
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
                        value={formData.descripcion}
                        onChange={(e) =>
                          e.target.value.length <= 50 &&
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        className="crud-textarea"
                        maxLength={50}
                        placeholder="Descripción del material"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.descripcion.length > 40
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.descripcion.length >= 50
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.descripcion.length}/50
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Stock Mínimo</label>
                    <input
                      type="number"
                      value={formData.cantidadMinima}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadMinima: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="crud-input"
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
                  onClick={cerrarModalCrear}
                  className="crud-btn crud-btn-light"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="crud-btn crud-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Material"}
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
            <h3 className="crud-modal-title">Editar Material</h3>
            <form onSubmit={actualizarMaterial}>
              <div className="crud-modal-form">
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Nombre del Material *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          e.target.value.length <= 30 &&
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="crud-input"
                        required
                        maxLength={30}
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
                    <label className="crud-label">Unidad de Medida *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        value={formData.medida}
                        onChange={(e) =>
                          e.target.value.length <= 30 &&
                          setFormData({ ...formData, medida: e.target.value })
                        }
                        className="crud-input"
                        required
                        maxLength={30}
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.medida.length > 25
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.medida.length >= 30
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.medida.length}/30
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Stock Mínimo</label>
                    <input
                      type="number"
                      value={formData.cantidadMinima}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadMinima: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="crud-input"
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
                        value={formData.descripcion}
                        onChange={(e) =>
                          e.target.value.length <= 50 &&
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        className="crud-textarea"
                        maxLength={50}
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.descripcion.length > 40
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.descripcion.length >= 50
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.descripcion.length}/50
                      </span>
                    </div>
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
                      {materialSeleccionado?.cantidadActual}{" "}
                      {materialSeleccionado?.medida}
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#ece9e9",
                        margin: "4px 0 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      💡 Para modificar el stock usa los botones de
                      Ingreso/Salida
                    </p>
                  </div>
                </div>
                <div className="crud-modal-full-width">
                  <div className="crud-info-box">
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#ffffff",
                      }}
                    >
                      <strong>Material seleccionado:</strong>{" "}
                      {materialSeleccionado?.nombre}
                    </p>
                  </div>
                </div>
              </div>
              <div className="crud-modal-actions">
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  className="crud-btn crud-btn-light"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="crud-btn crud-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar Material"}
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
                {materialSeleccionado?.nombre}
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
                <strong>
                  {materialSeleccionado?.cantidadActual}{" "}
                  {materialSeleccionado?.medida}
                </strong>
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
                  value={movimientoData.cantidad}
                  onChange={(e) =>
                    setMovimientoData({
                      ...movimientoData,
                      cantidad: e.target.value,
                    })
                  }
                  className="crud-input"
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
                  value={movimientoData.motivo}
                  onChange={(e) =>
                    setMovimientoData({
                      ...movimientoData,
                      motivo: e.target.value,
                    })
                  }
                  className="crud-input"
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
                  materialSeleccionado?.cantidadActual && (
                  <div className="crud-warning-message">
                    <span>⚠️</span>
                    <span>
                      No hay suficiente stock. Disponible:{" "}
                      {materialSeleccionado?.cantidadActual}
                    </span>
                  </div>
                )}
              <div className="crud-modal-actions">
                <button
                  type="button"
                  onClick={cerrarModalStock}
                  className="crud-btn crud-btn-light"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`crud-btn ${
                    tipoMovimiento === "ingreso"
                      ? "crud-btn-primary"
                      : "crud-btn-warning"
                  }`}
                  disabled={
                    loading ||
                    !movimientoData.cantidad ||
                    parseFloat(movimientoData.cantidad) <= 0 ||
                    (tipoMovimiento === "salida" &&
                      parseFloat(movimientoData.cantidad) >
                        materialSeleccionado?.cantidadActual)
                  }
                >
                  {loading ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalReportes && (
        <div className="crud-modal-overlay" onClick={cerrarModalReportes}>
          <div
            className="crud-modal-content"
            style={{ maxWidth: "700px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">Generar Reporte de Materiales</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generarReportePersonalizado();
              }}
            >
              <div className="crud-report-config">
                <div className="crud-form-group">
                  <label className="crud-label">Tipo de Reporte</label>
                  <select
                    value={configuracionReporte.tipoReporte}
                    onChange={(e) => {
                      setConfiguracionReporte({
                        ...configuracionReporte,
                        tipoReporte: e.target.value,
                        nivelStockSeleccionado:
                          e.target.value === "por-stock" ? "critico" : "todos",
                      });
                    }}
                    className="crud-select"
                  >
                    <option value="completo">📊 Reporte Completo</option>
                    <option value="por-stock">📦 Por Nivel de Stock</option>
                  </select>
                </div>
                {configuracionReporte.tipoReporte === "por-stock" && (
                  <div className="crud-form-group">
                    <label className="crud-label">Nivel de Stock</label>
                    <select
                      value={configuracionReporte.nivelStockSeleccionado}
                      onChange={(e) =>
                        setConfiguracionReporte({
                          ...configuracionReporte,
                          nivelStockSeleccionado: e.target.value,
                        })
                      }
                      className="crud-select"
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
                        checked={configuracionReporte.incluirFechas}
                        onChange={(e) =>
                          setConfiguracionReporte({
                            ...configuracionReporte,
                            incluirFechas: e.target.checked,
                          })
                        }
                        className="crud-checkbox"
                      />
                      Incluir fechas de ingreso y actualización
                    </label>
                    <label className="crud-checkbox-label">
                      <input
                        type="checkbox"
                        checked={configuracionReporte.incluirDetalles}
                        onChange={(e) =>
                          setConfiguracionReporte({
                            ...configuracionReporte,
                            incluirDetalles: e.target.checked,
                          })
                        }
                        className="crud-checkbox"
                      />
                      Incluir descripción completa
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
                            return "Reporte completo de inventario";
                          case "por-stock":
                            return `Filtrado por stock: ${configuracionReporte.nivelStockSeleccionado}`;
                          default:
                            return "Sin definir";
                        }
                      })()}
                    </p>
                    <p style={{ margin: "8px 0" }}>
                      <strong>Materiales estimados:</strong>{" "}
                      {(() => {
                        let filtrados = materiales;
                        if (
                          configuracionReporte.nivelStockSeleccionado !==
                          "todos"
                        ) {
                          filtrados = filtrados.filter((m) => {
                            const estadoStock = materialesApi.getEstadoStock(
                              m.cantidadActual,
                              m.cantidadMinima
                            );
                            switch (
                              configuracionReporte.nivelStockSeleccionado
                            ) {
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
                        return filtrados.length;
                      })()}{" "}
                      materiales
                    </p>
                  </div>
                </div>
              </div>
              <div className="crud-modal-actions">
                <button
                  type="button"
                  onClick={cerrarModalReportes}
                  className="crud-btn crud-btn-light"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="crud-btn crud-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Generando..." : "Generar Reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialesCRUD;