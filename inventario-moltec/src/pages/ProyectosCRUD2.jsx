// pages/ProyectosCRUD.jsx - CRUD de proyectos con numCotizacion
import React, { useState, useEffect } from "react";
import {FolderOpen,Plus,Search,Edit,Trash2,RefreshCw,FileText,User,Users,Calendar,DollarSign,CheckCircle,Clock,MapPin,Hash} from "lucide-react";
import { toast } from "react-toastify";
import proyectosApi from "../services/proyectosApi";
import empleadosApi from "../services/empleadosApi";
import clienteApi from "../services/clienteApi";
import reportesService from "../services/reportesService";
import "./CRUDStyles2.css";

const ProyectosCRUD = () => {
  const [proyectos, setProyectos] = useState([]);
  const [proyectosFiltrados, setProyectosFiltrados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({totalProyectos: 0,planificados: 0,enProgreso: 0,completados: 0});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [mostrarModalReportes, setMostrarModalReportes] = useState(false);
  const [configuracionReporte, setConfiguracionReporte] = useState({statusSeleccionado: "todos",clienteSeleccionado: "",responsableSeleccionado: "",aprobacionSeleccionada: "todos",incluirFechas: true,incluirFinanzas: true,incluirAprobacion: true});
  const [filtros, setFiltros] = useState({status: "todos",aprobacion: "todos"});
  const [formData, setFormData] = useState({nombre: "",descripcion: "",responsableId: "",clienteId: "",ubicacion: "",fechaInicio: "",fechaAproxFin: "",fechaFin: "",cotizacion: "",numCotizacion: "",aprobado: false,status: "planificado"});

  const isMobile = () => window.innerWidth <= 768;
  const isSmallMobile = () => window.innerWidth <= 640;

  useEffect(() => {cargarDatos();}, []);

  useEffect(() => {
    try {
      const tieneFiltroApi = typeof proyectosApi?.filtrarProyectos === "function";
      let proyectosFiltradosPorTexto = tieneFiltroApi ? proyectosApi.filtrarProyectos(proyectos, busqueda) : filtrarLocal(proyectos, busqueda);
      let proyectosFiltradosCompleto = proyectosFiltradosPorTexto;
      if (filtros.status !== "todos") {proyectosFiltradosCompleto = proyectosFiltradosCompleto.filter((proyecto) => proyecto?.status === filtros.status);}
      if (filtros.aprobacion !== "todos") {
        if (filtros.aprobacion === "aprobados") {proyectosFiltradosCompleto = proyectosFiltradosCompleto.filter((proyecto) => proyecto?.aprobado === true || proyecto?.aprobado === 1);} 
        else if (filtros.aprobacion === "pendientes") {proyectosFiltradosCompleto = proyectosFiltradosCompleto.filter((proyecto) => proyecto?.aprobado === false || proyecto?.aprobado === 0 || !proyecto?.aprobado);}
      }
      setProyectosFiltrados(proyectosFiltradosCompleto || []);
    } catch {setProyectosFiltrados(filtrarLocal(proyectos, busqueda));}
  }, [proyectos, busqueda, filtros]);

  const manejarCambioFiltro = (tipoFiltro, valor) => {setFiltros((prev) => ({ ...prev, [tipoFiltro]: valor }));};
  const resetearFiltros = () => {setFiltros({ status: "todos", aprobacion: "todos" });};
  const filtrarLocal = (lista, termino) => {
    const t = (termino || "").trim().toLowerCase();
    if (!t) return lista;
    return (lista || []).filter((p) => {
      const campos = [p?.nombre,p?.clienteNombre,p?.responsableNombre,p?.descripcion,p?.ubicacion,p?.status,p?.numCotizacion?.toString()].filter(Boolean).map((x) => String(x).toLowerCase());
      return campos.some((x) => x.includes(t));
    });
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [proyectosResponse,empleadosResponse,clientesResponse,statsResponse] = await Promise.all([proyectosApi.obtenerProyectos(),empleadosApi.obtenerEmpleados(),clienteApi.obtenerClientes(),proyectosApi.obtenerEstadisticas()]);
      if (proyectosResponse?.success) {setProyectos(proyectosResponse.data || []);setProyectosFiltrados(proyectosResponse.data || []);}
      if (empleadosResponse?.success) {const empleadosActivos = (empleadosResponse.data || []).filter((emp) => {return (emp?.status === 1 || emp?.status === true || emp?.empleado_status === 1 || emp?.empleado_status === true || emp?.status === "activo");});setEmpleados(empleadosActivos);}
      if (clientesResponse?.success) {
        const todosLosClientes = clientesResponse.data || [];
        if (todosLosClientes.length > 0) {
          const clientesActivos = todosLosClientes.filter((cli) => {
            const statusPosibles = [cli?.status,cli?.cliente_status,cli?.statusRegistro,cli?.cliente_status_registro,cli?.estado,cli?.activo];
            const esActivo = statusPosibles.some((status) => status === 1 || status === true || status === "1" || status === "activo" || status === "true");
            return esActivo;
          });
          if (clientesActivos.length === 0) {setClientes(todosLosClientes);} else {setClientes(clientesActivos);}
        } else {setClientes([]);}
      } else {setClientes([]);}
      if (statsResponse?.success && statsResponse.data) {setEstadisticas(statsResponse.data);} else {
        const total = (proyectosResponse?.data || []).length;
        const enProgreso = (proyectosResponse?.data || []).filter((p) => p?.status === "en progreso").length;
        const completados = (proyectosResponse?.data || []).filter((p) => p?.status === "completado").length;
        const planificados = (proyectosResponse?.data || []).filter((p) => p?.status === "planificado").length;
        setEstadisticas({totalProyectos: total,enProgreso,completados,planificados});
      }
    } catch (error) {console.error("Error al cargar datos:", error);toast.error("Error al cargar los proyectos");setProyectos([]);setProyectosFiltrados([]);setEmpleados([]);setClientes([]);} finally {setLoading(false);}
  };

  const recargarDatos = async () => {toast.info("Recargando datos...");setFiltros({ status: "todos", aprobacion: "todos" });setBusqueda("");await cargarDatos();toast.success("Datos actualizados");};

  const handleInputChange = (e) => {const { name, value, type, checked } = e.target;setFormData((prev) => ({...prev,[name]: type === "checkbox" ? checked : value}));};

  const abrirModalCrear = () => {setFormData({nombre: "",descripcion: "",responsableId: "",clienteId: "",ubicacion: "",fechaInicio: "",fechaAproxFin: "",fechaFin: "",cotizacion: "",numCotizacion: "",aprobado: false,status: "planificado"});setMostrarModalCrear(true);};

  const abrirModalEditar = (proyecto) => {setProyectoSeleccionado(proyecto);setFormData({nombre: proyecto?.nombre || "",descripcion: proyecto?.descripcion || "",responsableId: proyecto?.responsableId || "",clienteId: proyecto?.clienteId || "",ubicacion: proyecto?.ubicacion || "",fechaInicio: proyecto?.fechaInicio ? String(proyecto.fechaInicio).split("T")[0] : "",fechaAproxFin: proyecto?.fechaAproxFin ? String(proyecto.fechaAproxFin).split("T")[0] : "",fechaFin: proyecto?.fechaFin ? String(proyecto.fechaFin).split("T")[0] : "",cotizacion: proyecto?.cotizacion || "",numCotizacion: proyecto?.numCotizacion || "",aprobado: Boolean(proyecto?.aprobado),status: proyecto?.status || "planificado"});setMostrarModalEditar(true);};

  const cerrarModalCrear = () => {setMostrarModalCrear(false);};
  const cerrarModalEditar = () => {setMostrarModalEditar(false);setProyectoSeleccionado(null);};

  const crearProyecto = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData };
      const response = await proyectosApi.crearProyecto(payload);
      if (response?.success) {toast.success("Proyecto creado exitosamente");cerrarModalCrear();await cargarDatos();} else {throw new Error(response?.message || "No se pudo crear el proyecto");}
    } catch (error) {console.error("Error al crear proyecto:", error);toast.error(error?.message || "Error al crear el proyecto");} finally {setLoading(false);}
  };

  const actualizarProyecto = async (e) => {
    e.preventDefault();
    try {
      if (!proyectoSeleccionado?.id) throw new Error("Proyecto no seleccionado");
      setLoading(true);
      const payload = { ...formData };
      const response = await proyectosApi.actualizarProyecto(proyectoSeleccionado.id,payload);
      if (response?.success) {toast.success("Proyecto actualizado exitosamente");cerrarModalEditar();await cargarDatos();} else {throw new Error(response?.message || "No se pudo actualizar el proyecto");}
    } catch (error) {console.error("Error al actualizar proyecto:", error);toast.error(error?.message || "Error al actualizar el proyecto");} finally {setLoading(false);}
  };

  const eliminarProyecto = async (proyecto) => {
    const confirmacion = window.confirm(`¿Estás seguro de eliminar el proyecto "${proyecto?.nombre}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmacion || !proyecto?.id) return;
    try {setLoading(true);const response = await proyectosApi.eliminarProyecto(proyecto.id);if (response?.success) {toast.success("Proyecto eliminado exitosamente");await cargarDatos();} else {throw new Error(response?.message || "No se pudo eliminar el proyecto");}} catch (error) {console.error("Error al eliminar proyecto:", error);toast.error(error?.message || "Error al eliminar el proyecto");} finally {setLoading(false);}
  };

  const generarReporte = async () => {
    try {
      setLoading(true);
      let proyectosParaReporte = [...proyectosFiltrados];
      if (configuracionReporte.statusSeleccionado !== "todos") {proyectosParaReporte = proyectosParaReporte.filter((proyecto) => proyecto.status === configuracionReporte.statusSeleccionado);}
      if (configuracionReporte.clienteSeleccionado) {proyectosParaReporte = proyectosParaReporte.filter((proyecto) => proyecto.clienteId == configuracionReporte.clienteSeleccionado);}
      if (configuracionReporte.responsableSeleccionado) {proyectosParaReporte = proyectosParaReporte.filter((proyecto) => proyecto.responsableId == configuracionReporte.responsableSeleccionado);}
      if (configuracionReporte.aprobacionSeleccionada !== "todos") {if (configuracionReporte.aprobacionSeleccionada === "aprobados") {proyectosParaReporte = proyectosParaReporte.filter((proyecto) => proyecto.aprobado === true || proyecto.aprobado === 1);} else if (configuracionReporte.aprobacionSeleccionada === "pendientes") {proyectosParaReporte = proyectosParaReporte.filter((proyecto) => proyecto.aprobado === false || proyecto.aprobado === 0 || !proyecto.aprobado);}}
      if (proyectosParaReporte.length === 0) {toast.warning("No hay proyectos que coincidan con los filtros seleccionados");return;}
      const response = await reportesService.generarReporteProyectos(proyectosParaReporte,configuracionReporte);
      if (response?.success) {toast.success(`Reporte generado exitosamente con ${proyectosParaReporte.length} proyectos`);setMostrarModalReportes(false);setConfiguracionReporte({statusSeleccionado: "todos",clienteSeleccionado: "",responsableSeleccionado: "",aprobacionSeleccionada: "todos",incluirFechas: true,incluirFinanzas: true,incluirAprobacion: true});} else {throw new Error(response?.message || "No se pudo generar el reporte");}
    } catch (error) {console.error("Error al generar reporte:", error);toast.error(`Error al generar el reporte: ${error.message}`);} finally {setLoading(false);}
  };

  const formatearMoneda = (valor) => {const num = Number(valor) || 0;return new Intl.NumberFormat("es-GT", {style: "currency",currency: "GTQ",minimumFractionDigits: 2,maximumFractionDigits: 2}).format(num);};
  const formatearFecha = (fecha) => {if (!fecha) return "Sin fecha";const d = new Date(fecha);if (Number.isNaN(d.getTime())) return "Sin fecha";return d.toLocaleDateString("es-GT", {year: "numeric",month: "short",day: "numeric"});};
  const obtenerEstiloStatus = (status) => {
    // Colores oscuros para tema MOLTEC — fondo sólido + texto blanco
    const estilos = {
      planificado:    { color: "#ffffff", bg: "#2b6cb0" },  // azul oscuro
      "en progreso":  { color: "#ffffff", bg: "#c05621" },  // naranja oscuro
      pausado:        { color: "#ffffff", bg: "#4a5568" },  // gris oscuro
      completado:     { color: "#ffffff", bg: "#276749" },  // verde oscuro
      cancelado:      { color: "#ffffff", bg: "#c53030" },  // rojo oscuro
    };
    return estilos[status?.toLowerCase()] || estilos.planificado;
  };

  if (loading) {return (<div className="crud-loading-container"><div className="crud-spinner"></div><p>Cargando proyectos...</p></div>);}

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-title-section"><div><h1 className="crud-title"><FolderOpen size={32} />Gestión de Proyectos</h1><p className="crud-subtitle">Administra todos los proyectos de MOLTEC S.A.</p></div></div>
        <div className="crud-header-actions"><button className="crud-btn crud-btn-info" onClick={() => setMostrarModalReportes(true)}><FileText size={16} />Reporte PDF</button><button className="crud-btn crud-btn-secondary" onClick={recargarDatos}><RefreshCw size={16} />Actualizar</button><button className="crud-btn crud-btn-primary" onClick={abrirModalCrear}><Plus size={16} />Nuevo Proyecto</button></div>
      </div>

      <div className="crud-stats-container">
        <div className="crud-stat-card"><h3 className="crud-stat-title">Completados</h3><p className="crud-stat-number" style={{ color: "#38a169" }}>{estadisticas.completados || 0}</p></div>
        <div className="crud-stat-card"><h3 className="crud-stat-title">En Progreso</h3><p className="crud-stat-number" style={{ color: "#dd6b20" }}>{estadisticas.enProgreso || 0}</p></div>
        <div className="crud-stat-card"><h3 className="crud-stat-title">Pausados</h3><p className="crud-stat-number" style={{ color: "rgba(255,255,255,0.55)" }}>{estadisticas.pausados || 0}</p></div>
        <div className="crud-stat-card"><h3 className="crud-stat-title">Planificados</h3><p className="crud-stat-number" style={{ color: "#3182ce" }}>{estadisticas.planificados || 0}</p></div>
        <div className="crud-stat-card"><h3 className="crud-stat-title">Cancelados</h3><p className="crud-stat-number" style={{ color: "#e53e3e" }}>{estadisticas.cancelados || 0}</p></div>
        <div className="crud-stat-card"><h3 className="crud-stat-title">Aprobados</h3><p className="crud-stat-number" style={{ color: "#48bb78" }}>{estadisticas.aprobados || 0}</p></div>
        <div className="crud-stat-card"><h3 className="crud-stat-title">Pendientes</h3><p className="crud-stat-number" style={{ color: "#ecc94b" }}>{estadisticas.pendientesAprobacion || 0}</p></div>
      </div>

      <div className="crud-search-container"><div className="crud-search-box"><Search size={20} color="#6c757d" /><input type="text" className="crud-search-input" placeholder="Buscar proyectos por nombre, cliente, responsable, N° cotización..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div></div>

      <div className="crud-filters-container">
        <div className="crud-filters-row">
          <div className="crud-filter-group"><label className="crud-filter-label">Estado del Proyecto:</label><select className="crud-filter-input" value={filtros.status} onChange={(e) => manejarCambioFiltro("status", e.target.value)}><option value="todos">📂 Todos los estados</option><option value="planificado">📋 Planificado</option><option value="en progreso">⚡ En Progreso</option><option value="pausado">⏸️ Pausado</option><option value="completado">✅ Completado</option><option value="cancelado">❌ Cancelado</option></select></div>
          <div className="crud-filter-group"><label className="crud-filter-label">Estado de Aprobación:</label><select className="crud-filter-input" value={filtros.aprobacion} onChange={(e) => manejarCambioFiltro("aprobacion", e.target.value)}><option value="todos">📋 Todos</option><option value="aprobados">✅ Aprobados</option><option value="pendientes">⏳ Pendientes</option></select></div>
          <div className="crud-filter-group"><label className="crud-filter-label crud-filter-label-invisible">Resetear</label><button className="crud-btn crud-btn-light crud-filter-reset-btn" onClick={resetearFiltros} title="Resetear todos los filtros"><RefreshCw size={16} />Resetear</button></div>
        </div>
        {(filtros.status !== "todos" || filtros.aprobacion !== "todos") && (<div className="crud-active-filters"><span className="crud-active-filters-text">Filtros activos:{filtros.status !== "todos" && (<span className="crud-filter-tag">Estado: {filtros.status}</span>)}{filtros.aprobacion !== "todos" && (<span className="crud-filter-tag">{filtros.aprobacion === "aprobados" ? "Solo aprobados" : "Solo pendientes"}</span>)}</span><span className="crud-results-count">({proyectosFiltrados.length} proyectos encontrados)</span></div>)}
      </div>

      <div className="crud-table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th className="crud-th">Proyecto</th>
              <th className="crud-th">Cliente</th>
              <th className="crud-th">Responsable</th>
              <th className="crud-th" style={{ display: isMobile() ? "none" : "table-cell" }}>Ubicación</th>
              <th className="crud-th" style={{ display: isSmallMobile() ? "none" : "table-cell" }}>Fechas</th>
              <th className="crud-th">Cotización</th>
              <th className="crud-th">N° Cotiz.</th>
              <th className="crud-th">Estado</th>
              <th className="crud-th" style={{ display: isMobile() ? "none" : "table-cell" }}>Aprobado</th>
              <th className="crud-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectosFiltrados.length === 0 ? (<tr><td colSpan="10" className="crud-no-results">{busqueda ? "No se encontraron proyectos que coincidan con la búsqueda" : "No hay proyectos registrados"}</td></tr>) : (proyectosFiltrados.map((proyecto) => {const estiloStatus = obtenerEstiloStatus(proyecto?.status);return (<tr key={proyecto?.id} className="crud-table-row"><td className="crud-td"><div style={{display: "flex",flexDirection: "column",gap: "4px",maxWidth: "200px"}}><h4 style={{fontSize: "14px",fontWeight: "600",color: "#ffffff",margin: "0 0 4px 0"}}>{proyecto?.nombre}</h4>{proyecto?.descripcion && (<p style={{fontSize: "12px",color: "rgba(255,255,255,0.55)",margin: "0",lineHeight: "1.4"}}>{String(proyecto.descripcion).length > 50 ? `${String(proyecto.descripcion).substring(0,50)}...` : proyecto.descripcion}</p>)}<div style={{display: isMobile() ? "flex" : "none",flexWrap: "wrap",gap: "4px",marginTop: "8px"}}>{proyecto?.ubicacion && (<span style={{fontSize: "11px",color: "rgba(255,255,255,0.55)",backgroundColor: "#1a2d3d",padding: "2px 6px",borderRadius: "12px",border: "1px solid rgba(255,255,255,0.08)",whiteSpace: "nowrap"}}>📍 {proyecto.ubicacion}</span>)}<span style={{fontSize: "11px",color: "rgba(255,255,255,0.55)",backgroundColor: "#1a2d3d",padding: "2px 6px",borderRadius: "12px",border: "1px solid rgba(255,255,255,0.08)",whiteSpace: "nowrap"}}>{proyecto?.aprobado ? "✅ Aprobado" : "⏳ Pendiente"}</span></div></div></td><td className="crud-td"><div style={{display: "flex",alignItems: "center",gap: "6px",fontSize: "13px",color: "#ffffff"}}><Users size={16} color="rgba(255,255,255,0.55)" /><span>{proyecto?.clienteNombre}</span></div></td><td className="crud-td"><div style={{display: "flex",alignItems: "center",gap: "6px",fontSize: "13px",color: "#ffffff"}}><User size={16} color="rgba(255,255,255,0.55)" /><span>{proyecto?.responsableNombre}</span></div></td><td className="crud-td" style={{ display: isMobile() ? "none" : "table-cell" }}><div style={{display: "flex",alignItems: "center",gap: "6px",fontSize: "13px",color: "#ffffff"}}><MapPin size={16} color="rgba(255,255,255,0.55)" /><span>{proyecto?.ubicacion || "No especificada"}</span></div></td><td className="crud-td" style={{display: isSmallMobile() ? "none" : "table-cell"}}><div style={{display: "flex",flexDirection: "column",gap: "4px"}}><small style={{fontSize: "11px",color: "rgba(255,255,255,0.55)",fontWeight: "600"}}>Inicio:</small><span style={{fontSize: "13px",color: "#ffffff",marginBottom: "8px"}}>{formatearFecha(proyecto?.fechaInicio)}</span>{proyecto?.fechaAproxFin && (<><small style={{fontSize: "11px",color: "rgba(255,255,255,0.55)",fontWeight: "600"}}>Est. Fin:</small><span style={{fontSize: "13px",color: "#ffffff",marginBottom: "8px"}}>{formatearFecha(proyecto.fechaAproxFin)}</span></>)}{proyecto?.fechaFin && (<><small style={{fontSize: "11px",color: "rgba(255,255,255,0.55)",fontWeight: "600"}}>Fin Real:</small><span style={{fontSize: "13px",color: "#ffffff",marginBottom: "8px"}}>{formatearFecha(proyecto.fechaFin)}</span></>)}</div></td><td className="crud-td"><span style={{fontSize: "14px",fontWeight: "600",color: "#68d391"}}>{formatearMoneda(proyecto?.cotizacion)}</span></td><td className="crud-td"><div style={{display: "flex",alignItems: "center",gap: "4px",fontSize: "13px",color: "#ffffff",fontWeight: "600"}}><Hash size={14} color="rgba(255,255,255,0.55)" /><span>{proyecto?.numCotizacion || "-"}</span></div></td><td className="crud-td"><span className="crud-badge" style={{color: estiloStatus.color,backgroundColor: estiloStatus.bg}}>{proyecto?.status}</span></td><td className="crud-td" style={{ display: isMobile() ? "none" : "table-cell" }}><div>{proyecto?.aprobado ? (<span style={{display: "flex",alignItems: "center",gap: "6px",padding: "4px 12px",backgroundColor: "#276749",color: "#ffffff",borderRadius: "20px",fontSize: "12px",fontWeight: "600"}}><CheckCircle size={16} />Aprobado</span>) : (<span style={{display: "flex",alignItems: "center",gap: "6px",padding: "4px 12px",backgroundColor: "#c05621",color: "#ffffff",borderRadius: "20px",fontSize: "12px",fontWeight: "600"}}><Clock size={16} />Pendiente</span>)}</div></td><td className="crud-td"><div className="crud-table-actions" style={{...(isSmallMobile() && {flexDirection: "column",gap: "4px"})}}><button className="crud-btn crud-btn-icon crud-btn-secondary" onClick={() => abrirModalEditar(proyecto)} title="Editar proyecto"><Edit size={14} /></button><button className="crud-btn crud-btn-icon crud-btn-danger" onClick={() => eliminarProyecto(proyecto)} title="Eliminar proyecto"><Trash2 size={14} /></button></div></td></tr>);}))}
          </tbody>
        </table>
      </div>

      {mostrarModalCrear && (<div className="crud-modal-overlay" onClick={cerrarModalCrear}><div className="crud-modal-content" onClick={(e) => e.stopPropagation()}><h3 className="crud-modal-title">Crear Nuevo Proyecto</h3><form onSubmit={crearProyecto}><div className="crud-modal-form"><div className="crud-modal-column"><div className="crud-form-group"><label className="crud-label">Nombre del Proyecto *</label><div className="crud-input-with-counter"><input type="text" name="nombre" className="crud-input" value={formData.nombre} onChange={handleInputChange} required maxLength={20} placeholder="Nombre del proyecto..." /><span className={`crud-char-counter ${formData.nombre.length > 15 ? "crud-char-counter-warning" : ""} ${formData.nombre.length >= 20 ? "crud-char-counter-danger" : ""}`}>{formData.nombre.length}/20</span></div></div><div className="crud-form-group"><label className="crud-label">Cliente *</label><select name="clienteId" className="crud-select" value={formData.clienteId} onChange={handleInputChange} required><option value="">Seleccionar cliente...</option>{clientes.map((cliente) => (<option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>))}</select></div><div className="crud-form-group"><label className="crud-label">Responsable *</label><select name="responsableId" className="crud-select" value={formData.responsableId} onChange={handleInputChange} required><option value="">Seleccionar responsable...</option>{empleados.map((empleado) => (<option key={empleado.id} value={empleado.id}>{empleado.nombre} {empleado.apellido}</option>))}</select></div><div className="crud-form-group"><label className="crud-label">Fecha de Inicio</label><input type="date" name="fechaInicio" className="crud-input" value={formData.fechaInicio} onChange={handleInputChange} /></div></div><div className="crud-modal-column"><div className="crud-form-group"><label className="crud-label">Ubicación</label><div className="crud-input-with-counter"><input type="text" name="ubicacion" className="crud-input" value={formData.ubicacion} onChange={handleInputChange} maxLength={50} placeholder="Ubicación del proyecto..." /><span className={`crud-char-counter ${formData.ubicacion.length > 40 ? "crud-char-counter-warning" : ""} ${formData.ubicacion.length >= 50 ? "crud-char-counter-danger" : ""}`}>{formData.ubicacion.length}/50</span></div></div><div className="crud-form-group"><label className="crud-label">Cotización (Q)</label><input type="number" name="cotizacion" className="crud-input" value={formData.cotizacion} onChange={handleInputChange} step="any" min="0" max="9999999999.99" placeholder="0.00" /></div><div className="crud-form-group"><label className="crud-label">N° Cotización</label><input type="number" name="numCotizacion" className="crud-input" value={formData.numCotizacion} onChange={handleInputChange} min="0" placeholder="Ej: 12345" /></div><div className="crud-form-group"><label className="crud-label">Fecha Estimada de Finalización</label><input type="date" name="fechaAproxFin" className="crud-input" value={formData.fechaAproxFin} onChange={handleInputChange} /></div><div className="crud-form-group"><label className="crud-label">Estado del Proyecto</label><select name="status" className="crud-select" value={formData.status} onChange={handleInputChange}><option value="planificado">📋 Planificado</option><option value="en progreso">⚡ En Progreso</option><option value="pausado">⏸️ Pausado</option><option value="completado">✅ Completado</option><option value="cancelado">❌ Cancelado</option></select></div></div><div className="crud-modal-full-width"><div className="crud-form-group"><label className="crud-label">Descripción</label><div className="crud-input-with-counter"><textarea name="descripcion" className="crud-textarea" value={formData.descripcion} onChange={handleInputChange} rows="3" maxLength={50} placeholder="Descripción detallada del proyecto..." /><span className={`crud-char-counter ${formData.descripcion.length > 40 ? "crud-char-counter-warning" : ""} ${formData.descripcion.length >= 50 ? "crud-char-counter-danger" : ""}`}>{formData.descripcion.length}/50</span></div></div><div className="crud-form-group" style={{alignItems: "center",justifyContent: "center",marginTop: "10px"}}><label className="crud-checkbox-label"><input type="checkbox" name="aprobado" className="crud-checkbox" checked={formData.aprobado} onChange={handleInputChange} />Proyecto Aprobado</label></div></div></div><div className="crud-modal-actions"><button type="button" className="crud-btn crud-btn-light" onClick={cerrarModalCrear}>Cancelar</button><button type="submit" className="crud-btn crud-btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear Proyecto"}</button></div></form></div></div>)}

      {mostrarModalEditar && (<div className="crud-modal-overlay" onClick={cerrarModalEditar}><div className="crud-modal-content" onClick={(e) => e.stopPropagation()}><h3 className="crud-modal-title">Editar Proyecto</h3><form onSubmit={actualizarProyecto}><div className="crud-modal-form"><div className="crud-modal-column"><div className="crud-form-group"><label className="crud-label">Nombre del Proyecto *</label><div className="crud-input-with-counter"><input type="text" name="nombre" className="crud-input" value={formData.nombre} onChange={handleInputChange} required maxLength={20} placeholder="Nombre del proyecto..." /><span className={`crud-char-counter ${formData.nombre.length > 15 ? "crud-char-counter-warning" : ""} ${formData.nombre.length >= 20 ? "crud-char-counter-danger" : ""}`}>{formData.nombre.length}/20</span></div></div><div className="crud-form-group"><label className="crud-label">Cliente *</label><select name="clienteId" className="crud-select" value={formData.clienteId} onChange={handleInputChange} required><option value="">Seleccionar cliente...</option>{clientes.map((cliente) => (<option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>))}</select></div><div className="crud-form-group"><label className="crud-label">Responsable *</label><select name="responsableId" className="crud-select" value={formData.responsableId} onChange={handleInputChange} required><option value="">Seleccionar responsable...</option>{empleados.map((empleado) => (<option key={empleado.id} value={empleado.id}>{empleado.nombre} {empleado.apellido}</option>))}</select></div><div className="crud-form-group"><label className="crud-label">Fecha de Inicio</label><input type="date" name="fechaInicio" className="crud-input" value={formData.fechaInicio} onChange={handleInputChange} /></div></div><div className="crud-modal-column"><div className="crud-form-group"><label className="crud-label">Ubicación</label><div className="crud-input-with-counter"><input type="text" name="ubicacion" className="crud-input" value={formData.ubicacion} onChange={handleInputChange} maxLength={50} placeholder="Ubicación del proyecto..." /><span className={`crud-char-counter ${formData.ubicacion.length > 40 ? "crud-char-counter-warning" : ""} ${formData.ubicacion.length >= 50 ? "crud-char-counter-danger" : ""}`}>{formData.ubicacion.length}/50</span></div></div><div className="crud-form-group"><label className="crud-label">Cotización (Q)</label><input type="number" name="cotizacion" className="crud-input" value={formData.cotizacion} onChange={handleInputChange} step="any" min="0" max="9999999999.99" placeholder="0.00" /></div><div className="crud-form-group"><label className="crud-label">N° Cotización</label><input type="number" name="numCotizacion" className="crud-input" value={formData.numCotizacion} onChange={handleInputChange} min="0" placeholder="Ej: 12345" /></div><div className="crud-form-group"><label className="crud-label">Fecha Estimada de Finalización</label><input type="date" name="fechaAproxFin" className="crud-input" value={formData.fechaAproxFin} onChange={handleInputChange} /></div><div className="crud-form-group"><label className="crud-label">Fecha Real de Finalización</label><input type="date" name="fechaFin" className="crud-input" value={formData.fechaFin} onChange={handleInputChange} /></div></div><div className="crud-modal-full-width"><div className="crud-form-group"><label className="crud-label">Descripción</label><div className="crud-input-with-counter"><textarea name="descripcion" className="crud-textarea" value={formData.descripcion} onChange={handleInputChange} rows="3" maxLength={50} placeholder="Descripción detallada del proyecto..." /><span className={`crud-char-counter ${formData.descripcion.length > 40 ? "crud-char-counter-warning" : ""} ${formData.descripcion.length >= 50 ? "crud-char-counter-danger" : ""}`}>{formData.descripcion.length}/50</span></div></div><div style={{display: "grid",gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",gap: "15px"}}><div className="crud-form-group"><label className="crud-label">Estado del Proyecto</label><select name="status" className="crud-select" value={formData.status} onChange={handleInputChange}><option value="planificado">📋 Planificado</option><option value="en progreso">⚡ En Progreso</option><option value="pausado">⏸️ Pausado</option><option value="completado">✅ Completado</option><option value="cancelado">❌ Cancelado</option></select></div><div className="crud-form-group" style={{ alignItems: "center", justifyContent: "center" }}><label className="crud-checkbox-label"><input type="checkbox" name="aprobado" className="crud-checkbox" checked={formData.aprobado} onChange={handleInputChange} />Proyecto Aprobado</label></div></div><div className="crud-info-box"><p style={{margin: "0",fontSize: "14px",color: "#ffffff"}}><strong>Proyecto seleccionado:</strong> {proyectoSeleccionado?.nombre}</p></div></div></div><div className="crud-modal-actions"><button type="button" className="crud-btn crud-btn-light" onClick={cerrarModalEditar}>Cancelar</button><button type="submit" className="crud-btn crud-btn-primary" disabled={loading}>{loading ? "Actualizando..." : "Actualizar Proyecto"}</button></div></form></div></div>)}

      {mostrarModalReportes && (<div className="crud-modal-overlay" onClick={() => setMostrarModalReportes(false)}><div className="crud-modal-content" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}><h3 className="crud-modal-title">Generar Reporte de Proyectos</h3><form onSubmit={(e) => {e.preventDefault();generarReporte();}}><div className="crud-report-config"><div style={{display: "grid",gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",gap: "15px"}}><div className="crud-form-group"><label className="crud-label">Filtrar por Estado</label><select className="crud-select" value={configuracionReporte.statusSeleccionado} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,statusSeleccionado: e.target.value}))}><option value="todos">📂 Todos los estados</option><option value="planificado">📋 Planificado</option><option value="en progreso">⚡ En Progreso</option><option value="pausado">⏸️ Pausado</option><option value="completado">✅ Completado</option><option value="cancelado">❌ Cancelado</option></select></div><div className="crud-form-group"><label className="crud-label">Filtrar por Cliente</label><select className="crud-select" value={configuracionReporte.clienteSeleccionado} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,clienteSeleccionado: e.target.value}))}><option value="">Todos los clientes</option>{clientes.map((cliente) => (<option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>))}</select></div></div><div style={{display: "grid",gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",gap: "15px"}}><div className="crud-form-group"><label className="crud-label">Filtrar por Responsable</label><select className="crud-select" value={configuracionReporte.responsableSeleccionado || ""} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,responsableSeleccionado: e.target.value}))}><option value="">Todos los responsables</option>{empleados.map((empleado) => (<option key={empleado.id} value={empleado.id}>{empleado.nombre} {empleado.apellido}</option>))}</select></div><div className="crud-form-group"><label className="crud-label">Filtrar por Aprobación</label><select className="crud-select" value={configuracionReporte.aprobacionSeleccionada || "todos"} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,aprobacionSeleccionada: e.target.value}))}><option value="todos">📋 Todos</option><option value="aprobados">✅ Solo Aprobados</option><option value="pendientes">⏳ Solo Pendientes</option></select></div></div><div className="crud-form-group"><label className="crud-label">Contenido del Reporte</label><div className="crud-checkbox-group"><label className="crud-checkbox-label"><input type="checkbox" className="crud-checkbox" checked={configuracionReporte.incluirFechas} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,incluirFechas: e.target.checked}))} />Incluir fechas del proyecto (inicio y fin estimado)</label><label className="crud-checkbox-label"><input type="checkbox" className="crud-checkbox" checked={configuracionReporte.incluirFinanzas} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,incluirFinanzas: e.target.checked}))} />Incluir información financiera (cotizaciones)</label><label className="crud-checkbox-label"><input type="checkbox" className="crud-checkbox" checked={configuracionReporte.incluirAprobacion} onChange={(e) => setConfiguracionReporte((prev) => ({...prev,incluirAprobacion: e.target.checked}))} />Incluir estado de aprobación</label></div></div><div className="crud-preview-section"><h4 style={{margin: "0 0 12px 0",fontSize: "16px",fontWeight: "600",color: "#ffffff"}}>Vista Previa del Reporte</h4><div className="crud-preview-content"><p style={{ margin: "8px 0" }}><strong>Proyectos estimados:</strong> {(() => {let filtrados = [...proyectosFiltrados];if (configuracionReporte.statusSeleccionado !== "todos") {filtrados = filtrados.filter((p) => p.status === configuracionReporte.statusSeleccionado);}if (configuracionReporte.clienteSeleccionado) {filtrados = filtrados.filter((p) => p.clienteId == configuracionReporte.clienteSeleccionado);}if (configuracionReporte.responsableSeleccionado) {filtrados = filtrados.filter((p) => p.responsableId == configuracionReporte.responsableSeleccionado);}if (configuracionReporte.aprobacionSeleccionada !== "todos") {if (configuracionReporte.aprobacionSeleccionada === "aprobados") {filtrados = filtrados.filter((p) => p.aprobado === true || p.aprobado === 1);} else if (configuracionReporte.aprobacionSeleccionada === "pendientes") {filtrados = filtrados.filter((p) => p.aprobado === false || p.aprobado === 0 || !p.aprobado);}}return filtrados.length;})()} proyectos</p></div></div></div><div className="crud-modal-actions"><button type="button" className="crud-btn crud-btn-light" onClick={() => setMostrarModalReportes(false)}>Cancelar</button><button type="submit" className="crud-btn crud-btn-primary" disabled={loading}>{loading ? "Generando..." : "Generar Reporte PDF"}</button></div></form></div></div>)}
    </div>
  );
};

export default ProyectosCRUD;