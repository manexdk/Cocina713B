import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function ComparadorPrecios({ user }) {
  const [comparaciones, setComparaciones] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    producto: "",
    lugar: "",
    precio: ""
  });

  useEffect(() => {
    const q = query(collection(db, "comparadorPrecios"));
    const unsub = onSnapshot(q, snap => {
      setComparaciones(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  async function guardar(e) {
    e.preventDefault();
    if (!form.producto.trim() || !form.lugar.trim() || !form.precio) return;
    if (editing) {
      await updateDoc(doc(db, "comparadorPrecios", editing.id), {
        producto: form.producto.trim(),
        lugar: form.lugar.trim(),
        precio: Number(form.precio),
        uid: user.uid
      });
      setEditing(null);
    } else {
      await addDoc(collection(db, "comparadorPrecios"), {
        producto: form.producto.trim(),
        lugar: form.lugar.trim(),
        precio: Number(form.precio),
        uid: user.uid
      });
    }
    setForm({ producto: "", lugar: "", precio: "" });
  }

  async function borrar(id) {
    if (window.confirm("¿Eliminar comparación?")) {
      await deleteDoc(doc(db, "comparadorPrecios", id));
    }
  }

  function editar(row) {
    setEditing(row);
    setForm({
      producto: row.producto,
      lugar: row.lugar,
      precio: row.precio
    });
  }

  // Agrupa comparaciones por producto
  const productos = Array.from(new Set(comparaciones.map(c => c.producto))).sort();
  const lugares = Array.from(new Set(comparaciones.map(c => c.lugar))).sort();

  function menorPrecio(producto) {
    const precios = comparaciones
      .filter(c => c.producto === producto)
      .map(c => c.precio);
    return precios.length ? Math.min(...precios) : null;
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Comparador de precios</h3>
      <form onSubmit={guardar} className="mb-4 flex flex-wrap gap-2 items-end">
        <input
          className="border px-2 py-1 rounded text-xs"
          placeholder="Producto"
          value={form.producto}
          onChange={e => setForm(f => ({ ...f, producto: e.target.value }))}
          required
        />
        <input
          className="border px-2 py-1 rounded text-xs"
          placeholder="Lugar/Supermercado"
          value={form.lugar}
          onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))}
          required
        />
        <input
          className="border px-2 py-1 rounded text-xs w-24"
          placeholder="Precio"
          type="number"
          min={0}
          step="0.01"
          value={form.precio}
          onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
          required
        />
        <button className="bg-gray-700 text-white px-3 py-1 rounded font-bold text-xs hover:bg-gray-900">
          {editing ? "Actualizar" : "Agregar"}
        </button>
        {editing && (
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs ml-2"
            onClick={() => {
              setEditing(null);
              setForm({ producto: "", lugar: "", precio: "" });
            }}
          >
            Cancelar
          </button>
        )}
      </form>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-[340px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Producto</th>
              <th className="p-2">Lugar</th>
              <th className="p-2">Precio</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">
                  No hay comparaciones registradas.
                </td>
              </tr>
            ) : (
              productos.map(prod =>
                comparaciones
                  .filter(c => c.producto === prod)
                  .sort((a, b) => a.precio - b.precio)
                  .map((c, i) =>
                    <tr key={c.id} className={i % 2 ? "bg-gray-50" : ""}>
                      <td className="p-2">{c.producto}</td>
                      <td className="p-2">{c.lugar}</td>
                      <td className={`p-2 font-bold ${c.precio === menorPrecio(prod) ? "text-green-700" : "text-gray-800"}`}>
                        ${c.precio.toFixed(2)}
                        {c.precio === menorPrecio(prod) && " 👑"}
                      </td>
                      <td className="p-2">
                        <button
                          className="bg-gray-300 hover:bg-gray-500 px-2 py-1 rounded mr-2 text-xs"
                          onClick={() => editar(c)}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-gray-200 hover:bg-red-500 hover:text-white px-2 py-1 rounded text-xs"
                          onClick={() => borrar(c.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
