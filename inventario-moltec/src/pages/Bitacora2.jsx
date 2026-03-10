// pages/BitacoraCRUD.jsx - Bitácora con CSS externo
import React, { useState, useEffect } from "react";
import { FileText, Activity, Users, TrendingUp, Calendar, Search, Filter, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle, Plus, Minus, Eye, Clock, Package, Wrench, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "react-toastify";
import bitacoraApi from "../services/bitacoraApi";
import herramientasApi from "../services/herramientasApi";
import materialesApi from "../services/materialesApi";
import "./Bitacora.css";

const BitacoraCRUD = () => {
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [estadisticasBitacora, setEstadisticasBitacora] = useState(null);
const [registrosBitacora, setRegistrosBitacora] = useState([]);
const [movimientosHerramientas, setMovimientosHerramientas] = useState([]);
const [movimientosMateriales, setMovimientosMateriales] = useState([]);
const [busqueda, setBusqueda] = useState("");
const [filtros, setFiltros] = useState({tipoEvento: "todos", fechaInicio: "", fechaFin: "", usuario: "todos"});
const [tablaActiva, setTablaActiva] = useState("estadisticas");
const [mostrarFiltros, setMostrarFiltros] = useState(false);

const isMobile = () => window.innerWidth <= 768;
const isSmallMobile = () => window.innerWidth <= 640;

useEffect(() => { cargarDatos(); }, []);

const cargarDatos = async () => {
try {
setLoading(true);
setError(null);
const [statsResponse, bitacoraResponse, herramientasResponse, materialesResponse] = await Promise.all([bitacoraApi.obtenerEstadisticas(), bitacoraApi.obtenerRecientes(100), herramientasApi.obtenerMovimientosHerramientas(), materialesApi.obtenerMovimientosMateriales()]);
if (statsResponse?.success) { setEstadisticasBitacora(statsResponse.data); }
if (bitacoraResponse?.success) { setRegistrosBitacora(bitacoraResponse.data || []); }
if (herramientasResponse?.success) { setMovimientosHerramientas(herramientasResponse.data || []); }
if (materialesResponse?.success) { setMovimientosMateriales(materialesResponse.data || []); }
} catch (error) { console.error("Error al cargar datos:", error); setError(`Error al cargar datos: ${error.message}`); toast.error("Error al cargar los datos de bitácora"); } finally { setLoading(false); }
};

const recargarDatos = async () => { toast.info("Recargando datos..."); setBusqueda(""); setFiltros({tipoEvento: "todos", fechaInicio: "", fechaFin: "", usuario: "todos"}); await cargarDatos(); toast.success("Datos actualizados"); };

const cambiarTabla = (tabla) => { setTablaActiva(tabla); setBusqueda(""); };

const obtenerDatosFiltrados = () => {
let datos = [];
switch (tablaActiva) {
case "bitacora": datos = registrosBitacora; break;
case "ingresoHerramientas": datos = movimientosHerramientas.filter((m) => m.tipo === "ingreso"); break;
case "salidaHerramientas": datos = movimientosHerramientas.filter((m) => m.tipo === "salida"); break;
case "ingresoMateriales": datos = movimientosMateriales.filter((m) => m.tipo === "ingreso"); break;
case "salidaMateriales": datos = movimientosMateriales.filter((m) => m.tipo === "salida"); break;
default: return [];
}
if (busqueda.trim()) { const termino = busqueda.toLowerCase(); datos = datos.filter((item) => { if (tablaActiva === "bitacora") { return (item.bitacora_descripcion?.toLowerCase().includes(termino) || item.usuario_nombre?.toLowerCase().includes(termino)); } else { return (item.herramienta?.toLowerCase().includes(termino) || item.material?.toLowerCase().includes(termino) || item.motivo?.toLowerCase().includes(termino)); } }); }
return datos;
};

const exportarDatos = async () => {
try {
const datosFiltrados = obtenerDatosFiltrados();
if (tablaActiva === "bitacora") { await bitacoraApi.descargarBitacoraCSV(datosFiltrados); } else { const headers = ["Tipo", "Item", "Cantidad", "Motivo", "Fecha"]; const rows = datosFiltrados.map((item) => [item.tipo, item.herramienta || item.material || "N/A", item.cantidad || "N/A", item.motivo || "Sin motivo", item.fecha || "Sin fecha"]); const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n"); const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"}); const url = window.URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${tablaActiva}_${new Date().toISOString().split("T")[0]}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url); }
toast.success("Datos exportados exitosamente");
} catch (error) { console.error("Error al exportar:", error); toast.error("Error al exportar datos"); }
};

