// controllers/herramientasController.js
const db = require("../db");
const {
  registrarEnBitacora,
  TIPOS_EVENTO,
} = require("../helpers/bitacoraHelper");
const { getUserId } = require("../middleware/authMiddleware");

// 🔧 CONFIGURACIÓN REUTILIZABLE - Específica para herramientas
const TABLE_CONFIG = {
  tableName: "tbl_inventario_herramientas",
  primaryKey: "pk_inventario_herramientas_id",
  fields: {
    nombre: "inventario_herramientas_nombre",
    marca: "inventario_herramientas_marca",
    modelo: "inventario_herramientas_modelo",
    descripcion: "inventario_herramientas_descripcion",
    medida: "inventario_herramientas_medida",
    cantidadActual: "inventario_herramientas_cantidad_actual",
    cantidadMinima: "inventario_herramientas_cantidad_minima",
    fechaIngreso: "inventario_fecha_ingreso",
    fechaActualizacion: "inventario_fecha_actualizacion",
    estado: "inventario_estado",
    status: "inventario_status",
  },
};

// 📋 OBTENER TODAS LAS HERRAMIENTAS
// 📋 OBTENER TODAS LAS HERRAMIENTAS - Solo las activas
const obtenerHerramientas = async (req, res) => {
  try {
    console.log("🔧 Obteniendo lista de herramientas activas...");

    const query = `
      SELECT 
        ${TABLE_CONFIG.primaryKey} as id,
        ${TABLE_CONFIG.fields.nombre} as nombre,
        ${TABLE_CONFIG.fields.marca} as marca,
        ${TABLE_CONFIG.fields.modelo} as modelo,
        ${TABLE_CONFIG.fields.descripcion} as descripcion,
        ${TABLE_CONFIG.fields.medida} as medida,
        ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual,
        ${TABLE_CONFIG.fields.cantidadMinima} as cantidadMinima,
        ${TABLE_CONFIG.fields.fechaIngreso} as fechaIngreso,
        ${TABLE_CONFIG.fields.fechaActualizacion} as fechaActualizacion,
        ${TABLE_CONFIG.fields.estado} as estado
      FROM ${TABLE_CONFIG.tableName}
      WHERE inventario_status = 1
      ORDER BY ${TABLE_CONFIG.primaryKey} DESC
    `;

    const [herramientas] = await db.query(query);

    console.log(
      `✅ Se encontraron ${herramientas.length} herramientas activas`
    );

    res.json({
      success: true,
      data: herramientas,
      total: herramientas.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener herramientas:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// ➕ CREAR NUEVA HERRAMIENTA
const crearHerramienta = async (req, res) => {
  try {
    const {
      nombre,
      marca,
      modelo,
      descripcion,
      medida,
      cantidadActual,
      cantidadMinima,
      estado,
    } = req.body;

    console.log("➕ Creando nueva herramienta:", { nombre, marca, modelo });

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: "El nombre es obligatorio",
      });
    }

    // Validar límites de caracteres
    if (nombre.length > 30) {
      return res.status(400).json({
        success: false,
        error: "El nombre no puede exceder 30 caracteres",
      });
    }

    if (marca && marca.length > 15) {
      return res.status(400).json({
        success: false,
        error: "La marca no puede exceder 15 caracteres",
      });
    }

    if (modelo && modelo.length > 15) {
      return res.status(400).json({
        success: false,
        error: "El modelo no puede exceder 15 caracteres",
      });
    }

    if (descripcion && descripcion.length > 40) {
      return res.status(400).json({
        success: false,
        error: "La descripción no puede exceder 40 caracteres",
      });
    }

    if (medida && medida.length > 20) {
      return res.status(400).json({
        success: false,
        error: "La medida no puede exceder 20 caracteres",
      });
    }

    // Validar cantidades
    if (cantidadActual < 0 || cantidadMinima < 0) {
      return res.status(400).json({
        success: false,
        error: "Las cantidades no pueden ser negativas",
      });
    }

    // Validar estado
    const estadosValidos = [
      "Nuevo",
      "En buen estado",
      "Desgastado",
      "En reparación",
      "Baja",
    ];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: "Estado inválido",
      });
    }

    // // Verificar si ya existe una herramienta con el mismo nombre
    // const checkQuery = `
    //   SELECT COUNT(*) as count 
    //   FROM ${TABLE_CONFIG.tableName} 
    //   WHERE ${TABLE_CONFIG.fields.nombre} = ? AND inventario_status = 1
    // `;
    // const [existing] = await db.query(checkQuery, [nombre]);

    // if (existing[0].count > 0) {
    //   return res.status(409).json({
    //     success: false,
    //     error: "Ya existe una herramienta activa con ese nombre",
    //   });
    // }

    // Insertar nueva herramienta (inventario_status será 1 por defecto)
    const insertQuery = `
      INSERT INTO ${TABLE_CONFIG.tableName} (
        ${TABLE_CONFIG.fields.nombre},
        ${TABLE_CONFIG.fields.marca},
        ${TABLE_CONFIG.fields.modelo},
        ${TABLE_CONFIG.fields.descripcion},
        ${TABLE_CONFIG.fields.medida},
        ${TABLE_CONFIG.fields.cantidadActual},
        ${TABLE_CONFIG.fields.cantidadMinima},
        ${TABLE_CONFIG.fields.estado}
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertQuery, [
      nombre,
      marca || null,
      modelo || null,
      descripcion || null,
      medida || null,
      cantidadActual || 0,
      cantidadMinima || 0,
      estado || "Nuevo",
    ]);

    console.log(`✅ Herramienta creada con ID: ${result.insertId}`);

    await registrarEnBitacora(
      TIPOS_EVENTO.HERRAMIENTA_CREADA,
      getUserId(req) || 1,
      {
        id: result.insertId,
        nombre: nombre,
        marca: marca || null,
        modelo: modelo || null,
      },
      req
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: "Herramienta creada exitosamente",
      },
    });
  } catch (error) {
    console.error("❌ Error al crear herramienta:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// ✏️ ACTUALIZAR HERRAMIENTA
const actualizarHerramienta = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      marca,
      modelo,
      descripcion,
      medida,
      cantidadMinima,
      estado,
    } = req.body;

    console.log(`✏️ Actualizando herramienta ID: ${id}`);

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: "El nombre es obligatorio",
      });
    }

    // Validar límites de caracteres (igual que en crear)
    if (nombre.length > 30) {
      return res.status(400).json({
        success: false,
        error: "El nombre no puede exceder 30 caracteres",
      });
    }

    if (marca && marca.length > 15) {
      return res.status(400).json({
        success: false,
        error: "La marca no puede exceder 15 caracteres",
      });
    }

    if (modelo && modelo.length > 15) {
      return res.status(400).json({
        success: false,
        error: "El modelo no puede exceder 15 caracteres",
      });
    }

    if (descripcion && descripcion.length > 40) {
      return res.status(400).json({
        success: false,
        error: "La descripción no puede exceder 40 caracteres",
      });
    }

    if (medida && medida.length > 20) {
      return res.status(400).json({
        success: false,
        error: "La medida no puede exceder 20 caracteres",
      });
    }

    // Validar estado
    const estadosValidos = [
      "Nuevo",
      "En buen estado",
      "Desgastado",
      "En reparación",
      "Baja",
    ];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: "Estado inválido",
      });
    }

    // Verificar que la herramienta existe
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;
    const [existing] = await db.query(checkQuery, [id]);

    if (existing[0].count === 0) {
      return res.status(404).json({
        success: false,
        error: "Herramienta no encontrada",
      });
    }

    // Actualizar herramienta
    const updateQuery = `
      UPDATE ${TABLE_CONFIG.tableName} 
      SET 
        ${TABLE_CONFIG.fields.nombre} = ?,
        ${TABLE_CONFIG.fields.marca} = ?,
        ${TABLE_CONFIG.fields.modelo} = ?,
        ${TABLE_CONFIG.fields.descripcion} = ?,
        ${TABLE_CONFIG.fields.medida} = ?,
        ${TABLE_CONFIG.fields.cantidadMinima} = ?,
        ${TABLE_CONFIG.fields.estado} = ?
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;

    await db.query(updateQuery, [
      nombre,
      marca || null,
      modelo || null,
      descripcion || null,
      medida || null,
      cantidadMinima || 0,
      estado || "Nuevo",
      id,
    ]);

    console.log(`✅ Herramienta ID ${id} actualizada exitosamente`);

    await registrarEnBitacora(
      TIPOS_EVENTO.HERRAMIENTA_ACTUALIZADA,
      getUserId(req) || 1,
      {
        id: id,
        nombre: nombre,
      },
      req
    );

    res.json({
      success: true,
      message: "Herramienta actualizada exitosamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar herramienta:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 🔥 INGRESO DE STOCK (aumentar cantidad) - CON HISTORIAL
const ingresoStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    console.log(
      `🔥 Ingreso de stock - Herramienta ID: ${id}, Cantidad: ${cantidad}`
    );

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad debe ser mayor a 0",
      });
    }

    // Verificar que la herramienta existe y obtener cantidad actual
    // En ambas funciones, cambiar la consulta de verificación:
    const getHerramientaQuery = `
  SELECT 
    ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual,
    ${TABLE_CONFIG.fields.nombre} as nombre
  FROM ${TABLE_CONFIG.tableName} 
  WHERE ${TABLE_CONFIG.primaryKey} = ? AND inventario_status = 1
`;
    const [herramienta] = await db.query(getHerramientaQuery, [id]);

    if (herramienta.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Herramienta no encontrada",
      });
    }

    const cantidadAnterior = parseFloat(herramienta[0].cantidadActual) || 0;
    const nuevaCantidad = cantidadAnterior + parseFloat(cantidad);

    // 📄 INICIAR TRANSACCIÓN PARA GARANTIZAR CONSISTENCIA
    await db.query("START TRANSACTION");

    try {
      // 1️⃣ Actualizar stock de la herramienta
      const updateQuery = `
        UPDATE ${TABLE_CONFIG.tableName} 
        SET ${TABLE_CONFIG.fields.cantidadActual} = ?
        WHERE ${TABLE_CONFIG.primaryKey} = ?
      `;
      await db.query(updateQuery, [nuevaCantidad, id]);

      // 2️⃣ 🆕 REGISTRAR EN TABLA DE HISTORIAL DE INGRESOS
      const insertIngresoQuery = `
        INSERT INTO tbl_ingreso_inventario (
          id_herramienta, 
          cantidad, 
          motivo,
          fecha_ingreso
        ) VALUES (?, ?, ?, NOW())
      `;
      await db.query(insertIngresoQuery, [
        id,
        parseFloat(cantidad),
        motivo || "Sin motivo especificado",
      ]);

      // ✅ CONFIRMAR TRANSACCIÓN
      await db.query("COMMIT");

      console.log(
        `✅ Ingreso registrado: ${cantidadAnterior} + ${cantidad} = ${nuevaCantidad}`
      );
      console.log(`✅ Movimiento guardado en historial de ingresos`);

      await registrarEnBitacora(
        TIPOS_EVENTO.HERRAMIENTA_INGRESO_STOCK,
        getUserId(req) || 1,
        {
          herramienta: herramienta[0].nombre,
          cantidad: parseFloat(cantidad),
          cantidadAnterior: cantidadAnterior,
          nuevaCantidad: nuevaCantidad,
          motivo: motivo || "Sin motivo especificado",
        },
        req
      );

      res.json({
        success: true,
        data: {
          cantidadAnterior,
          cantidadIngresada: parseFloat(cantidad),
          nuevaCantidad,
          herramienta: herramienta[0].nombre,
        },
        message: "Ingreso de stock registrado exitosamente",
      });
    } catch (transactionError) {
      // ❌ REVERTIR TRANSACCIÓN EN CASO DE ERROR
      await db.query("ROLLBACK");
      throw transactionError;
    }
  } catch (error) {
    console.error("❌ Error en ingreso de stock:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📤 SALIDA DE STOCK (disminuir cantidad) - CON HISTORIAL
const salidaStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    console.log(
      `📤 Salida de stock - Herramienta ID: ${id}, Cantidad: ${cantidad}`
    );

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad debe ser mayor a 0",
      });
    }

    // En ambas funciones, cambiar la consulta de verificación:
    const getHerramientaQuery = `
  SELECT 
    ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual,
    ${TABLE_CONFIG.fields.nombre} as nombre
  FROM ${TABLE_CONFIG.tableName} 
  WHERE ${TABLE_CONFIG.primaryKey} = ? AND inventario_status = 1
`;
    const [herramienta] = await db.query(getHerramientaQuery, [id]);

    if (herramienta.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Herramienta no encontrada",
      });
    }

    const cantidadAnterior = parseFloat(herramienta[0].cantidadActual) || 0;
    const cantidadSalida = parseFloat(cantidad);

    // Verificar que hay suficiente stock
    if (cantidadAnterior < cantidadSalida) {
      return res.status(400).json({
        success: false,
        error: `Stock insuficiente. Disponible: ${cantidadAnterior}, Solicitado: ${cantidadSalida}`,
      });
    }

    const nuevaCantidad = cantidadAnterior - cantidadSalida;

    // 📄 INICIAR TRANSACCIÓN PARA GARANTIZAR CONSISTENCIA
    await db.query("START TRANSACTION");

    try {
      // 1️⃣ Actualizar stock de la herramienta
      const updateQuery = `
        UPDATE ${TABLE_CONFIG.tableName} 
        SET ${TABLE_CONFIG.fields.cantidadActual} = ?
        WHERE ${TABLE_CONFIG.primaryKey} = ?
      `;
      await db.query(updateQuery, [nuevaCantidad, id]);

      // 2️⃣ 🆕 REGISTRAR EN TABLA DE HISTORIAL DE SALIDAS
      const insertSalidaQuery = `
        INSERT INTO tbl_salida_inventario (
          id_herramienta, 
          cantidad, 
          motivo,
          fecha_salida
        ) VALUES (?, ?, ?, NOW())
      `;
      await db.query(insertSalidaQuery, [
        id,
        cantidadSalida,
        motivo || "Sin motivo especificado",
      ]);

      // ✅ CONFIRMAR TRANSACCIÓN
      await db.query("COMMIT");

      console.log(
        `✅ Salida registrada: ${cantidadAnterior} - ${cantidadSalida} = ${nuevaCantidad}`
      );
      console.log(`✅ Movimiento guardado en historial de salidas`);

      await registrarEnBitacora(
        TIPOS_EVENTO.HERRAMIENTA_SALIDA_STOCK,
        getUserId(req) || 1,
        {
          herramienta: herramienta[0].nombre,
          cantidad: cantidadSalida,
          cantidadAnterior: cantidadAnterior,
          nuevaCantidad: nuevaCantidad,
          motivo: motivo || "Sin motivo especificado",
        },
        req
      );

      res.json({
        success: true,
        data: {
          cantidadAnterior,
          cantidadSalida,
          nuevaCantidad,
          herramienta: herramienta[0].nombre,
        },
        message: "Salida de stock registrada exitosamente",
      });
    } catch (transactionError) {
      // ❌ REVERTIR TRANSACCIÓN EN CASO DE ERROR
      await db.query("ROLLBACK");
      throw transactionError;
    }
  } catch (error) {
    console.error("❌ Error en salida de stock:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};
// 🗑️ ELIMINAR HERRAMIENTA - Soft Delete
const eliminarHerramienta = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Desactivando herramienta ID: ${id}`);

    // Verificar que la herramienta existe y está activa
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ? AND inventario_status = 1
    `;
    const [existing] = await db.query(checkQuery, [id]);

    if (existing[0].count === 0) {
      return res.status(404).json({
        success: false,
        error: "Herramienta no encontrada o ya está eliminada",
      });
    }

    // Cambiar status a 0 (soft delete)
    const updateQuery = `
      UPDATE ${TABLE_CONFIG.tableName} 
      SET inventario_status = 0
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;
    await db.query(updateQuery, [id]);

    console.log(`✅ Herramienta ID ${id} desactivada exitosamente`);

    await registrarEnBitacora(
      TIPOS_EVENTO.HERRAMIENTA_ELIMINADA,
      getUserId(req) || 1,
      {
        id: id,
        mensaje: "Herramienta desactivada (soft delete)",
      },
      req
    );

    res.json({
      success: true,
      message: "Herramienta eliminada exitosamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar herramienta:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📊 OBTENER HISTORIAL DE MOVIMIENTOS (NUEVA FUNCIÓN)
const obtenerHistorialMovimientos = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📊 Obteniendo historial para herramienta ID: ${id}`);

    // Consultar ingresos
    const ingresosQuery = `
      SELECT 
        'ingreso' as tipo,
        cantidad,
        motivo,
        fecha_ingreso as fecha
      FROM tbl_ingreso_inventario 
      WHERE id_herramienta = ?
      ORDER BY fecha_ingreso DESC
    `;

    // Consultar salidas
    const salidasQuery = `
      SELECT 
        'salida' as tipo,
        cantidad,
        motivo,
        fecha_salida as fecha
      FROM tbl_salida_inventario 
      WHERE id_herramienta = ?
      ORDER BY fecha_salida DESC
    `;

    const [ingresos] = await db.query(ingresosQuery, [id]);
    const [salidas] = await db.query(salidasQuery, [id]);

    // Combinar y ordenar por fecha
    const movimientos = [...ingresos, ...salidas].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    console.log(`✅ Se encontraron ${movimientos.length} movimientos`);

    res.json({
      success: true,
      data: movimientos,
      total: movimientos.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📊 OBTENER ESTADÍSTICAS - Solo herramientas activas CON ESTADÍSTICAS DE ESTADO
const obtenerEstadisticas = async (req, res) => {
  try {
    console.log(
      "📊 Obteniendo estadísticas completas de herramientas activas..."
    );

    const statsQuery = `
      SELECT 
        COUNT(*) as totalHerramientas,
        
        -- Estadísticas de Stock
       SUM(
          CASE 
            WHEN ${TABLE_CONFIG.fields.cantidadActual} < ${TABLE_CONFIG.fields.cantidadMinima}
            THEN 1 ELSE 0 
          END
        ) as stockCritico,
        SUM(
          CASE 
            WHEN ${TABLE_CONFIG.fields.cantidadActual} >= ${TABLE_CONFIG.fields.cantidadMinima}
             AND ${TABLE_CONFIG.fields.cantidadActual} <= ${TABLE_CONFIG.fields.cantidadMinima} * 2
            THEN 1 ELSE 0 
          END
        ) as stockBajo,
        SUM(
          CASE 
            WHEN ${TABLE_CONFIG.fields.cantidadActual} > ${TABLE_CONFIG.fields.cantidadMinima} * 2
            THEN 1 ELSE 0 
          END
        ) as stockNormal,

        
        -- Estadísticas por Estado de Herramientas
        SUM(CASE WHEN ${TABLE_CONFIG.fields.estado} = 'Nuevo' THEN 1 ELSE 0 END) as herramientasNuevas,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.estado} = 'En buen estado' THEN 1 ELSE 0 END) as herramientasBuenEstado,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.estado} = 'Desgastado' THEN 1 ELSE 0 END) as herramientasDesgastadas,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.estado} = 'En reparación' THEN 1 ELSE 0 END) as herramientasEnReparacion,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.estado} = 'Baja' THEN 1 ELSE 0 END) as herramientasBaja
      FROM ${TABLE_CONFIG.tableName}
      WHERE inventario_status = 1
    `;

    const [stats] = await db.query(statsQuery);

    console.log("✅ Estadísticas completas obtenidas exitosamente");

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📊 OBTENER MOVIMIENTOS DE HERRAMIENTAS
const obtenerMovimientosHerramientas = async (req, res) => {
  try {
    console.log("📊 Obteniendo movimientos de herramientas...");

    // Obtener INGRESOS
    const ingresosQuery = `
      SELECT 
        'ingreso' as tipo,
        ih.cantidad,
        ih.motivo,
        ih.fecha_ingreso as fecha,
        h.inventario_herramientas_nombre as herramienta
      FROM tbl_ingreso_inventario ih
      INNER JOIN tbl_inventario_herramientas h ON ih.id_herramienta = h.pk_inventario_herramientas_id
      WHERE ih.id_herramienta IS NOT NULL
      ORDER BY ih.fecha_ingreso DESC
      LIMIT 50
    `;

    // Obtener SALIDAS  
    const salidasQuery = `
      SELECT 
        'salida' as tipo,
        sh.cantidad,
        sh.motivo,
        sh.fecha_salida as fecha,
        h.inventario_herramientas_nombre as herramienta
      FROM tbl_salida_inventario sh
      INNER JOIN tbl_inventario_herramientas h ON sh.id_herramienta = h.pk_inventario_herramientas_id
      WHERE sh.id_herramienta IS NOT NULL
      ORDER BY sh.fecha_salida DESC
      LIMIT 50
    `;

    const [ingresos] = await db.query(ingresosQuery);
    const [salidas] = await db.query(salidasQuery);

    // Combinar y ordenar por fecha
    const movimientos = [...ingresos, ...salidas].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    res.json({
      success: true,
      data: movimientos,
      total: movimientos.length
    });

  } catch (error) {
    console.error("❌ Error al obtener movimientos de herramientas:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
};

module.exports = {
  obtenerHerramientas,
  crearHerramienta,
  actualizarHerramienta,
  ingresoStock,
  salidaStock,
  eliminarHerramienta,
  obtenerEstadisticas,
  obtenerHistorialMovimientos,
  obtenerMovimientosHerramientas,
};
