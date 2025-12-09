// src/dashboard/admin/index.jsx
"use client";

import { useState, useEffect } from "react";
import { db } from "../../../firebase/config";
import { ref, onValue, update } from "firebase/database";

export default function AdminDashboard() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const solicitudesRef = ref(db, "solicitudes/");
    const unsubscribe = onValue(solicitudesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([id, solicitud]) => ({ id, ...solicitud }));
      setSolicitudes(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await update(ref(db, `solicitudes/${id}`), { estado: nuevoEstado });
      alert("Estado actualizado");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar estado");
    }
  };

  const asignarTecnico = async (id, tecnico) => {
    if (!tecnico) return alert("Ingrese un técnico válido");
    try {
      await update(ref(db, `solicitudes/${id}`), { asignado: tecnico });
      alert("Técnico asignado");
    } catch (err) {
      console.error(err);
      alert("Error al asignar técnico");
    }
  };

  const colorEstado = (estado) => {
    switch (estado) {
      case "pendiente": return "bg-yellow-200";
      case "en_progreso": return "bg-blue-200";
      case "completada": return "bg-green-200";
      case "rechazada": return "bg-red-200";
      default: return "";
    }
  };

  if (loading) return <div className="p-10">Cargando solicitudes...</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Solicitudes de Mantenimiento</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Solicitante</th>
            <th className="border p-2">Máquina</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Asignado</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((sol) => (
            <tr key={sol.id} className={colorEstado(sol.estado)}>
              <td className="border p-2">{sol.solicitante}</td>
              <td className="border p-2">{sol.maquina}</td>
              <td className="border p-2">{sol.estado}</td>
              <td className="border p-2">
                <input
                  type="text"
                  value={sol.asignado || ""}
                  placeholder="Técnico"
                  onChange={(e) => (sol.asignado = e.target.value)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="border p-2 flex gap-2">
                <button
                  className="bg-blue-600 text-white px-2 py-1 rounded"
                  onClick={() => cambiarEstado(sol.id, "en_progreso")}
                >
                  En progreso
                </button>
                <button
                  className="bg-green-600 text-white px-2 py-1 rounded"
                  onClick={() => cambiarEstado(sol.id, "completada")}
                >
                  Completar
                </button>
                <button
                  className="bg-red-600 text-white px-2 py-1 rounded"
                  onClick={() => cambiarEstado(sol.id, "rechazada")}
                >
                  Rechazar
                </button>
                <button
                  className="bg-indigo-600 text-white px-2 py-1 rounded"
                  onClick={() => asignarTecnico(sol.id, sol.asignado)}
                >
                  Asignar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