const formatearFecha = (fecha) => { if (!fecha) return "Sin fecha"; const d = new Date(fecha); if (isNaN(d.getTime())) return "Sin fecha"; return d.toLocaleDateString("es-GT", {year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"}); };

const obtenerColorTipoEvento = (descripcion) => { return bitacoraApi.getColorTipoEvento(descripcion); };

const renderEstadisticas = () => {
if (!estadisticasBitacora) return null;
const { general, tiposEventoRecientes, usuariosActivos, actividadDiaria } = estadisticasBitacora;
return (
<div className="bitacora-estadisticas-container">
<div className="bitacora-stats-container">
<div className="bitacora-stat-card" style={{background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"}}><div className="bitacora-stat-card-content"><FileText size={24} color="white" /><div><h3 className="bitacora-stat-title" style={{color: "white"}}>Total Registros</h3><p className="bitacora-stat-number" style={{color: "white"}}>{general.totalRegistros?.toLocaleString() || 0}</p></div></div></div>
<div className="bitacora-stat-card" style={{background: "linear-gradient(135deg, #059669 0%, #047857 100%)"}}><div className="bitacora-stat-card-content"><Users size={24} color="white" /><div><h3 className="bitacora-stat-title" style={{color: "white"}}>Usuarios Activos</h3><p className="bitacora-stat-number" style={{color: "white"}}>{general.usuariosActivos || 0}</p></div></div></div>
<div className="bitacora-stat-card" style={{background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"}}><div className="bitacora-stat-card-content"><Wrench size={24} color="white" /><div><h3 className="bitacora-stat-title" style={{color: "white"}}>Mov. Herramientas</h3><p className="bitacora-stat-number" style={{color: "white"}}>{movimientosHerramientas.length}</p></div></div></div>
<div className="bitacora-stat-card" style={{background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)"}}><div className="bitacora-stat-card-content"><Package size={24} color="white" /><div><h3 className="bitacora-stat-title" style={{color: "white"}}>Mov. Materiales</h3><p className="bitacora-stat-number" style={{color: "white"}}>{movimientosMateriales.length}</p></div></div></div>
</div>
<div className="bitacora-charts-container">
<div className="bitacora-chart-card"><h3 className="bitacora-chart-title">Tipos de Eventos (Últimos 30 días)</h3><div className="bitacora-chart-content">{tiposEventoRecientes?.map((evento, index) => (<div key={index} className="bitacora-chart-item"><span className="bitacora-chart-label">{evento.tipoEvento}</span><span className="bitacora-chart-value">{evento.cantidad}</span></div>))}</div></div>
<div className="bitacora-chart-card"><h3 className="bitacora-chart-title">Usuarios Más Activos</h3><div className="bitacora-chart-content">{usuariosActivos?.map((usuario, index) => (<div key={index} className="bitacora-chart-item"><span className="bitacora-chart-label">{usuario.usuario}</span><span className="bitacora-chart-value">{usuario.registros}</span></div>))}</div></div>
</div>
</div>
);
};

const renderTabla = () => {
const datos = obtenerDatosFiltrados();
if (tablaActiva === "bitacora") {
return (
<table className="bitacora-table"><thead><tr><th className="bitacora-table-th">Fecha</th><th className="bitacora-table-th">Usuario</th><th className="bitacora-table-th">Descripción</th></tr></thead><tbody>{datos.length === 0 ? (<tr><td colSpan="3" className="bitacora-empty-message">{busqueda ? "No se encontraron registros que coincidan con la búsqueda" : "No hay registros de bitácora"}</td></tr>) : (datos.map((registro, index) => {const colorEvento = obtenerColorTipoEvento(registro.bitacora_descripcion); return (<tr key={index} className="bitacora-table-row"><td className="bitacora-table-td"><div className="bitacora-date-info"><Clock size={14} color="rgba(255,255,255,0.55)" /><span>{formatearFecha(registro.bitacora_fecha)}</span></div></td><td className="bitacora-table-td"><div className="bitacora-user-info"><Users size={14} color="rgba(255,255,255,0.55)" /><span>{registro.usuario_nombre || "Usuario desconocido"}</span></div></td><td className="bitacora-table-td"><span className="bitacora-event-badge" style={{color: colorEvento.color, backgroundColor: colorEvento.bg}}>{registro.bitacora_descripcion}</span></td></tr>);})
)}</tbody></table>
);
} else {
return (
<table className="bitacora-table"><thead><tr><th className="bitacora-table-th"><div className="bitacora-movement-header">{tablaActiva.includes("ingreso") ? (<ArrowUp size={16} color="#68d391" />) : (<ArrowDown size={16} color="#fc8181" />)}Tipo</div></th><th className="bitacora-table-th">Item</th><th className="bitacora-table-th">Cantidad</th><th className="bitacora-table-th" style={{display: isMobile() ? "none" : "table-cell"}}>Motivo</th><th className="bitacora-table-th">Fecha</th></tr></thead><tbody>{datos.length === 0 ? (<tr><td colSpan="5" className="bitacora-empty-message">{busqueda ? "No se encontraron movimientos que coincidan con la búsqueda" : "No hay movimientos registrados"}</td></tr>) : (datos.map((movimiento, index) => (<tr key={index} className="bitacora-table-row"><td className="bitacora-table-td"><span className="bitacora-movement-badge" style={{backgroundColor: movimiento.tipo === "ingreso" ? "#276749" : "#c53030", color: "#ffffff"}}>{movimiento.tipo === "ingreso" ? "Ingreso" : "Salida"}</span></td><td className="bitacora-table-td"><div className="bitacora-item-info">{tablaActiva.includes("Herramientas") ? (<Wrench size={14} color="rgba(255,255,255,0.55)" />) : (<Package size={14} color="rgba(255,255,255,0.55)" />)}<span>{movimiento.herramienta || movimiento.material || "N/A"}</span></div></td><td className="bitacora-table-td"><span className="bitacora-quantity-text">{movimiento.cantidad || "N/A"}</span></td><td className="bitacora-table-td" style={{display: isMobile() ? "none" : "table-cell"}}><span className="bitacora-reason-text">{movimiento.motivo || "Sin motivo especificado"}</span></td><td className="bitacora-table-td"><div className="bitacora-date-info"><Calendar size={14} color="rgba(255,255,255,0.55)" /><span>{formatearFecha(movimiento.fecha)}</span></div></td></tr>))
)}</tbody></table>
);
}
};

if (loading) {
return (<div className="bitacora-loading-container"><div className="bitacora-spinner"></div><p>Cargando datos de bitácora...</p></div>);
}

if (error) {
return (<div className="bitacora-error-container"><AlertTriangle size={48} color="#fc8181" /><h2>Error al cargar datos</h2><p>{error}</p><button className="bitacora-retry-button" onClick={cargarDatos}><RefreshCw size={16} />Reintentar</button></div>);
}

return (
<div className="bitacora-container">
<div className="bitacora-header"><div className="bitacora-title-section"><div><h1 className="bitacora-title"><FileText size={32} style={{marginRight: "12px"}} />Bitácora del Sistema</h1><p className="bitacora-subtitle">Monitoreo completo de actividades y movimientos en MOLTEC S.A.</p></div></div><div className="bitacora-header-actions"><button className="bitacora-refresh-button" onClick={recargarDatos}><RefreshCw size={16} />Actualizar</button>{tablaActiva !== "estadisticas" && (<button className="bitacora-export-button" onClick={exportarDatos}><Download size={16} />Exportar</button>)}</div></div>

<div className="bitacora-tab-navigation">
<button className={tablaActiva === "estadisticas" ? "bitacora-tab-button-active" : "bitacora-tab-button"} onClick={() => cambiarTabla("estadisticas")}><TrendingUp size={16} />Estadísticas</button>
<button className={tablaActiva === "bitacora" ? "bitacora-tab-button-active" : "bitacora-tab-button"} onClick={() => cambiarTabla("bitacora")}><FileText size={16} />Bitácora</button>
<button className={tablaActiva === "ingresoMateriales" ? "bitacora-tab-button-active" : "bitacora-tab-button"} onClick={() => cambiarTabla("ingresoMateriales")}><ArrowUp size={16} />Ingreso Materiales</button>
<button className={tablaActiva === "salidaMateriales" ? "bitacora-tab-button-active" : "bitacora-tab-button"} onClick={() => cambiarTabla("salidaMateriales")}><ArrowDown size={16} />Salida Materiales</button>
<button className={tablaActiva === "ingresoHerramientas" ? "bitacora-tab-button-active" : "bitacora-tab-button"} onClick={() => cambiarTabla("ingresoHerramientas")}><ArrowUp size={16} />Ingreso Herramientas</button>
<button className={tablaActiva === "salidaHerramientas" ? "bitacora-tab-button-active" : "bitacora-tab-button"} onClick={() => cambiarTabla("salidaHerramientas")}><ArrowDown size={16} />Salida Herramientas</button>
</div>

{tablaActiva === "estadisticas" ? (
renderEstadisticas()
) : (
<>
<div className="bitacora-search-container"><div className="bitacora-search-box"><Search size={20} color="rgba(255,255,255,0.55)" /><input type="text" className="bitacora-search-input" placeholder={tablaActiva === "bitacora" ? "Buscar en bitácora por descripción, usuario..." : "Buscar movimientos por item, motivo..."} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div></div>

<div className="bitacora-table-container"><div className="bitacora-table-header"><h2 className="bitacora-table-title">{tablaActiva === "bitacora" && "Registros de Bitácora"}{tablaActiva === "ingresoMateriales" && "Ingresos de Materiales"}{tablaActiva === "salidaMateriales" && "Salidas de Materiales"}{tablaActiva === "ingresoHerramientas" && "Ingresos de Herramientas"}{tablaActiva === "salidaHerramientas" && "Salidas de Herramientas"} ({obtenerDatosFiltrados().length})</h2></div><div className="bitacora-table-content">{renderTabla()}</div></div>
</>
)}
</div>
);
};

export default BitacoraCRUD;