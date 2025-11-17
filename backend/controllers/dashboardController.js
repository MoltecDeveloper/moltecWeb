// controllers/dashboardController.js - Controlador para Dashboard MOLTEC S.A.
const db = require('../db');

// 📊 OBTENER TODOS LOS DATOS DEL DASHBOARD
const obtenerDatosDashboard = async (req, res) => {
  try {
    console.log("📊 Obteniendo todos los datos del dashboard...");

    // OBTENER TODAS LAS ESTADÍSTICAS EN PARALELO
    const [
      totalMateriales,
      totalHerramientas, 
      totalEmpleados,
      totalClientes,
      proyectosActivos,
      estadoHerramientas,
      stockHerramientas,
      stockMateriales,
      topMaterialesHerramientas,
      clientesDelMes
    ] = await Promise.all([
      obtenerTotalMateriales(),
      obtenerTotalHerramientas(),
      obtenerTotalEmpleados(),
      obtenerTotalClientes(),
      obtenerProyectosActivos(),
      obtenerEstadoHerramientas(),
      obtenerStockHerramientas(),
      obtenerStockMateriales(),
      obtenerTopMaterialesHerramientas(),
      obtenerClientesDelMes()
    ]);

    console.log("✅ Datos del dashboard obtenidos exitosamente");

    res.json({
      success: true,
      data: {
        totales: {
          materiales: totalMateriales,
          herramientas: totalHerramientas,
          empleados: totalEmpleados,
          clientes: totalClientes,
          proyectosActivos: proyectosActivos
        },
        graficasPie: {
          estadoHerramientas,
          stockHerramientas,
          stockMateriales
        },
        graficasBarras: {
          topMaterialesHerramientas,
          clientesDelMes
        }
      }
    });

  } catch (error) {
    console.error("❌ Error al obtener datos del dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: error.message
    });
  }
};

// 📦 TOTAL DE MATERIALES ACTIVOS
const obtenerTotalMateriales = async () => {
  const query = `
    SELECT COUNT(*) as total
    FROM tbl_inventario_materiales 
    WHERE inventario_materiales_status = 1
  `;
  const [result] = await db.query(query);
  return result[0].total;
};

// 🔧 TOTAL DE HERRAMIENTAS ACTIVAS
const obtenerTotalHerramientas = async () => {
  const query = `
    SELECT COUNT(*) as total
    FROM tbl_inventario_herramientas 
    WHERE inventario_status = 1
  `;
  const [result] = await db.query(query);
  return result[0].total;
};

// 👥 TOTAL DE EMPLEADOS ACTIVOS
const obtenerTotalEmpleados = async () => {
  const query = `
    SELECT COUNT(*) as total
    FROM tbl_empleado 
    WHERE empleado_status = 'activo' AND empleado_status_registro = 1
  `;
  const [result] = await db.query(query);
  return result[0].total;
};

// 👤 TOTAL DE CLIENTES ACTIVOS
const obtenerTotalClientes = async () => {
  const query = `
    SELECT COUNT(*) as total
    FROM tbl_cliente 
    WHERE cliente_status = 1
  `;
  const [result] = await db.query(query);
  return result[0].total;
};

// 🏗️ PROYECTOS ACTIVOS (EN PROGRESO)
const obtenerProyectosActivos = async () => {
  const query = `
    SELECT COUNT(*) as total
    FROM tbl_proyecto 
    WHERE proyecto_status = 'en progreso' AND proyecto_status_registro = 1
  `;
  const [result] = await db.query(query);
  return result[0].total;
};

// 🔧 ESTADO DE HERRAMIENTAS (GRÁFICA PIE)
const obtenerEstadoHerramientas = async () => {
  const query = `
    SELECT 
      inventario_estado as estado,
      COUNT(*) as cantidad
    FROM tbl_inventario_herramientas 
    WHERE inventario_status = 1
    GROUP BY inventario_estado
    ORDER BY cantidad DESC
  `;
  const [result] = await db.query(query);
  
  return {
    labels: result.map(row => row.estado || 'Sin Estado'),
    data: result.map(row => row.cantidad),
    backgroundColor: [
      '#48bb78', // Verde - Nuevo/Buen estado
      '#ed8936', // Naranja - Desgastado  
      '#e53e3e', // Rojo - En reparación
      '#805ad5', // Púrpura - Baja
      '#38b2ac'  // Teal - Otros
    ]
  };
};

// 📊 STOCK DE HERRAMIENTAS (GRÁFICA PIE)
const obtenerStockHerramientas = async () => {
  const query = `
    SELECT 
      CASE 
        WHEN inventario_herramientas_cantidad_actual < inventario_herramientas_cantidad_minima THEN 'Stock Crítico'
        WHEN inventario_herramientas_cantidad_actual <= inventario_herramientas_cantidad_minima * 2 THEN 'Stock Bajo'
        ELSE 'Stock Normal'
      END as estadoStock,
      COUNT(*) as cantidad
    FROM tbl_inventario_herramientas 
    WHERE inventario_status = 1
    GROUP BY estadoStock
    ORDER BY cantidad DESC
  `;
  const [result] = await db.query(query);
  
  return {
    labels: result.map(row => row.estadoStock),
    data: result.map(row => row.cantidad),
    backgroundColor: [
      '#48bb78', // Verde - Stock Normal
      '#ed8936', // Naranja - Stock Bajo
      '#e53e3e'  // Rojo - Stock Crítico
    ]
  };
};

