import { useState } from "react";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import ResumenMensual from "./ResumenMensual";
import Graficos from "./Graficos";
import ListaCompras from "./ListaCompras";
import Alertas from "./Alertas";
import Historial from "./Historial";
import Favoritos from "./Favoritos";
import ImportExport from "./ImportExport";
import Configuracion from "./Configuracion";
import Recetas from "./Recetas";
import CalendarioConsumo from "./CalendarioConsumo";
import ComparadorPrecios from "./ComparadorPrecios";
import PlanificadorCompras from "./PlanificadorCompras";
import MealPlanner from "./MealPlanner";
import Ubicaciones from "./Ubicaciones";
import UsuariosRoles from "./UsuariosRoles";
import Adjuntos from "./Adjuntos";
import Colaborativo from "./Colaborativo";
import VozScanner from "./VozScanner";
import Manual from "./Manual";

const TABS = [
  { name: "Adjuntos", key: "adj", icon: "📎" },
  { name: "Inventario", key: "inv", icon: "📦" },
  { name: "Alertas", key: "alertas", icon: "⏰" },
  { name: "Calendario", key: "cal", icon: "📅" },
  { name: "Colaborativo", key: "colab", icon: "🤝" },
  { name: "Comparar precios", key: "comparar", icon: "💹" },
  { name: "Configuración", key: "config", icon: "⚙️" },
  { name: "Favoritos", key: "favs", icon: "⭐" },
  { name: "Gráficos", key: "graficos", icon: "📈" },
  { name: "Historial", key: "hist", icon: "📜" },
  { name: "Import/Export", key: "iexp", icon: "📤" },
  { name: "Lista compras", key: "listacomp", icon: "🛒" },
  { name: "Manual", key: "manual", icon: "📖" },
  { name: "Meal planner", key: "mealplan", icon: "🥗" },
  { name: "Plan compras", key: "plancomp", icon: "🗓️" },
  { name: "Recetas", key: "recetas", icon: "🍲" },
  { name: "Resumen", key: "resumen", icon: "📊" },
  { name: "Ubicaciones", key: "ubic", icon: "🏠" },
  { name: "Usuarios/Roles", key: "users", icon: "👥" },
  { name: "Voz/Scanner", key: "voz", icon: "🎤" }
];

export default function DashboardTabs({ user }) {
  const [tab, setTab] = useState("inv");
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleTabChange(key) {
    setTab(key);
    setMenuOpen(false); // Cierra el menú mobile después de seleccionar
  }

  return (
    <div>
      {/* Barra top */}
      <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between px-2 sm:px-6 py-2">
          <div className="flex items-center gap-2">
            {/* Hamburguesa solo en mobile */}
            <button
              className="sm:hidden mr-2 text-2xl p-1 focus:outline-none"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(m => !m)}
            >
              {/* Ícono hamburguesa */}
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-extrabold text-lg sm:text-2xl text-gray-800 tracking-wide">Inventario 713</span>
          </div>
          {/* Desktop menú */}
          <div className="hidden sm:flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`px-3 py-2 rounded-t-2xl font-bold transition flex items-center gap-1 text-xs sm:text-sm
                  ${tab === t.key
                    ? "bg-gray-700 text-white border-b-2 border-gray-700 shadow"
                    : "bg-gray-100 text-gray-700 border-b-2 border-transparent hover:bg-gray-300"
                  }`}
                onClick={() => handleTabChange(t.key)}
              >
                <span>{t.icon}</span> {t.name}
              </button>
            ))}
          </div>
        </div>
        {/* Mobile menú desplegable */}
        {menuOpen && (
          <div className="sm:hidden px-4 py-3 border-t border-gray-200 bg-white shadow z-40 absolute w-full left-0">
            <div className="flex flex-col gap-1">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center gap-2
                    ${tab === t.key
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-300"
                    }`}
                  onClick={() => handleTabChange(t.key)}
                >
                  <span>{t.icon}</span> {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
      {/* Panel principal */}
      <div className="max-w-5xl mx-auto bg-white/90 rounded-2xl shadow-lg border border-gray-300 px-1 sm:px-6 pb-6 pt-2 min-h-[250px]">
        {tab === "inv" && (
          <>
            <ProductForm editing={editing} setEditing={setEditing} user={user} />
            <ProductList setEditing={setEditing} user={user} mostrarSoloTabla={false} />
          </>
        )}
        {tab === "resumen" && <ResumenMensual user={user} />}
        {tab === "graficos" && <Graficos user={user} />}
        {tab === "listacomp" && <ListaCompras user={user} />}
        {tab === "alertas" && <Alertas user={user} />}
        {tab === "hist" && <Historial user={user} />}
        {tab === "favs" && <Favoritos user={user} />}
        {tab === "iexp" && <ImportExport user={user} />}
        {tab === "config" && <Configuracion />}
        {tab === "recetas" && <Recetas user={user} />}
        {tab === "cal" && <CalendarioConsumo user={user} />}
        {tab === "comparar" && <ComparadorPrecios user={user} />}
        {tab === "plancomp" && <PlanificadorCompras user={user} />}
        {tab === "mealplan" && <MealPlanner user={user} />}
        {tab === "ubic" && <Ubicaciones user={user} />}
        {tab === "users" && <UsuariosRoles user={user} />}
        {tab === "adj" && <Adjuntos user={user} />}
        {tab === "colab" && <Colaborativo user={user} />}
        {tab === "voz" && <VozScanner user={user} />}
        {tab === "manual" && <Manual />}
      </div>
    </div>
  );
}
