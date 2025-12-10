"use client";

import { useState } from "react";
import { auth, db } from "../../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  // LOGIN STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // REGISTER STATES
  const [showRegister, setShowRegister] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerError, setRegisterError] = useState("");

  const [newUser, setNewUser] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    correo: "",
    sucursal: "",
    direccion: "",
    externo: false,
    password: "",
  });

  const handleLogin = async () => {
    setError("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const roleSnap = await get(ref(db, `users/${cred.user.uid}/role`));

      if (!roleSnap.exists()) {
        setError("Tu usuario no tiene rol asignado");
        return;
      }

      const role = roleSnap.val();
      const token = await cred.user.getIdToken();

      document.cookie = `token=${token}; path=/;`;
      document.cookie = `role=${role}; path=/;`;

      if (role === "admin") router.push("/dashboard/admin");
      if (role === "tecnico") router.push("/dashboard/tecnico");
      if (role === "cliente") router.push("/dashboard/cliente");

    } catch (err) {
      setError("Credenciales incorrectas");
    }
  };

  const handleRegisterClient = async () => {
    setRegisterError("");
    setRegisterSuccess("");

    const { nombre, cedula, telefono, correo, sucursal, direccion, password } = newUser;

    if (!nombre || !cedula || !telefono || !correo || !direccion || (!sucursal && !newUser.externo) || !password) {
      setRegisterError("Todos los campos son obligatorios.");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, password);
      const uid = cred.user.uid;

      await set(ref(db, `users/${uid}`), {
        role: "cliente",
        nombre,
        cedula,
        telefono,
        correo,
        sucursal: newUser.externo ? "Externo" : sucursal,
        direccion,
        externo: newUser.externo,
      });

      setRegisterSuccess(`Cliente registrado con éxito: ${correo}`);

      setNewUser({
        nombre: "",
        cedula: "",
        telefono: "",
        correo: "",
        sucursal: "",
        direccion: "",
        externo: false,
        password: "",
      });

    } catch (err) {
      setRegisterError("Error al crear usuario (posiblemente ya existe).");
    }
  };

  return (
    <div className="min-h-screen p-6 flex justify-center items-center bg-gradient-to-br from-gray-200 to-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200">

        {!showRegister ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h1>

            <input className="border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-3 w-full mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <input type="password"
              className="border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-3 w-full mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Entrar
            </button>

            {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}

            <p className="mt-5 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <button onClick={() => setShowRegister(true)} className="text-blue-600 font-semibold hover:underline">
                Crear nuevo usuario
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-5 text-center">Registrar Cliente</h1>

            {[
              {name: "nombre", label: "Nombre completo"},
              {name: "cedula", label: "Cédula"},
              {name: "telefono", label: "Teléfono"},
              {name: "correo", label: "Correo"},
              {name: "direccion", label: "Dirección"},
            ].map(field => (
              <input key={field.name}
                className="border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-3 w-full mb-4 outline-none focus:ring-2 focus:ring-green-500 transition"
                placeholder={field.label}
                value={newUser[field.name]}
                onChange={e => setNewUser({...newUser, [field.name]: e.target.value})}
              />
            ))}

            <input className="border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-3 w-full mb-4 outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="Sucursal (si aplica)"
              value={newUser.sucursal}
              onChange={e => setNewUser({...newUser, sucursal: e.target.value})}
              disabled={newUser.externo}
            />

            <label className="flex gap-3 items-center text-sm text-gray-700">
              <input type="checkbox"
                checked={newUser.externo}
                onChange={() => setNewUser({...newUser, externo: !newUser.externo, sucursal: ""})}
              />
              Soy externo (sin sucursal)
            </label>

            <input type="password"
              className="border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-3 w-full my-4 outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="Contraseña"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />

            <button onClick={handleRegisterClient} className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Registrar
            </button>

            {registerError && <p className="text-red-600 text-sm mt-3 text-center">{registerError}</p>}
            {registerSuccess && <p className="text-green-600 text-sm mt-3 text-center">{registerSuccess}</p>}

            <p className="mt-5 text-center text-sm text-gray-600">
              <button onClick={() => setShowRegister(false)} className="text-gray-700 font-semibold hover:underline">
                Volver al login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}













