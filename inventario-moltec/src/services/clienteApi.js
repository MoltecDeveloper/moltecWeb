// services/clientesApi.js - VERSIÓN CORREGIDA COMPLETA
// 🔧 CONFIGURACIÓN REUTILIZABLE - Cambiar para otros CRUDs
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL,
  endpoint: "clientes", // 👈 Cambiar por 'herramientas', 'empleados', etc.
  timeout: 10000,
};

class ClientesAPI {
  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/${API_CONFIG.endpoint}`;
  }

  // 🔒 Obtener token de autenticación
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

  // 📋 OBTENER TODOS LOS CLIENTES
  async obtenerClientes() {
    console.log("👥 Obteniendo clientes...");

    try {
      const data = await this.makeRequest(this.baseURL);
      console.log(`✅ ${data.data.length} clientes obtenidos`);
      return data;
    } catch (error) {
      console.error("❌ Error al obtener clientes:", error);
      throw new Error("No se pudieron cargar los clientes");
    }
  }

  // ➕ CREAR NUEVO CLIENTE
  async crearCliente(clienteData) {
    console.log("➕ Creando cliente:", clienteData);

    try {
      // 🔍 VALIDACIONES DE FORMATO EN FRONTEND
      const errores = this.validarClienteFormato(clienteData);
      if (errores.length > 0) {
        throw new Error(errores[0]); // Mostrar el primer error
      }

      const data = await this.makeRequest(this.baseURL, {
        method: "POST",
        body: JSON.stringify(clienteData),
      });

      console.log("✅ Cliente creado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al crear cliente:", error);
      throw error;
    }
  }

  // ✏️ ACTUALIZAR CLIENTE - CORREGIDO
  // Solo valida FORMATO, NO duplicados (el backend se encarga de eso)
  async actualizarCliente(id, clienteData) {
    console.log(`✏️ Actualizando cliente ID: ${id}`, clienteData);

    try {
      // 🔍 SOLO VALIDACIONES DE FORMATO (NO de duplicados)
      const errores = this.validarClienteFormato(clienteData);
      if (errores.length > 0) {
        throw new Error(errores[0]);
      }

      const data = await this.makeRequest(`${this.baseURL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(clienteData),
      });

      console.log("✅ Cliente actualizado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al actualizar cliente:", error);
      throw error;
    }
  }

  // 🗑️ ELIMINAR CLIENTE
  async eliminarCliente(id) {
    console.log(`🗑️ Eliminando cliente ID: ${id}`);

    try {
      const data = await this.makeRequest(`${this.baseURL}/${id}`, {
        method: "DELETE",
      });

      console.log("✅ Cliente eliminado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error al eliminar cliente:", error);
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

  // 🔍 BUSCAR CLIENTES
  async buscarClientes(query, tipo = "todos") {
    console.log(`🔍 Buscando clientes: "${query}" (${tipo})`);

    try {
      if (!query || query.trim().length < 2) {
        throw new Error(
          "El término de búsqueda debe tener al menos 2 caracteres"
        );
      }

      const params = new URLSearchParams();
      params.append("q", query.trim());
      if (tipo !== "todos") {
        params.append("tipo", tipo);
      }

      const data = await this.makeRequest(`${this.baseURL}/buscar?${params}`);
      console.log(`✅ Búsqueda completada: ${data.total} resultados`);
      return data;
    } catch (error) {
      console.error("❌ Error en búsqueda:", error);
      throw error;
    }
  }

  // 🔍 FILTRADO LOCAL (método helper para filtrado en frontend)
  filtrarClientes(clientes, termino) {
    if (!termino) return clientes;

    const terminoLower = termino.toLowerCase();
    return clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(terminoLower) ||
        cliente.apellido.toLowerCase().includes(terminoLower) ||
        (cliente.correo &&
          cliente.correo.toLowerCase().includes(terminoLower)) ||
        (cliente.telefono && cliente.telefono.includes(terminoLower)) ||
        (cliente.nit && cliente.nit.includes(terminoLower)) ||
        `${cliente.nombre} ${cliente.apellido}`
          .toLowerCase()
          .includes(terminoLower)
    );
  }

  // 📋 FORMATEAR DATOS PARA MOSTRAR
  formatearCliente(cliente) {
    return {
      ...cliente,
      nombreCompleto: `${cliente.nombre} ${cliente.apellido}`,
      fechaRegistroFormateada: this.formatearFecha(cliente.fechaRegistro),
    };
  }

  // 📅 FORMATEAR FECHA
  formatearFecha(fecha) {
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
  }

  // 📊 VALIDAR FORMATO DE CLIENTE (SIN verificar duplicados)
  // Esta función SOLO valida que los datos tengan el formato correcto
  // NO verifica si el correo/NIT ya existen (eso lo hace el backend)
  validarClienteFormato(clienteData) {
    const errores = [];

    // Validaciones requeridas
    if (!clienteData.nombre?.trim()) {
      errores.push("El nombre es obligatorio");
    } else if (clienteData.nombre.trim().length > 50) {
      errores.push("El nombre no puede exceder 50 caracteres");
    }

    if (!clienteData.apellido?.trim()) {
      errores.push("El contacto es obligatorio");
    } else if (clienteData.apellido.trim().length > 35) {
      errores.push("El contacto no puede exceder 35 caracteres");
    }

    // Validar FORMATO de correo (NO si ya existe)
    if (
      clienteData.correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteData.correo)
    ) {
      errores.push("El formato del correo electrónico no es válido");
    }

    // Validar FORMATO de teléfono: exactamente 8 dígitos (NO si ya existe)
    if (clienteData.telefono) {
      const telefonoLimpio = clienteData.telefono.replace(/[-\s]/g, "");
      if (!/^\d{8}$/.test(telefonoLimpio)) {
        errores.push("El teléfono debe tener exactamente 8 dígitos");
      }
    }

    // Validar FORMATO de NIT: máximo 9 dígitos (NO si ya existe)
    if (clienteData.nit) {
      if (!/^\d{1,9}(-\d)?$/.test(clienteData.nit.trim())) {
        errores.push(
          "El NIT debe tener máximo 9 dígitos (formato: 12345678 o 12345678-9)"
        );
      }
    }

    return errores;
  }

  // 📊 VALIDAR CLIENTE (mantener compatibilidad)
  // Esta función ahora solo llama a validarClienteFormato
  validarCliente(clienteData) {
    return this.validarClienteFormato(clienteData);
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

  // 📈 GENERAR ESTADÍSTICAS LOCALES
  generarEstadisticasLocales(clientes) {
    return {
      total: clientes.length,
      conCorreo: clientes.filter((c) => c.correo && c.correo.trim()).length,
      conTelefono: clientes.filter((c) => c.telefono && c.telefono.trim())
        .length,
      conNIT: clientes.filter((c) => c.nit && c.nit.trim()).length,
      registrosHoy: clientes.filter((c) => {
        const hoy = new Date().toDateString();
        const fechaCliente = new Date(c.fechaRegistro).toDateString();
        return hoy === fechaCliente;
      }).length,
    };
  }
}

// 📋 GUÍA DE ADAPTACIÓN PARA OTROS CRUDs:
/*
🔧 PARA ADAPTAR A OTRA TABLA (ej: empleados):

1. Cambiar API_CONFIG:
   endpoint: 'empleados'

2. Cambiar nombres de clase y métodos:
   ClientesAPI → EmpleadosAPI
   crearCliente → crearEmpleado
   etc.

3. Adaptar validaciones según los campos de la nueva tabla

4. Los métodos base (makeRequest, getAuthHeaders, etc.) son reutilizables

EJEMPLO PARA EMPLEADOS:
- API_CONFIG.endpoint = 'empleados'
- Cambiar mensajes de console.log
- Adaptar validaciones específicas de empleados
- Todo lo demás queda igual

IMPORTANTE: 
- validarClienteFormato() solo valida FORMATO (longitud, formato de email, etc.)
- NO valida duplicados (correo/NIT ya existentes)
- Los duplicados los valida el BACKEND excluyendo el registro actual al editar
*/

export default new ClientesAPI();
