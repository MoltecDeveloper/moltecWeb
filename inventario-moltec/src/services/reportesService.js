// services/reportesService.js - VERSIÓN CORREGIDA Y PROFESIONAL
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

class ReportesService {
  // GENERAR REPORTE DE INVENTARIO COMPLETO EN PDF
  generarReporteInventarioPDF(materiales, estadisticas) {
    try {
      console.log("Generando reporte PDF de inventario...");

      // Crear nuevo documento PDF
      const doc = new jsPDF();

      // ENCABEZADO ESTÁNDAR
      this.agregarEncabezadoEstandar(
        doc,
        "REPORTE DE INVENTARIO DE MATERIALES",
        false
      );

      // RESUMEN EJECUTIVO
      this.agregarResumenEjecutivo(doc, estadisticas, materiales.length);

      // TABLA DE MATERIALES COMPLETA
      this.agregarTablaMaterialesCompleta(doc, materiales, 130);

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Inventario_Completo_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte PDF generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte PDF:", error);
      throw new Error("No se pudo generar el reporte PDF");
    }
  }

  // GENERAR REPORTE DE STOCK CRÍTICO EN PDF - FORMATO ESTANDARIZADO
  generarReporteStockCriticoPDF(materiales) {
    try {
      console.log("Generando reporte de stock crítico...");

      // Filtrar solo materiales con stock crítico
      const materialesCriticos = materiales.filter(
        (material) =>
          (material.inventario_materiales_cantidad_actual ||
            material.cantidadActual) <=
          (material.inventario_materiales_cantidad_minima ||
            material.cantidadMinima)
      );
      // const materialesCriticos = materiales.filter(
      //   (material) =>
      //     (material.inventario_materiales_cantidad_actual ||
      //       material.cantidadActual) <=
      //     (material.inventario_materiales_cantidad_minima ||
      //       material.cantidadMinima)
      // );

      if (materialesCriticos.length === 0) {
        throw new Error("No hay materiales con stock crítico");
      }

      const doc = new jsPDF();

      // ENCABEZADO ESTÁNDAR (con indicador de criticidad)
      this.agregarEncabezadoEstandar(doc, "REPORTE DE STOCK CRÍTICO", true);

      // RESUMEN EJECUTIVO PARA STOCK CRÍTICO
      //this.agregarResumenStockCritico(doc, materialesCriticos.length, materiales.length);

      // TABLA DE MATERIALES CRÍTICOS
      this.agregarTablaMaterialesCompleta(doc, materialesCriticos, 85);

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Stock_Critico_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte de stock crítico generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte de stock crítico:", error);
      throw error;
    }
  }

  // AGREGAR ENCABEZADO ESTÁNDAR CON LOGO
  agregarEncabezadoEstandar(doc, tituloReporte, esCritico = false) {
    // AGREGAR LOGO DE LA EMPRESA
    try {
      // Logo placeholder - reemplaza 'logo-moltec.png' con tu logo real
      doc.addImage("/LogoMoltecV3.png", "PNG", 15, 10, 40, 40);
    } catch (error) {
      console.warn("Logo no encontrado, continuando sin logo");
    }

    // INFORMACIÓN DE LA EMPRESA
    doc.setTextColor(0, 0, 0); // Volver a negro
    doc.setFont("Arial", "bold");
    doc.setFontSize(20);
    doc.text("MOLTEC S.A.", 55, 25);

    doc.setFont("Arial", "normal");
    doc.setFontSize(12);
    doc.text("Constructora", 55, 32);
    doc.text("Sistema de Gestión de Inventario", 55, 38);

    // TÍTULO DEL REPORTE
    doc.setFont("Arial", "bold");
    doc.setFontSize(16);

    if (esCritico) {
      doc.setTextColor(220, 53, 69); // Rojo para reportes críticos
      doc.text("ALERTA - " + tituloReporte, 20, 55);
    } else {
      doc.setTextColor(19, 31, 43); // Azul oscuro para reportes normales
      doc.text(tituloReporte, 20, 55);
    }

    // FECHA Y HORA DE GENERACIÓN
    doc.setTextColor(100, 100, 100); // Gris
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    const fechaHora = new Date().toLocaleString("es-GT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Generado el: ${fechaHora}`, 20, 65);

    // INFORMACIÓN DE CONTACTO
    doc.text("Email: admin@grupomolet.info | Tel: +502 2212-4880", 20, 70);

    // LÍNEA SEPARADORA
    doc.setDrawColor(19, 31, 43);
    doc.setLineWidth(1);
    doc.line(20, 75, 190, 75);

    // Resetear color de texto
    doc.setTextColor(0, 0, 0);
  }

  // AGREGAR RESUMEN EJECUTIVO ESTÁNDAR
  agregarResumenEjecutivo(doc, estadisticas, totalMateriales) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(19, 31, 43);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // ESTADÍSTICAS PRINCIPALES
    const resumenTexto = [
      `Total de materiales registrados: ${totalMateriales}`,
      `Materiales con stock normal: ${estadisticas.stockNormal || 0}`,
      `Materiales con stock bajo: ${
        totalMateriales -
        (estadisticas.stockCritico || 0) -
        (estadisticas.stockNormal || 0)
      }`,
      `Materiales con stock crítico: ${estadisticas.stockCritico || 0}`,
    ];

    resumenTexto.forEach((texto) => {
      doc.text("• " + texto, 25, yPosition);
      yPosition += 7;
    });
  }

