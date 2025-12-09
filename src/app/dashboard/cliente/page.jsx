"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/config";
import { onValue, ref } from "firebase/database";
import { useRouter } from "next/navigation";

export default function ClienteDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser || null);
  const [solicitudes, setSolicitudes] = useState([]);

  const [filtro, setFiltro] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const estadosColores = {
    pendiente: "bg-yellow-100 text-yellow-700 border-yellow-300",
    "en progreso": "bg-blue-100 text-blue-700 border-blue-300",
    completada: "bg-green-100 text-green-700 border-green-300",
    rechazada: "bg-red-100 text-red-700 border-red-300",
  };

  /* Cargar solicitudes */
  useEffect(() => {
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }
    setUser(auth.currentUser);

    const r = ref(db, "solicitudes/");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));

      const filtered = arr.filter(
        (s) =>
          s.usuario === auth.currentUser.email ||
          s.solicitante === auth.currentUser.email
      );

      filtered.sort(
        (a, b) =>
          (b.fechaCreacion || "").localeCompare(a.fechaCreacion || "")
      );

      setSolicitudes(filtered);
    });

    return () => unsub();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    document.cookie =
      "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const solicitudesFiltradas =
    filtro === "todas"
      ? solicitudes
      : solicitudes.filter((s) => (s.estado || "").toLowerCase() === filtro);

  const solicitudesFiltradas2 = solicitudesFiltradas.filter(s => {
    if (filtroTipo === "todos") return true;
    return (s.tipo || "").toLowerCase() === filtroTipo;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          👋 Bienvenido, {user?.email}
        </h1>

        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => router.push("/solicitud")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear solicitud técnica
          </button>

          <button
            onClick={() => router.push("/prestamo")}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Solicitar préstamo de maquinaria
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["todas", "pendiente", "en progreso", "completada", "rechazada"].map(
          (tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltro(tipo)}
              className={`px-4 py-2 rounded capitalize ${
                filtro === tipo
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border"
              }`}
            >
              {tipo}
            </button>
          )
        )}

        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="border p-2 rounded ml-2">
          <option value="todos">Todos los tipos</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="prestamo">Préstamo</option>
          <option value="garantia">Garantía</option>
          <option value="ingreso">Ingreso máquina</option>
        </select>
      </div>

      {/* LISTA DE SOLICITUDES */}
      <h2 className="text-xl font-semibold mb-3">📄 Tus solicitudes</h2>

      {solicitudesFiltradas2.length === 0 ? (
        <p className="text-gray-500">No hay solicitudes registradas.</p>
      ) : (
        <div className="grid gap-4">
          {solicitudesFiltradas2.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{s.maquina}</h3>
                  <p className="text-sm text-gray-500">{s.sucursal}</p>
                  <p className="text-sm text-gray-500">Tipo: {s.tipo || "mantenimiento"}</p>
                </div>

                <span
                  className={`px-3 py-1 border rounded text-sm capitalize ${estadosColores[(s.estado || "").toLowerCase()] || "bg-gray-200"}`}
                >
                  {s.estado || "pendiente"}
                </span>
              </div>

              <p className="mt-2 text-gray-700">
                {s.motivo || s.observaciones || "Sin observaciones"}
              </p>

              <div className="mt-3 text-sm text-gray-600">
                Técnico asignado:{" "}
                <span className="font-semibold">
                  {s.asignado || "Sin asignar"}
                </span>
              </div>

              {/* Observación técnica (última) */}
              {s.observacionTecnico && (
                <p className="mt-3 text-blue-700 text-sm italic border-l-4 border-blue-500 pl-2">
                  🛠 Observación del técnico: {s.observacionTecnico}
                </p>
              )}

              {/* Mostrar historial completo si existe */}
              {s.historial && (
                <div className="mt-3 bg-gray-50 p-3 rounded border">
                  <h4 className="text-sm font-medium mb-2">Historial</h4>
                  {Object.entries(s.historial).sort((a,b)=> b[0]-a[0]).map(([ts, entry]) => (
                    <div key={ts} className="text-sm text-gray-700 mb-1">
                      <div className="text-xs text-gray-500">{entry.fecha}</div>
                      <div>{entry.tecnico}: {entry.observacion || "(sin comentario)"} <span className="text-xs text-gray-400">— {entry.estado}</span></div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}






