"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/config";
import { ref, onValue, update } from "firebase/database";
import { useRouter, useParams } from "next/navigation";

export default function SolicitudDetalle() {
  const { id } = useParams();
  const router = useRouter();

  const [sol, setSol] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("cliente");
  const [asignado, setAsignado] = useState("");

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);

    // leer rol
    const roleRef = ref(db, `users/${u.uid}/role`);
    onValue(roleRef, (s) => {
      const r = s.val();
      if (r) setRole(r);
    });

    // leer solicitud por id
    const solRef = ref(db, `solicitudes/${id}`);
    onValue(solRef, (snap) => {
      const data = snap.val();
      setSol(data);
      if (data && data.asignado) setAsignado(data.asignado);
    });
  }, [id]);

  if (!sol) return <div className="p-10">Cargando solicitud...</div>;

  const actualizarEstado = async (nuevoEstado) => {
    // Solo admin o tecnico puede cambiar a ciertos estados
    if (!["admin", "tecnico"].includes(role)) {
      alert("No tienes permisos para cambiar el estado.");
      return;
    }
    try {
      await update(ref(db, `solicitudes/${id}`), { estado: nuevoEstado });
      alert("Estado actualizado");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar estado");
    }
  };

  const asignarTecnico = async () => {
    if (role !== "admin") {
      alert("Solo admin puede asignar técnicos.");
      return;
    }
    try {
      await update(ref(db, `solicitudes/${id}`), { asignado: asignado || null });
      alert("Técnico asignado");
    } catch (err) {
      console.error(err);
      alert("Error al asignar técnico");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{sol.solicitante || "Solicitud"}</h1>
            <p className="text-sm text-gray-500">{sol.maquina}</p>
          </div>

          <div className="text-right">
            <p className="font-medium">{sol.estado}</p>
            <p className="text-sm text-gray-500">{sol.usuario}</p>
          </div>
        </div>

        <hr className="my-4" />

        <div>
          <p><strong>Fecha solicitada:</strong> {sol.fecha || "-"}</p>
          <p><strong>Sucursal:</strong> {sol.sucursal || "-"}</p>
          <p className="mt-2"><strong>Motivo:</strong><br />{sol.motivo}</p>
          <p className="mt-2"><strong>Observaciones:</strong><br />{sol.observaciones || "-"}</p>
        </div>

        <div className="mt-6 flex gap-2">
          {/* Acciones según rol */}
          {["admin", "tecnico"].includes(role) && (
            <>
              <button onClick={() => actualizarEstado("en_progreso")} className="bg-yellow-500 px-3 py-1 rounded">En progreso</button>
              <button onClick={() => actualizarEstado("completada")} className="bg-green-600 text-white px-3 py-1 rounded">Completar</button>
              <button onClick={() => actualizarEstado("rechazada")} className="bg-red-600 text-white px-3 py-1 rounded">Rechazar</button>
            </>
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">Asignar técnico (solo admin)</h3>
          <div className="flex gap-2 mt-2">
            <input value={asignado} onChange={(e) => setAsignado(e.target.value)} className="border p-2 rounded flex-1" placeholder="email o nombre del técnico" />
            <button onClick={asignarTecnico} className="bg-indigo-600 text-white px-4 py-2 rounded">Asignar</button>
          </div>
          {sol.asignado && <p className="mt-2 text-sm text-gray-600">Asignado a: {sol.asignado}</p>}
        </div>

        <div className="mt-6">
          <button onClick={() => router.push("/dashboard")} className="bg-gray-300 px-4 py-2 rounded">Volver</button>
        </div>
      </div>
    </div>
  );
}

