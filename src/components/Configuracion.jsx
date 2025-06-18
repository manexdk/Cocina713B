import { useState } from "react";

export default function Configuracion() {
  const [idioma, setIdioma] = useState("es");
  const [unidades, setUnidades] = useState("kg");
  const [tema, setTema] = useState("claro");

  return (
    <div>
      <h3 className="font-bold text-gray-700 mb-3">Configuración</h3>
      <div className="grid gap-4 max-w-xs">
        <div>
          <label className="block text-gray-700">Idioma</label>
          <select value={idioma} onChange={e => setIdioma(e.target.value)}
            className="w-full border px-2 py-1 rounded-md text-gray-700">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Unidades</label>
          <select value={unidades} onChange={e => setUnidades(e.target.value)}
            className="w-full border px-2 py-1 rounded-md text-gray-700">
            <option value="kg">Kilogramos</option>
            <option value="g">Gramos</option>
            <option value="l">Litros</option>
            <option value="ml">Mililitros</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Tema</label>
          <select value={tema} onChange={e => setTema(e.target.value)}
            className="w-full border px-2 py-1 rounded-md text-gray-700">
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>
        </div>
      </div>
      <div className="mt-6 text-xs text-gray-500">
        Esta configuración solo afecta tu experiencia en este dispositivo.
      </div>
    </div>
  );
}
