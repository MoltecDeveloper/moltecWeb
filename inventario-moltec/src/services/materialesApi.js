// services/materialesApi.js
// 🔧 CONFIGURACIÓN REUTILIZABLE - Cambia estos valores para otros CRUDs
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL,
  endpoint: "materiales", // 👈 Cambiar por 'herramientas', 'empleados', etc.
  timeout: 10000,
};

class MaterialesAPI {
  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/${API_CONFIG.endpoint}`;
  }

  // 🔑 Obtener token de autenticación
  getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  // 🛠️ Método base para hacer requests
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        ...options,
        timeout: API_CONFIG.timeout,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("❌ API Error:", error);
      throw error;
    }
  }

  // 📋 OBTENER TODOS LOS MATERIALES
  async obtenerMateriales() {
    console.log("📦 Obteniendo materiales...");

    try {
      const data = await this.makeRequest(this.baseURL);
      console.log(`✅ ${data.data.length} materiales obtenidos`);
      return data;
    } catch (error) {
      console.error("❌ Error al obtener materiales:", error);
      throw new Error("No se pudieron cargar los materiales");
    }
  }

  // ➕ CREAR NUEVO MATERIAL
  async crearMaterial(materialData) {
    console.log("➕ Creando material:", materialData);

    try {
      // Validaciones básicas en frontend
      if (!materialData.nombre || !materialData.medida) {
        throw new Error("Nombre y medida son obligatorios");
      }

      const data = await this.makeRequest(this.baseURL, {
        method: "POST",
        body: JSON.stringify(materialData),
      });

      console.log("✅ Material creado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al crear material:", error);
      throw error;
    }
  }

  // ✏️ ACTUALIZAR MATERIAL
  async actualizarMaterial(id, materialData) {
    console.log(`✏️ Actualizando material ID: ${id}`, materialData);

    try {
      if (!materialData.nombre || !materialData.medida) {
        throw new Error("Nombre y medida son obligatorios");
      }

      const data = await this.makeRequest(`${this.baseURL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(materialData),
      });

      console.log("✅ Material actualizado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al actualizar material:", error);
      throw error;
    }
  }

  // 📥 INGRESO DE STOCK
  async ingresoStock(id, cantidad, motivo = "") {
    console.log(`📥 Registrando ingreso - ID: ${id}, Cantidad: ${cantidad}`);

    try {
      if (!cantidad || cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      const data = await this.makeRequest(`${this.baseURL}/${id}/ingreso`, {
        method: "PATCH",
        body: JSON.stringify({ cantidad, motivo }),
      });

      console.log("✅ Ingreso registrado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al registrar ingreso:", error);
      throw error;
    }
  }

  // 📤 SALIDA DE STOCK
  async salidaStock(id, cantidad, motivo = "") {
    console.log(`📤 Registrando salida - ID: ${id}, Cantidad: ${cantidad}`);

    try {
      if (!cantidad || cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      const data = await this.makeRequest(`${this.baseURL}/${id}/salida`, {
        method: "PATCH",
        body: JSON.stringify({ cantidad, motivo }),
      });

      console.log("✅ Salida registrada exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al registrar salida:", error);
      throw error;
    }
  }

  // 🗑️ ELIMINAR MATERIAL
  async eliminarMaterial(id) {
    console.log(`🗑️ Eliminando material ID: ${id}`);

    try {
      const data = await this.makeRequest(`${this.baseURL}/${id}`, {
        method: "DELETE",
      });

      console.log("✅ Material eliminado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al eliminar material:", error);
      throw error;
    }
  }

  // 📊 OBTENER ESTADÍSTICAS
  async obtenerEstadisticas() {
    console.log("📊 Obteniendo estadísticas...");

    try {
      const data = await this.makeRequest(`${this.baseURL}/estadisticas`);
      console.log("✅ Estadísticas obtenidas");
      return data;
    } catch (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      throw new Error("No se pudieron cargar las estadísticas");
    }
  }

  // 🔍 BUSCAR MATERIALES (método helper para filtrado local)
  buscarMateriales(materiales, termino) {
    if (!termino) return materiales;

    const terminoLower = termino.toLowerCase();
    return materiales.filter(
      (material) =>
        material.nombre.toLowerCase().includes(terminoLower) ||
        (material.descripcion &&
          material.descripcion.toLowerCase().includes(terminoLower)) ||
        material.medida.toLowerCase().includes(terminoLower)
    );
  }

  // 🎯 DETERMINAR ESTADO DEL STOCK (método helper)
  getEstadoStock(cantidadActual, cantidadMinima) {
    const actual = Number(cantidadActual ?? 0);
  const minimo = Number(cantidadMinima ?? 0);

  // Si algo viene raro, lo tratamos como stock normal
  if (isNaN(actual) || isNaN(minimo)) {
    return {
      texto: "Stock Normal",
      color: "#38a169",
      bg: "#c6f6d5",
      //icon: "🟢",
    };
  }

  // ⚠️ LÓGICA BASE
  // Crítico: actual < mínimo
  // Bajo:   mínimo <= actual <= 2 * mínimo
  // Normal: actual > 2 * mínimo
  if (actual < minimo) {
    return {
      texto: "Stock Crítico",
      color: "#e53e3e",
      bg: "#fed7d7",
      //icon: "🔴",
    };
  } else if (actual <= minimo * 2) {
    return {
      texto: "Stock Bajo",
      color: "#dd6b20",
      bg: "#feebc8",
      //icon: "🟡",
    };
  } else {
    return {
      texto: "Stock Normal",
      color: "#38a169",
      bg: "#c6f6d5",
      //icon: "🟢",
    };
  }
    // if (cantidadActual < cantidadMinima) {
    //   return {
    //     texto: "Stock Crítico",
    //     color: "#e53e3e",
    //     bg: "#fed7d7",
    //     //icon: '🔴'
    //   };
    // } else if (cantidadActual <= cantidadMinima * 2) {
    //   return {
    //     texto: "Stock Bajo",
    //     color: "#dd6b20",
    //     bg: "#feebc8",
    //     //icon: '🟡'
    //   };
    // } else {
    //   return {
    //     texto: "Stock Normal",
    //     color: "#38a169",
    //     bg: "#c6f6d5",
    //     //icon: '🟢'
    //   };
    // }
  }

  // 📊 OBTENER MOVIMIENTOS DE HERRAMIENTAS
  async obtenerMovimientosHerramientas() {
    console.log("📊 Obteniendo movimientos de herramientas...");

    try {
      const data = await this.makeRequest(`${this.baseURL}/movimientos`);
      console.log(
        `✅ ${data.data.length} movimientos de herramientas obtenidos`
      );
      return data;
    } catch (error) {
      console.error("❌ Error al obtener movimientos de herramientas:", error);
      throw new Error("No se pudieron cargar los movimientos de herramientas");
    }
  }

  // 📊 OBTENER MOVIMIENTOS DE MATERIALES
  async obtenerMovimientosMateriales() {
    console.log("📊 Obteniendo movimientos de materiales...");

    try {
      const data = await this.makeRequest(`${this.baseURL}/movimientos`);
      console.log(`✅ ${data.data.length} movimientos de materiales obtenidos`);
      return data;
    } catch (error) {
      console.error("❌ Error al obtener movimientos de materiales:", error);
      throw new Error("No se pudieron cargar los movimientos de materiales");
    }
  }

  // 🔄 VALIDAR CONEXIÓN CON API
  async validarConexion() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}`, {
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 📝 GUÍA DE ADAPTACIÓN PARA OTROS CRUDs:
/*
🔧 PARA ADAPTAR A OTRA TABLA (ej: herramientas):

1. Cambiar API_CONFIG:
   endpoint: 'herramientas'

2. Cambiar nombres de clase y métodos:
   MaterialesAPI → HerramientasAPI
   crearMaterial → crearHerramienta
   etc.

3. Adaptar validaciones según los campos de la nueva tabla

4. Los métodos base (makeRequest, getAuthHeaders, etc.) son reutilizables

EJEMPLO PARA HERRAMIENTAS:
- API_CONFIG.endpoint = 'herramientas'
- Cambiar mensajes de console.log
- Adaptar validaciones específicas de herramientas
- Todo lo demás queda igual
*/

export default new MaterialesAPI();
