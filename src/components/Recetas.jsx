import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";

// Recetas sugeridas IA local
const RECETAS_BASE = [
  {
    nombre: "Tallarines con salsa de tomate",
    ingredientes: ["Spaguetti", "Salsa de tomate (6un)", "Aceite (1 L)", "Sal"],
    pasos: [
      "Cocina los tallarines según el envase.",
      "Calienta la salsa con aceite y sal.",
      "Mezcla y sirve caliente."
    ]
  },
  {
    nombre: "Lentejas guisadas",
    ingredientes: ["Lentejas (1kg)", "Cebolla (1 uds)", "Zanahoria (1 kg)", "Sal", "Aceite (1 L)"],
    pasos: [
      "Remoja las lentejas si es necesario.",
      "Sofríe cebolla y zanahoria, añade lentejas.",
      "Agrega agua y cocina hasta ablandar."
    ]
  },
  {
    nombre: "Ensalada de frutas",
    ingredientes: ["Manzana (1 kg)", "Naranja (1 kg)", "Plátano (1 kg)", "Miel"],
    pasos: [
      "Pela y corta toda la fruta.",
      "Mezcla en un bol.",
      "Añade miel al gusto."
    ]
  },
  {
    nombre: "Pollo al horno con papas",
    ingredientes: ["Filete de pollo", "Papa (2 kg)", "Aceite (1 L)", "Sal", "Pimienta"],
    pasos: [
      "Corta papas y pollo, salpimenta.",
      "Coloca en bandeja, añade aceite.",
      "Hornea a 200°C por 40 minutos."
    ]
  },
  {
    nombre: "Tortilla de verduras",
    ingredientes: ["Huevos (12 uds)", "Zanahoria (1 kg)", "Papa (2 kg)", "Cebolla (1 uds)", "Aceite (1 L)"],
    pasos: [
      "Ralla o corta las verduras.",
      "Mezcla con huevos batidos y sal.",
      "Cocina en sartén con aceite."
    ]
  }
];

