import { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";

export default function ListaCompras({ user }) {
  const [products, setProducts] = useState([]);
  const [comprados, setComprados] = useState({});
  const [minStock, setMinStock] = useState({});

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

  // Calcula productos bajo mínimo (por defecto mínimo 1)
  const faltantes = products
    .filter(p => {
      const min = minStock[p.id] !== undefined ? minStock[p.id] : (p.minStock !== undefined ? p.minStock : 1);
      return Number(p.quantity) < min && !comprados[p.id];
    })
    .map(p => ({
      ...p,
      min: minStock[p.id] !== undefined ? minStock[p.id] : (p.minStock !== undefined ? p.minStock : 1),
      aComprar: Math.max(0, (minStock[p.id] !== undefined ? minStock[p.id] : (p.minStock !== undefined ? p.minStock : 1)) - Number(p.quantity))
    }));

  function marcarComprado(id) {
    setComprados(c => ({ ...c, [id]: true }));
  }

  function handleStockMinChange(id, value) {
    setMinStock(s => ({ ...s, [id]: value }));
  }

  function guardarMinStock(id, value) {
    updateDoc(doc(db, "products", id), { minStock: Number(value) });
  }

  function exportarExcel() {
    const datos = faltantes.map(p => ({
      Producto: p.name,
      Categoría: p.category,
      Cantidad_actual: p.quantity,
      Stock_mínimo: p.min,
      Cantidad_a_comprar: p.aComprar
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ListaCompras");
    XLSX.writeFile(wb, "lista_compras.xlsx");
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Lista automática de compras</h3>
      {faltantes.length === 0 ? (
        <div className="text-gray-500">¡Todo en orden! No hay productos por reponer.</div>
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <button
              onClick={exportarExcel}
              className="bg-gray-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-900"
            >
              Exportar a Excel
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl shadow">
            <table className="min-w-[340px] text-xs sm:text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Cantidad actual</th>
                  <th className="p-2">Stock mínimo</th>
                  <th className="p-2">A comprar</th>
                  <th className="p-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {faltantes.map(p =>
                  <tr key={p.id} className="even:bg-gray-50">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.category}</td>
                    <td className="p-2">{p.quantity}</td>
                    <td className="p-2">
                      <input
                        className="w-14 border rounded px-1"
                        type="number"
                        min={1}
                        value={minStock[p.id] !== undefined ? minStock[p.id] : (p.minStock !== undefined ? p.minStock : 1)}
                        onChange={e => handleStockMinChange(p.id, e.target.value)}
                        onBlur={e => guardarMinStock(p.id, e.target.value)}
                      />
                    </td>
                    <td className="p-2 font-bold text-gray-800">{p.aComprar}</td>
                    <td className="p-2">
                      <button
                        className="bg-gray-300 hover:bg-gray-500 text-gray-700 px-3 py-1 rounded"
                        onClick={() => marcarComprado(p.id)}
                      >
                        Marcar comprado
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
