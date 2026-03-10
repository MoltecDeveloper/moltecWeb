// // admin.jsx - Panel de Administración Principal
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/authContext';
// import Sidebar from '../components/sidebar';
// import MaterialesPage from '../pages/MaterialesPage';
// import MaterialesCRUD from '../pages/MaterialesCRUD';
// import ClientesCRUD from '../pages/ClientesCRUD';
// import EmpleadosCRUD from '../pages/EmpleadosCRUD';
// import HerramientasCRUD from '../pages/HerramientasCRUD';
// import ProyectosCRUD from '../pages/ProyectosCRUD';
// import DashboardStats from '../pages/DashboardStats';
// import BitacoraCRUD from '../pages/Bitacora';
// import { toast } from 'react-toastify';

// const Admin = () => {
//   const [activeSection, setActiveSection] = useState('dashboard');
//   const { user, logout, isAdmin, getUserName, getUserRole } = useAuth();
//   const navigate = useNavigate();

//   // Manejo del cambio de sección
//   const handleSectionChange = (section) => {
//     setActiveSection(section);
//     console.log(`📱 Navegando a: ${section}`);
//   };

//   // Manejo del logout mejorado
//   const handleLogout = () => {
//     const userName = getUserName();
//     console.log(`👋 ${userName} está cerrando sesión desde admin panel`);
    
//     // Toast de despedida
//     toast.success(`¡Hasta luego ${userName}! 👋`);
    
//     // Logout y redirección
//     logout();
//     navigate('/login');
//   };

//   // Verificar si el usuario existe
//   if (!user) {
//     return (
//       <div style={styles.errorContainer}>
//         <h2>❌ No hay sesión activa</h2>
//         <p>Redirigiendo al login...</p>
//       </div>
//     );
//   }

//   // Renderizar contenido según la sección activa
//   const renderContent = () => {
//     switch (activeSection) {
//       case 'dashboard':
//          return <DashboardStats />;
//         // return (
//         //   <div style={styles.contentSection}>
//         //     <h1 style={styles.sectionTitle}>🏢 Dashboard Principal</h1>
//         //     <div style={styles.welcomeCard}>
//         //       <h2>¡Bienvenido al Panel de Administración! 👋</h2>
//         //       <div style={styles.statsGrid}>
//         //         <div style={styles.statCard}>
//         //           <h3>📊 Proyectos Activos</h3>
//         //           <p style={styles.statNumber}>12</p>
//         //         </div>
//         //         <div style={styles.statCard}>
//         //           <h3>👥 Empleados</h3>
//         //           <p style={styles.statNumber}>25</p>
//         //         </div>
//         //         <div style={styles.statCard}>
//         //           <h3>📦 Materiales</h3>
//         //           <p style={styles.statNumber}>150</p>
//         //         </div>
//         //         <div style={styles.statCard}>
//         //           <h3>🔧 Herramientas</h3>
//         //           <p style={styles.statNumber}>45</p>
//         //         </div>
//         //       </div>
//         //       <div style={styles.userInfo}>
//         //         <p><strong>Usuario:</strong> {getUserName()}</p>
//         //         <p><strong>Rol:</strong> {getUserRole()} {isAdmin && '👑'}</p>
//         //         <p><strong>ID:</strong> {user.pk_usuario_id}</p>
//         //       </div>
//         //     </div>
//         //   </div>
//         // );

//       case 'materiales':
//         //return <MaterialesPage />;
//         return <MaterialesCRUD />;


//       case 'herramientas':
//         return <HerramientasCRUD />;
//         // return (
//         //   <div style={styles.contentSection}>
//         //     <h1 style={styles.sectionTitle}>🔧 Inventario de Herramientas</h1>
//         //     <p>Gestión de herramientas del inventario.</p>
//         //     <div style={styles.placeholder}>
//         //       <p>🚧 Página en construcción</p>
//         //       <p>Aquí irá el CRUD de herramientas</p>
//         //     </div>
//         //   </div>
//         // );

//       case 'clientes':
//         return <ClientesCRUD />;
//         // return (
//         //   <div style={styles.contentSection}>
//         //     <h1 style={styles.sectionTitle}>👥 Gestión de Clientes</h1>
//         //     <p>Administración de clientes y contactos.</p>
//         //     <div style={styles.placeholder}>
//         //       <p>🚧 Página en construcción</p>
//         //       <p>Aquí irá el CRUD de clientes</p>
//         //     </div>
//         //   </div>
//         // );

