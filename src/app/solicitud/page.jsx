"use client";

import { useState } from "react";
import { db, auth } from "../../firebase/config";
import { ref, set } from "firebase/database";
import { useRouter } from "next/navigation";

export default function Solicitud() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    sucursal: "",
    maquina: "",
    telefono: "",
    tipoSolicitud: "mantenimiento",
    prioridad: "media",
    comentarios: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const enviar = async () => {
    setError("");
    setSuccess("");

    const { sucursal, maquina, telefono } = formData;

    if (!sucursal || !maquina || !telefono) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const id = Date.now().toString();

    try {
      await set(ref(db, `solicitudes/${id}`), {
        id,
        fechaCreacion: id,
        solicitante: auth.currentUser.email,
        ...formData,
        estado: "pendiente",
        asignado: ""
      });

      setSuccess("Solicitud enviada correctamente!");
      setFormData({
        sucursal: "",
        maquina: "",
        telefono: "",
        tipoSolicitud: "mantenimiento",
        prioridad: "media",
        comentarios: "",
      });

      // Redirigir automáticamente después de 1.5 segundos
      setTimeout(() => router.push("/dashboard/cliente"), 1500);
    } catch (err) {
      setError("Ocurrió un error al enviar la solicitud.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-10 flex justify-center items-start bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Nueva Solicitud</h1>

        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Sucursal"
          name="sucursal"
          value={formData.sucursal}
          onChange={handleChange}
        />

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Máquina"
          name="maquina"
          value={formData.maquina}
          onChange={handleChange}
        />

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Teléfono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
        />

        <select
          className="border p-2 w-full mb-3 rounded"
          name="tipoSolicitud"
          value={formData.tipoSolicitud}
          onChange={handleChange}
        >
          <option value="mantenimiento">Mantenimiento</option>
          <option value="reparacion">Reparación</option>
          <option value="instalacion">Instalación</option>
          <option value="otro">Otro</option>
        </select>

        <select
          className="border p-2 w-full mb-3 rounded"
          name="prioridad"
          value={formData.prioridad}
          onChange={handleChange}
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <textarea
          className="border p-2 w-full mb-3 rounded"
          placeholder="Comentarios adicionales"
          name="comentarios"
          value={formData.comentarios}
          onChange={handleChange}
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={enviar}
            className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Enviar Solicitud
          </button>
          <button
            onClick={() => router.push("/dashboard/cliente")}
            className="flex-1 bg-gray-400 text-white p-2 rounded hover:bg-gray-500"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

