// src/components/Manual.jsx

import { useState } from "react";

const modulos = [
  { nombre: "📋 Inventario (ProductList)", descripcion: "Visualiza todo el inventario. Filtros por categoría, ubicación, búsqueda. Muestra cantidades, caducidad y favoritos." },
  { nombre: "➕ Agregar producto (ProductForm)", descripcion: "Formulario elegante para agregar productos, categorías, fecha de caducidad y precio." },
  { nombre: "📅 Resumen mensual", descripcion: "Estadísticas de consumo, gastos por mes, productos más usados." },
  { nombre: "📈 Gráficos y estadísticas", descripcion: "Gráficos de pastel y barras. Muestra top categorías, favoritos, historial de gastos." },
  { nombre: "🛍️ Lista de compras", descripcion: "Crea y exporta listas de compra, detecta productos faltantes." },
  { nombre: "🔔 Alertas", descripcion: "Alerta productos próximos a vencer, con colores y notificaciones." },
  { nombre: "🕓 Historial", descripcion: "Registro completo de movimientos: agregado, consumido, revertido." },
  { nombre: "⭐ Favoritos", descripcion: "Marca productos favoritos para acceso rápido." },
  { nombre: "🔄 Import / Export", descripcion: "Importa desde Excel / Exporta listas e inventario." },
  { nombre: "⚙️ Configuración", descripcion: "Personaliza categorías, ubicaciones, idioma, unidades, dark-mode." },
  { nombre: "🍳 Recetas (con IA)", descripcion: "Agrega recetas propias o IA sugiere en base a inventario. Vincula con meal planner." },
  { nombre: "🗓️ Calendario de consumo", descripcion: "Planifica consumo, exporta a Google Calendar." },
  { nombre: "💰 Comparador de precios", descripcion: "Registra precios en diferentes tiendas. Compara y optimiza compras." },
  { nombre: "📅 Planificador de compras", descripcion: "Sugiere compras basadas en consumo promedio." },
  { nombre: "🍽️ Meal Planner", descripcion: "Planifica comidas semanales. Descarga ingredientes del inventario." },
  { nombre: "🏷️ Ubicaciones", descripcion: "Organiza por ubicación física: despensa, freezer, baño, etc." },
  { nombre: "👥 Usuarios y roles", descripcion: "Gestión de usuarios, permisos, historial." },
  { nombre: "📎 Adjuntos", descripcion: "Adjunta boletas de compra. Controla gastos reales." },
  { nombre: "🤝 Colaborativo", descripcion: "Modo grupo: inventario compartido, chat, minijuegos, QR, listas secretas." },
  { nombre: "🎤 Escáner por voz", descripcion: "Agrega productos dictando en voz alta. Móvil y desktop." },
  { nombre: "🤖 Bot de consejos IA", descripcion: "Bot que responde a preguntas. Tips automáticos y chat con IA." },
  { nombre: "🎉 Modo Fiesta", descripcion: "Organiza eventos, asigna productos, genera lista de fiesta." },
  { nombre: "🎮 Minijuegos", descripcion: "Incluye memoria, adivina el producto, ruleta de tareas, pago la ronda, ranking." },
  { nombre: "🔍 QR y listas", descripcion: "Genera QR para compartir listas o eventos." }
];

export default function Manual() {
  const [activo, setActivo] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const modFiltrados = modulos.filter(mod =>
    mod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    mod.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const scrollToModulo = (nombre) => {
    const el = document.getElementById(nombre);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="text-xl mb-4">📖 Manual de Inventario 713</h2>

      <input
        type="text"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="🔍 Buscar módulo o función..."
        className="border border-gray-300 rounded px-3 py-2 w-full mb-4 text-sm"
      />

      <div className="mb-4">
        <h3 className="text-md font-bold mb-2">🗂️ Índice</h3>
        <div className="flex flex-wrap gap-2">
          {modFiltrados.map((mod, i) => (
            <button
              key={i}
              onClick={() => scrollToModulo(mod.nombre)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-2 py-1 text-xs"
            >
              {mod.nombre}
            </button>
          ))}
        </div>
      </div>

      {modFiltrados.length === 0 && (
        <div className="text-gray-500 text-sm mb-4">⚠️ No se encontraron resultados.</div>
      )}

      {modFiltrados.map((mod, i) => (
        <div
          key={i}
          id={mod.nombre}
          className="border-b border-gray-200 py-2 scroll-mt-24"
        >
          <button
            onClick={() => setActivo(activo === mod.nombre ? null : mod.nombre)}
            className="w-full text-left text-gray-700 font-bold flex justify-between items-center"
          >
            <span>{mod.nombre}</span>
            <span>{activo === mod.nombre ? "▲" : "▼"}</span>
          </button>
          {activo === mod.nombre && (
            <div className="mt-2 text-gray-600 text-sm animate-fade-in">
              {mod.descripcion}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
