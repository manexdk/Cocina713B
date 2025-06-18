import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function Adjuntos({ user }) {
  const [products, setProducts] = useState([]);
  const [selProd, setSelProd] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [adjuntos, setAdjuntos] = useState({});

  // Cargar productos
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, snap => {
      setProducts(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.uid === user.uid)
      );
      // Cargar adjuntos
      setAdjuntos(
        Object.fromEntries(
          snap.docs
            .map(d => [d.id, d.data().adjuntos || []])
        )
      );
    });
    return () => unsub();
  }, [user.uid]);

  // Subir archivo
  async function subir(e) {
    e.preventDefault();
    setMsg("");
    if (!selProd || !file) {
      setMsg("Selecciona producto y archivo.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileRef = ref(storage, `adjuntos/${selProd}/${Date.now()}.${ext}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    const nuevoAdjunto = {
      url,
      nombre: file.name,
      tipo: file.type,
      fecha: new Date().toISOString()
    };
    // Actualiza en Firestore
    const nuevos = [...(adjuntos[selProd] || []), nuevoAdjunto];
    await updateDoc(doc(db, "products", selProd), { adjuntos: nuevos });
    setFile(null);
    setMsg("Adjunto subido.");
    setUploading(false);
  }

  // Eliminar adjunto
  async function borrarAdjunto(pid, idx) {
    const adj = adjuntos[pid][idx];
    if (!window.confirm("¿Borrar adjunto?")) return;
    // Borra archivo real en Storage
    if (adj && adj.url) {
      const fileRef = ref(storage, adj.url);
      try { await deleteObject(fileRef); } catch {}
    }
    // Actualiza Firestore
    const nuevos = adjuntos[pid].filter((_, i) => i !== idx);
    await updateDoc(doc(db, "products", pid), { adjuntos: nuevos });
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-gray-700">Adjuntar boletas, fotos y archivos</h3>
      <form onSubmit={subir} className="flex flex-wrap gap-2 mb-4 items-end">
        <select
          className="border px-2 py-1 rounded text-xs"
          value={selProd}
          onChange={e => setSelProd(e.target.value)}
        >
          <option value="">Producto...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input
          type="file"
          className="text-xs"
          onChange={e => setFile(e.target.files[0])}
          accept="image/*,application/pdf"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-3 py-1 rounded font-bold text-xs hover:bg-gray-900"
          disabled={uploading}
        >
          {uploading ? "Subiendo..." : "Adjuntar"}
        </button>
      </form>
      {msg && <div className="mb-3 text-green-700 font-bold">{msg}</div>}

      {/* Adjuntos por producto */}
      <div>
        {products.length === 0 && (
          <div className="text-gray-400 text-xs">No hay productos.</div>
        )}
        {products.map(p => (
          <div key={p.id} className="mb-5">
            <div className="font-bold text-gray-800 mb-1">{p.name}</div>
            <div className="flex gap-3 flex-wrap">
              {(adjuntos[p.id] || []).length === 0 ? (
                <span className="text-gray-400 text-xs">Sin adjuntos.</span>
              ) : (
                adjuntos[p.id].map((adj, i) =>
                  <div key={i} className="flex flex-col items-center bg-gray-100 p-2 rounded-xl relative">
                    {adj.tipo.startsWith("image/") ? (
                      <img src={adj.url} alt={adj.nombre} className="w-24 h-24 object-cover rounded mb-1" />
                    ) : (
                      <a
                        href={adj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-xs text-blue-600"
                      >
                        {adj.nombre}
                      </a>
                    )}
                    <div className="text-xs text-gray-600">{adj.fecha?.slice(0, 10)}</div>
                    <button
                      className="absolute top-0 right-0 text-red-600 text-lg bg-white rounded-full px-2 py-1"
                      onClick={() => borrarAdjunto(p.id, i)}
                      title="Borrar adjunto"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-5">
        Adjunta boletas, facturas o fotos a cada producto.<br />
        Se guarda seguro en la nube.
      </div>
    </div>
  );
}
