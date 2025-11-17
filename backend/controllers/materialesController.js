// controllers/materialesController.js
const db = require("../db");
const {
  registrarEnBitacora,
  TIPOS_EVENTO,
} = require("../helpers/bitacoraHelper");
const { getUserId } = require("../middleware/authMiddleware");

// 📋 CONFIGURACIÓN REUTILIZABLE - Cambia estos valores para adaptar a otras tablas
const TABLE_CONFIG = {
  tableName: "tbl_inventario_materiales",
  primaryKey: "pk_inventario_materiales_id",
  statusField: "inventario_materiales_status",
  fields: {
    nombre: "inventario_materiales_nombre",
    descripcion: "inventario_materiales_descripcion",
    medida: "inventario_materiales_medida",
    cantidadActual: "inventario_materiales_cantidad_actual",
    cantidadMinima: "inventario_materiales_cantidad_minima",
    fechaIngreso: "inventario_fecha_ingreso",
    fechaActualizacion: "inventario_fecha_actualizacion",
  },
};

// 🔍 VALIDACIONES DE CAMPOS
const VALIDACIONES = {
  nombre: {
    required: true,
    maxLength: 30,
    minLength: 2,
  },
  descripcion: {
    required: false,
    maxLength: 50,
  },
  medida: {
    required: true,
    maxLength: 30,
    minLength: 1,
  },
  cantidadActual: {
    required: false,
    type: "decimal",
    precision: 10,
    scale: 2,
    min: 0,
    max: 99999999.99,
  },
  cantidadMinima: {
    required: false,
    type: "decimal",
    precision: 10,
    scale: 2,
    min: 0,
    max: 99999999.99,
  },
  motivo: {
    required: false,
    maxLength: 40,
  },
};

// 🛡️ FUNCIÓN AUXILIAR PARA VALIDAR CAMPOS
const validarCampos = (data, campos) => {
  const errores = [];

  for (const campo of campos) {
    const valor = data[campo];
    const config = VALIDACIONES[campo];

    if (!config) continue;

    // Validar campo requerido
    if (config.required && (!valor || valor.toString().trim() === "")) {
      errores.push(`El campo ${campo} es obligatorio`);
      continue;
    }

    // Si el valor está vacío y no es requerido, continuar
    if (!valor || valor.toString().trim() === "") continue;

    const valorString = valor.toString().trim();

    // Validar longitud mínima
    if (config.minLength && valorString.length < config.minLength) {
      errores.push(
        `${campo} debe tener al menos ${config.minLength} caracteres`
      );
    }

    // Validar longitud máxima
    if (config.maxLength && valorString.length > config.maxLength) {
      errores.push(`${campo} no puede exceder ${config.maxLength} caracteres`);
    }

    // Validar tipo decimal
    if (config.type === "decimal") {
      const numero = parseFloat(valor);

      if (isNaN(numero)) {
        errores.push(`${campo} debe ser un número válido`);
        continue;
      }

      // Validar rango
      if (config.min !== undefined && numero < config.min) {
        errores.push(`${campo} no puede ser menor a ${config.min}`);
      }

      if (config.max !== undefined && numero > config.max) {
        errores.push(`${campo} no puede ser mayor a ${config.max}`);
      }

      // Validar precisión decimal (máximo 2 decimales)
      if (config.scale && numero.toString().includes(".")) {
        const decimales = numero.toString().split(".")[1];
        if (decimales && decimales.length > config.scale) {
          errores.push(
            `${campo} no puede tener más de ${config.scale} decimales`
          );
        }
      }
    }
  }

  return errores;
};

