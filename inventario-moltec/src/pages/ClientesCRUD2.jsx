// pages/ClientesCRUD.jsx - CRUD de clientes con CSS externo
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  CreditCard,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import clientesApi from "../services/clienteApi";
import reportesService from "../services/reportesService";
import "./CRUDStyles.css";

const ClientesCRUD = () => {
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalClientes: 0,
    clientesConCorreo: 0,
    clientesConTelefono: 0,
    clientesConNIT: 0,
  });
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({ fechaDesde: "", fechaHasta: "" });
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    nit: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    let filtrados = clientesApi.filtrarClientes(clientes, busqueda);
    if (filtros.fechaDesde || filtros.fechaHasta) {
      filtrados = filtrados.filter((cliente) => {
        const fechaRegistro = new Date(cliente.fechaRegistro);
        const fechaDesde = filtros.fechaDesde
          ? new Date(filtros.fechaDesde + "T00:00:00")
          : null;
        const fechaHasta = filtros.fechaHasta
          ? new Date(filtros.fechaHasta + "T23:59:59")
          : null;
        if (fechaDesde && fechaRegistro < fechaDesde) return false;
        if (fechaHasta && fechaRegistro > fechaHasta) return false;
        return true;
      });
    }
    setClientesFiltrados(filtrados);
  }, [clientes, busqueda, filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [clientesResponse, statsResponse] = await Promise.all([
        clientesApi.obtenerClientes(),
        clientesApi.obtenerEstadisticas(),
      ]);
      if (clientesResponse.success) {
        setClientes(clientesResponse.data);
        setClientesFiltrados(clientesResponse.data);
      }
      if (statsResponse.success) {
        setEstadisticas(statsResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const recargarDatos = async () => {
    try {
      toast.info("Recargando datos...");
      setFiltros({ fechaDesde: "", fechaHasta: "" });
      setBusqueda("");
      await cargarDatos();
      toast.success("Datos actualizados");
    } catch (error) {
      console.error("Error al recargar datos:", error);
      toast.error("Error al actualizar los datos");
    }
  };

  const generarReportePDF = async () => {
    try {
      setLoading(true);
      toast.info("📊 Generando reporte PDF...", { autoClose: 2000 });
      await reportesService.generarReporteClientesPDF(clientes, estadisticas);
      toast.success("✅ Reporte PDF descargado exitosamente");
    } catch (error) {
      console.error("Error al generar reporte:", error);
      toast.error("Error al generar el reporte PDF");
    } finally {
      setLoading(false);
    }
  };

  const crearCliente = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await clientesApi.crearCliente(formData);
      if (response.success) {
        toast.success("Cliente creado exitosamente");
        await cargarDatos();
        cerrarModalCrear();
      }
    } catch (error) {
      toast.error(error.message || "Error al crear el cliente");
    } finally {
      setLoading(false);
    }
  };

  const actualizarCliente = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await clientesApi.actualizarCliente(
        clienteSeleccionado.id,
        formData
      );
      if (response.success) {
        toast.success("Cliente actualizado exitosamente");
        await cargarDatos();
        cerrarModalEditar();
      }
    } catch (error) {
      toast.error(error.message || "Error al actualizar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = async (cliente) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a "${cliente.nombre} ${cliente.apellido}"?`
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const response = await clientesApi.eliminarCliente(cliente.id);
      if (response.success) {
        toast.success("Cliente eliminado exitosamente");
        await cargarDatos();
      }
    } catch (error) {
      toast.error(error.message || "Error al eliminar el cliente");
    } finally {
      setLoading(false);
    }
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

  const formatearTelefono = (telefono) => {
    if (!telefono || telefono.length !== 8) return telefono;
    return `${telefono.slice(0, 4)}-${telefono.slice(4)}`;
  };

  const abrirModalCrear = () => {
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      nit: "",
    });
    setMostrarModalCrear(true);
  };
  const cerrarModalCrear = () => {
    setMostrarModalCrear(false);
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      nit: "",
    });
  };
  const abrirModalEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      correo: cliente.correo || "",
      telefono: cliente.telefono || "",
      nit: cliente.nit || "",
    });
    setMostrarModalEditar(true);
  };
  const cerrarModalEditar = () => {
    setMostrarModalEditar(false);
    setClienteSeleccionado(null);
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

  if (loading && clientes.length === 0) {
    return (
      <div className="crud-loading-container">
        <div className="crud-spinner"></div>
        <h2>Cargando clientes...</h2>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-title-section">
          <h1 className="crud-title">
            <Users size={32} />
            Gestión de Clientes
          </h1>
          <p className="crud-subtitle">
            Administración completa de la base de datos de clientes
          </p>
        </div>
        <div className="crud-header-actions">
          <button
            className="crud-btn crud-btn-info"
            onClick={generarReportePDF}
            disabled={loading || clientes.length === 0}
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
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="crud-stats-container">
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Total Clientes</h3>
          <p className="crud-stat-number">
            {estadisticas.totalClientes || clientes.length}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Con Correo</h3>
          <p className="crud-stat-number" style={{ color: "#4299e1" }}>
            {estadisticas.clientesConCorreo || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Con Teléfono</h3>
          <p className="crud-stat-number" style={{ color: "#48bb78" }}>
            {estadisticas.clientesConTelefono || 0}
          </p>
        </div>
        <div className="crud-stat-card">
          <h3 className="crud-stat-title">Con NIT</h3>
          <p className="crud-stat-number" style={{ color: "#9f7aea" }}>
            {estadisticas.clientesConNIT || 0}
          </p>
        </div>
      </div>

      <div className="crud-search-container">
        <div className="crud-search-box">
          <Search size={20} color="#6c757d" />
          <input
            type="text"
            className="crud-search-input"
            placeholder="Buscar clientes por nombre, contacto, correo, teléfono o NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="crud-filters-container">
        <div className="crud-filters-row">
          <div className="crud-filter-group">
            <label className="crud-filter-label">Fecha desde:</label>
            <input
              type="date"
              className="crud-filter-input"
              value={filtros.fechaDesde}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaDesde: e.target.value })
              }
            />
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label">Fecha hasta:</label>
            <input
              type="date"
              className="crud-filter-input"
              value={filtros.fechaHasta}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaHasta: e.target.value })
              }
            />
          </div>
          <div className="crud-filter-group">
            <label className="crud-filter-label crud-filter-label-invisible">
              Resetear
            </label>
            <button
              className="crud-btn crud-btn-light crud-filter-reset-btn"
              onClick={() => setFiltros({ fechaDesde: "", fechaHasta: "" })}
              title="Resetear todos los filtros"
            >
              <RefreshCw size={16} />
              Resetear
            </button>
          </div>
        </div>
        {(filtros.fechaDesde || filtros.fechaHasta) && (
          <div className="crud-active-filters">
            <span className="crud-active-filters-text">
              Filtros activos:
              {filtros.fechaDesde && (
                <span className="crud-filter-tag">
                  Desde: {formatearFechaLocal(filtros.fechaDesde)}
                </span>
              )}
              {filtros.fechaHasta && (
                <span className="crud-filter-tag">
                  Hasta: {formatearFechaLocal(filtros.fechaHasta)}
                </span>
              )}
            </span>
            <span className="crud-results-count">
              ({clientesFiltrados.length} clientes encontrados)
            </span>
          </div>
        )}
      </div>

      <div className="crud-table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th className="crud-th">Nombre Completo</th>
              <th className="crud-th">Contacto</th>
              <th className="crud-th">Correo Electrónico</th>
              <th className="crud-th">Teléfono</th>
              <th className="crud-th">NIT</th>
              <th className="crud-th">Fecha Registro</th>
              <th className="crud-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="crud-table-row">
                  <td className="crud-td">
                    <strong>{cliente.nombre}</strong>
                  </td>
                  {/* Contacto: aquí va el apellido */}
                  <td className="crud-td">
                    {cliente.apellido || (
                      <span
                        style={{
                          color: "#a0aec0",
                          fontStyle: "italic",
                          fontSize: 14,
                        }}
                      >
                        Sin contacto
                      </span>
                    )}
                  </td>
                  <td className="crud-td">
                    {cliente.correo ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Mail size={16} color="#4299e1" />
                        <a
                          href={`mailto:${cliente.correo}`}
                          style={{
                            color: "#2d3748",
                            textDecoration: "none",
                            fontSize: "14px",
                          }}
                        >
                          {cliente.correo}
                        </a>
                      </div>
                    ) : (
                      <span
                        style={{
                          color: "#a0aec0",
                          fontStyle: "italic",
                          fontSize: "14px",
                        }}
                      >
                        Sin correo
                      </span>
                    )}
                  </td>
                  <td className="crud-td">
                    {cliente.telefono ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Phone size={16} color="#48bb78" />
                        <a
                          href={`tel:${cliente.telefono}`}
                          style={{
                            color: "#2d3748",
                            textDecoration: "none",
                            fontSize: "13px",
                          }}
                        >
                          {formatearTelefono(cliente.telefono)}
                        </a>
                      </div>
                    ) : (
                      <span
                        style={{
                          color: "#a0aec0",
                          fontStyle: "italic",
                          fontSize: "14px",
                        }}
                      >
                        Sin teléfono
                      </span>
                    )}
                  </td>
                  <td className="crud-td">
                    {cliente.nit ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <CreditCard size={16} color="#9f7aea" />
                        <span>{cliente.nit}</span>
                      </div>
                    ) : (
                      <span
                        style={{
                          color: "#a0aec0",
                          fontStyle: "italic",
                          fontSize: "14px",
                        }}
                      >
                        Sin NIT
                      </span>
                    )}
                  </td>
                  <td className="crud-td">
                    {formatearFecha(cliente.fechaRegistro)}
                  </td>
                  <td className="crud-td">
                    <div className="crud-table-actions">
                      <button
                        className="crud-btn crud-btn-icon crud-btn-secondary"
                        title="Editar"
                        onClick={() => abrirModalEditar(cliente)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="crud-btn crud-btn-icon crud-btn-danger"
                        title="Eliminar"
                        onClick={() => eliminarCliente(cliente)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="crud-no-results">
                  {busqueda
                    ? `No se encontraron clientes que coincidan con "${busqueda}"`
                    : "No hay clientes registrados"}
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
            <h3 className="crud-modal-title">Crear Nuevo Cliente</h3>
            <form onSubmit={crearCliente}>
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
                          if (value.length <= 50) {
                            setFormData({ ...formData, nombre: value });
                          }
                        }}
                        required
                        placeholder="Juan Carlos"
                        maxLength="50"
                      />
                      <span className="crud-char-counter">
                        {formData.nombre.length}/50
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Contacto *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.apellido}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 35) {
                            setFormData({ ...formData, apellido: value });
                          }
                        }}
                        required
                        placeholder="Contacto"
                        maxLength="35"
                      />
                      <span className="crud-char-counter">
                        {formData.apellido.length}/35
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Teléfono</label>
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
                      <span className="crud-char-counter">
                        {formData.telefono.length}/8
                      </span>
                    </div>
                  </div>
                </div>
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="crud-input"
                      value={formData.correo}
                      onChange={(e) =>
                        setFormData({ ...formData, correo: e.target.value })
                      }
                      placeholder="juan@email.com"
                    />
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">NIT</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.nit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            /^[\d-]*$/.test(value) &&
                            value.replace(/\D/g, "").length <= 9
                          ) {
                            setFormData({ ...formData, nit: value });
                          }
                        }}
                        placeholder="12345678-9"
                        maxLength="11"
                      />
                      <span className="crud-char-counter">
                        {formData.nit.replace(/\D/g, "").length}/9
                      </span>
                    </div>
                  </div>
                </div>
                <div className="crud-info-box crud-modal-full-width">
                  <p
                    style={{ margin: "0", fontSize: "14px", color: "#2d3748" }}
                  >
                    💡 <strong>Límites:</strong> Nombre (50 chars), Contacto (35
                    chars), Teléfono (8 dígitos), NIT (9 dígitos)
                  </p>
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
                  {loading ? "Creando..." : "Crear Cliente"}
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
            <h3 className="crud-modal-title">Editar Cliente</h3>
            <form onSubmit={actualizarCliente}>
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
                          if (value.length <= 50) {
                            setFormData({ ...formData, nombre: value });
                          }
                        }}
                        required
                        maxLength="50"
                        placeholder="Juan Carlos"
                      />
                      <span className="crud-char-counter">
                        {formData.nombre.length}/50
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Contacto *</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.apellido}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 35) {
                            setFormData({ ...formData, apellido: value });
                          }
                        }}
                        required
                        maxLength="35"
                        placeholder="Contacto"
                      />
                      <span className="crud-char-counter">
                        {formData.apellido.length}/35
                      </span>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">Teléfono</label>
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
                      <span className="crud-char-counter">
                        {formData.telefono.length}/8
                      </span>
                    </div>
                  </div>
                </div>
                <div className="crud-modal-column">
                  <div className="crud-form-group">
                    <label className="crud-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="crud-input"
                      value={formData.correo}
                      onChange={(e) =>
                        setFormData({ ...formData, correo: e.target.value })
                      }
                      placeholder="juan@email.com"
                    />
                  </div>
                  <div className="crud-form-group">
                    <label className="crud-label">NIT</label>
                    <div className="crud-input-with-counter">
                      <input
                        type="text"
                        className="crud-input"
                        value={formData.nit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            /^[\d-]*$/.test(value) &&
                            value.replace(/\D/g, "").length <= 9
                          ) {
                            setFormData({ ...formData, nit: value });
                          }
                        }}
                        maxLength="11"
                        placeholder="12345678-9"
                      />
                      <span className="crud-char-counter">
                        {formData.nit.replace(/\D/g, "").length}/9
                      </span>
                    </div>
                  </div>
                </div>
                <div className="crud-info-box crud-modal-full-width">
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "14px",
                      color: "#2d3748",
                    }}
                  >
                    <strong>Fecha de Registro:</strong>{" "}
                    {formatearFecha(clienteSeleccionado?.fechaRegistro)}
                  </p>
                  <p
                    style={{ margin: "0", fontSize: "12px", color: "#4a5568" }}
                  >
                    💡 <strong>Límites:</strong> Nombre (50 chars), Contacto (35
                    chars), Teléfono (8 dígitos), NIT (9 dígitos)
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
                  {loading ? "Actualizando..." : "Actualizar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesCRUD;
