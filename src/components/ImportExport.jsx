import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";

export default function ImportExport({ user }) {
  const [products, setProducts] = useState([]);
  const [importRows, setImportRows] = useState([]);
  const [preview, setPreview] = useState(false);

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

  // Exporta inventario actual a Excel
  function exportar() {
    const datos = products.map(p => ({
      Producto: p.name,
      Categoría: p.category,
      Cantidad: p.quantity,
      Precio: p.price,
      Vence: p.expiry,
      Ingreso: p.created,
      Favorito: p.favorito ? "Sí" : "No"
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario_713.xlsx");
  }

  // Importa Excel: preview y luego confirmación para agregar
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const datos = XLSX.utils.sheet_to_json(ws);
      setImportRows(datos);
      setPreview(true);
    };
    reader.readAsBinaryString(file);
  }

  async function importar() {
    for (const row of importRows) {
      // Verifica columnas básicas
      if (!row.Producto || !row.Categoría || row.Cantidad === undefined || row.Precio === undefined) continue;
      // Busca si existe
      const exist = products.find(p =>
        p.name === row.Producto && p.category === row.Categoría
      );
      if (exist) {
        await updateDoc(doc(db, "products", exist.id), {
          quantity: Number(row.Cantidad),
          price: Number(row.Precio),
          expiry: row.Vence || "",
          favorito: row.Favorito === "Sí"
        });
      } else {
        await addDoc(collection(db, "products"), {
          name: row.Producto,
          category: row.Categoría,
          quantity: Number(row.Cantidad),
          price: Number(row.Precio),
          expiry: row.Vence || "",
          created: row.Ingreso || new Date().toISOString().slice(0, 10),
          favorito: row.Favorito === "Sí",
          uid: user.uid
        });
      }
    }
    setImportRows([]);
    setPreview(false);
    alert("¡Importación exitosa!");
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Importar / Exportar inventario</h3>
      <div className="flex gap-4 mb-5 flex-wrap">
        <button
          onClick={exportar}
          className="bg-gray-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-900"
        >
          Exportar a Excel
        </button>
        <label className="bg-gray-300 hover:bg-gray-500 text-gray-900 px-4 py-2 rounded-xl font-bold cursor-pointer">
          Importar Excel
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      </div>
      {preview && (
        <div className="mb-4 bg-gray-50 p-4 rounded-xl border">
          <h4 className="font-semibold mb-2">Vista previa importación</h4>
          <div className="overflow-x-auto">
            <table className="min-w-[320px] text-xs sm:text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Cantidad</th>
                  <th className="p-2">Precio</th>
                  <th className="p-2">Vence</th>
                  <th className="p-2">Ingreso</th>
                  <th className="p-2">Favorito</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row, i) =>
                  <tr key={i} className="even:bg-gray-100">
                    <td className="p-2">{row.Producto}</td>
                    <td className="p-2">{row.Categoría}</td>
                    <td className="p-2">{row.Cantidad}</td>
                    <td className="p-2">{row.Precio}</td>
                    <td className="p-2">{row.Vence || "-"}</td>
                    <td className="p-2">{row.Ingreso || "-"}</td>
                    <td className="p-2">{row.Favorito || "-"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={importar}
            className="bg-gray-700 text-white px-4 py-2 rounded-xl font-bold mt-3 hover:bg-gray-900"
          >
            Confirmar e importar
          </button>
          <button
            onClick={() => { setImportRows([]); setPreview(false); }}
            className="ml-2 bg-gray-200 hover:bg-gray-400 text-gray-900 px-3 py-2 rounded-xl font-bold"
          >
            Cancelar
          </button>
        </div>
      )}
      <div className="text-xs text-gray-500 mt-6">
        <b>Nota:</b> El archivo debe contener columnas: Producto, Categoría, Cantidad, Precio.  
        <br />
        Si existe el producto se actualiza, si no se agrega nuevo.
      </div>
    </div>
  );
}
