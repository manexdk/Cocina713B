import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Alertas({ user }) {
  const [products, setProducts] = useState([]);
  const [diasAlerta, setDiasAlerta] = useState(7);
  const [stockAlerta, setStockAlerta] = useState(2);

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

  // Productos próximos a vencer
  const hoy = new Date();
  const alertasVencimiento = products.filter(p => {
    if (!p.expiry) return false;
    const exp = new Date(p.expiry);
    const diff = Math.ceil((exp - hoy) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= diasAlerta;
  });

  // Productos con poco stock
  const alertasStock = products.filter(p => Number(p.quantity) <= stockAlerta);

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Alertas de inventario</h3>
      <div className="flex gap-6 mb-4 flex-wrap">
        <div>
          <label className="text-xs mr-2">Días para alerta de caducidad:</label>
          <input
            className="w-14 border rounded px-1"
            type="number"
            min={1}
            value={diasAlerta}
            onChange={e => setDiasAlerta(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs mr-2">Stock bajo a alertar:</label>
          <input
            className="w-14 border rounded px-1"
            type="number"
            min={1}
            value={stockAlerta}
            onChange={e => setStockAlerta(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl shadow p-4">
          <div className="font-semibold text-gray-700 mb-2">Próximos a vencer ({diasAlerta} días)</div>
          {alertasVencimiento.length === 0 ? (
            <div className="text-gray-400 text-sm">No hay productos por vencer pronto.</div>
          ) : (
            <ul className="list-disc pl-5">
              {alertasVencimiento.map(p => {
                const dias = Math.ceil((new Date(p.expiry) - hoy) / (1000 * 60 * 60 * 24));
                return (
                  <li key={p.id} className="mb-1">
                    <span className="font-bold">{p.name}</span>{" "}
                    ({p.quantity} uds) vence en <span className="text-red-600">{dias} días</span> ({p.expiry})
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl shadow p-4">
          <div className="font-semibold text-gray-700 mb-2">Stock bajo (≤ {stockAlerta})</div>
          {alertasStock.length === 0 ? (
            <div className="text-gray-400 text-sm">No hay productos con poco stock.</div>
          ) : (
            <ul className="list-disc pl-5">
              {alertasStock.map(p => (
                <li key={p.id} className="mb-1">
                  <span className="font-bold">{p.name}</span> ({p.quantity} uds)
                  {p.expiry && (
                    <span className="ml-2 text-xs text-gray-500">
                      — vence {p.expiry}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
