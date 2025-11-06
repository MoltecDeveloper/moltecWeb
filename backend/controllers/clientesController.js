// controllers/clientesController.js - VERSIÓN FINAL CORREGIDA
const db = require("../db");
const {
  registrarEnBitacora,
  TIPOS_EVENTO,
} = require("../helpers/bitacoraHelper");
const { getUserId } = require("../middleware/authMiddleware");

// 📋 CONFIGURACIÓN - Nombres de tabla y campos
const TABLE_CONFIG = {
  tableName: "tbl_cliente",
  primaryKey: "pk_cliente_id",
  fields: {
    nombre: "cliente_nombre",
    apellido: "cliente_apellido",
    correo: "cliente_correo",
    telefono: "cliente_telefono",
    fechaRegistro: "cliente_fecha_registro",
    nit: "cliente_nit",
  },
};

// 📋 OBTENER TODOS LOS CLIENTES
const obtenerClientes = async (req, res) => {
  try {
    console.log("👥 Obteniendo lista de clientes...");

    const query = `
      SELECT 
        ${TABLE_CONFIG.primaryKey} as id,
        ${TABLE_CONFIG.fields.nombre} as nombre,
        ${TABLE_CONFIG.fields.apellido} as apellido,
        ${TABLE_CONFIG.fields.correo} as correo,
        ${TABLE_CONFIG.fields.telefono} as telefono,
        ${TABLE_CONFIG.fields.fechaRegistro} as fechaRegistro,
        ${TABLE_CONFIG.fields.nit} as nit
      FROM ${TABLE_CONFIG.tableName}
      WHERE cliente_status = 1
      ORDER BY ${TABLE_CONFIG.primaryKey} DESC
    `;

    const [clientes] = await db.query(query);
    console.log(`✅ Se encontraron ${clientes.length} clientes`);

    res.json({
      success: true,
      data: clientes,
      total: clientes.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// ➕ CREAR NUEVO CLIENTE
const crearCliente = async (req, res) => {
  try {
    const { nombre, apellido, correo, telefono, nit } = req.body;

    console.log("➕ Creando nuevo cliente:", { nombre, apellido });

    // 🔍 Validar campos obligatorios
    if (!nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Nombre y contacto son campos obligatorios",
      });
    }

    // 🔍 Validar longitud del nombre (máximo 15 caracteres)
    if (nombre.trim().length > 50) {
  return res.status(400).json({
    success: false,
    error: "El nombre no puede exceder 50 caracteres",
  });
}

if (apellido.trim().length > 35) {
  return res.status(400).json({
    success: false,
    error: "El contacto no puede exceder 35 caracteres",
  });
}

    // 🔍 Validar formato de correo electrónico
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({
        success: false,
        error: "El formato del correo electrónico no es válido",
      });
    }

    // 🔍 Validar teléfono (exactamente 8 dígitos)
    if (telefono && !/^\d{8}$/.test(telefono.replace(/[-\s]/g, ""))) {
      return res.status(400).json({
        success: false,
        error: "El teléfono debe tener exactamente 8 dígitos",
      });
    }

    // 🔍 Validar NIT (máximo 9 dígitos, puede incluir guión)
    if (nit && !/^\d{1,9}(-\d)?$/.test(nit.trim())) {
      return res.status(400).json({
        success: false,
        error: "El NIT debe tener máximo 9 dígitos (formato: 12345678 o 12345678-9)",
      });
    }

    // 🔍 Verificar si ya existe un cliente con el mismo correo
    if (correo) {
      const checkEmailQuery = `
        SELECT COUNT(*) as count 
        FROM ${TABLE_CONFIG.tableName} 
        WHERE ${TABLE_CONFIG.fields.correo} = ? AND cliente_status = 1
      `;
      const [existingEmail] = await db.query(checkEmailQuery, [correo]);

      if (existingEmail[0].count > 0) {
        return res.status(409).json({
          success: false,
          error: "Ya existe un cliente registrado con ese correo electrónico",
        });
      }
    }

    // 🔍 Verificar si ya existe un cliente con el mismo NIT
    if (nit) {
      const checkNitQuery = `
        SELECT COUNT(*) as count 
        FROM ${TABLE_CONFIG.tableName} 
        WHERE ${TABLE_CONFIG.fields.nit} = ? AND cliente_status = 1
      `;
      const [existingNit] = await db.query(checkNitQuery, [nit]);

      if (existingNit[0].count > 0) {
        return res.status(409).json({
          success: false,
          error: "Ya existe un cliente registrado con ese NIT",
        });
      }
    }

    // ➕ Insertar nuevo cliente en la base de datos
    const insertQuery = `
      INSERT INTO ${TABLE_CONFIG.tableName} (
        ${TABLE_CONFIG.fields.nombre},
        ${TABLE_CONFIG.fields.apellido},
        ${TABLE_CONFIG.fields.correo},
        ${TABLE_CONFIG.fields.telefono},
        ${TABLE_CONFIG.fields.nit},
        cliente_status
      ) VALUES (?, ?, ?, ?, ?, 1)
    `;

    const [result] = await db.query(insertQuery, [
      nombre.trim(),
      apellido.trim(),
      correo?.trim() || null,
      telefono?.trim() || null,
      nit?.trim() || null,
    ]);

    console.log(`✅ Cliente creado con ID: ${result.insertId}`);

    // 📝 Registrar acción en bitácora
    await registrarEnBitacora(
      TIPOS_EVENTO.CLIENTE_CREADO,
      getUserId(req) || 1,
      {
        id: result.insertId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correo?.trim() || null,
      },
      req
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: "Cliente creado exitosamente",
      },
    });
  } catch (error) {
    console.error("❌ Error al crear cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 🤫 REGISTRO SILENCIOSO - Desde formulario de contacto público
const registroSilencioso = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono } = req.body;

    console.log("🤫 Registro silencioso desde contacto:", {
      nombre,
      apellido,
      email,
    });

    // Validaciones básicas (menos estrictas que el CRUD admin)
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Datos incompletos para registro",
      });
    }

    // Validar formato de correo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Formato de correo inválido",
      });
    }

    // 🔍 Verificar si ya existe el cliente
    const checkClienteQuery = `
      SELECT 
        ${TABLE_CONFIG.primaryKey} as id,
        ${TABLE_CONFIG.fields.correo} as correo
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.fields.correo} = ? AND cliente_status = 1
    `;

    const [existingCliente] = await db.query(checkClienteQuery, [email.trim()]);

    if (existingCliente.length > 0) {
      // Cliente ya existe - no error, solo informar
      console.log(`ℹ️ Cliente ya existe con correo: ${email}`);
      return res.json({
        success: true,
        message: "Formulario procesado",
        existed: true,
        clientId: existingCliente[0].id,
      });
    }

    // 🆕 Registrar nuevo cliente
    const insertQuery = `
      INSERT INTO ${TABLE_CONFIG.tableName} (
        ${TABLE_CONFIG.fields.nombre},
        ${TABLE_CONFIG.fields.apellido},
        ${TABLE_CONFIG.fields.correo},
        ${TABLE_CONFIG.fields.telefono},
        cliente_status
      ) VALUES (?, ?, ?, ?, 1)
    `;

    const [result] = await db.query(insertQuery, [
      nombre.trim(),
      apellido.trim(),
      email.trim(),
      telefono?.replace(/[-\s]/g, "") || null,
    ]);

    console.log(`✅ Cliente registrado silenciosamente con ID: ${result.insertId}`);

    await registrarEnBitacora(
      TIPOS_EVENTO.CLIENTE_REGISTRO_SILENCIOSO,
      getUserId(req) || 1,
      {
        id: result.insertId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: email.trim(),
      },
      req
    );

    res.json({
      success: true,
      message: "Formulario procesado",
      existed: false,
      clientId: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error en registro silencioso:", error);
    // Siempre respuesta positiva para no afectar UX del formulario público
    res.json({
      success: true,
      message: "Formulario procesado",
      error: "Error interno pero continuando",
    });
  }
};

