import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

function getMonthYear(dateString) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export default function GastosMensuales({ user }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.uid === user.uid));
    });
    return () => unsub();
  }, [user.uid]);

  // Agrupa gastos por mes
  const mensual = {};
  for (const p of products) {
    const key = getMonthYear(p.created?.toDate ? p.created.toDate() : p.created);
    if (!mensual[key]) mensual[key] = 0;
    mensual[key] += Number(p.price) * Number(p.quantity || 1);
  }
  const rows = Object.entries(mensual).sort();

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Gastos mensuales</h3>
      {rows.length === 0 && <div className="text-gray-500">No hay datos de gastos.</div>}
      <table className="min-w-[300px] text-xs sm:text-sm bg-gray-100 rounded-lg overflow-hidden">
        <thead className="bg-gray-300">
          <tr>
            <th className="p-2 text-left">Mes</th>
            <th className="p-2 text-left">Total Gastado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([mes, total]) => (
            <tr key={mes} className="even:bg-gray-50">
              <td className="p-2">{mes}</td>
              <td className="p-2">${total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
