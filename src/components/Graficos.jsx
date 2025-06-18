import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const categorias = [
  "Alimentos NP", "Alimentos Des", "Condimentos", "Semillas", "Desayuno",
  "Frutas", "Verduras", "Refrigerados", "Congelados", "Bebidas",
  "Aseo personal", "Aseo hogar"
];

// Paleta de grises para pastel
const COLORS = [
  "#52525b", "#a1a1aa", "#d4d4d8", "#71717a", "#e5e5e5",
  "#9ca3af", "#6b7280", "#bdbdbd", "#d1d5db", "#f3f4f6",
  "#374151", "#111827"
];

export default function Graficos({ user }) {
  const [products, setProducts] = useState([]);

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

  // Agrupa productos por categoría para pastel de stock y gasto
  const dataCat = categorias.map((cat, i) => ({
    name: cat,
    value: products.filter(p => p.category === cat).reduce((a, b) => a + Number(b.quantity), 0)
  })).filter(d => d.value > 0);

  const dataCatGasto = categorias.map((cat, i) => ({
    name: cat,
    value: products.filter(p => p.category === cat)
      .reduce((a, b) => a + (Number(b.price) * Number(b.quantity)), 0)
  })).filter(d => d.value > 0);

  // Top 5 productos más consumidos (por cantidad)
  const prodConsumo = products
    .map(p => ({ name: p.name, value: Number(p.quantity) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-gray-700">Gráficos de inventario</h3>

      <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
        {/* Pastel de categorías */}
        <div className="flex-1 min-w-[260px] bg-gray-50 rounded-xl p-4">
          <div className="font-semibold text-gray-700 mb-2">Stock por categoría</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={dataCat}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={70}
                fill="#a1a1aa"
                label
              >
                {dataCat.map((_, i) =>
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-500">
            Total productos: <b>{products.reduce((a, b) => a + Number(b.quantity), 0)}</b>
          </div>
        </div>

        {/* Pastel de gasto */}
        <div className="flex-1 min-w-[260px] bg-gray-50 rounded-xl p-4">
          <div className="font-semibold text-gray-700 mb-2">Gasto total por categoría</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={dataCatGasto}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={70}
                fill="#a1a1aa"
                label
              >
                {dataCatGasto.map((_, i) =>
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-500">
            Total gastado: <b>${products.reduce((a, b) => a + Number(b.price) * Number(b.quantity), 0).toFixed(2)}</b>
          </div>
        </div>
      </div>

      {/* Barras: productos más presentes en el inventario */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 max-w-2xl mx-auto">
        <div className="font-semibold text-gray-700 mb-2">Top 5 productos (por cantidad actual)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={prodConsumo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#71717a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
