// pages/EmpleadosCRUD.jsx - CRUD de empleados con CSS externo
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Phone,
  UserCheck,
  UserX,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import empleadosApi from "../services/empleadosApi";
import reportesService from "../services/reportesService";
import "./CRUDStyles.css";

const EmpleadosCRUD = () => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalEmpleados: 0,
    empleadosActivos: 0,
    empleadosInactivos: 0,
    puestosOcupados: 0,
  });
  const [mostrarModalReportes, setMostrarModalReportes] = useState(false);
  const [configuracionReporte, setConfiguracionReporte] = useState({
    tipoReporte: "general",
    puestoSeleccionado: "",
    estadoSeleccionado: "todos",
    incluirFechas: true,
    incluirContacto: true,
  });
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({
    estadoEmpleado: "todos",
    fechaContratacionDesde: "",
    fechaContratacionHasta: "",
  });
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [empleadoPerfil, setEmpleadoPerfil] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    identificacion: "",
    puestoId: "",
    fechaContratacion: "",
    fechaFinalizacion: "",
    telefono: "",
    telefono2: "",
    numeroEmergencia: "",
    status: "activo",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    try {
      const filtrados = empleadosApi.buscarEmpleados(empleados, busqueda);
      let empleadosFiltrados = filtrados;
      if (filtros.estadoEmpleado !== "todos") {
        empleadosFiltrados = empleadosFiltrados.filter(
          (empleado) => empleado.status === filtros.estadoEmpleado
        );
      }
      if (filtros.fechaContratacionDesde || filtros.fechaContratacionHasta) {
        empleadosFiltrados = empleadosFiltrados.filter((empleado) => {
          if (!empleado.fechaContratacion) return false;
          const fechaEmpleado = new Date(empleado.fechaContratacion);
          if (filtros.fechaContratacionDesde) {
            const fechaDesde = new Date(
              filtros.fechaContratacionDesde + "T00:00:00"
            );
            if (fechaEmpleado < fechaDesde) return false;
          }
          if (filtros.fechaContratacionHasta) {
            const fechaHasta = new Date(
              filtros.fechaContratacionHasta + "T23:59:59"
            );
            if (fechaEmpleado > fechaHasta) return false;
          }
          return true;
        });
      }
      setEmpleadosFiltrados(empleadosFiltrados);
    } catch (error) {
      console.error("Error al filtrar empleados:", error);
      setEmpleadosFiltrados(empleados);
    }
  }, [empleados, busqueda, filtros]);

  useEffect(() => {
    if (formData.fechaFinalizacion) {
      const fechaFin = new Date(formData.fechaFinalizacion);
      const hoy = new Date();
      if (fechaFin < hoy) {
        setFormData((prev) => ({ ...prev, status: "inactivo" }));
      }
    }
    if (formData.status === "inactivo" && !formData.fechaFinalizacion) {
      setFormData((prev) => ({ ...prev, status: "activo" }));
    }
  }, [formData.fechaFinalizacion, formData.status]);

  const manejarCambioFiltro = (tipoFiltro, valor) => {
    setFiltros((prev) => ({ ...prev, [tipoFiltro]: valor }));
  };
  const resetearFiltros = () => {
    setFiltros({
      estadoEmpleado: "todos",
      fechaContratacionDesde: "",
      fechaContratacionHasta: "",
    });
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
  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return "";
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toISOString().split("T")[0];
    } catch (error) {
      return "";
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [empleadosResponse, puestosResponse, statsResponse] =
        await Promise.all([
          empleadosApi.obtenerEmpleados(),
          empleadosApi.obtenerPuestos(),
          empleadosApi.obtenerEstadisticas(),
        ]);
      if (empleadosResponse.success) {
        setEmpleados(empleadosResponse.data);
        setEmpleadosFiltrados(empleadosResponse.data);
      }
      if (puestosResponse.success) {
        setPuestos(puestosResponse.data);
      }
      if (statsResponse.success) {
        setEstadisticas(statsResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los empleados");
    } finally {
      setLoading(false);
    }
  };

  const recargarDatos = async () => {
    try {
      toast.info("Recargando datos...");
      setFiltros({
        estadoEmpleado: "todos",
        fechaContratacionDesde: "",
        fechaContratacionHasta: "",
      });
      setBusqueda("");
      await cargarDatos();
      toast.success("Datos actualizados");
    } catch (error) {
      console.error("Error al recargar datos:", error);
      toast.error("Error al actualizar los datos");
    }
  };

  const filtrarEmpleados = (empleadosBase, configuracion) => {
    let empleadosFiltrados = [...empleadosBase];
    if (configuracion.estadoSeleccionado !== "todos") {
      const estadoBuscado =
        configuracion.estadoSeleccionado === "activos" ? "activo" : "inactivo";
      empleadosFiltrados = empleadosFiltrados.filter(
        (emp) => emp.status === estadoBuscado
      );
    }
    if (
      configuracion.tipoReporte === "por-puesto" &&
      configuracion.puestoSeleccionado
    ) {
      empleadosFiltrados = empleadosFiltrados.filter((emp) => {
        const empPuestoId = String(emp.puestoId);
        const puestoSeleccionado = String(configuracion.puestoSeleccionado);
        return empPuestoId === puestoSeleccionado;
      });
    }
    return empleadosFiltrados;
  };

  const crearEmpleado = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const errores = empleadosApi.validarEmpleado(formData);
      if (errores.length > 0) {
        toast.error(errores[0]);
        return;
      }
      const response = await empleadosApi.crearEmpleado(formData);
      if (response.success) {
        toast.success("Empleado creado exitosamente");
        await cargarDatos();
        cerrarModalCrear();
      }
    } catch (error) {
      toast.error(error.message || "Error al crear el empleado");
    } finally {
      setLoading(false);
    }
  };

  const actualizarEmpleado = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const errores = empleadosApi.validarEmpleado(formData);
      if (errores.length > 0) {
        toast.error(errores[0]);
        return;
      }
      const response = await empleadosApi.actualizarEmpleado(
        empleadoSeleccionado.id,
        formData
      );
      if (response.success) {
        toast.success("Empleado actualizado exitosamente");
        await cargarDatos();
        cerrarModalEditar();
      }
    } catch (error) {
      toast.error(error.message || "Error al actualizar el empleado");
    } finally {
      setLoading(false);
    }
  };

  const eliminarEmpleado = async (empleado) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a "${empleado.nombre} ${empleado.apellido}"?`
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const response = await empleadosApi.eliminarEmpleado(empleado.id);
      if (response.success) {
        toast.success("Empleado eliminado exitosamente");
        await cargarDatos();
      }
    } catch (error) {
      toast.error(error.message || "Error al eliminar el empleado");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalReportes = () => {
    setConfiguracionReporte({
      tipoReporte: "general",
      puestoSeleccionado: "",
      estadoSeleccionado: "todos",
      incluirFechas: true,
      incluirContacto: true,
    });
    setMostrarModalReportes(true);
  };
  const cerrarModalReportes = () => {
    setMostrarModalReportes(false);
  };
  const generarReporte = async () => {
    try {
      setLoading(true);
      const empleadosFiltrados = filtrarEmpleados(
        empleados,
        configuracionReporte
      );
      if (empleadosFiltrados.length === 0) {
        toast.warning(
          "No hay empleados que coincidan con los filtros seleccionados"
        );
        return;
      }
      await reportesService.generarReporteEmpleados(
        empleadosFiltrados,
        configuracionReporte,
        puestos
      );
      toast.success("Reporte generado exitosamente");
      cerrarModalReportes();
    } catch (error) {
      console.error("Error al generar reporte:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setFormData({
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      identificacion: "",
      puestoId: "",
      fechaContratacion: "",
      fechaFinalizacion: "",
      telefono: "",
      telefono2: "",
      numeroEmergencia: "",
      status: "activo",
    });
    setMostrarModalCrear(true);
  };
  const cerrarModalCrear = () => {
    setMostrarModalCrear(false);
    setFormData({
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      identificacion: "",
      puestoId: "",
      fechaContratacion: "",
      fechaFinalizacion: "",
      telefono: "",
      telefono2: "",
      numeroEmergencia: "",
      status: "activo",
    });
  };
  const abrirModalEditar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormData({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      fechaNacimiento: empleado.fechaNacimiento || "",
      identificacion: empleado.identificacion || "",
      puestoId: empleado.puestoId,
      fechaContratacion: empleado.fechaContratacion || "",
      fechaFinalizacion: empleado.fechaFinalizacion || "",
      telefono: empleado.telefono || "",
      telefono2: empleado.telefono2 || "",
      numeroEmergencia: empleado.numeroEmergencia || "",
      status: empleado.status,
    });
    setMostrarModalEditar(true);
  };
  const cerrarModalEditar = () => {
    setMostrarModalEditar(false);
    setEmpleadoSeleccionado(null);
  };
  const abrirModalPerfil = (empleado) => {
    setEmpleadoPerfil(empleado);
    setMostrarModalPerfil(true);
  };
  const cerrarModalPerfil = () => {
    setMostrarModalPerfil(false);
    setEmpleadoPerfil(null);
  };

  if (loading && empleados.length === 0) {
    return (
      <div className="crud-loading-container">
        <div className="crud-spinner"></div>
        <h2>Cargando empleados...</h2>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-title-section">
          <h1 className="crud-title">
            <Users size={32} />
            Gestión de Empleados
          </h1>
          <p className="crud-subtitle">
            Administración completa del personal de la empresa
          </p>
        </div>
        <div className="crud-header-actions">
          <button
            className="crud-btn crud-btn-info"
            onClick={abrirModalReportes}
            disabled={loading || empleados.length === 0}
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
            Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="crud-stats-container">
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Total Empleados</h3>
          <p className="crud-stat-number">
            {estadisticas.totalEmpleados || empleados.length}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Activos</h3>
          <p className="crud-stat-number" style={{ color: "#38a169" }}>
            {estadisticas.empleadosActivos || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Inactivos</h3>
          <p className="crud-stat-number" style={{ color: "#e53e3e" }}>
            {estadisticas.empleadosInactivos || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Puestos Ocupados</h3>
          <p className="crud-stat-number" style={{ color: "#4299e1" }}>
            {estadisticas.puestosOcupados || 0}
          </p>
        </div>
      </div>

      <div className="crud-search-container">
        <div className="crud-search-box">
          <Search size={20} color="#6c757d" />
          <input
            type="text"
            className="crud-search-input"
            placeholder="Buscar empleados por nombre, apellido, identificación o puesto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="crud-filters-container">
        <div className="crud-filters-row">
          <div className="crud-filter-group">
            <label className="crud-filter-label">Estado del Empleado:</label>
            <select
              className="crud-filter-input"
              value={filtros.estadoEmpleado}
              onChange={(e) =>
                manejarCambioFiltro("estadoEmpleado", e.target.value)
              }
            >
              <option value="todos">👥 Todos los estados</option>
              <option value="activo">🟢 Empleados activos</option>
              <option value="inactivo">🔴 Empleados inactivos</option>
            </select>
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label">Contratados desde:</label>
            <input
              type="date"
              className="crud-filter-input"
              value={filtros.fechaContratacionDesde}
              onChange={(e) =>
                manejarCambioFiltro("fechaContratacionDesde", e.target.value)
              }
            />
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label">Contratados hasta:</label>
            <input
              type="date"
              className="crud-filter-input"
              value={filtros.fechaContratacionHasta}
              onChange={(e) =>
                manejarCambioFiltro("fechaContratacionHasta", e.target.value)
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
        {(filtros.estadoEmpleado !== "todos" ||
          filtros.fechaContratacionDesde ||
          filtros.fechaContratacionHasta) && (
          <div className="crud-active-filters">
            <span className="crud-active-filters-text">
              Filtros activos:
              {filtros.estadoEmpleado !== "todos" && (
                <span className="crud-filter-tag">
                  Estado: {filtros.estadoEmpleado}
                </span>
              )}
              {filtros.fechaContratacionDesde && (
                <span className="crud-filter-tag">
                  Desde: {formatearFechaLocal(filtros.fechaContratacionDesde)}
                </span>
              )}
              {filtros.fechaContratacionHasta && (
                <span className="crud-filter-tag">
                  Hasta: {formatearFechaLocal(filtros.fechaContratacionHasta)}
                </span>
              )}
            </span>
            <span className="crud-results-count">
              ({empleadosFiltrados.length} empleados encontrados)
            </span>
          </div>
        )}
      </div>

      <div className="crud-table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th className="crud-th">Empleado</th>
              <th className="crud-th">Identificación</th>
              <th className="crud-th">Puesto</th>
              <th className="crud-th">Teléfono</th>
              <th className="crud-th">Fecha Contratación</th>
              <th className="crud-th">Antigüedad</th>
              <th className="crud-th">Estado</th>
              <th className="crud-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosFiltrados.length > 0 ? (
              empleadosFiltrados.map((empleado) => {
                const estado = empleadosApi.getEstadoEmpleado(empleado.status);
                return (
                  <tr key={empleado.id} className="crud-table-row">
                    <td className="crud-td">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <strong
                          style={{
                            cursor: "pointer",
                            color: "#2d3748",
                            textDecoration: "none",
                            transition: "color 0.2s",
                          }}
                          onClick={() => abrirModalPerfil(empleado)}
                          onMouseEnter={(e) =>
                            (e.target.style.color = "#4299e1")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = "#2d3748")
                          }
                          title="Ver perfil completo"
                        >
                          {empleado.nombre} {empleado.apellido}
                        </strong>
                        {empleado.fechaNacimiento && (
                          <small style={{ color: "#718096", fontSize: "12px" }}>
                            Nac:{" "}
                            {empleadosApi.formatearFecha(
                              empleado.fechaNacimiento
                            )}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="crud-td">
                      {empleado.identificacion || (
                        <span
                          style={{
                            color: "#a0aec0",
                            fontStyle: "italic",
                            fontSize: "13px",
                          }}
                        >
                          Sin identificación
                        </span>
                      )}
                    </td>
                    <td className="crud-td">
                      <span
                        style={{
                          backgroundColor: "#e6f3ff",
                          color: "#3182ce",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                        }}
                      >
                        {empleado.puestoNombre}
                      </span>
                    </td>
                    <td className="crud-td">
                      {empleado.telefono ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                          }}
                        >
                          <Phone size={14} color="#4299e1" />
                          {empleadosApi.formatearTelefono(empleado.telefono)}
                        </div>
                      ) : (
                        <span
                          style={{
                            color: "#a0aec0",
                            fontStyle: "italic",
                            fontSize: "13px",
                          }}
                        >
                          Sin teléfono
                        </span>
                      )}
                    </td>
                    <td className="crud-td">
                      {empleado.fechaContratacion ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                          }}
                        >
                          <Calendar size={14} color="#9f7aea" />
                          {empleadosApi.formatearFecha(
                            empleado.fechaContratacion
                          )}
                        </div>
                      ) : (
                        <span
                          style={{
                            color: "#a0aec0",
                            fontStyle: "italic",
                            fontSize: "13px",
                          }}
                        >
                          Sin fecha
                        </span>
                      )}
                    </td>
                    <td className="crud-td">
                      <span
                        style={{
                          backgroundColor: "#f0fff4",
                          color: "#2d5016",
                          padding: "2px 6px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {empleadosApi.calcularAntiguedad(
                          empleado.fechaContratacion,
                          empleado.fechaFinalizacion
                        )}
                      </span>
                    </td>
                    <td className="crud-td">
                      <span
                        className="crud-badge"
                        style={{
                          color: estado.color,
                          backgroundColor: estado.bg,
                        }}
                      >
                        {estado.icon} {estado.texto}
                      </span>
                    </td>
                    <td className="crud-td">
                      <div className="crud-table-actions">
                        <button
                          className="crud-btn crud-btn-icon crud-btn-secondary"
                          title="Editar"
                          onClick={() => abrirModalEditar(empleado)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="crud-btn crud-btn-icon crud-btn-danger"
                          title="Eliminar"
                          onClick={() => eliminarEmpleado(empleado)}
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
                <td colSpan="8" className="crud-no-results">
                  {busqueda
                    ? `No se encontraron empleados que coincidan con "${busqueda}"`
                    : "No hay empleados registrados"}
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
            <h3 className="crud-modal-title">Generar Reporte de Empleados</h3>
            <div className="crud-report-config">
              <div className="crud-form-group">
                <label className="crud-label">Tipo de Reporte</label>
                <select
                  className="crud-select"
                  value={configuracionReporte.tipoReporte}
                  onChange={(e) =>
                    setConfiguracionReporte({
                      ...configuracionReporte,
                      tipoReporte: e.target.value,
                      puestoSeleccionado: "",
                    })
                  }
                >
                  <option value="general">📋 Reporte General</option>
                  <option value="por-puesto">👥 Reporte por Puesto</option>
                  <option value="por-estado">📊 Reporte por Estado</option>
                </select>
              </div>
              {configuracionReporte.tipoReporte === "por-puesto" && (
                <div className="crud-form-group">
                  <label className="crud-label">Seleccionar Puesto</label>
                  <select
                    className="crud-select"
                    value={configuracionReporte.puestoSeleccionado}
                    onChange={(e) =>
                      setConfiguracionReporte({
                        ...configuracionReporte,
                        puestoSeleccionado: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccionar puesto...</option>
                    {puestos.map((puesto) => (
                      <option key={puesto.id} value={puesto.id}>
                        {puesto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="crud-form-group">
                <label className="crud-label">Estado de Empleados</label>
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
                  <option value="todos">👥 Todos los empleados</option>
                  <option value="activos">🟢 Solo empleados activos</option>
                  <option value="inactivos">🔴 Solo empleados inactivos</option>
                </select>
              </div>
              <div className="crud-form-group">
                <label className="crud-label">Incluir en el reporte:</label>
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
                    Fecha de contratación
                  </label>
                  <label className="crud-checkbox-label">
                    <input
                      type="checkbox"
                      className="crud-checkbox"
                      checked={configuracionReporte.incluirContacto}
                      onChange={(e) =>
                        setConfiguracionReporte({
                          ...configuracionReporte,
                          incluirContacto: e.target.checked,
                        })
                      }
                    />
                    Información de contacto
                  </label>
                </div>
              </div>
              <div className="crud-preview-section">
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#2d3748",
                  }}
                >
                  Vista Previa del Reporte
                </h4>
                <div className="crud-preview-content">
                  <p style={{ margin: "8px 0" }}>
                    <strong>Tipo:</strong>{" "}
                    {(() => {
                      switch (configuracionReporte.tipoReporte) {
                        case "general":
                          return "Reporte completo de todos los empleados";
                        case "por-puesto":
                          return "Reporte filtrado por puesto específico";
                        case "por-estado":
                          return "Reporte agrupado por estado (activos/inactivos)";
                        default:
                          return "Sin definir";
                      }
                    })()}
                  </p>
                  {configuracionReporte.tipoReporte === "por-puesto" &&
                    configuracionReporte.puestoSeleccionado && (
                      <p style={{ margin: "8px 0" }}>
                        <strong>Puesto seleccionado:</strong>{" "}
                        {puestos.find(
                          (p) =>
                            String(p.id) ===
                            String(configuracionReporte.puestoSeleccionado)
                        )?.nombre || "No encontrado"}
                      </p>
                    )}
                  <p style={{ margin: "8px 0" }}>
                    <strong>Empleados que se incluirán:</strong>{" "}
                    {filtrarEmpleados(empleados, configuracionReporte).length}
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
                onClick={generarReporte}
                disabled={
                  loading ||
                  (configuracionReporte.tipoReporte === "por-puesto" &&
                    !configuracionReporte.puestoSeleccionado)
                }
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
            <h3 className="crud-modal-title">Crear Nuevo Empleado</h3>
            <form onSubmit={crearEmpleado}>
              <div className="crud-modal-form">
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Nombre *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.nombre}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 20) {
                            setFormData({ ...formData, nombre: value });
                          }
                        }}
                        required
                        placeholder="Juan Carlos"
                        maxLength="20"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.nombre.length > 17
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.nombre.length >= 20
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.nombre.length}/20
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Apellido *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.apellido}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 20) {
                            setFormData({ ...formData, apellido: value });
                          }
                        }}
                        required
                        placeholder="Pérez López"
                        maxLength="20"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.apellido.length > 17
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.apellido.length >= 20
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.apellido.length}/20
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      className="crud-input"
                      value={formData.fechaNacimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaNacimiento: e.target.value,
                        })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Identificación</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.identificacion}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          // 1. Limpia cualquier caracter que no sea un dígito
                          const value = rawValue.replace(/\D/g, "");

                          // 2. Limita la longitud a 14 caracteres
                          if (value.length <= 14) {
                            setFormData({ ...formData, identificacion: value });
                          }
                        }}
                        placeholder="1234567890123"
                        maxLength="14"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.identificacion.length > 12
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.identificacion.length >= 14
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.identificacion.length}/14
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Puesto *</label>
                    <select
                      className="crud-select"
                      value={formData.puestoId}
                      onChange={(e) =>
                        setFormData({ ...formData, puestoId: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccionar puesto</option>
                      {puestos.map((puesto) => (
                        <option key={puesto.id} value={puesto.id}>
                          {puesto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Fecha de Contratación</label>
                    <input
                      type="date"
                      className="crud-input"
                      value={formData.fechaContratacion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaContratacion: e.target.value,
                        })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Teléfono Principal</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="tel"
                        className="crud-input"
                        value={formData.telefono}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 8) {
                            setFormData({ ...formData, telefono: value });
                          }
                        }}
                        placeholder="12345678"
                        maxLength="8"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.telefono.length > 6
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.telefono.length >= 8
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.telefono.length}/8
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Teléfono Secundario</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="tel"
                        className="crud-input"
                        value={formData.telefono2}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 8) {
                            setFormData({ ...formData, telefono2: value });
                          }
                        }}
                        placeholder="87654321"
                        maxLength="8"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.telefono2.length > 6
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.telefono2.length >= 8
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.telefono2.length}/8
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Número de Emergencia</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="tel"
                        className="crud-input"
                        value={formData.numeroEmergencia}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 8) {
                            setFormData({
                              ...formData,
                              numeroEmergencia: value,
                            });
                          }
                        }}
                        placeholder="11111111"
                        maxLength="8"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.numeroEmergencia.length > 6
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.numeroEmergencia.length >= 8
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.numeroEmergencia.length}/8
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Estado</label>
                    <select
                      className="crud-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="activo">🟢 Activo</option>
                      <option value="inactivo">🔴 Inactivo</option>
                    </select>
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
                  {loading ? "Creando..." : "Crear Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPerfil && empleadoPerfil && (
        <div className="crud-modal-overlay" onClick={cerrarModalPerfil}>
          <div
            className="crud-modal-content"
            style={{
              maxWidth: "600px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #131F2B, #1a365d)",
                color: "white",
                padding: "20px",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "rgba(255, 255, 255, 1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid hsla(0, 0%, 100%, 0.30)",
                }}
              >
                <Users size={40} color="#4299e1" />
              </div>
              <div style={{ flex: 1 }}>
                <h2
                  style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}
                >
                  {empleadoPerfil.nombre} {empleadoPerfil.apellido}
                </h2>
                <div style={{ marginLeft: "-4px" }}>
                  <span
                    className="crud-badge"
                    style={{
                      ...empleadosApi.getEstadoEmpleado(empleadoPerfil.status),
                    }}
                  >
                    {empleadosApi.getEstadoEmpleado(empleadoPerfil.status).icon}{" "}
                    {
                      empleadosApi.getEstadoEmpleado(empleadoPerfil.status)
                        .texto
                    }
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2d3748",
                    marginBottom: "12px",
                  }}
                >
                  Información Personal
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Nombre Completo:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.nombre} {empleadoPerfil.apellido}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Fecha de Nacimiento:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.fechaNacimiento
                        ? empleadosApi.formatearFecha(
                            empleadoPerfil.fechaNacimiento
                          )
                        : "No registrada"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Identificación:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.identificacion || "No registrada"}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2d3748",
                    marginBottom: "12px",
                  }}
                >
                  Información Laboral
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Puesto:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.puestoNombre}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Fecha de Contratación:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.fechaContratacion
                        ? empleadosApi.formatearFecha(
                            empleadoPerfil.fechaContratacion
                          )
                        : "No registrada"}
                    </span>
                  </div>
                  {empleadoPerfil.fechaFinalizacion && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#4a5568" }}>
                        Fecha de Finalización:
                      </span>
                      <span style={{ color: "#e53e3e", fontWeight: "400" }}>
                        {empleadosApi.formatearFecha(
                          empleadoPerfil.fechaFinalizacion
                        )}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Antigüedad:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadosApi.calcularAntiguedad(
                        empleadoPerfil.fechaContratacion,
                        empleadoPerfil.fechaFinalizacion
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2d3748",
                    marginBottom: "12px",
                  }}
                >
                  Información de Contacto
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Teléfono Principal:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.telefono
                        ? empleadosApi.formatearTelefono(
                            empleadoPerfil.telefono
                          )
                        : "No registrado"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Teléfono Secundario:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.telefono2
                        ? empleadosApi.formatearTelefono(
                            empleadoPerfil.telefono2
                          )
                        : "No registrado"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#4a5568" }}>
                      Número de Emergencia:
                    </span>
                    <span style={{ color: "#2d3748", fontWeight: "400" }}>
                      {empleadoPerfil.numeroEmergencia
                        ? empleadosApi.formatearTelefono(
                            empleadoPerfil.numeroEmergencia
                          )
                        : "No registrado"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <button
                className="crud-btn crud-btn-primary"
                style={{ backgroundColor: "#131F2B" }}
                onClick={cerrarModalPerfil}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalEditar && (
        <div className="crud-modal-overlay" onClick={cerrarModalEditar}>
          <div
            className="crud-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crud-modal-title">Editar Empleado</h3>
            <form onSubmit={actualizarEmpleado}>
              <div className="crud-modal-form">
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Nombre *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.nombre}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 20) {
                            setFormData({ ...formData, nombre: value });
                          }
                        }}
                        required
                        maxLength="20"
                        placeholder="Juan Carlos"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.nombre.length > 17
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.nombre.length >= 20
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.nombre.length}/20
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Apellido *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.apellido}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 20) {
                            setFormData({ ...formData, apellido: value });
                          }
                        }}
                        required
                        maxLength="20"
                        placeholder="Pérez López"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.apellido.length > 17
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.apellido.length >= 20
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.apellido.length}/20
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      className="crud-input"
                      value={formatearFechaParaInput(formData.fechaNacimiento)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaNacimiento: e.target.value,
                        })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Fecha de Contratación</label>
                    <input
                      type="date"
                      className="crud-input"
                      value={formatearFechaParaInput(
                        formData.fechaContratacion
                      )}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaContratacion: e.target.value,
                        })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Fecha de Finalización</label>
                    <input
                      type="date"
                      className="crud-input"
                      value={formatearFechaParaInput(
                        formData.fechaFinalizacion
                      )}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaFinalizacion: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Identificación</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.identificacion}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          // 1. Limpia cualquier caracter que no sea un dígito
                          const value = rawValue.replace(/\D/g, "");

                          // 2. Limita la longitud a 14 caracteres
                          if (value.length <= 14) {
                            setFormData({ ...formData, identificacion: value });
                          }
                        }}
                        maxLength="14"
                        placeholder="1234567890123"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.identificacion.length > 12
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.identificacion.length >= 14
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.identificacion.length}/14
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Puesto *</label>
                    <select
                      className="crud-select"
                      value={formData.puestoId}
                      onChange={(e) =>
                        setFormData({ ...formData, puestoId: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccionar puesto</option>
                      {puestos.map((puesto) => (
                        <option key={puesto.id} value={puesto.id}>
                          {puesto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Teléfono Principal</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="tel"
                        className="crud-input"
                        value={formData.telefono}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 8) {
                            setFormData({ ...formData, telefono: value });
                          }
                        }}
                        maxLength="8"
                        placeholder="12345678"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.telefono.length > 6
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.telefono.length >= 8
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.telefono.length}/8
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Teléfono Secundario</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="tel"
                        className="crud-input"
                        value={formData.telefono2}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 8) {
                            setFormData({ ...formData, telefono2: value });
                          }
                        }}
                        maxLength="8"
                        placeholder="87654321"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.telefono2.length > 6
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.telefono2.length >= 8
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.telefono2.length}/8
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Número de Emergencia</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="tel"
                        className="crud-input"
                        value={formData.numeroEmergencia}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 8) {
                            setFormData({
                              ...formData,
                              numeroEmergencia: value,
                            });
                          }
                        }}
                        maxLength="8"
                        placeholder="11111111"
                      />
                      <span
                        className={`crud-char-counter ${
                          formData.numeroEmergencia.length > 6
                            ? "crud-char-counter-warning"
                            : ""
                        } ${
                          formData.numeroEmergencia.length >= 8
                            ? "crud-char-counter-danger"
                            : ""
                        }`}
                      >
                        {formData.numeroEmergencia.length}/8
                      </span>
                    </div>
                  </div>
                </div>
                <div className="crud-modal-full-width">
                  <div className="crud-form-group">
                    <label className="crud-label">Estado</label>
                    <select
                      className="crud-select"
                      value={formData.status}
                      onChange={(e) => {
                        const nuevoStatus = e.target.value;
                        if (
                          nuevoStatus === "inactivo" &&
                          !formData.fechaFinalizacion
                        ) {
                          toast.warning(
                            "Debe establecer una fecha de finalización antes de marcar como inactivo"
                          );
                          return;
                        }
                        setFormData({ ...formData, status: nuevoStatus });
                      }}
                      disabled={
                        formData.fechaFinalizacion &&
                        new Date(formData.fechaFinalizacion) < new Date() &&
                        formData.status === "inactivo"
                      }
                    >
                      <option value="activo">🟢 Activo</option>
                      <option value="inactivo">🔴 Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="crud-info-box crud-modal-full-width">
                  <p
                    style={{ margin: "0", fontSize: "14px", color: "#2d3748" }}
                  >
                    <strong>Empleado:</strong> {empleadoSeleccionado?.nombre}{" "}
                    {empleadoSeleccionado?.apellido}
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "12px",
                      color: "#4a5568",
                      marginTop: "5px",
                    }}
                  >
                    Límites: Nombre/Apellido (20 chars), Identificación (14
                    chars), Teléfonos (8 dígitos)
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
                  {loading ? "Actualizando..." : "Actualizar Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpleadosCRUD;
