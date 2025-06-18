import { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const categorias = [
  "Alimentos NP", "Alimentos Des", "Condimentos", "Semillas", "Desayuno",
  "Frutas", "Verduras", "Refrigerados", "Congelados", "Bebidas",
  "Aseo personal", "Aseo hogar"
];

export default function Favoritos({ user }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, snap => {
      setProducts(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.uid === user.uid && p.favorito)
      );
    });
    return () => unsub();
  }, [user.uid]);

  async function quitarFavorito(prod) {
    await updateDoc(doc(db, "products", prod.id), { favorito: false });
  }

  const filtrados = products
    .filter(p =>
      (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (!cat || p.category === cat)
    );

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Favoritos ⭐</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="border px-2 py-1 rounded w-44 text-xs"
          placeholder="Buscar producto"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border px-2 py-1 rounded text-xs"
          value={cat}
          onChange={e => setCat(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c =>
            <option key={c} value={c}>{c}</option>
          )}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-[320px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">★</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">Cantidad</th>
              <th className="p-2">Vence</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-gray-400 py-4">
                  No tienes productos favoritos.
                </td>
              </tr>
            ) : (
              filtrados.map(prod => (
                <tr key={prod.id} className="even:bg-gray-50">
                  <td className="p-2 text-yellow-400 text-xl">★</td>
                  <td className="p-2">{prod.name}</td>
                  <td className="p-2">{prod.category}</td>
                  <td className="p-2">{prod.quantity}</td>
                  <td className="p-2">{prod.expiry || "-"}</td>
                  <td className="p-2">
                    <button
                      className="bg-gray-300 hover:bg-gray-500 px-2 py-1 rounded mr-2"
                      onClick={() => quitarFavorito(prod)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
