import { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

// Opciones ampliadas y colores
const UBICACIONES_PREDEF = [
  { nombre: "Cocina", color: "bg-gray-700 text-white" },
  { nombre: "Despensa", color: "bg-gray-500 text-white" },
  { nombre: "Congelador", color: "bg-blue-600 text-white" },
  { nombre: "Refrigerador", color: "bg-blue-400 text-white" },
  { nombre: "Baño", color: "bg-pink-300 text-black" },
  { nombre: "Bodega", color: "bg-yellow-400 text-black" },
  { nombre: "Lavadero", color: "bg-indigo-400 text-white" },
  { nombre: "Habitación", color: "bg-fuchsia-400 text-white" },
  { nombre: "Limpieza", color: "bg-green-400 text-black" },
  { nombre: "Jardín", color: "bg-emerald-400 text-black" },
  { nombre: "Oficina", color: "bg-orange-400 text-black" },
  { nombre: "Otros", color: "bg-gray-200 text-black" }
];

export default function Ubicaciones({ user }) {
  const [products, setProducts] = useState([]);
  const [ubic, setUbic] = useState("");
  const [usuario, setUsuario] = useState("propio");
  const [editing, setEditing] = useState(null);
  const [todosUsuarios, setTodosUsuarios] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, snap => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(prods);
      setTodosUsuarios(Array.from(new Set(prods.map(p => p.uid))));
    });
    return () => unsub();
  }, []);

  function colorUbicacion(ubicacion) {
    const found = UBICACIONES_PREDEF.find(u => u.nombre === ubicacion);
    return found ? found.color : "bg-gray-200 text-black";
  }

  async function cambiarUbicacion(id, value) {
    await updateDoc(doc(db, "products", id), { ubicacion: value });
    setEditing(null);
  }

  // Lista de ubicaciones únicas + sugeridas
  const ubicacionesExist = Array.from(
    new Set([
      ...UBICACIONES_PREDEF.map(u => u.nombre),
      ...products.map(p => p.ubicacion).filter(Boolean)
    ])
  );

  // Soporte multiusuario
  const productosFiltrados = products
    .filter(p =>
      (!ubic || p.ubicacion === ubic) &&
      (usuario === "todos" || p.uid === user.uid)
    );

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Ubicaciones de productos</h3>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <label className="text-xs">Ubicación:</label>
        <select
          className="border px-2 py-1 rounded text-xs"
          value={ubic}
          onChange={e => setUbic(e.target.value)}
        >
          <option value="">Todas</option>
          {ubicacionesExist.map(u =>
            <option key={u} value={u}>{u}</option>
          )}
        </select>
        <label className="text-xs">Usuario:</label>
        <select
          className="border px-2 py-1 rounded text-xs"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
        >
          <option value="propio">Sólo mi inventario</option>
          <option value="todos">Todos los usuarios</option>
        </select>
      </div>

      {/* Mapa rápido de zonas */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {UBICACIONES_PREDEF.map(u => (
          <div
            key={u.nombre}
            className={`${u.color} p-3 rounded-lg cursor-pointer text-center text-xs font-bold shadow ${ubic === u.nombre ? "ring-2 ring-black" : ""}`}
            onClick={() => setUbic(u.nombre)}
          >
            {u.nombre}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-[340px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Producto</th>
              <th className="p-2">Ubicación</th>
              <th className="p-2">Usuario</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">
                  No hay productos en esta ubicación.
                </td>
              </tr>
            ) : (
              productosFiltrados.map(prod => (
                <tr key={prod.id} className="even:bg-gray-50">
                  <td className="p-2">{prod.name}</td>
                  <td className="p-2">
                    {editing === prod.id ? (
                      <select
                        className="border px-2 py-1 rounded text-xs"
                        value={prod.ubicacion || ""}
                        onChange={e => cambiarUbicacion(prod.id, e.target.value)}
                        autoFocus
                        onBlur={() => setEditing(null)}
                      >
                        <option value="">- Sin asignar -</option>
                        {ubicacionesExist.map(u =>
                          <option key={u} value={u}>{u}</option>
                        )}
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded cursor-pointer font-bold text-xs ${colorUbicacion(prod.ubicacion)}`}
                        onClick={() => setEditing(prod.id)}
                      >
                        {prod.ubicacion || <span className="text-gray-400">Sin asignar</span>}
                      </span>
                    )}
                  </td>
                  <td className="p-2">{prod.uid === user.uid ? "Tú" : prod.uid.slice(0, 6) + "…"}</td>
                  <td className="p-2">
                    {editing === prod.id ? (
                      <button
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                        onClick={() => setEditing(null)}
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        className="bg-gray-200 hover:bg-gray-500 px-2 py-1 rounded text-xs"
                        onClick={() => setEditing(prod.id)}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-500 mt-4">
        Toca una etiqueta de ubicación para filtrar.  
        Puedes ver todos los inventarios de usuarios (colaborativo).  
        Colores indican zona de almacenamiento.
      </div>
    </div>
  );
}
