import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

const acciones = [
  "Agregar producto",
  "Editar producto",
  "Consumir",
  "Eliminar producto",
  "Marcar favorito",
  "Quitar favorito"
];

export default function Historial({ user }) {
  const [history, setHistory] = useState([]);
  const [filtroAccion, setFiltroAccion] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [limpiaVisual, setLimpiaVisual] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, snap => {
      setHistory(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(h => h.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  const productosUnicos = Array.from(new Set(history.map(h => h.productName))).sort();

  function resetFiltros() {
    setFiltroAccion("");
    setFiltroProducto("");
    setFiltroFecha("");
  }

  function limpiarVisual() {
    setLimpiaVisual(history.map(h => h.id));
  }

  const historialFiltrado = history
    .filter(h => !limpiaVisual.includes(h.id))
    .filter(h =>
      (!filtroAccion || h.action === filtroAccion) &&
      (!filtroProducto || h.productName === filtroProducto) &&
      (!filtroFecha || (h.timestamp && h.timestamp.toDate
        ? h.timestamp.toDate().toISOString().slice(0, 10)
        : new Date(h.timestamp).toISOString().slice(0, 10)
      ) === filtroFecha)
    );

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Historial de movimientos</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="border rounded px-2 py-1 text-xs"
          value={filtroAccion}
          onChange={e => setFiltroAccion(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          {acciones.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={filtroProducto}
          onChange={e => setFiltroProducto(e.target.value)}
        >
          <option value="">Todos los productos</option>
          {productosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          className="border rounded px-2 py-1 text-xs"
          type="date"
          value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
        />
        {(filtroAccion || filtroProducto || filtroFecha) && (
          <button
            className="text-xs ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-400"
            onClick={resetFiltros}
          >
            Limpiar filtros
          </button>
        )}
        <button
          className="text-xs px-3 py-1 bg-gray-300 rounded hover:bg-gray-500"
          onClick={limpiarVisual}
        >
          Limpiar historial visual
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-[340px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Fecha</th>
              <th className="p-2">Acción</th>
              <th className="p-2">Producto</th>
              <th className="p-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {historialFiltrado.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-gray-400 py-4">No hay movimientos en el período.</td>
              </tr>
            ) : (
              historialFiltrado.map(h => (
                <tr key={h.id} className="even:bg-gray-50">
                  <td className="p-2">{h.timestamp && h.timestamp.toDate
                    ? h.timestamp.toDate().toLocaleString()
                    : new Date(h.timestamp).toLocaleString()
                  }</td>
                  <td className="p-2">{h.action}</td>
                  <td className="p-2">{h.productName}</td>
                  <td className="p-2">{h.details || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