  // RESUMEN ESPECÍFICO PARA STOCK CRÍTICO
  agregarResumenStockCritico(doc, materialesCriticos, totalMateriales) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(220, 53, 69);
    doc.text("ALERTA DE INVENTARIO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Caja de alerta crítica
    doc.setFillColor(254, 215, 215);
    doc.roundedRect(20, yPosition - 3, 170, 25, 3, 3, "F");
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(2);
    doc.roundedRect(20, yPosition - 3, 170, 25, 3, 3, "D");

    doc.setFont("Arial", "bold");
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text("REABASTECIMIENTO URGENTE REQUERIDO", 105, yPosition + 5, {
      align: "center",
    });

    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${materialesCriticos} de ${totalMateriales} materiales están en nivel crítico`,
      105,
      yPosition + 12,
      { align: "center" }
    );
    doc.text("Contactar a proveedores inmediatamente", 105, yPosition + 18, {
      align: "center",
    });
  }

  // AGREGAR TABLA DE MATERIALES COMPLETA (con fechas)
  agregarTablaMaterialesCompleta(doc, materiales, startY) {
    // COLUMNAS DE LA TABLA (incluyendo fechas)
    const columnas = [
      "Material",
      "Descripción",
      "Medida",
      "Stock Actual",
      "Stock Mínimo",
      "Fecha Ingreso",
      "Última Actualización",
      "Estado",
    ];

    // PREPARAR DATOS DE LAS FILAS
    const filas = materiales.map((material) => {
      const cantidadActual =
        material.inventario_materiales_cantidad_actual ||
        material.cantidadActual;
      const cantidadMinima =
        material.inventario_materiales_cantidad_minima ||
        material.cantidadMinima;
      const estado = this.determinarEstadoStock(cantidadActual, cantidadMinima);

      // Formatear fechas
      const fechaIngreso = this.formatearFecha(
        material.inventario_fecha_ingreso || material.fechaIngreso
      );
      const fechaActualizacion = this.formatearFecha(
        material.inventario_fecha_actualizacion || material.fechaActualizacion
      );

      return [
        material.inventario_materiales_nombre || material.nombre,
        material.inventario_materiales_descripcion ||
          material.descripcion ||
          "Sin descripción",
        material.inventario_materiales_medida || material.medida,
        cantidadActual.toString(),
        cantidadMinima.toString(),
        fechaIngreso,
        fechaActualizacion,
        estado.texto,
      ];
    });

    // CONFIGURAR Y GENERAR TABLA
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: filas,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: "Arial",
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [19, 31, 43], // Color azul oscuro de Moltec
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        font: "Arial",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Gris muy claro alternado
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Material
        1: { cellWidth: 35 }, // Descripción
        2: { cellWidth: 18 }, // Medida
        3: { cellWidth: 15, halign: "center" }, // Stock Actual
        4: { cellWidth: 15, halign: "center" }, // Stock Mínimo
        5: { cellWidth: 20, halign: "center", fontSize: 7 }, // Fecha Ingreso
        6: { cellWidth: 20, halign: "center", fontSize: 7 }, // Última Actualización
        7: { cellWidth: 22, halign: "center", fontSize: 8 }, // Estado
      },
      didParseCell: function (data) {
        // COLOREAR FILAS SEGÚN EL ESTADO DEL STOCK
        if (data.section === "body" && data.column.index === 7) {
          const estado = data.cell.text[0];
          if (estado === "Stock Crítico") {
            data.cell.styles.fillColor = [254, 215, 215]; // Rojo claro
            data.cell.styles.textColor = [185, 28, 28]; // Rojo oscuro
            data.cell.styles.fontStyle = "bold";
          } else if (estado === "Stock Bajo") {
            data.cell.styles.fillColor = [254, 235, 200]; // Naranja claro
            data.cell.styles.textColor = [154, 52, 18]; // Naranja oscuro
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [198, 246, 213]; // Verde claro
            data.cell.styles.textColor = [21, 128, 61]; // Verde oscuro
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 20, right: 20 }, // CAMBIADO: ahora coincide con la línea separadora (X=20)
      theme: "striped",
      showHead: "everyPage",
    });
  }

  // AGREGAR PIE DE PÁGINA ESTANDARIZADO
  agregarPiePagina(doc) {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // LÍNEA SUPERIOR
      doc.setDrawColor(19, 31, 43);
      doc.setLineWidth(0.5);
      doc.line(20, 278, 190, 278); // Línea de X=20 a X=190

      // INFORMACIÓN DEL PIE
      doc.setFont("Arial", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      // Lado izquierdo
      doc.text("MOLTEC S.A. - Sistema de Gestión de Inventario", 20, 285); // X=20 para coincidir
      doc.text("Zona 11, Ciudad de Guatemala, Guatemala", 20, 290); // X=20 para coincidir

      // Lado derecho
      doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: "right" }); // X=190 para coincidir
      doc.text(this.obtenerFechaCompleta(), 190, 290, { align: "right" }); // X=190 para coincidir

      // Centro
      doc.text("admin@grupomolet.info | +502 2212-4880", 105, 285, {
        align: "center",
      });
      doc.text("Documento generado automáticamente por el sistema", 105, 290, {
        align: "center",
      });
    }
  }

  // DETERMINAR ESTADO DEL STOCK
  determinarEstadoStock(cantidadActual, cantidadMinima) {
    const actual = Number(cantidadActual ?? 0);
    const minimo = Number(cantidadMinima ?? 0);

    if (isNaN(actual) || isNaN(minimo)) {
      return { texto: "Stock Normal", color: "#38a169" };
    }

    if (actual < minimo) {
      return { texto: "Stock Crítico", color: "#e53e3e" };
    } else if (actual <= minimo * 2) {
      return { texto: "Stock Bajo", color: "#dd6b20" };
    } else {
      return { texto: "Stock Normal", color: "#38a169" };
    }
    // if (cantidadActual <= cantidadMinima) {
    //   return { texto: "Stock Crítico", color: "#e53e3e" };
    // } else if (cantidadActual <= cantidadMinima * 2) {
    //   return { texto: "Stock Bajo", color: "#dd6b20" };
    // } else {
    //   return { texto: "Stock Normal", color: "#38a169" };
    // }
  }

  // FORMATEAR FECHA PARA MOSTRAR EN TABLA
  formatearFecha(fecha) {
    if (!fecha) return "N/A";

    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  }

  // OBTENER FECHA FORMATEADA PARA ARCHIVOS
  obtenerFechaFormateada() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    const hora = String(ahora.getHours()).padStart(2, "0");
    const minuto = String(ahora.getMinutes()).padStart(2, "0");

    return `${año}-${mes}-${dia}_${hora}-${minuto}`;
  }

  // OBTENER FECHA COMPLETA PARA PIE DE PÁGINA
  obtenerFechaCompleta() {
    return new Date().toLocaleDateString("es-GT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // GENERAR ESTADÍSTICAS PARA RESUMEN
  calcularEstadisticas(materiales) {
    const estadisticas = {
      total: materiales.length,
      stockCritico: 0,
      stockBajo: 0,
      stockNormal: 0,
    };

    materiales.forEach((material) => {
      const cantidadActual =
        material.inventario_materiales_cantidad_actual ||
        material.cantidadActual;
      const cantidadMinima =
        material.inventario_materiales_cantidad_minima ||
        material.cantidadMinima;

      const actual = Number(cantidadActual ?? 0);
      const minimo = Number(cantidadMinima ?? 0);

      if (actual < minimo) {
        estadisticas.stockCritico++;
      } else if (actual <= minimo * 2) {
        estadisticas.stockBajo++;
      } else {
        estadisticas.stockNormal++;
      }
    });

    return estadisticas;
  }

  // MÉTODO PÚBLICO PARA GENERAR REPORTE CON ESTADÍSTICAS CALCULADAS
  async generarReporteCompleto(materiales) {
    const estadisticas = this.calcularEstadisticas(materiales);
    return this.generarReporteInventarioPDF(materiales, estadisticas);
  }

  // AGREGAR ESTOS MÉTODOS AL FINAL de la clase ReportesService en reportesService.js
  // (Antes del cierre de la clase, antes de "export default new ReportesService();")

  // GENERAR REPORTE DE CLIENTES COMPLETO EN PDF
  generarReporteClientesPDF(clientes, estadisticas) {
    try {
      console.log("Generando reporte PDF de clientes...");

      // Crear nuevo documento PDF
      const doc = new jsPDF();

      // ENCABEZADO ESTÁNDAR
      this.agregarEncabezadoEstandar(
        doc,
        "REPORTE DE BASE DE DATOS DE CLIENTES",
        false
      );

      // RESUMEN EJECUTIVO PARA CLIENTES
      this.agregarResumenEjecutivoClientes(doc, estadisticas, clientes.length);

      // TABLA DE CLIENTES COMPLETA
      this.agregarTablaClientesCompleta(doc, clientes, 130);

      // PIE DE PÁGINA (reutiliza el método existente)
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Clientes_Completo_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte PDF generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte PDF de clientes:", error);
      throw new Error("No se pudo generar el reporte PDF de clientes");
    }
  }

  // RESUMEN EJECUTIVO ESPECÍFICO PARA CLIENTES
  agregarResumenEjecutivoClientes(doc, estadisticas, totalClientes) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(19, 31, 43);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // ESTADÍSTICAS PRINCIPALES DE CLIENTES
    const resumenTexto = [
      `Total de clientes registrados: ${totalClientes}`,
      `Clientes con correo electrónico: ${estadisticas.clientesConCorreo || 0}`,
      `Clientes con teléfono: ${estadisticas.clientesConTelefono || 0}`,
      `Clientes con NIT: ${estadisticas.clientesConNIT || 0}`,
      //`Porcentaje de completitud de datos: ${this.calcularPorcentajeCompletitud(estadisticas, totalClientes)}%`
    ];

    resumenTexto.forEach((texto) => {
      doc.text("• " + texto, 25, yPosition);
      yPosition += 7;
    });
  }

  // TABLA DE CLIENTES COMPLETA
  agregarTablaClientesCompleta(doc, clientes, startY) {
    // COLUMNAS DE LA TABLA
    const columnas = [
      "Nombre Completo",
      "Correo Electrónico",
      "Teléfono",
      "NIT",
      "Fecha Registro",
    ];

    // PREPARAR DATOS DE LAS FILAS
    const filas = clientes.map((cliente) => {
      return [
        `${cliente.nombre} ${cliente.apellido}`,
        cliente.correo || "Sin correo",
        cliente.telefono || "Sin teléfono",
        cliente.nit || "Sin NIT",
        this.formatearFecha(cliente.fechaRegistro),
      ];
    });

    // CONFIGURAR Y GENERAR TABLA
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: filas,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: "Arial",
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [19, 31, 43], // Color azul oscuro de Moltec
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        font: "Arial",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Gris muy claro alternado
      },
      columnStyles: {
        0: { cellWidth: 45 }, // Nombre Completo
        1: { cellWidth: 50 }, // Correo
        2: { cellWidth: 25, halign: "center" }, // Teléfono
        3: { cellWidth: 25, halign: "center" }, // NIT
        4: { cellWidth: 25, halign: "center", fontSize: 8 }, // Fecha Registro
      },
      didParseCell: function (data) {
        // RESALTAR FILAS CON DATOS FALTANTES
        if (data.section === "body") {
          const cellText = data.cell.text[0];
          if (
            cellText === "Sin correo" ||
            cellText === "Sin teléfono" ||
            cellText === "Sin NIT"
          ) {
            data.cell.styles.fillColor = [255, 249, 196]; // Amarillo claro
            data.cell.styles.textColor = [133, 77, 14]; // Texto naranja oscuro
            data.cell.styles.fontStyle = "italic";
          }
        }
      },
      margin: { left: 20, right: 20 },
      theme: "striped",
      showHead: "everyPage",
    });
  }

  // CALCULAR PORCENTAJE DE COMPLETITUD DE DATOS
  calcularPorcentajeCompletitud(estadisticas, total) {
    if (total === 0) return 0;

    const camposCompletos =
      (estadisticas.clientesConCorreo || 0) +
      (estadisticas.clientesConTelefono || 0) +
      (estadisticas.clientesConNIT || 0);
    const camposTotales = total * 3; // 3 campos opcionales por cliente

    return Math.round((camposCompletos / camposTotales) * 100);
  }

  // MÉTODO PÚBLICO PARA GENERAR REPORTE COMPLETO DE CLIENTES
  async generarReporteCompletoClientes(clientes) {
    const estadisticas = this.calcularEstadisticasClientes(clientes);
    return this.generarReporteClientesPDF(clientes, estadisticas);
  }

  // GENERAR ESTADÍSTICAS PARA CLIENTES
  calcularEstadisticasClientes(clientes) {
    const estadisticas = {
      total: clientes.length,
      clientesConCorreo: 0,
      clientesConTelefono: 0,
      clientesConNIT: 0,
    };

    clientes.forEach((cliente) => {
      if (cliente.correo && cliente.correo.trim()) {
        estadisticas.clientesConCorreo++;
      }
      if (cliente.telefono && cliente.telefono.trim()) {
        estadisticas.clientesConTelefono++;
      }
      if (cliente.nit && cliente.nit.trim()) {
        estadisticas.clientesConNIT++;
      }
    });

    return estadisticas;
  }
  // GENERAR REPORTE DE EMPLEADOS COMPLETO EN PDF
  async generarReporteEmpleados(empleados, configuracion, puestos) {
    try {
      console.log("Generando reporte PDF de empleados...");

      const doc = new jsPDF();

      // Determinar título según configuración
      let tituloReporte = "REPORTE DE EMPLEADOS";
      if (configuracion.tipoReporte === "por-puesto") {
        const puesto = puestos.find(
          (p) => p.id === configuracion.puestoSeleccionado
        );
        tituloReporte = `REPORTE DE EMPLEADOS - ${
          puesto?.nombre.toUpperCase() || "PUESTO ESPECÍFICO"
        }`;
      } else if (configuracion.tipoReporte === "por-estado") {
        tituloReporte = `REPORTE DE EMPLEADOS POR ESTADO`;
      }

      // ENCABEZADO ESTÁNDAR
      this.agregarEncabezadoEstandar(doc, tituloReporte, false);

      // RESUMEN EJECUTIVO PARA EMPLEADOS
      this.agregarResumenEjecutivoEmpleados(doc, empleados, configuracion);

      // TABLA DE EMPLEADOS
      this.agregarTablaEmpleadosCompleta(
        doc,
        empleados,
        configuracion,
        puestos,
        130
      );

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Empleados_${
        configuracion.tipoReporte
      }_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte PDF generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte PDF de empleados:", error);
      throw new Error("No se pudo generar el reporte PDF de empleados");
    }
  }

  // RESUMEN EJECUTIVO ESPECÍFICO PARA EMPLEADOS
  agregarResumenEjecutivoEmpleados(doc, empleados, configuracion) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(19, 31, 43);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // ESTADÍSTICAS DE EMPLEADOS
    const activos = empleados.filter((emp) => emp.status === "activo").length;
    const inactivos = empleados.filter(
      (emp) => emp.status === "inactivo"
    ).length;

    const resumenTexto = [
      `Total de empleados en el reporte: ${empleados.length}`,
      `Empleados activos: ${activos}`,
      `Empleados inactivos: ${inactivos}`,
      `Tipo de reporte: ${this.obtenerDescripcionTipoReporte(
        configuracion.tipoReporte
      )}`,
      `Filtros aplicados: ${this.obtenerDescripcionFiltros(configuracion)}`,
    ];

    resumenTexto.forEach((texto) => {
      doc.text("• " + texto, 25, yPosition);
      yPosition += 7;
    });
  }

  // TABLA DE EMPLEADOS COMPLETA
  agregarTablaEmpleadosCompleta(
    doc,
    empleados,
    configuracion,
    puestos,
    startY
  ) {
    // COLUMNAS DINÁMICAS SEGÚN CONFIGURACIÓN
    const columnas = ["Nombre Completo", "Puesto", "Estado"];

    if (configuracion.incluirContacto) {
      columnas.push("Teléfono", "Emergencia");
    }

    if (configuracion.incluirFechas) {
      columnas.push("F. Contratación", "Antigüedad");
    }

    // PREPARAR DATOS DE LAS FILAS
    const filas = empleados.map((empleado) => {
      const puesto = puestos.find((p) => p.id === empleado.puestoId);
      const fila = [
        `${empleado.nombre} ${empleado.apellido}`,
        puesto?.nombre || "Sin puesto",
        empleado.status === "activo" ? "Activo" : "Inactivo",
      ];

      if (configuracion.incluirContacto) {
        fila.push(
          empleado.telefono
            ? this.formatearTelefono(empleado.telefono)
            : "Sin teléfono",
          empleado.numeroEmergencia
            ? this.formatearTelefono(empleado.numeroEmergencia)
            : "Sin contacto"
        );
      }

      if (configuracion.incluirFechas) {
        fila.push(
          this.formatearFecha(empleado.fechaContratacion),
          this.calcularAntiguedadEmpleado(
            empleado.fechaContratacion,
            empleado.fechaFinalizacion
          )
        );
      }

      return fila;
    });

    // Configuración de la tabla (adaptativa según columnas)
    const anchoColumnas = this.calcularAnchoColumnas(
      columnas.length,
      configuracion
    );

    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: filas,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: "Arial",
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [19, 31, 43],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        font: "Arial",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: anchoColumnas,
      didParseCell: function (data) {
        // Colorear estado
        if (data.section === "body" && data.column.index === 2) {
          const estado = data.cell.text[0];
          if (estado.includes("Inactivo")) {
            data.cell.styles.fillColor = [254, 215, 215];
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [198, 246, 213];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 20, right: 20 },
      theme: "striped",
      showHead: "everyPage",
    });
  }

  // MÉTODOS HELPER PARA EMPLEADOS
  obtenerDescripcionTipoReporte(tipo) {
    switch (tipo) {
      case "general":
        return "Reporte general completo";
      case "por-puesto":
        return "Filtrado por puesto específico";
      case "por-estado":
        return "Agrupado por estado";
      default:
        return "Reporte personalizado";
    }
  }

  obtenerDescripcionFiltros(configuracion) {
    const filtros = [];
    if (configuracion.estadoSeleccionado !== "todos") {
      filtros.push(`Estado: ${configuracion.estadoSeleccionado}`);
    }
    if (
      configuracion.tipoReporte === "por-puesto" &&
      configuracion.puestoSeleccionado
    ) {
      filtros.push("Puesto específico");
    }
    return filtros.length > 0 ? filtros.join(", ") : "Ninguno";
  }

  calcularAnchoColumnas(totalColumnas, configuracion) {
    // Distribuir ancho según número de columnas
    const anchoBase = 170 / totalColumnas; // Ancho total disponible
    const columnas = {};

    for (let i = 0; i < totalColumnas; i++) {
      columnas[i] = { cellWidth: anchoBase, halign: "left" };
    }

    // Ajustes específicos
    if (configuracion.incluirContacto) {
      columnas[3] = { cellWidth: anchoBase * 0.8, halign: "center" }; // Teléfono
      columnas[4] = { cellWidth: anchoBase * 0.8, halign: "center" }; // Emergencia
    }

    return columnas;
  }

  calcularAntiguedadEmpleado(fechaContratacion, fechaFinalizacion) {
    if (!fechaContratacion) return "N/A";

    try {
      const fechaInicio = new Date(fechaContratacion);
      const fechaFinal = fechaFinalizacion
        ? new Date(fechaFinalizacion)
        : new Date();

      const diffTime = Math.abs(fechaFinal - fechaInicio);
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      const diffMonths = Math.floor(
        (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
      );

      if (diffYears > 0) {
        return `${diffYears}a ${diffMonths}m`;
      } else {
        return `${diffMonths}m`;
      }
    } catch (error) {
      return "Error";
    }
  }

  formatearTelefono(telefono) {
    if (!telefono) return "";
    const clean = telefono.replace(/\D/g, "");
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return telefono;
  }

  // AGREGAR ESTOS MÉTODOS AL FINAL DE LA CLASE ReportesService en reportesService.js
  // (Antes del cierre de la clase, antes de "export default new ReportesService();")

  // GENERAR REPORTE DE HERRAMIENTAS COMPLETO EN PDF
  async generarReporteHerramientasPDF(
    herramientas,
    estadisticas,
    configuracion = {}
  ) {
    try {
      console.log("Generando reporte PDF de herramientas...");

      const doc = new jsPDF();

      // Determinar título según configuración
      let tituloReporte = "REPORTE DE INVENTARIO DE HERRAMIENTAS";
      if (configuracion.tipoReporte === "por-estado") {
        tituloReporte = `REPORTE DE HERRAMIENTAS POR ESTADO`;
      } else if (configuracion.tipoReporte === "por-stock") {
        tituloReporte = `REPORTE DE HERRAMIENTAS POR NIVEL DE STOCK`;
      }

      // ENCABEZADO ESTÁNDAR
      this.agregarEncabezadoEstandar(doc, tituloReporte, false);

      // RESUMEN EJECUTIVO PARA HERRAMIENTAS
      const yDespuesResumen = this.agregarResumenEjecutivoHerramientas(
        doc,
        estadisticas,
        herramientas.length,
        configuracion
      );

      // TABLA DE HERRAMIENTAS - POSICIÓN CORREGIDA
      this.agregarTablaHerramientasCompleta(
        doc,
        herramientas,
        configuracion,
        yDespuesResumen + 10
      );

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Herramientas_${
        configuracion.tipoReporte || "completo"
      }_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte PDF generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte PDF de herramientas:", error);
      throw new Error("No se pudo generar el reporte PDF de herramientas");
    }
  }

  // GENERAR REPORTE DE STOCK CRÍTICO DE HERRAMIENTAS
  async generarReporteStockCriticoHerramientasPDF(herramientas) {
    try {
      console.log("Generando reporte de stock crítico de herramientas...");

      // Filtrar solo herramientas con stock crítico
      const herramientasCriticas = herramientas.filter((herramienta) => {
        const actual = Number(herramienta.cantidadActual ?? 0);
        const minimo = Number(herramienta.cantidadMinima ?? 0);
        return actual < minimo;
      });
      // const herramientasCriticas = herramientas.filter(
      //   (herramienta) =>
      //     herramienta.cantidadActual <= herramienta.cantidadMinima
      // );

      if (herramientasCriticas.length === 0) {
        throw new Error("No hay herramientas con stock crítico");
      }

      const doc = new jsPDF();

      // ENCABEZADO ESTÁNDAR (con indicador de criticidad)
      this.agregarEncabezadoEstandar(
        doc,
        "REPORTE DE STOCK CRÍTICO - HERRAMIENTAS",
        true
      );

      // RESUMEN ESPECÍFICO PARA STOCK CRÍTICO
      this.agregarResumenStockCriticoHerramientas(
        doc,
        herramientasCriticas.length,
        herramientas.length
      );

      // TABLA DE HERRAMIENTAS CRÍTICAS
      this.agregarTablaHerramientasCompleta(
        doc,
        herramientasCriticas,
        { tipoReporte: "stock-critico" },
        110
      );

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Herramientas_Stock_Critico_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte de stock crítico generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte de stock crítico:", error);
      throw error;
    }
  }

  // RESUMEN EJECUTIVO ESPECÍFICO PARA HERRAMIENTAS - RETORNA POSICIÓN Y
  agregarResumenEjecutivoHerramientas(
    doc,
    estadisticas,
    totalHerramientas,
    configuracion
  ) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(19, 31, 43);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // ESTADÍSTICAS PRINCIPALES
    let resumenTexto = [
      `Total de herramientas en el reporte: ${totalHerramientas}`,
      `Herramientas con stock crítico: ${estadisticas.stockCritico || 0}`,
      `Herramientas con stock bajo: ${estadisticas.stockBajo || 0}`,
      `Herramientas con stock normal: ${estadisticas.stockNormal || 0}`,
    ];

    // Agregar estadísticas por estado si está disponible
    if (estadisticas.herramientasNuevas !== undefined) {
      resumenTexto = resumenTexto.concat([
        `Herramientas nuevas: ${estadisticas.herramientasNuevas || 0}`,
        `Herramientas en buen estado: ${
          estadisticas.herramientasBuenEstado || 0
        }`,
        `Herramientas desgastadas: ${
          estadisticas.herramientasDesgastadas || 0
        }`,
        `Herramientas en reparación: ${
          estadisticas.herramientasEnReparacion || 0
        }`,
        `Herramientas dadas de baja: ${estadisticas.herramientasBaja || 0}`,
      ]);
    }

    // Agregar información del filtro aplicado
    if (configuracion.tipoReporte) {
      resumenTexto.push(
        `Tipo de reporte: ${this.obtenerDescripcionTipoReporteHerramientas(
          configuracion.tipoReporte
        )}`
      );
    }

    resumenTexto.forEach((texto) => {
      doc.text("• " + texto, 25, yPosition);
      yPosition += 7;
    });

    // RETORNAR LA POSICIÓN Y FINAL
    return yPosition;
  }

  // TABLA DE HERRAMIENTAS COMPLETA - CON CONFIGURACIÓN DINÁMICA
  agregarTablaHerramientasCompleta(doc, herramientas, configuracion, startY) {
    // CONSTRUIR COLUMNAS DINÁMICAMENTE
    let columnas = ["Herramienta", "Marca/Modelo"];

    // Agregar columnas de detalles si está habilitado
    if (configuracion.incluirDetalles) {
      columnas.push("Descripción", "Medida");
    }

    // Siempre incluir stock y estados
    columnas.push(
      "Stock Actual",
      "Stock Mínimo",
      "Estado Stock",
      "Estado Herramienta"
    );

    // Agregar fecha solo si está habilitado
    if (configuracion.incluirFechas) {
      columnas.push("Fecha Ingreso");
    }

    // CONSTRUIR FILAS DINÁMICAMENTE SEGÚN LAS COLUMNAS
    const filas = herramientas.map((herramienta) => {
      const estadoStock = this.determinarEstadoStockHerramienta(
        herramienta.cantidadActual,
        herramienta.cantidadMinima
      );

      // Construir fila paso a paso según las columnas definidas
      let fila = [];

      // Siempre agregar herramienta y marca/modelo
      fila.push(herramienta.nombre);
      fila.push(
        this.formatearMarcaModelo(herramienta.marca, herramienta.modelo)
      );

      // Agregar detalles solo si está configurado
      if (configuracion.incluirDetalles) {
        fila.push(herramienta.descripcion || "Sin descripción");
        fila.push(herramienta.medida || "No definida");
      }

      // Siempre agregar stock y estados
      fila.push(herramienta.cantidadActual.toString());
      fila.push(herramienta.cantidadMinima.toString());
      fila.push(estadoStock.texto);
      fila.push(herramienta.estado);

      // Agregar fecha solo si está configurado
      if (configuracion.incluirFechas) {
        fila.push(this.formatearFecha(herramienta.fechaIngreso));
      }

      return fila;
    });

    // CALCULAR ESTILOS DE COLUMNA DINÁMICAMENTE CON MEJOR DISTRIBUCIÓN
    const columnStyles =
      this.calcularAnchoColumnasHerramientasMejorado(configuracion);

    // GENERAR TABLA
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: filas,
      styles: {
        fontSize: configuracion.incluirDetalles ? 7 : 8,
        cellPadding: 2,
        font: "Arial",
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [19, 31, 43],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: configuracion.incluirDetalles ? 8 : 9,
        font: "Arial",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: columnStyles,
      didParseCell: function (data) {
        // Encontrar índices dinámicamente
        const estadoStockIndex = columnas.indexOf("Estado Stock");
        const estadoHerramientaIndex = columnas.indexOf("Estado Herramienta");

        // COLOREAR ESTADO DE STOCK
        if (data.section === "body" && data.column.index === estadoStockIndex) {
          const estadoStock = data.cell.text[0];
          if (estadoStock === "Stock Crítico") {
            data.cell.styles.fillColor = [254, 215, 215];
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          } else if (estadoStock === "Stock Bajo") {
            data.cell.styles.fillColor = [254, 235, 200];
            data.cell.styles.textColor = [154, 52, 18];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [198, 246, 213];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          }
        }

        // COLOREAR ESTADO DE HERRAMIENTA
        if (
          data.section === "body" &&
          data.column.index === estadoHerramientaIndex
        ) {
          const estadoHerramienta = data.cell.text[0];
          switch (estadoHerramienta) {
            case "Nuevo":
              data.cell.styles.fillColor = [198, 246, 213];
              data.cell.styles.textColor = [21, 128, 61];
              break;
            case "En buen estado":
              data.cell.styles.fillColor = [190, 227, 248];
              data.cell.styles.textColor = [49, 130, 206];
              break;
            case "Desgastado":
              data.cell.styles.fillColor = [254, 235, 200];
              data.cell.styles.textColor = [154, 52, 18];
              break;
            case "En reparación":
              data.cell.styles.fillColor = [250, 240, 137];
              data.cell.styles.textColor = [113, 63, 18];
              break;
            case "Baja":
              data.cell.styles.fillColor = [254, 215, 215];
              data.cell.styles.textColor = [185, 28, 28];
              break;
          }
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 20, right: 20 },
      theme: "striped",
      showHead: "everyPage",
    });
  }
  // RESUMEN ESPECÍFICO PARA STOCK CRÍTICO DE HERRAMIENTAS
  agregarResumenStockCriticoHerramientas(
    doc,
    herramientasCriticas,
    totalHerramientas
  ) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(220, 53, 69);
    doc.text("ALERTA DE INVENTARIO - HERRAMIENTAS", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Caja de alerta crítica
    doc.setFillColor(254, 215, 215);
    doc.roundedRect(20, yPosition - 3, 170, 25, 3, 3, "F");
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(2);
    doc.roundedRect(20, yPosition - 3, 170, 25, 3, 3, "D");

    doc.setFont("Arial", "bold");
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text("REABASTECIMIENTO URGENTE REQUERIDO", 105, yPosition + 5, {
      align: "center",
    });

    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${herramientasCriticas} de ${totalHerramientas} herramientas están en nivel crítico`,
      105,
      yPosition + 12,
      { align: "center" }
    );
    doc.text(
      "Verificar disponibilidad y realizar compras inmediatamente",
      105,
      yPosition + 18,
      {
        align: "center",
      }
    );
  }

  calcularAnchoColumnasHerramientasMejorado(configuracion) {
    const columnStyles = {};
    let currentIndex = 0;

    if (configuracion.incluirDetalles && configuracion.incluirFechas) {
      // Tabla completa (9 columnas) - distribución actual está bien
      columnStyles[currentIndex++] = { cellWidth: 20 }; // Herramienta
      columnStyles[currentIndex++] = { cellWidth: 18 }; // Marca/Modelo
      columnStyles[currentIndex++] = { cellWidth: 22 }; // Descripción
      columnStyles[currentIndex++] = { cellWidth: 15 }; // Medida
      columnStyles[currentIndex++] = { cellWidth: 12, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 12, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Estado Stock
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Estado Herramienta
      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Fecha Ingreso
    } else if (configuracion.incluirDetalles && !configuracion.incluirFechas) {
      // Con detalles, sin fechas (8 columnas) - MEJORADO pero razonable
      columnStyles[currentIndex++] = { cellWidth: 25 }; // Herramienta
      columnStyles[currentIndex++] = { cellWidth: 23 }; // Marca/Modelo
      columnStyles[currentIndex++] = { cellWidth: 30 }; // Descripción
      columnStyles[currentIndex++] = { cellWidth: 18 }; // Medida
      columnStyles[currentIndex++] = { cellWidth: 15, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 15, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 22, halign: "center" }; // Estado Stock
      columnStyles[currentIndex++] = { cellWidth: 22, halign: "center" }; // Estado Herramienta
    } else if (!configuracion.incluirDetalles && configuracion.incluirFechas) {
      // Sin detalles, con fechas (7 columnas) - MEJORADO pero razonable
      columnStyles[currentIndex++] = { cellWidth: 28 }; // Herramienta
      columnStyles[currentIndex++] = { cellWidth: 25 }; // Marca/Modelo
      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 24, halign: "center" }; // Estado Stock
      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Estado Herramienta
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Fecha Ingreso
    } else {
      // Tabla básica (6 columnas) - SIN DETALLES NI FECHAS - BALANCEADO
      columnStyles[currentIndex++] = { cellWidth: 32 }; // Herramienta
      columnStyles[currentIndex++] = { cellWidth: 28 }; // Marca/Modelo
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 26, halign: "center" }; // Estado Stock
      columnStyles[currentIndex++] = { cellWidth: 28, halign: "center" }; // Estado Herramienta
    }

    return columnStyles;
  }

  // NUEVO MÉTODO: CALCULAR ANCHOS DE COLUMNA DINÁMICAMENTE
  calcularAnchoColumnasHerramientas(totalColumnas, configuracion) {
    const columnStyles = {};

    if (configuracion.incluirDetalles && configuracion.incluirFechas) {
      // Tabla completa (9 columnas)
      columnStyles[0] = { cellWidth: 20 }; // Herramienta
      columnStyles[1] = { cellWidth: 18 }; // Marca/Modelo
      columnStyles[2] = { cellWidth: 22 }; // Descripción
      columnStyles[3] = { cellWidth: 15 }; // Medida
      columnStyles[4] = { cellWidth: 12, halign: "center" }; // Stock Actual
      columnStyles[5] = { cellWidth: 12, halign: "center" }; // Stock Mínimo
      columnStyles[6] = { cellWidth: 18, halign: "center" }; // Estado Stock
      columnStyles[7] = { cellWidth: 20, halign: "center" }; // Estado Herramienta
      columnStyles[8] = { cellWidth: 18, halign: "center" }; // Fecha Ingreso
    } else if (configuracion.incluirDetalles) {
      // Con detalles, sin fechas (8 columnas)
      columnStyles[0] = { cellWidth: 22 }; // Herramienta
      columnStyles[1] = { cellWidth: 20 }; // Marca/Modelo
      columnStyles[2] = { cellWidth: 25 }; // Descripción
      columnStyles[3] = { cellWidth: 18 }; // Medida
      columnStyles[4] = { cellWidth: 15, halign: "center" }; // Stock Actual
      columnStyles[5] = { cellWidth: 15, halign: "center" }; // Stock Mínimo
      columnStyles[6] = { cellWidth: 20, halign: "center" }; // Estado Stock
      columnStyles[7] = { cellWidth: 22, halign: "center" }; // Estado Herramienta
    } else if (configuracion.incluirFechas) {
      // Sin detalles, con fechas (7 columnas)
      columnStyles[0] = { cellWidth: 25 }; // Herramienta
      columnStyles[1] = { cellWidth: 22 }; // Marca/Modelo
      columnStyles[2] = { cellWidth: 18, halign: "center" }; // Stock Actual
      columnStyles[3] = { cellWidth: 18, halign: "center" }; // Stock Mínimo
      columnStyles[4] = { cellWidth: 22, halign: "center" }; // Estado Stock
      columnStyles[5] = { cellWidth: 25, halign: "center" }; // Estado Herramienta
      columnStyles[6] = { cellWidth: 20, halign: "center" }; // Fecha Ingreso
    } else {
      // Tabla básica (6 columnas)
      columnStyles[0] = { cellWidth: 30 }; // Herramienta
      columnStyles[1] = { cellWidth: 25 }; // Marca/Modelo
      columnStyles[2] = { cellWidth: 20, halign: "center" }; // Stock Actual
      columnStyles[3] = { cellWidth: 20, halign: "center" }; // Stock Mínimo
      columnStyles[4] = { cellWidth: 25, halign: "center" }; // Estado Stock
      columnStyles[5] = { cellWidth: 30, halign: "center" }; // Estado Herramienta
    }

    return columnStyles;
  }

  // MÉTODOS HELPER ESPECÍFICOS PARA HERRAMIENTAS
  determinarEstadoStockHerramienta(cantidadActual, cantidadMinima) {
    const actual = Number(cantidadActual ?? 0);
    const minimo = Number(cantidadMinima ?? 0);

    if (isNaN(actual) || isNaN(minimo)) {
      return { texto: "Stock Normal", color: "#38a169" };
    }

    if (actual < minimo) {
      return { texto: "Stock Crítico", color: "#e53e3e" };
    } else if (actual <= minimo * 2) {
      return { texto: "Stock Bajo", color: "#dd6b20" };
    } else {
      return { texto: "Stock Normal", color: "#38a169" };
    }
    // if (cantidadActual <= cantidadMinima) {
    //   return { texto: "Stock Crítico", color: "#e53e3e" };
    // } else if (cantidadActual <= cantidadMinima * 2) {
    //   return { texto: "Stock Bajo", color: "#dd6b20" };
    // } else {
    //   return { texto: "Stock Normal", color: "#38a169" };
    // }
  }

  formatearMarcaModelo(marca, modelo) {
    if (marca && modelo) {
      return `${marca} ${modelo}`;
    } else if (marca) {
      return marca;
    } else if (modelo) {
      return `Modelo: ${modelo}`;
    } else {
      return "Sin especificar";
    }
  }

  obtenerDescripcionTipoReporteHerramientas(tipo) {
    switch (tipo) {
      case "completo":
        return "Reporte completo de todas las herramientas";
      case "por-estado":
        return "Filtrado por estado de herramienta";
      case "por-stock":
        return "Filtrado por nivel de stock";
      case "stock-critico":
        return "Solo herramientas con stock crítico";
      default:
        return "Reporte personalizado";
    }
  }

  // MÉTODO PÚBLICO PARA GENERAR REPORTE COMPLETO DE HERRAMIENTAS
  async generarReporteCompletoHerramientas(
    herramientas,
    estadisticas,
    configuracion = {}
  ) {
    return this.generarReporteHerramientasPDF(
      herramientas,
      estadisticas,
      configuracion
    );
  }

  // 📋 GENERAR REPORTE DE PROYECTOS COMPLETO EN PDF
  async generarReporteProyectosPDF(
    proyectos,
    estadisticas,
    configuracion = {}
  ) {
    try {
      console.log("Generando reporte PDF de proyectos...");

      const doc = new jsPDF();

      // Título simple sin tipos específicos
      const tituloReporte = "REPORTE DE GESTIÓN DE PROYECTOS";

      // ENCABEZADO ESTÁNDAR
      this.agregarEncabezadoEstandar(doc, tituloReporte, false);

      // RESUMEN EJECUTIVO PARA PROYECTOS
      const yDespuesResumen = this.agregarResumenEjecutivoProyectos(
        doc,
        estadisticas,
        proyectos.length,
        configuracion
      );

      // TABLA DE PROYECTOS
      this.agregarTablaProyectosCompleta(
        doc,
        proyectos,
        configuracion,
        yDespuesResumen + 10
      );

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Proyectos_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte PDF generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte PDF de proyectos:", error);
      throw new Error("No se pudo generar el reporte PDF de proyectos");
    }
  }

  // RESUMEN EJECUTIVO PARA PROYECTOS
  agregarResumenEjecutivoProyectos(
    doc,
    estadisticas,
    totalProyectos,
    configuracion
  ) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(19, 31, 43);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // ESTADÍSTICAS PRINCIPALES
    const resumenTexto = [
      `Total de proyectos en el reporte: ${totalProyectos}`,
      `Proyectos planificados: ${estadisticas.planificados || 0}`,
      `Proyectos en progreso: ${estadisticas.enProgreso || 0}`,
      `Proyectos completados: ${estadisticas.completados || 0}`,
      `Proyectos pausados: ${estadisticas.pausados || 0}`,
      `Proyectos cancelados: ${estadisticas.cancelados || 0}`,
      `Proyectos aprobados: ${estadisticas.aprobados || 0}`,
      `Proyectos pendientes: ${estadisticas.pendientes || 0}`,
    ];

    // Agregar valor total si está disponible
    if (estadisticas.valorTotal !== undefined) {
      resumenTexto.push(
        `Valor total de proyectos: ${this.formatearMonedaParaReporte(
          estadisticas.valorTotal
        )}`
      );
    }

    resumenTexto.forEach((texto) => {
      doc.text("• " + texto, 25, yPosition);
      yPosition += 7;
    });

    return yPosition;
  }

  // TABLA DE PROYECTOS COMPLETA
  agregarTablaProyectosCompleta(doc, proyectos, configuracion, startY) {
    // COLUMNAS BASE
    let columnas = ["Proyecto", "Cliente", "Responsable"];

    // Agregar columnas según configuración
    if (configuracion.incluirFechas) {
      columnas.push("F. Inicio", "F. Est. Fin");
    }

    columnas.push("Estado");

    if (configuracion.incluirAprobacion) {
      columnas.push("Aprobado");
    }

    if (configuracion.incluirFinanzas) {
      columnas.push("Cotización", "N° Cotiz."); // ⭐ AGREGADA COLUMNA
    }

    // CONSTRUIR FILAS
    const filas = proyectos.map((proyecto) => {
      let fila = [];

      // Datos base
      fila.push(proyecto.nombre || "Sin nombre");
      fila.push(proyecto.clienteNombre || "Sin cliente");
      fila.push(proyecto.responsableNombre || "Sin responsable");

      // Fechas si están habilitadas
      if (configuracion.incluirFechas) {
        fila.push(this.formatearFecha(proyecto.fechaInicio));
        fila.push(this.formatearFecha(proyecto.fechaAproxFin));
      }

      // Estado siempre
      fila.push(proyecto.status || "Sin estado");

      // Aprobación si está habilitada
      if (configuracion.incluirAprobacion) {
        fila.push(proyecto.aprobado ? "Sí" : "No");
      }

      // Finanzas si están habilitadas
      if (configuracion.incluirFinanzas) {
        fila.push(this.formatearMonedaParaReporte(proyecto.cotizacion));
        fila.push(
          proyecto.numCotizacion ? proyecto.numCotizacion.toString() : "-"
        ); // ⭐ AGREGADO
      }

      return fila;
    });

    // ESTILOS DE COLUMNA
    const columnStyles = this.calcularAnchoColumnasProyectos(configuracion);

    // GENERAR TABLA
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: filas,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: "Arial",
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [19, 31, 43],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        font: "Arial",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: columnStyles,
      didParseCell: function (data) {
        const estadoIndex = columnas.indexOf("Estado");
        const aprobadoIndex = columnas.indexOf("Aprobado");

        // Colorear estado
        if (data.section === "body" && data.column.index === estadoIndex) {
          const estado = data.cell.text[0];
          switch (estado) {
            case "planificado":
              data.cell.styles.fillColor = [190, 227, 248];
              data.cell.styles.textColor = [49, 130, 206];
              break;
            case "en progreso":
              data.cell.styles.fillColor = [254, 235, 200];
              data.cell.styles.textColor = [154, 52, 18];
              break;
            case "completado":
              data.cell.styles.fillColor = [198, 246, 213];
              data.cell.styles.textColor = [21, 128, 61];
              break;
            case "pausado":
              data.cell.styles.fillColor = [250, 240, 137];
              data.cell.styles.textColor = [113, 63, 18];
              break;
            case "cancelado":
              data.cell.styles.fillColor = [254, 215, 215];
              data.cell.styles.textColor = [185, 28, 28];
              break;
          }
          data.cell.styles.fontStyle = "bold";
        }

        // Colorear aprobación
        if (data.section === "body" && data.column.index === aprobadoIndex) {
          const aprobado = data.cell.text[0];
          if (aprobado === "Sí") {
            data.cell.styles.fillColor = [198, 246, 213];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [254, 235, 200];
            data.cell.styles.textColor = [154, 52, 18];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 20, right: 20 },
      theme: "striped",
      showHead: "everyPage",
    });
  }

  // CALCULAR ANCHOS DE COLUMNA
  calcularAnchoColumnasProyectos(configuracion) {
    const columnStyles = {};
    let currentIndex = 0;

    // Determinar número total de columnas
    let totalColumnas = 4; // Proyecto, Cliente, Responsable, Estado
    if (configuracion.incluirFechas) totalColumnas += 2;
    if (configuracion.incluirAprobacion) totalColumnas += 1;
    if (configuracion.incluirFinanzas) totalColumnas += 2; // ⭐ AHORA SON 2: Cotización + N° Cotiz.

    if (totalColumnas <= 6) {
      // Tabla con pocas columnas
      columnStyles[currentIndex++] = { cellWidth: 35 }; // Proyecto
      columnStyles[currentIndex++] = { cellWidth: 30 }; // Cliente
      columnStyles[currentIndex++] = { cellWidth: 30 }; // Responsable

      if (configuracion.incluirFechas) {
        columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" };
        columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" };
      }

      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Estado

      if (configuracion.incluirAprobacion) {
        columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" };
      }

      if (configuracion.incluirFinanzas) {
        columnStyles[currentIndex++] = { cellWidth: 25, halign: "right" }; // Cotización
        columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // ⭐ N° Cotiz.
      }
    } else {
      // Tabla con muchas columnas (más compacta)
      columnStyles[currentIndex++] = { cellWidth: 22 }; // Proyecto
      columnStyles[currentIndex++] = { cellWidth: 20 }; // Cliente
      columnStyles[currentIndex++] = { cellWidth: 20 }; // Responsable

      if (configuracion.incluirFechas) {
        columnStyles[currentIndex++] = { cellWidth: 16, halign: "center" };
        columnStyles[currentIndex++] = { cellWidth: 16, halign: "center" };
      }

      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Estado

      if (configuracion.incluirAprobacion) {
        columnStyles[currentIndex++] = { cellWidth: 14, halign: "center" };
      }

      if (configuracion.incluirFinanzas) {
        columnStyles[currentIndex++] = { cellWidth: 20, halign: "right" }; // Cotización
        columnStyles[currentIndex++] = { cellWidth: 14, halign: "center" }; // ⭐ N° Cotiz.
      }
    }

    return columnStyles;
  }

  // FORMATEAR MONEDA PARA REPORTES
  formatearMonedaParaReporte(valor) {
    if (!valor || valor === 0) return "Q 0.00";

    const num = Number(valor) || 0;
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // CALCULAR ESTADÍSTICAS PARA PROYECTOS
  calcularEstadisticasProyectos(proyectos) {
    const estadisticas = {
      total: proyectos.length,
      planificados: 0,
      enProgreso: 0,
      completados: 0,
      pausados: 0,
      cancelados: 0,
      aprobados: 0,
      pendientes: 0,
      valorTotal: 0,
    };

    proyectos.forEach((proyecto) => {
      // Contar por estado
      switch (proyecto.status) {
        case "planificado":
          estadisticas.planificados++;
          break;
        case "en progreso":
          estadisticas.enProgreso++;
          break;
        case "completado":
          estadisticas.completados++;
          break;
        case "pausado":
          estadisticas.pausados++;
          break;
        case "cancelado":
          estadisticas.cancelados++;
          break;
      }

      // Contar por aprobación
      if (proyecto.aprobado) {
        estadisticas.aprobados++;
      } else {
        estadisticas.pendientes++;
      }

      // Sumar valor total
      const cotizacion = Number(proyecto.cotizacion) || 0;
      estadisticas.valorTotal += cotizacion;
    });

    return estadisticas;
  }

  // MÉTODO PÚBLICO PARA GENERAR REPORTE
  async generarReporteProyectos(proyectosFiltrados, configuracion) {
    try {
      console.log("Procesando reporte de proyectos...");
      console.log("Configuración:", configuracion);
      console.log("Proyectos a procesar:", proyectosFiltrados.length);

      const estadisticas =
        this.calcularEstadisticasProyectos(proyectosFiltrados);

      const resultado = await this.generarReporteProyectosPDF(
        proyectosFiltrados,
        estadisticas,
        configuracion
      );

      console.log("Reporte generado exitosamente");
      return { success: true, message: "Reporte generado exitosamente" };
    } catch (error) {
      console.error("Error al generar reporte:", error);
      return {
        success: false,
        message: error.message || "Error al generar el reporte",
      };
    }
  }

  // MÉTODO PÚBLICO PARA GENERAR REPORTE COMPLETO DE MATERIALES CON CONFIGURACIÓN
  async generarReporteCompletoMateriales(
    materiales,
    estadisticas,
    configuracion = {}
  ) {
    try {
      console.log("Generando reporte PDF de materiales con configuración...");

      const doc = new jsPDF();

      // Determinar título según configuración
      let tituloReporte = "REPORTE DE INVENTARIO DE MATERIALES";
      if (configuracion.tipoReporte === "por-stock") {
        const nivelTexto =
          configuracion.nivelStockSeleccionado === "critico"
            ? "CRÍTICO"
            : configuracion.nivelStockSeleccionado === "bajo"
            ? "BAJO"
            : "NORMAL";
        tituloReporte = `REPORTE DE MATERIALES - STOCK ${nivelTexto}`;
      }

      // ENCABEZADO ESTÁNDAR
      this.agregarEncabezadoEstandar(
        doc,
        tituloReporte,
        configuracion.nivelStockSeleccionado === "critico"
      );

      // RESUMEN EJECUTIVO PARA MATERIALES
      const yDespuesResumen = this.agregarResumenEjecutivoMateriales(
        doc,
        estadisticas,
        materiales.length,
        configuracion
      );

      // TABLA DE MATERIALES
      this.agregarTablaMaterialesConfigurable(
        doc,
        materiales,
        configuracion,
        yDespuesResumen + 10
      );

      // PIE DE PÁGINA
      this.agregarPiePagina(doc);

      // DESCARGAR ARCHIVO
      const nombreArchivo = `Reporte_Materiales_${
        configuracion.tipoReporte || "completo"
      }_${this.obtenerFechaFormateada()}.pdf`;
      doc.save(nombreArchivo);

      console.log(`Reporte PDF generado: ${nombreArchivo}`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte PDF de materiales:", error);
      throw new Error("No se pudo generar el reporte PDF de materiales");
    }
  }

  // RESUMEN EJECUTIVO ESPECÍFICO PARA MATERIALES
  agregarResumenEjecutivoMateriales(
    doc,
    estadisticas,
    totalMateriales,
    configuracion
  ) {
    let yPosition = 85;

    doc.setFont("Arial", "bold");
    doc.setFontSize(14);
    doc.setTextColor(19, 31, 43);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;
    doc.setFont("Arial", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // ESTADÍSTICAS PRINCIPALES
    const resumenTexto = [
      `Total de materiales en el reporte: ${totalMateriales}`,
      `Materiales con stock crítico: ${estadisticas.stockCritico || 0}`,
      `Materiales con stock bajo: ${estadisticas.stockBajo || 0}`,
      `Materiales con stock normal: ${estadisticas.stockNormal || 0}`,
    ];

    // Agregar información del filtro aplicado
    if (configuracion.tipoReporte) {
      resumenTexto.push(
        `Tipo de reporte: ${this.obtenerDescripcionTipoReporteMateriales(
          configuracion.tipoReporte
        )}`
      );
    }

    resumenTexto.forEach((texto) => {
      doc.text("• " + texto, 25, yPosition);
      yPosition += 7;
    });

    return yPosition;
  }

  // TABLA DE MATERIALES CONFIGURABLE
  agregarTablaMaterialesConfigurable(doc, materiales, configuracion, startY) {
    // CONSTRUIR COLUMNAS DINÁMICAMENTE
    let columnas = ["Material"];

    // Agregar columnas de detalles si está habilitado
    if (configuracion.incluirDetalles) {
      columnas.push("Descripción");
    }

    // Siempre incluir medida, stock y estado
    columnas.push("Medida", "Stock Actual", "Stock Mínimo", "Estado Stock");

    // Agregar fechas solo si está habilitado
    if (configuracion.incluirFechas) {
      columnas.push("Fecha Ingreso", "Última Actualización");
    }

    // CONSTRUIR FILAS DINÁMICAMENTE SEGÚN LAS COLUMNAS
    const filas = materiales.map((material) => {
      const estadoStock = this.determinarEstadoStock(
        material.cantidadActual,
        material.cantidadMinima
      );

      // Construir fila paso a paso según las columnas definidas
      let fila = [];

      // Siempre agregar material
      fila.push(material.nombre);

      // Agregar descripción solo si está configurado
      if (configuracion.incluirDetalles) {
        fila.push(material.descripcion || "Sin descripción");
      }

      // Siempre agregar medida, stock y estado
      fila.push(material.medida || "No definida");
      fila.push(material.cantidadActual.toString());
      fila.push(material.cantidadMinima.toString());
      fila.push(estadoStock.texto);

      // Agregar fechas solo si está configurado
      if (configuracion.incluirFechas) {
        fila.push(this.formatearFecha(material.fechaIngreso));
        fila.push(this.formatearFecha(material.fechaActualizacion));
      }

      return fila;
    });

    // CALCULAR ESTILOS DE COLUMNA DINÁMICAMENTE
    const columnStyles = this.calcularAnchoColumnasMateriales(configuracion);

    // GENERAR TABLA
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: filas,
      styles: {
        fontSize: configuracion.incluirDetalles ? 7 : 8,
        cellPadding: 2,
        font: "Arial",
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [19, 31, 43],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: configuracion.incluirDetalles ? 8 : 9,
        font: "Arial",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: columnStyles,
      didParseCell: function (data) {
        // Encontrar índice del estado de stock dinámicamente
        const estadoStockIndex = columnas.indexOf("Estado Stock");

        // COLOREAR ESTADO DE STOCK
        if (data.section === "body" && data.column.index === estadoStockIndex) {
          const estadoStock = data.cell.text[0];
          if (estadoStock === "Stock Crítico") {
            data.cell.styles.fillColor = [254, 215, 215];
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          } else if (estadoStock === "Stock Bajo") {
            data.cell.styles.fillColor = [254, 235, 200];
            data.cell.styles.textColor = [154, 52, 18];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [198, 246, 213];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 20, right: 20 },
      theme: "striped",
      showHead: "everyPage",
    });
  }

  // CALCULAR ANCHOS DE COLUMNA PARA MATERIALES
  calcularAnchoColumnasMateriales(configuracion) {
    const columnStyles = {};
    let currentIndex = 0;

    if (configuracion.incluirDetalles && configuracion.incluirFechas) {
      // Tabla completa (8 columnas)
      columnStyles[currentIndex++] = { cellWidth: 25 }; // Material
      columnStyles[currentIndex++] = { cellWidth: 30 }; // Descripción
      columnStyles[currentIndex++] = { cellWidth: 18 }; // Medida
      columnStyles[currentIndex++] = { cellWidth: 15, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 15, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 22, halign: "center" }; // Estado Stock
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Fecha Ingreso
      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Última Actualización
    } else if (configuracion.incluirDetalles && !configuracion.incluirFechas) {
      // Con detalles, sin fechas (6 columnas)
      columnStyles[currentIndex++] = { cellWidth: 35 }; // Material
      columnStyles[currentIndex++] = { cellWidth: 40 }; // Descripción
      columnStyles[currentIndex++] = { cellWidth: 25 }; // Medida
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 20, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 30, halign: "center" }; // Estado Stock
    } else if (!configuracion.incluirDetalles && configuracion.incluirFechas) {
      // Sin detalles, con fechas (7 columnas)
      columnStyles[currentIndex++] = { cellWidth: 30 }; // Material
      columnStyles[currentIndex++] = { cellWidth: 22 }; // Medida
      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 18, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Estado Stock
      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Fecha Ingreso
      columnStyles[currentIndex++] = { cellWidth: 32, halign: "center" }; // Última Actualización
    } else {
      // Tabla básica (5 columnas)
      columnStyles[currentIndex++] = { cellWidth: 40 }; // Material
      columnStyles[currentIndex++] = { cellWidth: 30 }; // Medida
      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Stock Actual
      columnStyles[currentIndex++] = { cellWidth: 25, halign: "center" }; // Stock Mínimo
      columnStyles[currentIndex++] = { cellWidth: 50, halign: "center" }; // Estado Stock
    }

    return columnStyles;
  }

  // OBTENER DESCRIPCIÓN DE TIPO DE REPORTE PARA MATERIALES
  obtenerDescripcionTipoReporteMateriales(tipo) {
    switch (tipo) {
      case "completo":
        return "Reporte completo de inventario";
      case "por-stock":
        return "Filtrado por nivel de stock";
      default:
        return "Reporte personalizado";
    }
  }
}

export default new ReportesService();