// ✏️ ACTUALIZAR CLIENTE - ✅ FIX APLICADO
const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, telefono, nit } = req.body;

    console.log(`✏️ Actualizando cliente ID: ${id}`);

    // 🔍 Validar campos obligatorios
    if (!nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Nombre y apellido son campos obligatorios",
      });
    }

    // 🔍 Validar longitud del nombre (máximo 15 caracteres)
   if (nombre.trim().length > 50) {
  return res.status(400).json({
    success: false,
    error: "El nombre no puede exceder 50 caracteres",
  });
}

if (apellido.trim().length > 35) {
  return res.status(400).json({
    success: false,
    error: "El contacto no puede exceder 35 caracteres",
  });
}

    // 🔍 Validar formato de correo electrónico
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({
        success: false,
        error: "El formato del correo electrónico no es válido",
      });
    }

    // 🔍 Validar teléfono (exactamente 8 dígitos)
    if (telefono && !/^\d{8}$/.test(telefono.replace(/[-\s]/g, ""))) {
      return res.status(400).json({
        success: false,
        error: "El teléfono debe tener exactamente 8 dígitos",
      });
    }

    // 🔍 Validar NIT (máximo 9 dígitos, puede incluir guión)
    if (nit && !/^\d{1,9}(-\d)?$/.test(nit.trim())) {
      return res.status(400).json({
        success: false,
        error: "El NIT debe tener máximo 9 dígitos (formato: 12345678 o 12345678-9)",
      });
    }

    // 🔍 Verificar que el cliente existe
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;
    const [existing] = await db.query(checkQuery, [id]);

    if (existing[0].count === 0) {
      return res.status(404).json({
        success: false,
        error: "Cliente no encontrado",
      });
    }

    // ✅ FIX CRÍTICO: Verificar correo único EXCLUYENDO el cliente actual
    // ANTES solo tenía 1 placeholder: WHERE correo = ?
    // AHORA tiene 2 placeholders: WHERE correo = ? AND id != ?
    if (correo) {
      const checkEmailQuery = `
        SELECT COUNT(*) as count 
        FROM ${TABLE_CONFIG.tableName} 
        WHERE ${TABLE_CONFIG.fields.correo} = ? 
          AND ${TABLE_CONFIG.primaryKey} != ?
          AND cliente_status = 1
      `;
      // ✅ Ahora pasamos 2 valores [correo, id] para 2 placeholders
      const [existingEmail] = await db.query(checkEmailQuery, [correo, id]);

      if (existingEmail[0].count > 0) {
        return res.status(409).json({
          success: false,
          error: "Ya existe otro cliente con ese correo electrónico",
        });
      }
    }

    // ✅ FIX CRÍTICO: Verificar NIT único EXCLUYENDO el cliente actual
    // ANTES solo tenía 1 placeholder: WHERE nit = ?
    // AHORA tiene 2 placeholders: WHERE nit = ? AND id != ?
    if (nit) {
      const checkNitQuery = `
        SELECT COUNT(*) as count 
        FROM ${TABLE_CONFIG.tableName} 
        WHERE ${TABLE_CONFIG.fields.nit} = ? 
          AND ${TABLE_CONFIG.primaryKey} != ?
          AND cliente_status = 1
      `;
      // ✅ Ahora pasamos 2 valores [nit, id] para 2 placeholders
      const [existingNit] = await db.query(checkNitQuery, [nit, id]);

      if (existingNit[0].count > 0) {
        return res.status(409).json({
          success: false,
          error: "Ya existe otro cliente con ese NIT",
        });
      }
    }

    // ✏️ Actualizar datos del cliente
    const updateQuery = `
      UPDATE ${TABLE_CONFIG.tableName} 
      SET 
        ${TABLE_CONFIG.fields.nombre} = ?,
        ${TABLE_CONFIG.fields.apellido} = ?,
        ${TABLE_CONFIG.fields.correo} = ?,
        ${TABLE_CONFIG.fields.telefono} = ?,
        ${TABLE_CONFIG.fields.nit} = ?
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;

    await db.query(updateQuery, [
      nombre.trim(),
      apellido.trim(),
      correo?.trim() || null,
      telefono?.trim() || null,
      nit?.trim() || null,
      id,
    ]);

    console.log(`✅ Cliente ID ${id} actualizado exitosamente`);

    // 📝 Registrar acción en bitácora
    await registrarEnBitacora(
      TIPOS_EVENTO.CLIENTE_ACTUALIZADO,
      getUserId(req) || 1,
      {
        id: parseInt(id),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correo?.trim() || null,
      },
      req
    );

    res.json({
      success: true,
      message: "Cliente actualizado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 🗑️ ELIMINAR CLIENTE - Borrado lógico (cambia status a 0)
const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Eliminando cliente ID: ${id} (borrado lógico)`);

    // 🔍 Verificar que el cliente existe y está activo
    const checkQuery = `
      SELECT 
        ${TABLE_CONFIG.fields.nombre} as nombre,
        ${TABLE_CONFIG.fields.apellido} as apellido
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ? AND cliente_status = 1
    `;
    const [cliente] = await db.query(checkQuery, [id]);

    if (cliente.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Cliente no encontrado o ya inactivo",
      });
    }

    // 🗑️ Realizar borrado lógico (cambiar status a 0)
    const deleteQuery = `
      UPDATE ${TABLE_CONFIG.tableName} 
      SET cliente_status = 0
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;

    await db.query(deleteQuery, [id]);

    console.log(`✅ Cliente "${cliente[0].nombre} ${cliente[0].apellido}" desactivado`);

    await registrarEnBitacora(
      TIPOS_EVENTO.CLIENTE_ELIMINADO,
      getUserId(req) || 1,
      {
        id: id,
        nombre: cliente[0].nombre,
        apellido: cliente[0].apellido,
      },
      req
    );

    res.json({
      success: true,
      message: `Cliente "${cliente[0].nombre} ${cliente[0].apellido}" eliminado exitosamente`,
    });
  } catch (error) {
    console.error("❌ Error al eliminar cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📊 OBTENER ESTADÍSTICAS DE CLIENTES
const obtenerEstadisticas = async (req, res) => {
  try {
    console.log("📊 Obteniendo estadísticas de clientes...");

    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as totalClientes,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.correo} IS NOT NULL AND ${TABLE_CONFIG.fields.correo} != '' THEN 1 ELSE 0 END) as clientesConCorreo,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.telefono} IS NOT NULL AND ${TABLE_CONFIG.fields.telefono} != '' THEN 1 ELSE 0 END) as clientesConTelefono,
        SUM(CASE WHEN ${TABLE_CONFIG.fields.nit} IS NOT NULL AND ${TABLE_CONFIG.fields.nit} != '' THEN 1 ELSE 0 END) as clientesConNIT,
        COUNT(DISTINCT DATE(${TABLE_CONFIG.fields.fechaRegistro})) as diasConRegistros,
        DATE(MIN(${TABLE_CONFIG.fields.fechaRegistro})) as primerRegistro,
        DATE(MAX(${TABLE_CONFIG.fields.fechaRegistro})) as ultimoRegistro
      FROM ${TABLE_CONFIG.tableName}
      WHERE cliente_status = 1
    `;

    const [stats] = await db.query(statsQuery);

    // Estadísticas por mes (últimos 12 meses)
    const monthlyStatsQuery = `
      SELECT 
        DATE_FORMAT(${TABLE_CONFIG.fields.fechaRegistro}, '%Y-%m') as mes,
        COUNT(*) as registros
      FROM ${TABLE_CONFIG.tableName}
      WHERE ${TABLE_CONFIG.fields.fechaRegistro} >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      AND cliente_status = 1
      GROUP BY DATE_FORMAT(${TABLE_CONFIG.fields.fechaRegistro}, '%Y-%m')
      ORDER BY mes DESC
      LIMIT 12
    `;

    const [monthlyStats] = await db.query(monthlyStatsQuery);

    res.json({
      success: true,
      data: {
        ...stats[0],
        registrosPorMes: monthlyStats,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 🔍 BUSCAR CLIENTES - Búsqueda avanzada
const buscarClientes = async (req, res) => {
  try {
    const { q, tipo } = req.query;

    // Validar que el término de búsqueda tenga al menos 2 caracteres
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "El término de búsqueda debe tener al menos 2 caracteres",
      });
    }

    console.log(`🔍 Buscando clientes: "${q}" (tipo: ${tipo || "todos"})`);

    let whereClause;
    let params;

    // Construir cláusula WHERE según el tipo de búsqueda
    switch (tipo) {
      case "nombre":
        whereClause = `(${TABLE_CONFIG.fields.nombre} LIKE ? OR ${TABLE_CONFIG.fields.apellido} LIKE ?)`;
        params = [`%${q}%`, `%${q}%`];
        break;
      case "correo":
        whereClause = `${TABLE_CONFIG.fields.correo} LIKE ?`;
        params = [`%${q}%`];
        break;
      case "telefono":
        whereClause = `${TABLE_CONFIG.fields.telefono} LIKE ?`;
        params = [`%${q}%`];
        break;
      case "nit":
        whereClause = `${TABLE_CONFIG.fields.nit} LIKE ?`;
        params = [`%${q}%`];
        break;
      default:
        // Búsqueda en todos los campos
        whereClause = `(
          ${TABLE_CONFIG.fields.nombre} LIKE ? OR 
          ${TABLE_CONFIG.fields.apellido} LIKE ? OR 
          ${TABLE_CONFIG.fields.correo} LIKE ? OR 
          ${TABLE_CONFIG.fields.telefono} LIKE ? OR 
          ${TABLE_CONFIG.fields.nit} LIKE ?
        )`;
        params = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`];
    }

    const searchQuery = `
      SELECT 
        ${TABLE_CONFIG.primaryKey} as id,
        ${TABLE_CONFIG.fields.nombre} as nombre,
        ${TABLE_CONFIG.fields.apellido} as apellido,
        ${TABLE_CONFIG.fields.correo} as correo,
        ${TABLE_CONFIG.fields.telefono} as telefono,
        ${TABLE_CONFIG.fields.fechaRegistro} as fechaRegistro,
        ${TABLE_CONFIG.fields.nit} as nit
      FROM ${TABLE_CONFIG.tableName}
      WHERE (${whereClause}) AND cliente_status = 1
      ORDER BY ${TABLE_CONFIG.fields.nombre} ASC, ${TABLE_CONFIG.fields.apellido} ASC
      LIMIT 50
    `;

    const [resultados] = await db.query(searchQuery, params);

    console.log(`✅ Búsqueda completada: ${resultados.length} resultados`);

    res.json({
      success: true,
      data: resultados,
      total: resultados.length,
      query: q,
      tipo: tipo || "todos",
    });
  } catch (error) {
    console.error("❌ Error en búsqueda:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📤 Exportar todas las funciones del controlador
module.exports = {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerEstadisticas,
  buscarClientes,
  registroSilencioso,
};