export default function Recetas({ user }) {
  const [products, setProducts] = useState([]);
  const [busca, setBusca] = useState("");
  const [recetaSel, setRecetaSel] = useState(null);
  const [misRecetas, setMisRecetas] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    ingredientes: "",
    pasos: ""
  });
  const [error, setError] = useState("");

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

  // Mis recetas propias (Firestore)
  useEffect(() => {
    const q = query(collection(db, "recetas"));
    const unsub = onSnapshot(q, snap => {
      setMisRecetas(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => r.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  const nombresProd = products.map(p => p.name);

  // Recetas IA sugeridas
  const sugeridas = RECETAS_BASE
    .filter(rec => {
      const tengo = rec.ingredientes.filter(i =>
        nombresProd.some(np => i.toLowerCase().includes(np.toLowerCase()) || np.toLowerCase().includes(i.toLowerCase()))
      );
      return tengo.length / rec.ingredientes.length >= 0.6;
    })
    .filter(rec =>
      !busca ||
      rec.nombre.toLowerCase().includes(busca.toLowerCase())
    );

  // Recetas propias
  const propias = misRecetas
    .filter(rec =>
      !busca ||
      rec.nombre.toLowerCase().includes(busca.toLowerCase())
    );

  function verDetalles(rec, propio = false) {
    setRecetaSel({ ...rec, propio });
  }

  function cerrarDetalles() {
    setRecetaSel(null);
  }

  async function agregarReceta(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.ingredientes.trim() || !form.pasos.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    await addDoc(collection(db, "recetas"), {
      nombre: form.nombre.trim(),
      ingredientes: form.ingredientes.split(",").map(i => i.trim()),
      pasos: form.pasos.split("\n").map(p => p.trim()),
      uid: user.uid
    });
    setForm({ nombre: "", ingredientes: "", pasos: "" });
    setAdding(false);
  }

  async function borrarReceta(id) {
    if (window.confirm("¿Seguro que deseas eliminar la receta?")) {
      await deleteDoc(doc(db, "recetas", id));
    }
  }

  // Exporta lista de ingredientes a Excel
  function exportarIngredientes(rec) {
    const datos = rec.ingredientes.map(i => ({
      Ingrediente: i
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Lista_${rec.nombre.slice(0, 15)}`);
    XLSX.writeFile(wb, `lista_compras_${rec.nombre.slice(0, 15)}.xlsx`);
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Recetas sugeridas por IA y tus recetas</h3>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          className="border px-2 py-1 rounded text-xs"
          placeholder="Buscar receta"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <button
          className="bg-gray-700 text-white px-3 py-1 rounded font-bold text-xs hover:bg-gray-900"
          onClick={() => setAdding(a => !a)}
        >
          {adding ? "Cancelar" : "Agregar receta propia"}
        </button>
      </div>
      {/* Agregar receta propia */}
      {adding && (
        <form onSubmit={agregarReceta} className="mb-4 bg-gray-100 rounded-xl p-4 border">
          <div className="mb-2">
            <label className="text-xs font-bold">Nombre de la receta:</label>
            <input
              className="border px-2 py-1 rounded w-full"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              required
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-bold">Ingredientes (separa por coma):</label>
            <input
              className="border px-2 py-1 rounded w-full"
              value={form.ingredientes}
              onChange={e => setForm(f => ({ ...f, ingredientes: e.target.value }))}
              placeholder="Ej: arroz, pollo, cebolla"
              required
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-bold">Pasos (uno por línea):</label>
            <textarea
              className="border px-2 py-1 rounded w-full"
              rows={4}
              value={form.pasos}
              onChange={e => setForm(f => ({ ...f, pasos: e.target.value }))}
              required
            />
          </div>
          {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-900"
            type="submit"
          >
            Guardar receta
          </button>
        </form>
      )}
      <div className="mb-5">
        <div className="font-bold text-gray-700 mb-2">Tus recetas propias</div>
        {propias.length === 0 ? (
          <div className="text-gray-400 mb-3">No tienes recetas propias.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {propias.map(rec => (
              <div key={rec.id} className="bg-gray-50 rounded-xl shadow p-4 flex flex-col">
                <div className="font-bold text-gray-700 mb-1">{rec.nombre}</div>
                <div className="text-xs text-gray-600 mb-2">
                  Ingredientes: {rec.ingredientes.join(", ")}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-900 text-xs font-bold"
                    onClick={() => verDetalles(rec, true)}
                  >
                    Ver detalles
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-500 text-xs"
                    onClick={() => exportarIngredientes(rec)}
                  >
                    Exportar lista
                  </button>
                  <button
                    className="bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-red-500 hover:text-white text-xs"
                    onClick={() => borrarReceta(rec.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="font-bold text-gray-700 mb-2">Recetas IA sugeridas</div>
        {sugeridas.length === 0 ? (
          <div className="text-gray-400">No hay recetas sugeridas con tu inventario actual.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {sugeridas.map((rec, i) => (
              <div key={i} className="bg-gray-50 rounded-xl shadow p-4 flex flex-col">
                <div className="font-bold text-gray-700 mb-1">{rec.nombre}</div>
                <div className="text-xs text-gray-600 mb-2">
                  Ingredientes: {rec.ingredientes.join(", ")}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-900 text-xs font-bold"
                    onClick={() => verDetalles(rec, false)}
                  >
                    Ver detalles
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-500 text-xs"
                    onClick={() => exportarIngredientes(rec)}
                  >
                    Exportar lista
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal detalle receta */}
      {recetaSel && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-lg">{recetaSel.nombre}</div>
              <button onClick={cerrarDetalles} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <div>
              <b>Ingredientes:</b>
              <ul className="ml-6 mb-3">
                {recetaSel.ingredientes.map((ing, i) => {
                  const tengo = nombresProd.some(np =>
                    ing.toLowerCase().includes(np.toLowerCase()) ||
                    np.toLowerCase().includes(ing.toLowerCase())
                  );
                  return (
                    <li key={i} className={tengo ? "text-gray-800" : "text-red-600"}>
                      {ing} {tengo ? "✅" : "❌"}
                    </li>
                  );
                })}
              </ul>
              <b>Paso a paso:</b>
              <ol className="ml-6 list-decimal">
                {(recetaSel.pasos || []).map((paso, i) =>
                  <li key={i} className="mb-1">{paso}</li>
                )}
              </ol>
            </div>
            <button
              onClick={cerrarDetalles}
              className="mt-4 bg-gray-300 hover:bg-gray-500 px-4 py-2 rounded font-bold text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
