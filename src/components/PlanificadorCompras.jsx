import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";

// Calcula promedio consumo mensual por producto
function promedioConsumo(historial, producto) {
  const consumos = historial
    .filter(h => h.action === "Consumir" && h.productName === producto)
    .map(h => {
      const d = h.timestamp && h.timestamp.toDate
        ? h.timestamp.toDate()
        : new Date(h.timestamp);
      return { mes: d.getMonth() + 1, anio: d.getFullYear() };
    });
  const meses = {};
  for (const c of consumos) {
    const key = c.anio + "-" + c.mes;
    meses[key] = (meses[key] || 0) + 1;
  }
  const valores = Object.values(meses);
  return valores.length ? (valores.reduce((a, b) => a + b, 0) / valores.length) : 0;
}

export default function PlanificadorCompras({ user }) {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [objetivos, setObjetivos] = useState({});

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

  useEffect(() => {
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, snap => {
      setHistory(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(h => h.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  // Calcula stock objetivo
  function handleObjetivoChange(id, value) {
    setObjetivos(o => ({ ...o, [id]: value }));
  }

  async function guardarObjetivo(id, value) {
    await updateDoc(doc(db, "products", id), { stockObjetivo: Number(value) });
  }

  // Planifica compras
  const plan = products.map(p => {
    const obj = objetivos[p.id] !== undefined ? objetivos[p.id] : (p.stockObjetivo !== undefined ? p.stockObjetivo : Math.ceil(promedioConsumo(history, p.name)) + 1);
    const falta = Math.max(0, obj - Number(p.quantity));
    return {
      ...p,
      objetivo: obj,
      consumo: promedioConsumo(history, p.name),
      aComprar: falta
    };
  }).filter(p => p.aComprar > 0);

  // Exportar a Excel
  function exportar() {
    if (plan.length === 0) {
      alert("No hay productos a planificar en este momento.");
      return;
    }
    const datos = plan.map(p => ({
      Producto: p.name,
      Categoría: p.category,
      Cantidad_actual: p.quantity,
      Objetivo: p.objetivo,
      Consumo_promedio: p.consumo.toFixed(2),
      A_comprar: p.aComprar
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PlanCompras");
    XLSX.writeFile(wb, "plan_compras.xlsx");
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Planificador automático de compras</h3>
      <div className="mb-3 flex justify-end">
        <button
          onClick={exportar}
          className="bg-gray-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-900"
        >
          Exportar Excel
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-[340px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Producto</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Objetivo</th>
              <th className="p-2">Consumo/mes</th>
              <th className="p-2">A comprar</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {plan.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-4">
                  No se requiere comprar productos ahora.
                </td>
              </tr>
            ) : (
              plan.map(p => (
                <tr key={p.id} className="even:bg-gray-50">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2">{p.quantity}</td>
                  <td className="p-2">
                    <input
                      className="w-14 border rounded px-1"
                      type="number"
                      min={1}
                      value={objetivos[p.id] !== undefined ? objetivos[p.id] : (p.stockObjetivo !== undefined ? p.stockObjetivo : Math.ceil(p.consumo) + 1)}
                      onChange={e => handleObjetivoChange(p.id, e.target.value)}
                      onBlur={e => guardarObjetivo(p.id, e.target.value)}
                    />
                  </td>
                  <td className="p-2">{p.consumo.toFixed(2)}</td>
                  <td className="p-2 font-bold text-gray-800">{p.aComprar}</td>
                  <td className="p-2">
                    {p.aComprar > 0 ? <span className="text-green-700">✔️</span> : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-500 mt-4">
        Sugerencia basada en consumo promedio histórico por producto.<br />
        Puedes modificar los objetivos manualmente.
      </div>
    </div>
  );
}