// 📋 OBTENER TODOS LOS MATERIALES (solo activos)
const obtenerMateriales = async (req, res) => {
  try {
    console.log("📦 Obteniendo lista de materiales activos...");

    const query = `
      SELECT 
        ${TABLE_CONFIG.primaryKey} as id,
        ${TABLE_CONFIG.fields.nombre} as nombre,
        ${TABLE_CONFIG.fields.descripcion} as descripcion,
        ${TABLE_CONFIG.fields.medida} as medida,
        ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual,
        ${TABLE_CONFIG.fields.cantidadMinima} as cantidadMinima,
        ${TABLE_CONFIG.fields.fechaIngreso} as fechaIngreso,
        ${TABLE_CONFIG.fields.fechaActualizacion} as fechaActualizacion
      FROM ${TABLE_CONFIG.tableName}
      WHERE ${TABLE_CONFIG.statusField} = 1
      ORDER BY ${TABLE_CONFIG.primaryKey} DESC
    `;

    const [materiales] = await db.query(query);

    console.log(`✅ Se encontraron ${materiales.length} materiales activos`);

    res.json({
      success: true,
      data: materiales,
      total: materiales.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener materiales:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// ➕ CREAR NUEVO MATERIAL
const crearMaterial = async (req, res) => {
  try {
    const { nombre, descripcion, medida, cantidadActual, cantidadMinima } =
      req.body;

    console.log("➕ Creando nuevo material:", { nombre, medida });

    // 🔍 VALIDAR CAMPOS
    const erroresValidacion = validarCampos(req.body, [
      "nombre",
      "descripcion",
      "medida",
      "cantidadActual",
      "cantidadMinima",
    ]);

    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Errores de validación",
        detalles: erroresValidacion,
      });
    }

    // Verificar si ya existe un material activo con el mismo nombre
    // const checkQuery = `
    //   SELECT COUNT(*) as count
    //   FROM ${TABLE_CONFIG.tableName}
    //   WHERE ${TABLE_CONFIG.fields.nombre} = ?
    //   AND ${TABLE_CONFIG.statusField} = 1
    // `;
    // const [existing] = await db.query(checkQuery, [nombre.trim()]);

    // if (existing[0].count > 0) {
    //   return res.status(409).json({
    //     success: false,
    //     error: "Ya existe un material activo con ese nombre",
    //   });
    // }

    // Insertar nuevo material
    const insertQuery = `
      INSERT INTO ${TABLE_CONFIG.tableName} (
        ${TABLE_CONFIG.fields.nombre},
        ${TABLE_CONFIG.fields.descripcion},
        ${TABLE_CONFIG.fields.medida},
        ${TABLE_CONFIG.fields.cantidadActual},
        ${TABLE_CONFIG.fields.cantidadMinima},
        ${TABLE_CONFIG.statusField}
      ) VALUES (?, ?, ?, ?, ?, 1)
    `;

    const [result] = await db.query(insertQuery, [
      nombre.trim(),
      descripcion ? descripcion.trim() : null,
      medida.trim(),
      parseFloat(cantidadActual) || 0,
      parseFloat(cantidadMinima) || 0,
    ]);

    console.log(`✅ Material creado con ID: ${result.insertId}`);

    await registrarEnBitacora(
      TIPOS_EVENTO.MATERIAL_CREADO,
      getUserId(req) || 1,
      {
        id: result.insertId,
        nombre: nombre.trim(),
        medida: medida.trim(),
      },
      req
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: "Material creado exitosamente",
      },
    });
  } catch (error) {
    console.error("❌ Error al crear material:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// ✏️ ACTUALIZAR MATERIAL
const actualizarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, medida, cantidadMinima } = req.body;

    console.log(`✏️ Actualizando material ID: ${id}`);

    // 🔍 VALIDAR CAMPOS
    const erroresValidacion = validarCampos(req.body, [
      "nombre",
      "descripcion",
      "medida",
      "cantidadMinima",
    ]);

    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Errores de validación",
        detalles: erroresValidacion,
      });
    }

    // Verificar que el material existe y está activo
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ? 
      AND ${TABLE_CONFIG.statusField} = 1
    `;
    const [existing] = await db.query(checkQuery, [id]);

    if (existing[0].count === 0) {
      return res.status(404).json({
        success: false,
        error: "Material no encontrado o está inactivo",
      });
    }

    // Actualizar material
    const updateQuery = `
      UPDATE ${TABLE_CONFIG.tableName} 
      SET 
        ${TABLE_CONFIG.fields.nombre} = ?,
        ${TABLE_CONFIG.fields.descripcion} = ?,
        ${TABLE_CONFIG.fields.medida} = ?,
        ${TABLE_CONFIG.fields.cantidadMinima} = ?
      WHERE ${TABLE_CONFIG.primaryKey} = ? 
      AND ${TABLE_CONFIG.statusField} = 1
    `;

    await db.query(updateQuery, [
      nombre.trim(),
      descripcion ? descripcion.trim() : null,
      medida.trim(),
      parseFloat(cantidadMinima) || 0,
      id,
    ]);

    console.log(`✅ Material ID ${id} actualizado exitosamente`);

    await registrarEnBitacora(
      TIPOS_EVENTO.MATERIAL_ACTUALIZADO,
      getUserId(req) || 1,
      {
        id: id,
        nombre: nombre.trim(),
      },
      req
    );

    res.json({
      success: true,
      message: "Material actualizado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar material:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📥 INGRESO DE STOCK
const ingresoStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    console.log(
      `📥 Ingreso de stock - Material ID: ${id}, Cantidad: ${cantidad}`
    );

    // 🔍 VALIDAR CAMPOS
    const erroresValidacion = validarCampos({ cantidad, motivo }, ["motivo"]);

    // Validar cantidad específicamente para movimientos de stock
    if (!cantidad || isNaN(parseFloat(cantidad))) {
      erroresValidacion.push("La cantidad debe ser un número válido");
    } else {
      const cantidadNum = parseFloat(cantidad);
      if (cantidadNum <= 0) {
        erroresValidacion.push("La cantidad debe ser mayor a 0");
      }
      if (cantidadNum > 99999999.99) {
        erroresValidacion.push("La cantidad no puede exceder 99,999,999.99");
      }
      // Validar máximo 2 decimales
      if (cantidad.toString().includes(".")) {
        const decimales = cantidad.toString().split(".")[1];
        if (decimales && decimales.length > 2) {
          erroresValidacion.push(
            "La cantidad no puede tener más de 2 decimales"
          );
        }
      }
    }

    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Errores de validación",
        detalles: erroresValidacion,
      });
    }

    // Verificar que el material existe y está activo
    const getMaterialQuery = `
      SELECT 
        ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual,
        ${TABLE_CONFIG.fields.nombre} as nombre
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ? 
      AND ${TABLE_CONFIG.statusField} = 1
    `;
    const [material] = await db.query(getMaterialQuery, [id]);

    if (material.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Material no encontrado o está inactivo",
      });
    }

    const cantidadAnterior = parseFloat(material[0].cantidadActual) || 0;
    const nuevaCantidad = cantidadAnterior + parseFloat(cantidad);

    // Validar que no exceda el límite total
    if (nuevaCantidad > 99999999.99) {
      return res.status(400).json({
        success: false,
        error: "El stock resultante excedería el límite máximo (99,999,999.99)",
      });
    }

    // Iniciar transacción
    await db.query("START TRANSACTION");

    try {
      // Actualizar stock del material
      const updateQuery = `
        UPDATE ${TABLE_CONFIG.tableName} 
        SET ${TABLE_CONFIG.fields.cantidadActual} = ?
        WHERE ${TABLE_CONFIG.primaryKey} = ? 
        AND ${TABLE_CONFIG.statusField} = 1
      `;
      await db.query(updateQuery, [nuevaCantidad, id]);

      // Registrar en historial
      const insertIngresoQuery = `
        INSERT INTO tbl_ingreso_inventario (
          id_material, 
          cantidad, 
          motivo,
          fecha_ingreso
        ) VALUES (?, ?, ?, NOW())
      `;
      await db.query(insertIngresoQuery, [
        id,
        parseFloat(cantidad),
        motivo ? motivo.trim() : "Sin motivo especificado",
      ]);

      await db.query("COMMIT");

      console.log(
        `✅ Ingreso registrado: ${cantidadAnterior} + ${cantidad} = ${nuevaCantidad}`
      );

      await registrarEnBitacora(
        TIPOS_EVENTO.MATERIAL_INGRESO_STOCK,
        getUserId(req) || 1,
        {
          material: material[0].nombre,
          cantidad: parseFloat(cantidad),
          cantidadAnterior: cantidadAnterior,
          nuevaCantidad: nuevaCantidad,
          motivo: motivo?.trim() || "Sin motivo especificado",
        },
        req
      );

      res.json({
        success: true,
        data: {
          cantidadAnterior,
          cantidadIngresada: parseFloat(cantidad),
          nuevaCantidad,
          material: material[0].nombre,
        },
        message: "Ingreso de stock registrado exitosamente",
      });
    } catch (transactionError) {
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

// 📤 SALIDA DE STOCK
const salidaStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    console.log(
      `📤 Salida de stock - Material ID: ${id}, Cantidad: ${cantidad}`
    );

    // 🔍 VALIDAR CAMPOS (mismo proceso que ingreso)
    const erroresValidacion = validarCampos({ cantidad, motivo }, ["motivo"]);

    if (!cantidad || isNaN(parseFloat(cantidad))) {
      erroresValidacion.push("La cantidad debe ser un número válido");
    } else {
      const cantidadNum = parseFloat(cantidad);
      if (cantidadNum <= 0) {
        erroresValidacion.push("La cantidad debe ser mayor a 0");
      }
      if (cantidadNum > 99999999.99) {
        erroresValidacion.push("La cantidad no puede exceder 99,999,999.99");
      }
      if (cantidad.toString().includes(".")) {
        const decimales = cantidad.toString().split(".")[1];
        if (decimales && decimales.length > 2) {
          erroresValidacion.push(
            "La cantidad no puede tener más de 2 decimales"
          );
        }
      }
    }

    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Errores de validación",
        detalles: erroresValidacion,
      });
    }

    // Verificar material y stock disponible
    const getMaterialQuery = `
      SELECT 
        ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual,
        ${TABLE_CONFIG.fields.nombre} as nombre
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ? 
      AND ${TABLE_CONFIG.statusField} = 1
    `;
    const [material] = await db.query(getMaterialQuery, [id]);

    if (material.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Material no encontrado o está inactivo",
      });
    }

    const cantidadAnterior = parseFloat(material[0].cantidadActual) || 0;
    const cantidadSalida = parseFloat(cantidad);

    if (cantidadAnterior < cantidadSalida) {
      return res.status(400).json({
        success: false,
        error: `Stock insuficiente. Disponible: ${cantidadAnterior}`,
        stockDisponible: cantidadAnterior,
      });
    }

    const nuevaCantidad = cantidadAnterior - cantidadSalida;

    // Iniciar transacción
    await db.query("START TRANSACTION");

    try {
      // Actualizar stock
      const updateQuery = `
        UPDATE ${TABLE_CONFIG.tableName} 
        SET ${TABLE_CONFIG.fields.cantidadActual} = ?
        WHERE ${TABLE_CONFIG.primaryKey} = ? 
        AND ${TABLE_CONFIG.statusField} = 1
      `;
      await db.query(updateQuery, [nuevaCantidad, id]);

      // Registrar en historial
      const insertSalidaQuery = `
        INSERT INTO tbl_salida_inventario (
          id_material, 
          cantidad, 
          motivo,
          fecha_salida
        ) VALUES (?, ?, ?, NOW())
      `;
      await db.query(insertSalidaQuery, [
        id,
        cantidadSalida,
        motivo ? motivo.trim() : "Sin motivo especificado",
      ]);

      await db.query("COMMIT");

      console.log(
        `✅ Salida registrada: ${cantidadAnterior} - ${cantidadSalida} = ${nuevaCantidad}`
      );

      await registrarEnBitacora(
        TIPOS_EVENTO.MATERIAL_SALIDA_STOCK,
        getUserId(req) || 1,
        {
          material: material[0].nombre,
          cantidad: cantidadSalida,
          cantidadAnterior: cantidadAnterior,
          nuevaCantidad: nuevaCantidad,
          motivo: motivo?.trim() || "Sin motivo especificado",
        },
        req
      );

      res.json({
        success: true,
        data: {
          cantidadAnterior,
          cantidadSalida,
          nuevaCantidad,
          material: material[0].nombre,
        },
        message: "Salida de stock registrada exitosamente",
      });
    } catch (transactionError) {
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

// 🗑️ ELIMINAR MATERIAL (BORRADO LÓGICO)
const eliminarMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Desactivando material ID: ${id} (borrado lógico)`);

    const checkQuery = `
      SELECT 
        ${TABLE_CONFIG.fields.nombre} as nombre,
        ${TABLE_CONFIG.fields.cantidadActual} as cantidadActual
      FROM ${TABLE_CONFIG.tableName} 
      WHERE ${TABLE_CONFIG.primaryKey} = ? 
      AND ${TABLE_CONFIG.statusField} = 1
    `;
    const [material] = await db.query(checkQuery, [id]);

    if (material.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Material no encontrado o ya está eliminado",
      });
    }

    const updateQuery = `
      UPDATE ${TABLE_CONFIG.tableName} 
      SET ${TABLE_CONFIG.statusField} = 0
      WHERE ${TABLE_CONFIG.primaryKey} = ?
    `;

    await db.query(updateQuery, [id]);

    console.log(`✅ Material "${material[0].nombre}" desactivado exitosamente`);

    await registrarEnBitacora(
      TIPOS_EVENTO.MATERIAL_ELIMINADO,
      getUserId(req) || 1,
      {
        id: id,
        nombre: material[0].nombre,
      },
      req
    );

    res.json({
      success: true,
      message: `Material "${material[0].nombre}" eliminado exitosamente`,
    });
  } catch (error) {
    console.error("❌ Error al eliminar material:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// 📊 OBTENER ESTADÍSTICAS
const obtenerEstadisticas = async (req, res) => {
  try {
    console.log("📊 Obteniendo estadísticas de materiales activos...");

    const statsQuery = `
      SELECT 
        COUNT(*) as totalMateriales,
        SUM(
  CASE 
    WHEN ${TABLE_CONFIG.fields.cantidadActual} < ${TABLE_CONFIG.fields.cantidadMinima}
    THEN 1 ELSE 0 
  END
) AS stockCritico,

SUM(
  CASE 
    WHEN ${TABLE_CONFIG.fields.cantidadActual} >= ${TABLE_CONFIG.fields.cantidadMinima}
     AND ${TABLE_CONFIG.fields.cantidadActual} <= ${TABLE_CONFIG.fields.cantidadMinima} * 2
    THEN 1 ELSE 0 
  END
) AS stockBajo,

SUM(
  CASE 
    WHEN ${TABLE_CONFIG.fields.cantidadActual} > ${TABLE_CONFIG.fields.cantidadMinima} * 2
    THEN 1 ELSE 0 
  END
) AS stockNormal,
        AVG(${TABLE_CONFIG.fields.cantidadActual}) as promedioStock
      FROM ${TABLE_CONFIG.tableName}
      WHERE ${TABLE_CONFIG.statusField} = 1
    `;

    const [stats] = await db.query(statsQuery);

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

// 📊 OBTENER MOVIMIENTOS DE MATERIALES
const obtenerMovimientosMateriales = async (req, res) => {
  try {
    console.log("📊 Obteniendo movimientos de materiales...");

    // Obtener INGRESOS
    const ingresosQuery = `
      SELECT 
        'ingreso' as tipo,
        im.cantidad,
        im.motivo,
        im.fecha_ingreso as fecha,
        m.inventario_materiales_nombre as material
      FROM tbl_ingreso_inventario im
      INNER JOIN tbl_inventario_materiales m ON im.id_material = m.pk_inventario_materiales_id
      WHERE im.id_material IS NOT NULL
      ORDER BY im.fecha_ingreso DESC
      LIMIT 50
    `;

    // Obtener SALIDAS
    const salidasQuery = `
      SELECT 
        'salida' as tipo,
        sm.cantidad,
        sm.motivo,
        sm.fecha_salida as fecha,
        m.inventario_materiales_nombre as material
      FROM tbl_salida_inventario sm
      INNER JOIN tbl_inventario_materiales m ON sm.id_material = m.pk_inventario_materiales_id
      WHERE sm.id_material IS NOT NULL
      ORDER BY sm.fecha_salida DESC
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
      total: movimientos.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener movimientos de materiales:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

module.exports = {
  obtenerMateriales,
  crearMaterial,
  actualizarMaterial,
  ingresoStock,
  salidaStock,
  eliminarMaterial,
  obtenerEstadisticas,
  obtenerMovimientosMateriales,
};
