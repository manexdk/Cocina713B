export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-green-700 text-white p-3 mb-3 rounded-b-2xl shadow-lg flex items-center justify-between">
      <span className="text-2xl font-bold">Inventario</span>
      {user &&
        <button className="bg-white text-green-700 font-bold px-3 py-1 rounded-xl shadow" onClick={onLogout}>
          Salir
        </button>
      }
    </nav>
  );
}
