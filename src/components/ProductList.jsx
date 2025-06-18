import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, addDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

// Asegúrate que las categorías coincidan con tu app
const categorias = [
  "Alimentos NP", "Alimentos Des", "Condimentos", "Semillas", "Desayuno",
  "Frutas", "Verduras", "Refrigerados", "Congelados", "Bebidas",
  "Aseo personal", "Aseo hogar"
];

export default function ProductList({ setEditing, user, mostrarSoloTabla }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [multiCats, setMultiCats] = useState([]);
  const [multiProds, setMultiProds] = useState([]);
  const [orderByCol, setOrderByCol] = useState("created");
  const [orderAsc, setOrderAsc] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("created", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(
        snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  let prods = products.slice();
  if (orderByCol !== "created") {
    prods.sort((a, b) => {
      if (orderByCol === "expiry") {
        const da = a.expiry ? new Date(a.expiry) : new Date(0);
        const db = b.expiry ? new Date(b.expiry) : new Date(0);
        return orderAsc ? da - db : db - da;
      }
      if (orderByCol === "quantity" || orderByCol === "price") {
        return orderAsc
          ? Number(a[orderByCol] || 0) - Number(b[orderByCol] || 0)
          : Number(b[orderByCol] || 0) - Number(a[orderByCol] || 0);
      }
      return 0;
    });
  }

  const filteredProducts = prods.filter(prod => {
    const nameMatch =
      (!multiProds.length && prod.name?.toLowerCase().includes(search.toLowerCase())) ||
      (multiProds.length && multiProds.includes(prod.name));
    const catMatch =
      !multiCats.length || multiCats.includes(prod.category);
    return nameMatch && catMatch;
  });

  const allProductNames = Array.from(new Set(products.map(p => p.name))).sort();

  // Productos con poco stock
  const stockBajo = products.filter(p => Number(p.quantity) <= 2);

  // Fila resaltada si vence en 7 días o menos
  function getRowClass(prod) {
    if (!prod.expiry) return "";
    const dias = Math.ceil((new Date(prod.expiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias >= 0 && dias <= 7) return "bg-yellow-100";
    return "";
  }

  // Edición rápida cantidad/precio
  const startEdit = (prodId, field, value) => {
    setEditField({ prodId, field });
    setEditValue(value);
  };
  const saveEdit = async (prod) => {
    if (!editField) return;
    await updateDoc(doc(db, "products", prod.id), { [editField.field]: editValue });
    await addDoc(collection(db, "history"), {
      uid: user.uid,
      action: `Editar ${editField.field}`,
      productName: prod.name,
      details: `${editField.field}: ${editValue}`,
      timestamp: new Date()
    });
    setEditField(null);
  };

  const consumir = async (prod) => {
    const nuevaCantidad = Math.max(0, Number(prod.quantity) - 1);
    await updateDoc(doc(db, "products", prod.id), { quantity: nuevaCantidad });
    await addDoc(collection(db, "history"), {
      uid: user.uid,
      action: "Consumir",
      productName: prod.name,
      details: `Queda: ${nuevaCantidad}`,
      timestamp: new Date()
    });
  };

  const handleFavorito = async (prod) => {
    await updateDoc(doc(db, "products", prod.id), { favorito: !prod.favorito });
    await addDoc(collection(db, "history"), {
      uid: user.uid,
      action: prod.favorito ? "Quitar favorito" : "Marcar favorito",
      productName: prod.name,
      timestamp: new Date()
    });
  };

  const handleBorrar = async (prod) => {
    if (window.confirm("¿Seguro que deseas borrar este producto?")) {
      await deleteDoc(doc(db, "products", prod.id));
      await addDoc(collection(db, "history"), {
        uid: user.uid,
        action: "Eliminar producto",
        productName: prod.name,
        timestamp: new Date()
      });
    }
  };

  const consolidado = categorias.map(cat => {
    const items = products.filter(p => p.category === cat);
    const totalCantidad = items.reduce((a, b) => a + Number(b.quantity), 0);
    const totalGastado = items.reduce((a, b) => a + (Number(b.price) * Number(b.quantity)), 0);
    return {
      categoria: cat,
      cantidad: totalCantidad,
      gasto: totalGastado
    };
  });

  function headerBtn(label, col) {
    return (
      <button
        className="font-bold"
        onClick={() => {
          setOrderByCol(col);
          setOrderAsc(col === orderByCol ? !orderAsc : true);
        }}
      >
        {label}
        {orderByCol === col ? (orderAsc ? " ↑" : " ↓") : ""}
      </button>
    );
  }

  function handleCatClick(cat) {
    setMultiCats(mcs =>
      mcs.includes(cat)
        ? mcs.filter(c => c !== cat)
        : [...mcs, cat]
    );
  }
  function handleProdClick(prod) {
    setMultiProds(mps =>
      mps.includes(prod)
        ? mps.filter(p => p !== prod)
        : [...mps, prod]
    );
  }
  function resetFilters() {
    setMultiCats([]);
    setMultiProds([]);
    setSearch("");
  }

  return (
    <div>
      {stockBajo.length > 0 && (
        <div className="bg-gray-100 border border-gray-400 rounded-xl p-3 mb-4 text-gray-700">
          <b>¡Atención! Stock bajo:</b>{" "}
          {stockBajo.map(p => `${p.name} (${p.quantity})`).join(", ")}
        </div>
      )}

      {!mostrarSoloTabla && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              className="input w-full p-2 rounded-lg border-2 border-gray-300 focus:border-gray-600 outline-none transition"
              type="text" placeholder="Buscar por nombre"
              value={search} onChange={e => setSearch(e.target.value)}
              disabled={multiProds.length > 0}
            />
          </div>
          {/* Multi-categoría */}
          <div className="flex flex-wrap gap-2 mb-2 justify-center">
            {categorias.map(cat => (
              <button key={cat}
                className={`px-3 py-1 rounded-xl shadow text-xs font-semibold border transition
                  ${multiCats.includes(cat)
                  ? "bg-gray-700 text-white border-gray-800"
                  : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"}`}
                onClick={() => handleCatClick(cat)}>
                {cat}
              </button>
            ))}
          </div>
          {/* Multi-producto */}
          <div className="flex flex-wrap gap-2 mb-2 justify-center">
            {allProductNames.map(prod => (
              <button key={prod}
                className={`px-3 py-1 rounded-xl shadow text-xs border font-semibold transition
                  ${multiProds.includes(prod)
                  ? "bg-gray-700 text-white border-gray-800"
                  : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300"}`}
                onClick={() => handleProdClick(prod)}>
                {prod}
              </button>
            ))}
          </div>
          {(multiCats.length > 0 || multiProds.length > 0 || search) && (
            <div className="mb-2 text-center">
              <button className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-400"
                onClick={resetFilters}>
                Limpiar filtros
              </button>
            </div>
          )}
        </>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="overflow-x-auto rounded-xl shadow mb-4">
        <table className="min-w-[640px] text-xs sm:text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">★</th>
              <th className="p-2">{headerBtn("Nombre", "created")}</th>
              <th className="p-2">{headerBtn("Cantidad", "quantity")}</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">{headerBtn("Expiración", "expiry")}</th>
              <th className="p-2">{headerBtn("Precio", "price")}</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((prod, i) => (
              <tr key={prod.id} className={`${getRowClass(prod)} ${i % 2 === 0 ? "even:bg-gray-50" : ""}`}>
                <td className="p-2">
                  <button
                    className={`text-xl transition ${prod.favorito ? "text-yellow-400" : "text-gray-400 hover:text-yellow-500"}`}
                    title={prod.favorito ? "Quitar de favoritos" : "Marcar favorito"}
                    onClick={() => handleFavorito(prod)}>
                    ★
                  </button>
                </td>
                <td className="p-2 font-bold">{prod.name}</td>
                <td className="p-2">
                  {editField && editField.prodId === prod.id && editField.field === "quantity" ? (
                    <input
                      type="number"
                      className="w-16 border rounded"
                      value={editValue}
                      autoFocus
                      onBlur={() => saveEdit(prod)}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(prod); }}
                    />
                  ) : (
                    <span onDoubleClick={() => startEdit(prod.id, "quantity", prod.quantity)} className="cursor-pointer hover:underline">{prod.quantity}</span>
                  )}
                  <button className="ml-2 px-2 bg-gray-200 rounded hover:bg-gray-400" onClick={() => consumir(prod)} title="Consumir 1">-1</button>
                </td>
                <td className="p-2">{prod.category}</td>
                <td className="p-2">{prod.expiry}</td>
                <td className="p-2">
                  {editField && editField.prodId === prod.id && editField.field === "price" ? (
                    <input
                      type="number"
                      className="w-20 border rounded"
                      value={editValue}
                      autoFocus
                      onBlur={() => saveEdit(prod)}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(prod); }}
                    />
                  ) : (
                    <span onDoubleClick={() => startEdit(prod.id, "price", prod.price)} className="cursor-pointer hover:underline">
                      ${Number(prod.price).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <button className="px-2 py-1 bg-gray-200 rounded mr-1 hover:bg-gray-400 transition"
                    onClick={() => setEditing(prod)}>Editar</button>
                  <button className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-500 transition"
                    onClick={() => handleBorrar(prod)}>Borrar</button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-gray-400 py-4">
                  No hay productos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* CONSOLIDADO POR CATEGORÍA */}
      <div className="bg-gray-50 p-4 rounded-xl mb-3">
        <h4 className="font-bold mb-2">Resumen por categoría</h4>
        <table className="min-w-[360px] text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="p-2">Categoría</th>
              <th className="p-2">Total Productos</th>
              <th className="p-2">Total Gastado</th>
            </tr>
          </thead>
          <tbody>
            {consolidado.map(row =>
              <tr key={row.categoria}>
                <td className="p-2">{row.categoria}</td>
                <td className="p-2">{row.cantidad}</td>
                <td className="p-2">${row.gasto.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