// 📦 STOCK DE MATERIALES (GRÁFICA PIE)
const obtenerStockMateriales = async () => {
  const query = `
    SELECT 
      CASE 
        WHEN inventario_materiales_cantidad_actual < inventario_materiales_cantidad_minima THEN 'Stock Crítico'
        WHEN inventario_materiales_cantidad_actual <= inventario_materiales_cantidad_minima * 2 THEN 'Stock Bajo'
        ELSE 'Stock Normal'
      END as estadoStock,
      COUNT(*) as cantidad
    FROM tbl_inventario_materiales 
    WHERE inventario_materiales_status = 1
    GROUP BY estadoStock
    ORDER BY cantidad DESC
  `;
  const [result] = await db.query(query);
  
  return {
    labels: result.map(row => row.estadoStock),
    data: result.map(row => row.cantidad),
    backgroundColor: [
      '#48bb78', // Verde - Stock Normal
      '#ed8936', // Naranja - Stock Bajo
      '#e53e3e'  // Rojo - Stock Crítico
    ]
  };
};

// 📈 TOP 10 MATERIALES/HERRAMIENTAS CON MÁS SALIDAS DEL MES
const obtenerTopMaterialesHerramientas = async () => {
  // Obtener primer y último día del mes actual
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ultimoDiaMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  // SALIDAS DE MATERIALES DEL MES
  const queryMateriales = `
    SELECT 
      m.inventario_materiales_nombre as nombre,
      'Material' as tipo,
      SUM(s.cantidad) as totalSalidas
    FROM tbl_salida_inventario s
    INNER JOIN tbl_inventario_materiales m ON s.id_material = m.pk_inventario_materiales_id
    WHERE s.fecha_salida >= ? AND s.fecha_salida <= ?
    AND m.inventario_materiales_status = 1
    AND s.id_material IS NOT NULL
    GROUP BY s.id_material, m.inventario_materiales_nombre
    ORDER BY totalSalidas DESC
    LIMIT 5
  `;

  // SALIDAS DE HERRAMIENTAS DEL MES
  const queryHerramientas = `
    SELECT 
      h.inventario_herramientas_nombre as nombre,
      'Herramienta' as tipo,
      SUM(s.cantidad) as totalSalidas
    FROM tbl_salida_inventario s
    INNER JOIN tbl_inventario_herramientas h ON s.id_herramienta = h.pk_inventario_herramientas_id
    WHERE s.fecha_salida >= ? AND s.fecha_salida <= ?
    AND h.inventario_status = 1
    AND s.id_herramienta IS NOT NULL
    GROUP BY s.id_herramienta, h.inventario_herramientas_nombre
    ORDER BY totalSalidas DESC
    LIMIT 5
  `;

  try {
    const [materiales] = await db.query(queryMateriales, [primerDiaMes, ultimoDiaMes]);
    const [herramientas] = await db.query(queryHerramientas, [primerDiaMes, ultimoDiaMes]);

    // COMBINAR Y ORDENAR TOP 10
    const todos = [...materiales, ...herramientas]
      .sort((a, b) => b.totalSalidas - a.totalSalidas)
      .slice(0, 10);

    return {
      labels: todos.map(item => `${item.nombre} (${item.tipo})`),
      data: todos.map(item => item.totalSalidas),
      backgroundColor: todos.map((_, index) => {
        const colors = [
          '#667eea', '#48bb78', '#ed8936', '#e53e3e', '#38b2ac',
          '#9f7aea', '#4299e1', '#f56565', '#805ad5', '#68d391'
        ];
        return colors[index] || '#a0aec0';
      })
    };
  } catch (error) {
    console.error("Error en consulta de salidas:", error);
    // Si hay error, devolver datos vacíos en lugar de fallar
    return {
      labels: [],
      data: [],
      backgroundColor: []
    };
  }
};

// 👥 CLIENTES REGISTRADOS POR SEMANA DEL MES ACTUAL
const obtenerClientesDelMes = async () => {
  // Obtener primer día del mes actual
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ultimoDiaMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const query = `
    SELECT 
      WEEK(cliente_fecha_registro, 1) - WEEK(DATE_SUB(cliente_fecha_registro, INTERVAL DAYOFMONTH(cliente_fecha_registro)-1 DAY), 1) + 1 as semana,
      COUNT(*) as cantidad
    FROM tbl_cliente 
    WHERE cliente_fecha_registro >= ? AND cliente_fecha_registro <= ?
    AND cliente_status = 1
    GROUP BY semana
    ORDER BY semana
  `;

  const [result] = await db.query(query, [primerDiaMes, ultimoDiaMes]);
  
  // ASEGURAR QUE TENEMOS 4-5 SEMANAS
  const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];
  const datos = semanas.map((_, index) => {
    const semana = result.find(r => r.semana === index + 1);
    return semana ? semana.cantidad : 0;
  });

  return {
    labels: semanas,
    data: datos,
    backgroundColor: [
      '#667eea', '#48bb78', '#ed8936', '#38b2ac', '#9f7aea'
    ]
  };
};

module.exports = {
  obtenerDatosDashboard
};