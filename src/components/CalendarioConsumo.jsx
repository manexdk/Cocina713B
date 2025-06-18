import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";

// Helper para armar Google Calendar links
function gCalLink(fecha, acciones) {
  if (!acciones.length) return null;
  const title = encodeURIComponent("Inventario 713: " + acciones.map(a => a.action + " " + a.productName).join(", "));
  const date = fecha.replace(/-/g, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}`;
}

function agrupaPorDia(historial) {
  const dias = {};
  for (const h of historial) {
    const d = h.timestamp && h.timestamp.toDate
      ? h.timestamp.toDate()
      : new Date(h.timestamp);
    const diaStr = d.toISOString().slice(0, 10);
    if (!dias[diaStr]) dias[diaStr] = [];
    dias[diaStr].push(h);
  }
  return dias;
}

const tiposAccion = [
  "Agregar producto", "Consumir", "Eliminar producto", "Editar producto", "Marcar favorito", "Quitar favorito"
];

export default function CalendarioConsumo({ user }) {
  const [history, setHistory] = useState([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroProd, setFiltroProd] = useState("");

  useEffect(() => {
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, snap => {
      setHistory(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(h => h.uid === user.uid)
      );
    });
    return () => unsub();
  }, [user.uid]);

  // Filtra historial del mes/año y filtros seleccionados
  const historyMes = history.filter(h => {
    const d = h.timestamp && h.timestamp.toDate
      ? h.timestamp.toDate()
      : new Date(h.timestamp);
    return (
      d.getFullYear() === anio &&
      d.getMonth() + 1 === mes &&
      (!filtroTipo || h.action === filtroTipo) &&
      (!filtroProd || h.productName === filtroProd)
    );
  });

  const dias = agrupaPorDia(historyMes);
  const diasDelMes = new Date(anio, mes, 0).getDate();
  const primerDia = new Date(anio, mes - 1, 1).getDay();
  // Para que empiece en lunes:
  const celdas = [];
  for (let i = 1 - ((primerDia + 6) % 7); i <= diasDelMes; i++) {
    celdas.push(i > 0 ? i : null);
  }
  while (celdas.length % 7 !== 0) celdas.push(null);

  // Productos únicos para filtrar
  const productosUnicos = Array.from(new Set(history.map(h => h.productName))).sort();

  // Exportar calendario a Excel
  function exportar() {
    const filas = [];
    for (const fecha of Object.keys(dias)) {
      for (const h of dias[fecha]) {
        filas.push({
          Fecha: fecha,
          Acción: h.action,
          Producto: h.productName,
          Detalle: h.details || ""
        });
      }
    }
    if (filas.length === 0) {
      alert("No hay movimientos para exportar en este mes/filtro.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calendario");
    XLSX.writeFile(wb, `calendario_consumo_${anio}_${String(mes).padStart(2, "0")}.xlsx`);
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Calendario de consumo y movimientos</h3>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <label className="text-xs">Año:</label>
        <input
          className="border rounded px-2 py-1 text-xs w-20"
          type="number"
          value={anio}
          min={2000}
          max={2100}
          onChange={e => setAnio(Number(e.target.value))}
        />
        <label className="text-xs">Mes:</label>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) =>
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          )}
        </select>
        <label className="text-xs">Acción:</label>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="">Todas</option>
          {tiposAccion.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="text-xs">Producto:</label>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={filtroProd}
          onChange={e => setFiltroProd(e.target.value)}
        >
          <option value="">Todos</option>
          {productosUnicos.map(p =>
            <option key={p} value={p}>{p}</option>
          )}
        </select>
        <button
          className="bg-gray-700 text-white px-3 py-1 rounded font-bold text-xs hover:bg-gray-900"
          onClick={exportar}
        >
          Exportar Excel
        </button>
      </div>
      <div className="overflow-x-auto mb-5">
        <table className="min-w-[350px] text-xs bg-gray-100 rounded-xl">
          <thead>
            <tr className="bg-gray-300">
              <th className="p-1">Lun</th>
              <th className="p-1">Mar</th>
              <th className="p-1">Mié</th>
              <th className="p-1">Jue</th>
              <th className="p-1">Vie</th>
              <th className="p-1">Sáb</th>
              <th className="p-1">Dom</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: celdas.length / 7 }, (_, row) =>
              <tr key={row}>
                {celdas.slice(row * 7, row * 7 + 7).map((dia, i) => {
                  const fecha = dia
                    ? `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
                    : null;
                  const acciones = fecha ? (dias[fecha] || []) : [];
                  return (
                    <td
                      key={i}
                      className={`p-0.5 align-top border border-gray-200 ${dia ? "bg-white" : "bg-gray-50"}`}
                      style={{ minWidth: 48, height: 56 }}
                    >
                      {dia && (
                        <div className="flex flex-col h-full">
                          <div className="text-gray-500 font-bold">{dia}</div>
                          <div className="flex-1 overflow-y-auto">
                            {acciones.map((h, k) =>
                              <div key={k} className="text-[10px] mt-0.5 bg-gray-200 rounded px-1 text-gray-700">
                                {h.action === "Consumir" && <span>🍽️</span>}
                                {h.action === "Agregar producto" && <span>➕</span>}
                                {h.action === "Eliminar producto" && <span>🗑️</span>}
                                <span> {h.action}: {h.productName}</span>
                              </div>
                            )}
                          </div>
                          {acciones.length > 0 && (
                            <a
                              className="mt-1 text-xs text-blue-600 underline"
                              href={gCalLink(fecha, acciones)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Añadir a Google Calendar
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-500">
        {historyMes.length === 0
          ? "No hay movimientos registrados para este mes o filtro."
          : "Filtra por acción, producto o exporta el calendario. Haz clic en 'Añadir a Google Calendar' para guardar el evento diario."}
      </div>
    </div>
  );
}