//       case 'empleados':
//         return <EmpleadosCRUD />;
//         // return (
//         //   <div style={styles.contentSection}>
//         //     <h1 style={styles.sectionTitle}>👷 Gestión de Empleados</h1>
//         //     <p>Administración de empleados y puestos.</p>
//         //     <div style={styles.placeholder}>
//         //       <p>🚧 Página en construcción</p>
//         //       <p>Aquí irá el CRUD de empleados</p>
//         //     </div>
//         //   </div>
//         // );

//       case 'proyectos':
//         return <ProyectosCRUD />;

//       case 'bitacora':
//         return <BitacoraCRUD />;
//         // return (
//         //   <div style={styles.contentSection}>
//         //     <h1 style={styles.sectionTitle}>📋 Bitácora del Sistema</h1>
//         //     <p>Registro de actividades y eventos del sistema.</p>
//         //     <div style={styles.placeholder}>
//         //       <p>🚧 Página en construcción</p>
//         //       <p>Aquí irá la vista de bitácora</p>
//         //     </div>
//         //   </div>
//         // );

//       case 'solo-admin':
//         return (
//           <div style={styles.contentSection}>
//             <h1 style={styles.sectionTitle}>👑 Panel Solo para Administradores</h1>
//             <div style={styles.adminOnlyCard}>
//               <h2>🔒 Área Restringida</h2>
//               <p>Esta sección es visible solo para administradores.</p>
//               <div style={styles.adminInfo}>
//                 <p><strong>✅ Tienes acceso como:</strong> {getUserRole()}</p>
//                 <p><strong>🆔 Usuario ID:</strong> {user.pk_usuario_id}</p>
//                 <p><strong>🎭 Role ID:</strong> {user.fk_role_id}</p>
//               </div>
//               <div style={styles.adminActions}>
//                 <button style={styles.actionButton}>🔧 Configuración Avanzada</button>
//                 <button style={styles.actionButton}>📊 Reportes Ejecutivos</button>
//                 <button style={styles.actionButton}>👥 Gestión de Usuarios</button>
//                 <button style={styles.actionButton}>🔐 Permisos del Sistema</button>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return (
//           <div style={styles.contentSection}>
//             <h1 style={styles.sectionTitle}>❓ Sección no encontrada</h1>
//             <p>La sección "{activeSection}" no existe.</p>
//           </div>
//         );
//     }
//   };

//   return (
//     <div style={styles.adminContainer}>
//       <Sidebar
//         activeSection={activeSection}
//         onSectionChange={handleSectionChange}
//         userName={getUserName()}
//         userRole={getUserRole()}
//         isAdmin={isAdmin}
//         onLogout={handleLogout}
//       />
      
//       <main style={styles.mainContent}>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // Estilos del componente
// const styles = {
//   adminContainer: {
//     display: 'flex',
//     height: '100vh',
//     backgroundColor: '#f7fafc',
//     fontFamily: 'Arial, sans-serif'
//   },

//   mainContent: {
//     marginLeft: '280px',
//     flex: 1,
//     padding: '20px',
//     overflowY: 'auto',
//     backgroundColor: '#f7fafc'
//   },

//   errorContainer: {
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: '100vh',
//     backgroundColor: '#f7fafc',
//     fontFamily: 'Arial, sans-serif'
//   },

//   contentSection: {
//     backgroundColor: 'white',
//     borderRadius: '12px',
//     padding: '30px',
//     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
//     minHeight: 'calc(100vh - 40px)'
//   },

//   sectionTitle: {
//     fontSize: '28px',
//     fontWeight: '700',
//     color: '#2d3748',
//     marginBottom: '20px',
//     borderBottom: '3px solid #667eea',
//     paddingBottom: '10px',
//     fontFamily: 'Arial, sans-serif'
//   },

//   welcomeCard: {
//     backgroundColor: '#f8f9fa',
//     padding: '25px',
//     borderRadius: '12px',
//     border: '1px solid #e2e8f0'
//   },

