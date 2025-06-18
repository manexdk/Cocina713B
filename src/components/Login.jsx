import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState("login");
  const [err, setErr] = useState("");

  const handleAuth = async e => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
        setUser(auth.currentUser);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
        setUser(auth.currentUser);
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-12 bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-black mb-2 text-center text-green-700 drop-shadow">Inventario 713</h2>
      <div className="text-center text-sm mb-4 text-gray-500">{mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</div>
      <form onSubmit={handleAuth} className="space-y-3">
        <input
          className="input w-full p-3 rounded-lg border-2 border-gray-200 focus:border-green-400 outline-none transition"
          placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        <input
          className="input w-full p-3 rounded-lg border-2 border-gray-200 focus:border-green-400 outline-none transition"
          placeholder="Contraseña"
          value={pass} onChange={e=>setPass(e.target.value)} type="password" required />
        {err && <div className="text-red-500 text-sm text-center">{err}</div>}
        <button className="btn w-full py-3 rounded-xl bg-green-600 font-bold text-white shadow hover:bg-green-700 transition" type="submit">
          {mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        <button
          type="button"
          className="w-full text-green-700 underline text-sm hover:text-green-900 transition"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "¿No tienes cuenta? Crear una"
            : "¿Ya tienes cuenta? Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
