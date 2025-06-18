import { useState } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const productosPredefinidos = [
  { nombre: "Arroz (1 kg)", categoria: "Alimentos NP" },
  { nombre: "Spaguetti", categoria: "Alimentos NP" },
  { nombre: "Caracoles", categoria: "Alimentos NP" },
  { nombre: "Espirales", categoria: "Alimentos NP" },
  { nombre: "Corbatas", categoria: "Alimentos NP" },
  { nombre: "Canutones", categoria: "Alimentos NP" },
  { nombre: "Cabellos de angel", categoria: "Alimentos NP" },
  { nombre: "Caracolitos", categoria: "Alimentos NP" },
  { nombre: "Lentejas (1kg)", categoria: "Alimentos Des" },
  { nombre: "Garbanzos (1kg)", categoria: "Alimentos Des" },
  { nombre: "Harina común (1 kg)", categoria: "Alimentos NP" },
  { nombre: "Harina de maíz (1 kg)", categoria: "Alimentos NP" },
  { nombre: "Avena (800 g)", categoria: "Desayuno" },
  { nombre: "Proteina de Soya", categoria: "Alimentos Des" },
  { nombre: "Café instantáneo (tarro)", categoria: "Desayuno" },
  { nombre: "Manjar", categoria: "Desayuno" },
  { nombre: "Mermelada", categoria: "Desayuno" },
  { nombre: "Jugo Zuko", categoria: "Bebidas" },
  { nombre: "Azúcar (1 kg)", categoria: "Desayuno" },
  { nombre: "Aceite (1 L)", categoria: "Alimentos NP" },
  { nombre: "Atún (lata)", categoria: "Alimentos Des" },
  { nombre: "Jurel (lata)", categoria: "Alimentos Des" },
  { nombre: "Salsa de tomate (6un)", categoria: "Alimentos Des" },
  { nombre: "Pan de molde", categoria: "Desayuno" },
  { nombre: "Té (caja)", categoria: "Desayuno" },
  { nombre: "Sal", categoria: "Condimentos" },
  { nombre: "Pan (500 g)", categoria: "Desayuno" },
  { nombre: "Colacao", categoria: "Desayuno" },
  { nombre: "Miel", categoria: "Desayuno" },
  { nombre: "Leche evaporada", categoria: "Refrigerados" },
  { nombre: "Leche condenzada", categoria: "Refrigerados" },
  { nombre: "Crema Para cocinar", categoria: "Refrigerados" },
  { nombre: "Mix de semillas", categoria: "Semillas" },
  { nombre: "Frutos secos", categoria: "Semillas" },
  { nombre: "Caldo Verduras", categoria: "Condimentos" },
  { nombre: "Oregano", categoria: "Condimentos" },
  { nombre: "Aliño Completo", categoria: "Condimentos" },
  { nombre: "Canela", categoria: "Condimentos" },
  { nombre: "Comino", categoria: "Condimentos" },
  { nombre: "Pimienta", categoria: "Condimentos" },
  { nombre: "Ajo en polvo", categoria: "Condimentos" },
  { nombre: "Paprika", categoria: "Condimentos" },
  { nombre: "Curry", categoria: "Condimentos" },
  { nombre: "Bicarbonato", categoria: "Condimentos" },
  { nombre: "Palta (1 kg)", categoria: "Frutas" },
  { nombre: "Limon (1 kg)", categoria: "Frutas" },
  { nombre: "Manzana (1 kg)", categoria: "Frutas" },
  { nombre: "Naranja (1 kg)", categoria: "Frutas" },
  { nombre: "Plátano (1 kg)", categoria: "Frutas" },
  { nombre: "Zanahoria (1 kg)", categoria: "Verduras" },
  { nombre: "Tomate granel (500 g)", categoria: "Verduras" },
  { nombre: "Papa (2 kg)", categoria: "Verduras" },
  { nombre: "Cebolla (1 uds)", categoria: "Verduras" },
  { nombre: "Pepino (1 uds)", categoria: "Verduras" },
  { nombre: "Pimenton Verde (1 uds)", categoria: "Verduras" },
  { nombre: "Tomate Cherry (1 caja)", categoria: "Verduras" },
  { nombre: "Ajo (1 uds)", categoria: "Verduras" },
  { nombre: "Brócoli", categoria: "Verduras" },
  { nombre: "Lechuga", categoria: "Verduras" },
  { nombre: "Espinaca", categoria: "Verduras" },
  { nombre: "Cervezas (6 uds)", categoria: "Bebidas" },
  { nombre: "Mayo", categoria: "Refrigerados" },
  { nombre: "Ketchup", categoria: "Refrigerados" },
  { nombre: "Mostaza", categoria: "Refrigerados" },
  { nombre: "Mantequilla", categoria: "Refrigerados" },
  { nombre: "Queso (500 gr)", categoria: "Refrigerados" },
  { nombre: "Leche (1 L)", categoria: "Refrigerados" },
  { nombre: "Huevos (12 uds)", categoria: "Refrigerados" },
  { nombre: "Verduras surtidas", categoria: "Verduras" },
  { nombre: "Chuleta Centro", categoria: "Congelados" },
  { nombre: "Filete de pollo", categoria: "Congelados" },
  { nombre: "Hielo (1 kg)", categoria: "Congelados" },
  { nombre: "Pasta de dientes", categoria: "Aseo personal" },
  { nombre: "Shampo", categoria: "Aseo personal" },
  { nombre: "Jabon", categoria: "Aseo personal" },
  { nombre: "Confort", categoria: "Aseo hogar" },
  { nombre: "Toallas humedas", categoria: "Aseo personal" },
  { nombre: "Trapero humedo", categoria: "Aseo hogar" },
  { nombre: "Ariel (5 kg)", categoria: "Aseo hogar" },
  { nombre: "Quix (1 lt)", categoria: "Aseo hogar" },
  { nombre: "Lustramuebles", categoria: "Aseo hogar" },
  { nombre: "Cloro Gel", categoria: "Aseo hogar" },
  { nombre: "Limpiavidrios", categoria: "Aseo hogar" },
  { nombre: "Cif", categoria: "Aseo hogar" },
  { nombre: "Mr Musculo", categoria: "Aseo hogar" },
  { nombre: "Confort 8u", categoria: "Aseo hogar" },
  { nombre: "Bolsa de basura", categoria: "Aseo hogar" },
  { nombre: "Cervilletas", categoria: "Aseo hogar" },
  { nombre: "Nova", categoria: "Aseo hogar" },
  { nombre: "Pastilla WC", categoria: "Aseo hogar" },
  { nombre: "Esponja", categoria: "Aseo hogar" },
  { nombre: "Lisoform", categoria: "Aseo hogar" }
];
const categoriasBase = Array.from(new Set(productosPredefinidos.map(p => p.categoria)));

