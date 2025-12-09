"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/config";
import { onValue, ref, update } from "firebase/database";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

function EstadoBadge({ estado }) {
  const base = "px-2 py-1 rounded text-xs font-medium";
  switch (estado) {
    case "pendiente": return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pendiente</span>;
    case "en_progreso": return <span className={`${base} bg-blue-100 text-blue-800`}>En progreso</span>;
    case "completada": return <span className={`${base} bg-green-100 text-green-800`}>Completada</span>;
    case "rechazada": return <span className={`${base} bg-red-100 text-red-800`}>Rechazada</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{estado}</span>;
  }
}

function AsignarControl({ id, onAsignar }) {
  const [email, setEmail] = useState("");
  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@tecnico.com"
        className="w-full border p-2 rounded text-sm mb-1"
        type="email"
      />
      <button
        onClick={() => { onAsignar(id, email); setEmail(""); }}
        className="w-full bg-indigo-600 text-white py-2 rounded text-sm"
      >
        Asignar técnico
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser || null);
  const [solicitudes, setSolicitudes] = useState([]);

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
      arr.sort((a,b) => (b.fechaCreacion || "").localeCompare(a.fechaCreacion || ""));
      setSolicitudes(arr);
    });

    return () => unsub();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try { await update(ref(db, `solicitudes/${id}`), { estado }); }
    catch (e) { console.error(e); alert("Error actualizando estado"); }
  };

  const asignar = async (id, correo) => {
    if (!correo) return alert("Ingresa un correo válido");
    try { await update(ref(db, `solicitudes/${id}`), { asignado: correo }); }
    catch (e) { console.error(e); alert("Error al asignar"); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Agrupar por cliente
  const agrupadasPorCliente = solicitudes.reduce((acc, s) => {
    const cliente = s.solicitante || "Sin nombre";
    if (!acc[cliente]) acc[cliente] = [];
    acc[cliente].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <p className="text-sm text-gray-600">Gestiona solicitudes, asigna técnicos y revisa estados.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-700">{user?.email}</div>
            <div className="text-xs text-gray-500">Administrador</div>
          </div>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Cerrar sesión</button>
        </div>
      </header>

      <section className="grid gap-6">
        {Object.entries(agrupadasPorCliente).map(([cliente, registros]) => (
          <div key={cliente} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Cliente: {cliente} <span className="text-sm text-gray-500">({registros.length})</span></h2>

            {registros.map((s) => (
              <article key={s.id} className="bg-gray-50 p-3 rounded mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{s.maquina || "-"}</h3>
                    <p className="text-sm text-gray-500">Sucursal: {s.sucursal || "-"}</p>
                    <p className="text-sm text-gray-500">Teléfono: {s.telefono || "-"}</p>
                    <p className="text-sm text-gray-500">Tipo: {s.tipoSolicitud || "-"}</p>
                    <p className="text-sm text-gray-500">Prioridad: {s.prioridad || "-"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{s.fechaCreacion ? new Date(Number(s.fechaCreacion)).toLocaleString() : "-"}</div>
                    <EstadoBadge estado={s.estado || "pendiente"} />
                  </div>
                </div>

                <p className="mt-2 text-gray-700"><strong>Comentarios:</strong> {s.comentarios || "-"}</p>

                {s.observacionTecnico && (
                  <p className="mt-2 text-sm text-blue-700 border-l-4 border-blue-500 pl-2 italic">
                    🛠 Observación técnico: {s.observacionTecnico}
                  </p>
                )}

                {/* Mostrar historial (si existe) */}
                {s.historial && (
                  <div className="mt-3 bg-white border rounded p-2">
                    <h4 className="text-sm font-medium mb-2">Historial</h4>
                    {Object.entries(s.historial).sort((a,b)=> b[0]-a[0]).map(([ts, entry]) => (
                      <div key={ts} className="text-sm text-gray-700 mb-1">
                        <div className="text-xs text-gray-500">{entry.fecha}</div>
                        <div>{entry.tecnico}: {entry.observacion || "(sin comentario)"} <span className="text-xs text-gray-400">— {entry.estado}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <AsignarControl id={s.id} onAsignar={asignar} />
                  <button onClick={() => cambiarEstado(s.id, "en_progreso")} className="bg-yellow-500 text-white py-2 px-3 rounded">En progreso</button>
                  <button onClick={() => cambiarEstado(s.id, "completada")} className="bg-green-600 text-white py-2 px-3 rounded">Completar</button>
                  <button onClick={() => cambiarEstado(s.id, "rechazada")} className="bg-red-600 text-white py-2 px-3 rounded">Rechazar</button>
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}

