//   statsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//     gap: '20px',
//     margin: '25px 0'
//   },

//   statCard: {
//     backgroundColor: 'white',
//     padding: '20px',
//     borderRadius: '8px',
//     textAlign: 'center',
//     boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
//     border: '1px solid #e2e8f0'
//   },

//   statNumber: {
//     fontSize: '32px',
//     fontWeight: 'bold',
//     color: '#667eea',
//     margin: '10px 0'
//   },

//   userInfo: {
//     backgroundColor: 'white',
//     padding: '20px',
//     borderRadius: '8px',
//     border: '1px solid #e2e8f0'
//   },

//   placeholder: {
//     textAlign: 'center',
//     padding: '60px 20px',
//     backgroundColor: '#f8f9fa',
//     borderRadius: '8px',
//     border: '2px dashed #cbd5e0',
//     margin: '20px 0'
//   },

//   adminOnlyCard: {
//     backgroundColor: '#e6f3ff',
//     padding: '30px',
//     borderRadius: '12px',
//     border: '2px solid #3182ce',
//     textAlign: 'center'
//   },

//   adminInfo: {
//     backgroundColor: 'white',
//     padding: '20px',
//     borderRadius: '8px',
//     margin: '20px 0',
//     border: '1px solid #3182ce'
//   },

//   adminActions: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//     gap: '15px',
//     marginTop: '25px'
//   },

//   actionButton: {
//     padding: '12px 20px',
//     backgroundColor: '#3182ce',
//     color: 'white',
//     border: 'none',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     fontSize: '14px',
//     fontWeight: '500',
//     transition: 'all 0.2s ease',
//     fontFamily: 'Arial, sans-serif'
//   }
// };

// export default Admin;

// admin.jsx - Panel con Sidebar Responsive
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import Sidebar from '../components/sidebar2';
import MaterialesCRUD from '../pages/MaterialesCRUD2';
import ClientesCRUD from '../pages/ClientesCRUD2';
import EmpleadosCRUD from '../pages/EmpleadosCRUD2';
import HerramientasCRUD from '../pages/HerramientasCRUD2';
import ProyectosCRUD from '../pages/ProyectosCRUD2';
import DashboardStats from '../pages/DashboardStats2';
import BitacoraCRUD from '../pages/Bitacora2';
import { toast } from 'react-toastify';
import './AdminStyles2.css';