export default function ProductForm({ editing, setEditing, user }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    categoryCustom: "",
    quantity: 1,
    price: "",
    expiry: "",
    created: "",
    favorito: false
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Autocompleta y asigna categoría si elige predefinido
  function handlePredef(e) {
    const val = e.target.value;
    const found = productosPredefinidos.find(p => p.nombre === val);
    if (found) {
      setForm(f => ({
        ...f,
        name: found.nombre,
        category: found.categoria,
        categoryCustom: "",
        created: new Date().toISOString().slice(0, 10)
      }));
    } else {
      setForm(f => ({ ...f, name: val, category: "", categoryCustom: "", created: "" }));
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      category: "",
      categoryCustom: "",
      quantity: 1,
      price: "",
      expiry: "",
      created: "",
      favorito: false
    });
    setError("");
    if (setEditing) setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const categoryFinal = form.category === "Otro" ? form.categoryCustom : form.category;
    if (!form.name || !categoryFinal || !form.quantity || !form.price) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    try {
      // Busca producto existente (por nombre, categoría y expiración)
      const q = query(
        collection(db, "products"),
        where("uid", "==", user.uid),
        where("name", "==", form.name),
        where("category", "==", categoryFinal),
        where("expiry", "==", form.expiry || "")
      );
      const snapshot = await getDocs(q);

      if (editing) {
        // Editar producto existente
        await updateDoc(doc(db, "products", editing.id), {
          ...form,
          category: categoryFinal,
          quantity: Number(form.quantity),
          price: Number(form.price),
          created: form.created || new Date().toISOString().slice(0, 10)
        });
      } else if (!snapshot.empty) {
        // Ya existe, suma cantidad y actualiza precio
        const existing = snapshot.docs[0];
        await updateDoc(existing.ref, {
          quantity: Number(existing.data().quantity) + Number(form.quantity),
          price: Number(form.price),
          favorito: form.favorito
        });
      } else {
        // Nuevo producto
        await addDoc(collection(db, "products"), {
          ...form,
          category: categoryFinal,
          quantity: Number(form.quantity),
          price: Number(form.price),
          created: form.created || new Date().toISOString().slice(0, 10)
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      resetForm();
    } catch (err) {
      setError("Error al guardar. Intenta nuevamente.");
    }
  }

  // Si edita, llena campos
  if (editing && form.name === "") {
    setForm({
      name: editing.name,
      category: categoriasBase.includes(editing.category) ? editing.category : "Otro",
      categoryCustom: categoriasBase.includes(editing.category) ? "" : editing.category,
      quantity: editing.quantity,
      price: editing.price,
      expiry: editing.expiry || "",
      created: editing.created || new Date().toISOString().slice(0, 10),
      favorito: editing.favorito || false
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 bg-gray-50 p-4 rounded-2xl shadow">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Autocompleta producto predefinido */}
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-700">Producto *</label>
          <input
            list="productos"
            className="w-full border px-2 py-1 rounded"
            name="name"
            autoComplete="off"
            value={form.name}
            onChange={handlePredef}
            required
            placeholder="Elige o escribe producto"
          />
          <datalist id="productos">
            {productosPredefinidos.map(p =>
              <option key={p.nombre} value={p.nombre} />
            )}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-700">Categoría *</label>
          <select
            className="w-full border px-2 py-1 rounded"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona...</option>
            {categoriasBase.map(cat =>
              <option key={cat} value={cat}>{cat}</option>
            )}
            <option value="Otro">Otro...</option>
          </select>
          {form.category === "Otro" && (
            <input
              type="text"
              name="categoryCustom"
              value={form.categoryCustom}
              onChange={handleChange}
              className="mt-1 w-full border px-2 py-1 rounded"
              placeholder="Escribe nueva categoría"
              required
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-700">Cantidad *</label>
          <input
            className="w-full border px-2 py-1 rounded"
            name="quantity"
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-700">Precio de compra *</label>
          <input
            className="w-full border px-2 py-1 rounded"
            name="price"
            type="number"
            min={0}
            required
            value={form.price}
            onChange={handleChange}
            placeholder="Ej: 1200"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-700">Fecha de caducidad</label>
          <input
            className="w-full border px-2 py-1 rounded"
            name="expiry"
            type="date"
            value={form.expiry}
            onChange={handleChange}
          />
        </div>
        {/* Fecha de ingreso automática si producto predefinido */}
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-700">Fecha de ingreso</label>
          <input
            className="w-full border px-2 py-1 rounded bg-gray-200"
            name="created"
            type="date"
            value={form.created || new Date().toISOString().slice(0, 10)}
            readOnly
            tabIndex={-1}
          />
        </div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            name="favorito"
            checked={form.favorito}
            onChange={handleChange}
            className="mr-2"
            id="fav"
          />
          <label htmlFor="fav" className="text-xs text-gray-700">¿Favorito?</label>
        </div>
      </div>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      {saved && <div className="text-green-600 text-xs mt-2">¡Guardado!</div>}
      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          className="bg-gray-700 hover:bg-gray-900 text-white font-bold rounded px-4 py-2"
        >
          {editing ? "Actualizar" : "Agregar"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-300 hover:bg-gray-500 text-gray-900 font-bold rounded px-4 py-2"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}