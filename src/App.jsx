import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import DashboardTabs from "./components/DashboardTabs";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const auth = getAuth();

  useEffect(() => {
    // Observador de login
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, [auth]);

  function handleLogin(e) {
    e.preventDefault();
    setError("");
    signInWithEmailAndPassword(auth, email, pass)
      .catch(err => setError("Login incorrecto: " + err.message));
  }

  function handleLogout() {
    signOut(auth);
  }

  if (!user) {
    // Login simple
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <form onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-lg border border-gray-300 flex flex-col gap-3 w-[90vw] max-w-xs">
          <h2 className="text-2xl font-bold text-gray-700 mb-3 text-center">Inventario 713</h2>
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            className="border px-3 py-2 rounded-md"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            className="border px-3 py-2 rounded-md"
            value={pass}
            onChange={e => setPass(e.target.value)}
          />
          <button className="bg-gray-700 hover:bg-gray-900 text-white rounded px-4 py-2 font-bold" type="submit">
            Ingresar
          </button>
          {error && <div className="text-red-600 text-xs">{error}</div>}
        </form>
        <div className="mt-4 text-xs text-gray-400 text-center">
          Si no tienes cuenta, pídele al administrador que te registre en Firebase.
        </div>
      </div>
    );
  }

  // Usuario logueado: muestra dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-gray-100 px-4 py-3 flex items-center justify-between shadow">
        <span className="font-extrabold text-xl tracking-tight">Inventario 713</span>
        <button
          className="bg-gray-600 hover:bg-gray-800 text-white rounded px-3 py-1 text-xs"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>
      <main>
        <DashboardTabs user={user} />
      </main>
      <footer className="mt-10 text-xs text-gray-500 text-center">
        Inventario 713 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