const Admin = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, logout, isAdmin, getUserName, getUserRole } = useAuth();
  const navigate = useNavigate();

  // Manejo del cambio de sección
  const handleSectionChange = (section) => {
    setActiveSection(section);
    console.log(`📱 Navegando a: ${section}`);
  };

  // Manejo del logout
  const handleLogout = () => {
    const userName = getUserName();
    console.log(`👋 ${userName} está cerrando sesión desde admin panel`);
    toast.success(`¡Hasta luego ${userName}! 👋`);
    logout();
    navigate('/login');
  };

  // Verificar si el usuario existe
  if (!user) {
    return (
      <div className="admin-error-container">
        <h2>❌ No hay sesión activa</h2>
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  // Renderizar contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardStats />;
      case 'materiales':
        return <MaterialesCRUD />;
      case 'herramientas':
        return <HerramientasCRUD />;
      case 'clientes':
        return <ClientesCRUD />;
      case 'empleados':
        return <EmpleadosCRUD />;
      case 'proyectos':
        return <ProyectosCRUD />;
      case 'bitacora':
        return <BitacoraCRUD />;
      case 'solo-admin':
        return (
          <div className="admin-content-section">
            <h1 className="admin-section-title">👑 Panel Solo para Administradores</h1>
            <div className="admin-only-card">
              <h2>🔒 Área Restringida</h2>
              <p>Esta sección es visible solo para administradores.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="admin-content-section">
            <h1 className="admin-section-title">❓ Sección no encontrada</h1>
            <p>La sección "{activeSection}" no existe.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userName={getUserName()}
        userRole={getUserRole()}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      
      <main className="admin-main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Admin;

/* // admin.jsx - Panel de Administración Principal
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import Sidebar from '../components/sidebar';
import MaterialesPage from '../pages/MaterialesPage';
import MaterialesCRUD from '../pages/MaterialesCRUD2';
import ClientesCRUD from '../pages/ClientesCRUD2';
import EmpleadosCRUD from '../pages/EmpleadosCRUD2';
import HerramientasCRUD from '../pages/HerramientasCRUD2';
import ProyectosCRUD from '../pages/ProyectosCRUD2';
import DashboardStats from '../pages/DashboardStats';
import BitacoraCRUD from '../pages/Bitacora2';
import { toast } from 'react-toastify';

const Admin = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, logout, isAdmin, getUserName, getUserRole } = useAuth();
  const navigate = useNavigate();

  // Manejo del cambio de sección
  const handleSectionChange = (section) => {
    setActiveSection(section);
    console.log(`📱 Navegando a: ${section}`);
  };

  // Manejo del logout mejorado
  const handleLogout = () => {
    const userName = getUserName();
    console.log(`👋 ${userName} está cerrando sesión desde admin panel`);
    
    // Toast de despedida
    toast.success(`¡Hasta luego ${userName}! 👋`);
    
    // Logout y redirección
    logout();
    navigate('/login');
  };

  // Verificar si el usuario existe
  if (!user) {
    return (
      <div style={styles.errorContainer}>
        <h2>❌ No hay sesión activa</h2>
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  // Renderizar contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
         return <DashboardStats />;
      case 'materiales':
        return <MaterialesCRUD />;
      case 'herramientas':
        return <HerramientasCRUD />;
      case 'clientes':
        return <ClientesCRUD />;
      case 'empleados':
        return <EmpleadosCRUD />;
      case 'proyectos':
        return <ProyectosCRUD />;
      case 'bitacora':
        return <BitacoraCRUD />;

      case 'solo-admin':
        return (
          <div style={styles.contentSection}>
            <h1 style={styles.sectionTitle}>👑 Panel Solo para Administradores</h1>
            <div style={styles.adminOnlyCard}>
              <h2>🔒 Área Restringida</h2>
              <p>Esta sección es visible solo para administradores.</p>
              <div style={styles.adminInfo}>
                <p><strong>✅ Tienes acceso como:</strong> {getUserRole()}</p>
                <p><strong>🆔 Usuario ID:</strong> {user.pk_usuario_id}</p>
                <p><strong>🎭 Role ID:</strong> {user.fk_role_id}</p>
              </div>
              <div style={styles.adminActions}>
                <button style={styles.actionButton}>🔧 Configuración Avanzada</button>
                <button style={styles.actionButton}>📊 Reportes Ejecutivos</button>
                <button style={styles.actionButton}>👥 Gestión de Usuarios</button>
                <button style={styles.actionButton}>🔐 Permisos del Sistema</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={styles.contentSection}>
            <h1 style={styles.sectionTitle}>❓ Sección no encontrada</h1>
            <p>La sección "{activeSection}" no existe.</p>
          </div>
        );
    }
  };

  return (
    <div style={styles.adminContainer}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userName={getUserName()}
        userRole={getUserRole()}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      
      <main style={styles.mainContent}>
        {renderContent()}
      </main>
    </div>
  );
};

// Estilos del componente
const styles = {
  adminContainer: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f7fafc',
    fontFamily: 'Arial, sans-serif'
  },

  mainContent: {
    marginLeft: '280px',
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f7fafc'
  },

  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f7fafc',
    fontFamily: 'Arial, sans-serif'
  },

  contentSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    minHeight: 'calc(100vh - 40px)'
  },

  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '20px',
    borderBottom: '3px solid #667eea',
    paddingBottom: '10px',
    fontFamily: 'Arial, sans-serif'
  },

  welcomeCard: {
    backgroundColor: '#f8f9fa',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    margin: '25px 0'
  },

  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },

  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '10px 0'
  },

  userInfo: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  placeholder: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #cbd5e0',
    margin: '20px 0'
  },

  adminOnlyCard: {
    backgroundColor: '#e6f3ff',
    padding: '30px',
    borderRadius: '12px',
    border: '2px solid #3182ce',
    textAlign: 'center'
  },

  adminInfo: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    border: '1px solid #3182ce'
  },

  adminActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '25px'
  },

  actionButton: {
    padding: '12px 20px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    fontFamily: 'Arial, sans-serif'
  }
};

export default Admin; */