import React, { useState } from "react";
import "primereact/resources/themes/lara-dark-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "./App.css";

import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Estadisticas from "./pages/Estadisticas";

function App() {
  const [page, setPage] = useState("ventas");

  const renderPage = () => {
    switch (page) {
      case "clientes":
        return <Clientes />;
      case "juegos":
        return <Productos />;
      case "estadisticas":
        return <Estadisticas />;
      default:
        return <Ventas />;
    }
  };

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <div className="app-navbar-title">
          <span>🎮</span>
          <span>GameStore Dashboard</span>
        </div>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
          <div className="app-sidebar-section">
            <div className="app-sidebar-title">Gestión</div>

            <div
              className={
                "app-sidebar-link " +
                (page === "ventas" ? "app-sidebar-link--active" : "")
              }
              onClick={() => setPage("ventas")}
            >
              <span>Ventas</span>
            </div>

            <div
              className={
                "app-sidebar-link " +
                (page === "clientes" ? "app-sidebar-link--active" : "")
              }
              onClick={() => setPage("clientes")}
            >
              <span>Clientes</span>
            </div>

            <div
              className={
                "app-sidebar-link " +
                (page === "juegos" ? "app-sidebar-link--active" : "")
              }
              onClick={() => setPage("juegos")}
            >
              <span>Juegos</span>
            </div>
          </div>

          <div className="app-sidebar-section">
            <div className="app-sidebar-title">Análisis</div>

            <div
              className={
                "app-sidebar-link " +
                (page === "estadisticas" ? "app-sidebar-link--active" : "")
              }
              onClick={() => setPage("estadisticas")}
            >
              <span>Estadísticas</span>
            </div>
          </div>
        </aside>

        <section className="app-content">{renderPage()}</section>
      </main>
    </div>
  );
}

export default App;
