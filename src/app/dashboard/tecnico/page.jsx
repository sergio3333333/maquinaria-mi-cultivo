"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/config";
import { onValue, ref, update, set } from "firebase/database";
import { useRouter } from "next/navigation";

/* Badge estado */
function EstadoBadge({ estado }) {
  const base = "px-2 py-1 rounded text-xs font-medium";
  const map = {
    pendiente: "bg-yellow-100 text-yellow-800",
    en_progreso: "bg-blue-100 text-blue-800",
    completada: "bg-green-100 text-green-800",
    rechazada: "bg-red-100 text-red-800",
  };
  return <span className={`${base} ${map[estado] || "bg-gray-100 text-gray-800"}`}>{estado}</span>;
}

export default function TecnicoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser || null);
  const [items, setItems] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return router.push("/login");

    setUser(auth.currentUser);

    const r = ref(db, "solicitudes/");
    return onValue(r, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      const mine = arr.filter(s => s.asignado === auth.currentUser.email);
      mine.sort((a,b) => (b.fechaCreacion || "").localeCompare(a.fechaCreacion || ""));
      setItems(mine);
    });
  }, []);

  const actualizarSolicitud = async () => {
    if (!modalData) return;
    try {
      setLoadingSave(true);
      const id = modalData.id;
      const timestamp = Date.now().toString();

      // 1) Actualizar campos principales (estado + última observación)
      await update(ref(db, `solicitudes/${id}`), {
        estado: modalData.estado,
        observacionTecnico: modalData.observacion || "",
        ultimaActualizacion: new Date().toISOString(),
      });

      // 2) Añadir entrada al historial (key = timestamp)
      const entry = {
        fecha: new Date().toLocaleString(),
        tecnico: auth.currentUser.email,
        estado: modalData.estado,
        observacion: modalData.observacion || "",
      };
      await set(ref(db, `solicitudes/${id}/historial/${timestamp}`), entry);

      // 3) (Opcional) Notificar al cliente/administrador via endpoint interno
      // Si modalData.notificar === true o por defecto siempre notificar, se hace el POST.
      try {
        // Preparamos destinatario: preferiblemente s.usuario o s.solicitante
        const solicitudSnap = (await import("firebase/database")).get(ref(db, `solicitudes/${id}`));
        // No hacemos await de esa promesa aquí para no bloquear (opcional)
      } catch (e) {
        // ignore
      }

      // Llamada al endpoint /api/notify (no bloqueante)
      try {
        const payload = {
          to: modalData.usuarioEmail || modalData.solicitante || "",
          channel: "email", // o 'whatsapp' según prefieras
          subject: `Actualización solicitud ${id}`,
          message: `El técnico ${auth.currentUser.email} actualizó la solicitud: ${modalData.observacion || "Sin comentario"}`,
          meta: { solicitudId: id }
        };
        // Llamada no bloqueante
        fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          .catch(err => console.warn("Notify failed (client stub):", err));
      } catch (err) {
        console.warn("notify error", err);
      }

      setModalData(null);
    } catch (e) {
      console.error("Error guardando actualización:", e);
      alert("Error guardando la solicitud");
    } finally {
      setLoadingSave(false);
    }
  };

  const tipos = ["mantenimiento", "prestamo", "garantia"];
  const estados = ["pendiente", "en_progreso", "completada", "rechazada"];

  const grouped = {};
  tipos.forEach(tipo => {
    grouped[tipo] = estados.map(estado => ({
      estado,
      data: items.filter(s => (s.tipo || "mantenimiento") === tipo && s.estado === estado)
    }));
  });

  const logout = async () => {
    await auth.signOut();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      
      <header className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Panel técnico</h1>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Cerrar sesión
        </button>
      </header>

      {tipos.map(tipo => (
        <div key={tipo} className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">
            {tipo === "mantenimiento" && "🛠 Mantenimiento"}
            {tipo === "prestamo" && "📦 Solicitudes de préstamo"}
            {tipo === "garantia" && "📝 Garantías"}
          </h2>

          {grouped[tipo].map(section => (
            <section key={section.estado} className="mb-6">
              <h3 className="text-lg font-semibold flex gap-2">
                {section.estado === "pendiente" && "🟡 Pendientes"}
                {section.estado === "en_progreso" && "🔵 En progreso"}
                {section.estado === "completada" && "🟢 Completadas"}
                {section.estado === "rechazada" && "🔴 Rechazadas"}
                <span className="text-sm text-gray-500">({section.data.length})</span>
              </h3>

              {section.data.length === 0 ? (
                <p className="text-gray-600">No hay solicitudes.</p>
              ) : (
                <div className="grid gap-4">
                  {section.data.map(s => (
                    <article key={s.id} className="bg-white p-4 rounded shadow">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold">{s.solicitante}</h4>
                          <p className="text-sm text-gray-600">{s.maquina} • {s.sucursal}</p>
                        </div>
                        <EstadoBadge estado={s.estado} />
                      </div>

                      <p className="mt-2 text-gray-700">{s.motivo || s.observaciones || "-"}</p>

                      {s.observacionTecnico && (
                        <p className="mt-2 text-sm text-blue-700 border-l-4 border-blue-500 pl-2 italic">
                          📝 {s.observacionTecnico}
                        </p>
                      )}

                      <button
                        onClick={() => setModalData({ ...s })}
                        className="mt-4 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                      >
                        Actualizar estado
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ))}

      {/* MODAL */}
      {modalData && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-lg font-semibold mb-3">Actualizar solicitud</h2>

            <label className="block text-sm mb-1">Nuevo estado</label>
            <select
              value={modalData.estado}
              onChange={(e) => setModalData({ ...modalData, estado: e.target.value })}
              className="border p-2 w-full rounded mb-3"
            >
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <label className="block text-sm mb-1">Observación (técnico)</label>
            <textarea
              placeholder="Observación"
              value={modalData.observacion || ""}
              onChange={(e) => setModalData({ ...modalData, observacion: e.target.value })}
              className="border p-2 w-full rounded mb-3"
              rows={3}
            />

            <label className="flex items-center gap-2 mb-3 text-sm">
              <input
                type="checkbox"
                checked={modalData.notificar || false}
                onChange={(e) => setModalData({ ...modalData, notificar: e.target.checked })}
              />
              Notificar al cliente por email/WhatsApp
            </label>

            <div className="flex gap-2">
              <button onClick={actualizarSolicitud} className="bg-green-600 text-white px-4 py-2 rounded">
                {loadingSave ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setModalData(null)} className="bg-gray-300 px-4 py-2 rounded">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}





