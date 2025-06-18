import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const categorias = [
  "Alimentos NP", "Alimentos Des", "Condimentos", "Semillas", "Desayuno",
  "Frutas", "Verduras", "Refrigerados", "Congelados", "Bebidas",
  "Aseo personal", "Aseo hogar"
];

function getMonthYear(dateString) {
  if (!dateString) return { mes: "Sin fecha", year: "?" };
  const d = new Date(dateString);
  return {
    mes: String(d.getMonth() + 1).padStart(2, "0"),
    year: String(d.getFullYear())
  };
}

export default function ResumenMensual({ user }) {
  const [products, setProducts] = useState([]);
  const [filtroYear, setFiltroYear] = useState("");
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, snap => {
      setProducts(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  // Agrupa por año, mes y categoría
  const resumen = {};
  const yearsSet = new Set();
  for (const p of products) {
    const fecha = p.created?.toDate ? p.created.toDate() : new Date(p.created || Date.now());
    const { mes, year } = getMonthYear(fecha);
    yearsSet.add(year);
    if (!resumen[year]) resumen[year] = {};
    if (!resumen[year][mes]) resumen[year][mes] = {};
    const cat = p.category || "Sin categoría";
    if (!resumen[year][mes][cat]) resumen[year][mes][cat] = { cantidad: 0, gasto: 0 };
    resumen[year][mes][cat].cantidad += Number(p.quantity);
    resumen[year][mes][cat].gasto += Number(p.price) * Number(p.quantity);
  }
  const allYears = Array.from(yearsSet).sort((a, b) => b - a);

  // Filtro año/mes
  const showYears = filtroYear ? [filtroYear] : allYears;
  const showMeses = filtroMes ? [filtroMes] : Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  // Suma total anual (por categoría)
  const sumAnual = {};
  for (const year of showYears) {
    for (const mes of Object.keys(resumen[year] || {})) {
      for (const cat of categorias) {
        const dato = resumen[year][mes]?.[cat];
        if (!dato) continue;
        if (!sumAnual[cat]) sumAnual[cat] = { cantidad: 0, gasto: 0 };
        sumAnual[cat].cantidad += dato.cantidad;
        sumAnual[cat].gasto += dato.gasto;
      }
    }
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Resumen mensual por categoría</h3>
      <div className="flex gap-3 mb-3 flex-wrap items-center">
        <label className="text-xs">Año:</label>
        <select className="border rounded px-2 py-1 text-xs" value={filtroYear}
          onChange={e => setFiltroYear(e.target.value)}>
          <option value="">Todos</option>
          {allYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <label className="text-xs">Mes:</label>
        <select className="border rounded px-2 py-1 text-xs" value={filtroMes}
          onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos</option>
          {Array.from({ length: 12 }, (_, i) =>
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
              {String(i + 1).padStart(2, "0")}
            </option>
          )}
        </select>
        {(filtroYear || filtroMes) && (
          <button onClick={() => { setFiltroYear(""); setFiltroMes(""); }}
            className="text-xs ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-400">
            Limpiar filtros
          </button>
        )}
      </div>
      {showYears.every(year =>
        showMeses.every(mes =>
          !resumen[year]?.[mes]
        )
      ) && (
        <div className="text-gray-500 mb-4">No hay datos para el período seleccionado.</div>
      )}
      {/* Resumen por mes */}
      {showYears.map(year =>
        showMeses.map(mes => {
          const cats = resumen[year]?.[mes];
          if (!cats) return null;
          return (
            <div key={year + "-" + mes} className="mb-5">
              <h4 className="font-bold mb-2 text-gray-700">
                {year}-{mes}
              </h4>
              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-[320px] text-xs sm:text-sm bg-gray-100 rounded-lg mb-2">
                  <thead className="bg-gray-300">
                    <tr>
                      <th className="p-2">Categoría</th>
                      <th className="p-2">Total Productos</th>
                      <th className="p-2">Total Gastado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map(cat =>
                      cats[cat] ? (
                        <tr key={cat}>
                          <td className="p-2">{cat}</td>
                          <td className="p-2">{cats[cat].cantidad}</td>
                          <td className="p-2">${cats[cat].gasto.toFixed(2)}</td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
      {/* Totales año */}
      {Object.keys(sumAnual).length > 0 && (
        <div className="mt-6">
          <h4 className="font-bold mb-2 text-gray-700">Total anual por categoría</h4>
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-[320px] text-xs sm:text-sm bg-gray-100 rounded-lg mb-2">
              <thead className="bg-gray-300">
                <tr>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Total Productos</th>
                  <th className="p-2">Total Gastado</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat =>
                  sumAnual[cat] ? (
                    <tr key={cat}>
                      <td className="p-2">{cat}</td>
                      <td className="p-2">{sumAnual[cat].cantidad}</td>
                      <td className="p-2">${sumAnual[cat].gasto.toFixed(2)}</td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
