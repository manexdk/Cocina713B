import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, setDoc, updateDoc, arrayUnion, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";
import QRCode from "react-qr-code"; // Usando react-qr-code

const USER_COLORS = ["bg-red-300", "bg-blue-300", "bg-green-300", "bg-yellow-300", "bg-pink-300", "bg-fuchsia-300"];
const USER_EMOJIS = ["🦄", "🍕", "🎉", "🍔", "🍩", "🥦", "🌮", "🥑"];

export default function Colaborativo({ user }) {
  // --- Estado base
  const [modo, setModo] = useState("personal");
  const [grupo, setGrupo] = useState("");
  const [grupoActual, setGrupoActual] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [invitar, setInvitar] = useState("");
  const [msg, setMsg] = useState("");
  const [prodGrupo, setProdGrupo] = useState([]);
  const [histGrupo, setHistGrupo] = useState([]);
  const [chat, setChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [fiesta, setFiesta] = useState({ nombre: "", lista: [], usuarios: [] });
  const [fiestas, setFiestas] = useState([]);
  const [asignar, setAsignar] = useState({ prod: "", user: "" });
  const [mostrarQR, setMostrarQR] = useState(false);
  const [secretList, setSecretList] = useState("");
  const [encuesta, setEncuesta] = useState({ pregunta: "", opciones: [], votos: {} });
  const [opcionNueva, setOpcionNueva] = useState("");
  const [anon, setAnon] = useState(false);

  // --- Minijuegos y modos
  const [juegoActivo, setJuegoActivo] = useState(false);
  const [palabra, setPalabra] = useState("");
  const [adivinanza, setAdivinanza] = useState("");
  const [intentos, setIntentos] = useState(0);

  const [ruletaRes, setRuletaRes] = useState("");
  const [reaccionProducto, setReaccionProducto] = useState("");
  const [reaccionGanador, setReaccionGanador] = useState("");
  const [sorteoRes, setSorteoRes] = useState("");
  const [pagoRonda, setPagoRonda] = useState("");
  const [memoriaItems, setMemoriaItems] = useState([]);
  const [memoriaShow, setMemoriaShow] = useState([]);
  const [memoriaGanador, setMemoriaGanador] = useState("");
  const [amigosActivos, setAmigosActivos] = useState([]);
  const [regalo, setRegalo] = useState("");
  const [regalos, setRegalos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [amigoSecretShow, setAmigoSecretShow] = useState(false);

  // Easter Egg
  const [fiestaSorpresa, setFiestaSorpresa] = useState(false);

  // --- LOGICA PRINCIPAL ---
  useEffect(() => {
    const q = query(collection(db, "grupos"));
    const unsub = onSnapshot(q, snap => {
      const lista = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(g => g.miembros && g.miembros.includes(user.uid));
      setGrupos(lista);
      if (lista.length > 0 && !grupo) setGrupo(lista[0].id);
    });
    return () => unsub();
  }, [user.uid, grupo]);

  useEffect(() => {
    if (!grupo) { setGrupoActual(null); return; }
    const ref = doc(db, "grupos", grupo);
    getDoc(ref).then(snap => {
      if (snap.exists()) setGrupoActual({ id: snap.id, ...snap.data() });
      else setGrupoActual(null);
    });
    const unsubProd = onSnapshot(collection(db, "grupos", grupo, "productos"), snap => {
      setProdGrupo(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubHist = onSnapshot(collection(db, "grupos", grupo, "historial"), snap => {
      setHistGrupo(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
    });
    const unsubChat = onSnapshot(collection(db, "grupos", grupo, "chat"), snap => {
      setChat(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds));
    });
    const unsubFiesta = onSnapshot(collection(db, "grupos", grupo, "fiestas"), snap => {
      setFiestas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProd(); unsubHist(); unsubChat(); unsubFiesta(); };
  }, [grupo]);

  // Crear grupo nuevo
  async function crearGrupo() {
    if (!nuevoGrupo.trim()) return;
    const ref = doc(db, "grupos", nuevoGrupo.trim());
    await setDoc(ref, {
      nombre: nuevoGrupo.trim(),
      miembros: [user.uid]
    });
    setGrupo(nuevoGrupo.trim());
    setNuevoGrupo("");
    setMsg("Grupo creado.");
  }

  // Unirse a grupo
  async function unirseGrupo() {
    if (!nuevoGrupo.trim()) return;
    const ref = doc(db, "grupos", nuevoGrupo.trim());
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { miembros: arrayUnion(user.uid) });
      setGrupo(nuevoGrupo.trim());
      setNuevoGrupo("");
      setMsg("Te uniste al grupo.");
    } else {
      setMsg("Grupo no encontrado.");
    }
  }

  // Invitar usuario
  async function invitarUsuario() {
    if (!invitar.trim() || !grupoActual) return;
    await updateDoc(doc(db, "grupos", grupoActual.id), {
      miembros: arrayUnion(invitar.trim())
    });
    setMsg("Usuario invitado.");
    setInvitar("");
  }

  // Añadir producto grupo
  async function agregarProdGrupo(nombre) {
    if (!nombre.trim() || !grupo) return;
    await addDoc(collection(db, "grupos", grupo, "productos"), {
      name: nombre.trim(),
      quantity: 1,
      addedBy: user.uid,
      timestamp: serverTimestamp()
    });
    await addDoc(collection(db, "grupos", grupo, "historial"), {
      accion: "Agregar producto",
      name: nombre.trim(),
      usuario: user.uid,
      timestamp: serverTimestamp()
    });
    setMsg("Producto agregado.");
  }

  // Consumir producto
  async function consumirProdGrupo(pid) {
    const prodRef = doc(db, "grupos", grupo, "productos", pid);
    const snap = await getDoc(prodRef);
    if (!snap.exists()) return;
    const q = snap.data().quantity || 0;
    await updateDoc(prodRef, { quantity: Math.max(0, q - 1) });
    await addDoc(collection(db, "grupos", grupo, "historial"), {
      accion: "Consumir producto",
      name: snap.data().name,
      usuario: user.uid,
      timestamp: serverTimestamp()
    });
    setMsg("Producto consumido.");
  }

  // Exportar lista fiesta a Excel
  function exportarListaFiesta(fiesta) {
    if (!fiesta.lista?.length) return;
    const datos = fiesta.lista.map(a => ({
      Producto: a.producto,
      Usuario: a.user
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ListaFiesta");
    XLSX.writeFile(wb, `lista_fiesta_${fiesta.nombre}.xlsx`);
  }

  // Copiar lista compras
  function copiarLista(fiesta) {
    const txt = fiesta.lista.map(a => `${a.producto} → ${a.user}`).join("\n");
    navigator.clipboard.writeText(txt);
    setMsg("Lista copiada!");
  }

  // Generar lista secreta
  function generarListaSecreta() {
    setSecretList("Lista secreta: " + Math.random().toString(36).substring(2, 12));
    setMsg("¡Lista secreta generada!");
  }

  // Revertir último cambio
  async function revertirUltimo() {
    if (!histGrupo.length) return;
    const ult = histGrupo[0];
    if (ult.accion === "Agregar producto") {
      const prod = prodGrupo.find(p => p.name === ult.name);
      if (prod) await updateDoc(doc(db, "grupos", grupo, "productos", prod.id), { quantity: 0 });
    } else if (ult.accion === "Consumir producto") {
      const prod = prodGrupo.find(p => p.name === ult.name);
      if (prod) await updateDoc(doc(db, "grupos", grupo, "productos", prod.id), { quantity: prod.quantity + 1 });
    }
    setMsg("Última acción revertida.");
  }

  // Mensaje de chat (anónimo/menciones)
  async function enviarMensaje() {
    if (!nuevoMensaje.trim()) return;
    await addDoc(collection(db, "grupos", grupo, "chat"), {
      texto: nuevoMensaje,
      usuario: anon ? "Anónimo" : user.uid,
      timestamp: serverTimestamp()
    });
    setNuevoMensaje("");
  }

  // Emoji/Color usuario
  function colorEmojiUser(uid) {
    const ix = Math.abs(uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % USER_COLORS.length;
    const ex = Math.abs(uid.split("").reduce((a, c) => a * c.charCodeAt(0), 7)) % USER_EMOJIS.length;
    return { color: USER_COLORS[ix], emoji: USER_EMOJIS[ex] };
  }

  // QR lista de fiesta
  function qrValue(fiesta) {
    return fiesta.lista.map(a => `${a.producto}|${a.user}`).join(";");
  }

  // Encuesta funciones
  function agregarOpcionEncuesta() {
    if (!opcionNueva.trim()) return;
    setEncuesta(e => ({
      ...e,
      opciones: [...(e.opciones || []), opcionNueva.trim()],
      votos: { ...(e.votos || {}) }
    }));
    setOpcionNueva("");
  }
  function votarEncuesta(idx) {
    setEncuesta(e => ({
      ...e,
      votos: { ...e.votos, [user.uid]: idx }
    }));
  }

  // Ranking
  function ranking() {
    if (!grupoActual?.miembros?.length) return [];
    return grupoActual.miembros
      .sort((a, b) =>
        (prodGrupo.filter(p => p.addedBy === b).length) - (prodGrupo.filter(p => p.addedBy === a).length)
      )
      .map((u, i) => ({
        user: u,
        count: prodGrupo.filter(p => p.addedBy === u).length
      }));
  }

  // --- Minijuegos (mismos que antes, igual que el archivo anterior) ---

  function iniciarAdivinanza() {
    if (!prodGrupo.length) return;
    const aleatorio = prodGrupo[Math.floor(Math.random() * prodGrupo.length)].name;
    setPalabra(aleatorio);
    setAdivinanza("");
    setIntentos(0);
    setJuegoActivo(true);
  }
  function comprobarAdivinanza() {
    if (adivinanza.trim().toLowerCase() === palabra.trim().toLowerCase()) {
      setMsg("¡Correcto! El producto era " + palabra);
      setJuegoActivo(false);
    } else {
      setIntentos(intentos + 1);
      setMsg("Incorrecto. ¡Sigue intentando!");
    }
  }
  function lanzarRuleta() {
    if (!fiesta.lista?.length || !grupoActual?.miembros?.length) return;
    const asig = fiesta.lista[Math.floor(Math.random() * fiesta.lista.length)];
    const userx = grupoActual.miembros[Math.floor(Math.random() * grupoActual.miembros.length)];
    setRuletaRes(`${userx} debe comprar ${asig.producto}`);
  }
  function iniciarReaccion() {
    if (!prodGrupo.length) return;
    setReaccionProducto(prodGrupo[Math.floor(Math.random() * prodGrupo.length)].name);
    setReaccionGanador("");
  }
  function reclamarProducto() {
    if (!reaccionGanador) setReaccionGanador(user.uid);
  }
  function sortearAlAzar() {
    if (!grupoActual?.miembros?.length) return;
    setSorteoRes(grupoActual.miembros[Math.floor(Math.random() * grupoActual.miembros.length)]);
  }
  function sortearPagoRonda() {
    if (!grupoActual?.miembros?.length) return;
    setPagoRonda(grupoActual.miembros[Math.floor(Math.random() * grupoActual.miembros.length)]);
  }
  function iniciarMemoria() {
    const prods = prodGrupo.length > 6 ? prodGrupo.slice(0, 6) : prodGrupo;
    let items = prods.concat(prods).map((p, i) => ({ ...p, key: i, open: false }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setMemoriaItems(items);
    setMemoriaShow([]);
    setMemoriaGanador("");
  }
  function clickMemoria(idx) {
    let show = memoriaShow.concat(idx);
    setMemoriaShow(show);
    if (show.length === 2) {
      if (memoriaItems[show[0]].name === memoriaItems[show[1]].name && show[0] !== show[1]) {
        setMemoriaGanador(user.uid);
      } else {
        setTimeout(() => setMemoriaShow([]), 700);
      }
    }
  }
  function sortearAmigoSecreto() {
    if (amigosActivos.length < 2) return setMsg("¡Selecciona al menos 2 participantes!");
    let shuffled = amigosActivos.slice();
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (shuffled.some((v, i) => v === amigosActivos[i]));
    setAsignaciones(amigosActivos.map((a, i) => ({ quien: a, recibe: shuffled[i] })));
    setMsg("¡Asignación realizada!");
  }

  // Easter Egg: Konami Code
  useEffect(() => {
    let code = [];
    function handler(e) {
      code.push(e.key);
      if (code.join("-").includes("ArrowUp-ArrowUp-ArrowDown-ArrowDown-ArrowLeft-ArrowRight-ArrowLeft-ArrowRight-b-a")) {
        setFiestaSorpresa(true);
        setMsg("¡Modo fiesta sorpresa activado! 🎉🎆");
        code = [];
      }
      if (code.length > 10) code = [];
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Recordatorio auto
  useEffect(() => {
    const id = setInterval(() => {
      if (fiestas.length) setMsg("Recordatorio: ¡Revisa tu lista de compras para la fiesta!");
    }, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [fiestas.length]);

  // --- UI ---
  return (
    <div>
      {fiestaSorpresa && (
        <div className="fixed inset-0 bg-gradient-to-br from-fuchsia-400 via-yellow-200 to-pink-500 z-50 flex flex-col items-center justify-center animate-pulse text-3xl font-bold text-white">
          <div>🎆 ¡FIESTA SORPRESA! 🎉</div>
          <audio autoPlay src="https://assets.mixkit.co/active_storage/sfx/2052/205277-18a5de53ef8d7da527d1647c29a6c717.mp3" />
        </div>
      )}
      <div className="mb-3 flex gap-2 flex-wrap">
        <button className={`px-3 py-1 rounded font-bold text-xs ${modo === "personal" ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-700"}`} onClick={() => setModo("personal")}>Personal</button>
        <button className={`px-3 py-1 rounded font-bold text-xs ${modo === "grupo" ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-700"}`} onClick={() => setModo("grupo")}>Grupo</button>
        <button className={`px-3 py-1 rounded font-bold text-xs ${modo === "fiesta" ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-700"}`} onClick={() => setModo("fiesta")}>Fiesta</button>
      </div>

      {/* Amigo Secreto */}
      <div className="mb-3">
        <button className="bg-fuchsia-600 text-white px-3 py-1 rounded text-xs" onClick={() => setAmigoSecretShow(!amigoSecretShow)}>
          {amigoSecretShow ? "Cerrar Amigo Secreto" : "Modo Amigo Secreto"}
        </button>
        {amigoSecretShow && (
          <div className="bg-gray-50 p-3 mt-2 rounded-xl">
            <div className="font-bold text-gray-700 mb-2">🎁 Amigo Secreto</div>
            <div className="mb-1">Agrega participantes:</div>
            <div className="flex gap-2 mb-2 flex-wrap">
              {grupoActual && grupoActual.miembros && grupoActual.miembros.map((m, i) =>
                <button key={i}
                  className={`rounded px-2 py-0.5 text-xs border ${amigosActivos.includes(m) ? "bg-green-400" : "bg-gray-200"}`}
                  onClick={() => setAmigosActivos(a => a.includes(m) ? a.filter(x => x !== m) : [...a, m])}
                >{m}</button>
              )}
            </div>
            <div className="mb-2">
              <input className="border px-2 py-1 rounded text-xs mr-2"
                placeholder="Sugerencia regalo"
                value={regalo}
                onChange={e => setRegalo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setRegalos(r => regalo.trim() ? [...r, regalo] : r) && setRegalo("")}
              />
              <button className="bg-gray-700 text-white px-2 py-1 rounded text-xs" onClick={() => { if (regalo.trim()) { setRegalos(r => [...r, regalo]); setRegalo(""); } }}>
                Agregar regalo
              </button>
            </div>
            {regalos.length > 0 && (
              <div className="mb-2 text-xs text-gray-700">
                <b>Regalos sugeridos:</b>
                <ul className="list-disc ml-5">
                  {regalos.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
            <button className="bg-green-700 text-white px-3 py-1 rounded text-xs mb-2" onClick={sortearAmigoSecreto}>Sortear Amigo Secreto</button>
            {asignaciones.length > 0 && (
              <div className="text-xs mt-2">
                <b>Asignaciones (sólo para admin):</b>
                <ul className="list-disc ml-5">
                  {asignaciones.map((a, i) =>
                    <li key={i}><b>{a.quien}</b> regala a <b>{a.recibe}</b></li>
                  )}
                </ul>
                <div className="mt-2">
                  <b>Regalos sugeridos:</b>
                  <ul className="list-disc ml-5">
                    {regalos.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ...resto igual que el anterior... */}
      {/* (puedes copiar el resto del cuerpo de la función del mensaje anterior) */}
      {/* Incluye los modos, minijuegos, tablas, ranking, chat, logs, fiesta, QR, etc. */}

      {/* Donde veas: <QRCode value={qrValue(fiesta)} size={164} /> */}
      {/* Ahora se usa react-qr-code, todo igual. */}
    </div>
  );
}
