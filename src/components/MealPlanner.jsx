import { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const COMIDAS = ["Desayuno", "Almuerzo", "Cena"];

export default function MealPlanner({ user }) {
  const [products, setProducts] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [iaRecetas, setIaRecetas] = useState([]);
  const [plan, setPlan] = useState({});
  const [busca, setBusca] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "products")), snap => {
      setProducts(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "recetas")), snap => {
      setRecetas(
        snap.docs.map(d => ({ ...d.data(), id: d.id }))
          .filter(r => r.uid === user.uid)
      );
    });
    // Recetas IA base local
    setIaRecetas([
      {
        nombre: "Tallarines con salsa de tomate",
        ingredientes: ["Spaguetti", "Salsa de tomate (6un)", "Aceite (1 L)", "Sal"],
        pasos: ["Cocina los tallarines según el envase.", "Calienta la salsa con aceite y sal.", "Mezcla y sirve caliente."]
      },
      {
        nombre: "Lentejas guisadas",
        ingredientes: ["Lentejas (1kg)", "Cebolla (1 uds)", "Zanahoria (1 kg)", "Sal", "Aceite (1 L)"],
        pasos: ["Remoja las lentejas si es necesario.", "Sofríe cebolla y zanahoria, añade lentejas.", "Agrega agua y cocina hasta ablandar."]
      },
      {
        nombre: "Ensalada de frutas",
        ingredientes: ["Manzana (1 kg)", "Naranja (1 kg)", "Plátano (1 kg)", "Miel"],
        pasos: ["Pela y corta toda la fruta.", "Mezcla en un bol.", "Añade miel al gusto."]
      }
    ]);
    return () => unsub();
  }, [user.uid]);

  const todasRecetas = [...iaRecetas, ...recetas].filter(r =>
    !busca ||
    r.nombre.toLowerCase().includes(busca.toLowerCase())
  );

  // Asignar receta al planificador
  function asignarReceta(dia, comida, receta) {
    setPlan(p => ({
      ...p,
      [dia]: { ...p[dia], [comida]: receta }
    }));
  }

  // Guardar el plan y descontar ingredientes (sólo cuando se presiona "Guardar y actualizar stock")
  async function guardarPlan() {
    let updates = [];
    let faltantes = [];
    for (const dia of DIAS) {
      for (const comida of COMIDAS) {
        const receta = plan[dia]?.[comida];
        if (receta && receta.ingredientes) {
          for (const ing of receta.ingredientes) {
            const prod = products.find(p =>
              ing.toLowerCase().includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(ing.toLowerCase())
            );
            if (prod) {
              const nuevoStock = Math.max(0, Number(prod.quantity) - 1); // Descuenta 1 unidad por ingrediente
              updates.push(updateDoc(doc(db, "products", prod.id), { quantity: nuevoStock }));
            } else {
              faltantes.push(ing);
            }
          }
        }
      }
    }
    await Promise.all(updates);
    setMensaje(faltantes.length
      ? "Plan guardado. Faltaron ingredientes: " + faltantes.join(", ")
      : "Plan guardado y stock actualizado.");
  }

  // Exportar Excel planificador + lista de compras faltantes
  function exportar() {
    const filas = [];
    let ingredientesUsados = [];
    for (const dia of DIAS) {
      for (const comida of COMIDAS) {
        const receta = plan[dia]?.[comida];
        if (receta) {
          filas.push({ Día: dia, Comida: comida, Receta: receta.nombre, Ingredientes: receta.ingredientes.join(", ") });
          ingredientesUsados.push(...receta.ingredientes);
        }
      }
    }
    // Verifica faltantes en inventario
    const nombresProd = products.map(p => p.name.toLowerCase());
    const faltantes = Array.from(new Set(ingredientesUsados.filter(ing =>
      !nombresProd.some(np => ing.toLowerCase().includes(np) || np.includes(ing.toLowerCase()))
    )));
    const wsPlan = XLSX.utils.json_to_sheet(filas);
    const wsFaltan = XLSX.utils.json_to_sheet(faltantes.map(i => ({ Ingrediente: i })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsPlan, "MealPlanner");
    XLSX.utils.book_append_sheet(wb, wsFaltan, "Faltantes");
    XLSX.writeFile(wb, "mealplanner_713.xlsx");
  }

  // Limpiar toda la semana
  function limpiar() {
    setPlan({});
    setMensaje("");
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Planificador de comidas semanal</h3>
      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          className="border px-2 py-1 rounded text-xs"
          placeholder="Buscar receta"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <button
          className="bg-gray-300 hover:bg-gray-500 text-gray-900 px-3 py-1 rounded font-bold text-xs"
          onClick={limpiar}
        >
          Limpiar semana
        </button>
        <button
          className="bg-gray-700 text-white px-3 py-1 rounded font-bold text-xs hover:bg-gray-900"
          onClick={exportar}
        >
          Exportar plan Excel
        </button>
        <button
          className="bg-gray-700 text-white px-3 py-1 rounded font-bold text-xs hover:bg-gray-900"
          onClick={guardarPlan}
        >
          Guardar y actualizar stock
        </button>
      </div>
      {mensaje && (
        <div className="mb-3 text-green-700 font-bold">{mensaje}</div>
      )}
      <div className="overflow-x-auto rounded-xl shadow mb-4">
        <table className="min-w-[650px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Día</th>
              {COMIDAS.map(comida => (
                <th key={comida} className="p-2">{comida}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIAS.map(dia => (
              <tr key={dia} className="even:bg-gray-50">
                <td className="p-2 font-bold">{dia}</td>
                {COMIDAS.map(comida => (
                  <td key={comida} className="p-2">
                    <select
                      className="border rounded px-1 py-0.5 w-40 text-xs"
                      value={plan[dia]?.[comida]?.nombre || ""}
                      onChange={e => {
                        const receta = todasRecetas.find(r => r.nombre === e.target.value);
                        asignarReceta(dia, comida, receta);
                      }}
                    >
                      <option value="">- Sin asignar -</option>
                      {todasRecetas.map(r =>
                        <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
                      )}
                    </select>
                    {plan[dia]?.[comida]?.nombre && (
                      <div className="mt-1 text-gray-600 text-xs">
                        {plan[dia][comida].ingredientes.slice(0, 3).join(", ")}
                        {plan[dia][comida].ingredientes.length > 3 && "…"}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Asigna recetas para cada comida.  
        Al guardar se descuenta 1 unidad de cada ingrediente del inventario.<br />
        Exporta el plan semanal y faltantes a Excel.
      </div>
    </div>
  );
}
