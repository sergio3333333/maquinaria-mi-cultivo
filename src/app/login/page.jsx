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

  // ------------------------ LOGIN ------------------------
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

  // ------------------------ REGISTER ------------------------
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
    <div className="min-h-screen flex justify-center items-center bg-gray-200 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">

        {/* Branding */}
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: "var(--primary)" }}>
          MI CULTIVO 
        </h1>

        {!showRegister ? (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center" style={{ color: "var(--text-dark)" }}>
              Iniciar Sesión
            </h2>

            <input
              className="border rounded-md w-full p-3 mb-3 text-black"
              style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--input-border)" }}
              placeholder="Correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="border rounded-md w-full p-3 mb-3 text-black"
              style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--input-border)" }}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              className="w-full text-white p-3 rounded-md font-semibold transition hover:scale-105"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Entrar
            </button>

            {error && <p className="text-red-600 mt-3 text-center">{error}</p>}

            <p className="mt-5 text-center text-sm">
              <button onClick={() => setShowRegister(true)} className="text-blue-600 underline">
                Crear cuenta de cliente
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center" style={{ color: "var(--text-dark)" }}>
              Registrar Cliente
            </h2>

            {[ "nombre", "cedula", "telefono", "correo", "direccion" ].map(field => (
              <input key={field}
                className="border rounded-md w-full p-3 mb-3 text-black"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--input-border)" }}
                placeholder={field.toUpperCase()}
                value={newUser[field]}
                onChange={e => setNewUser({...newUser, [field]: e.target.value})}
              />
            ))}

            <input
              className="border rounded-md w-full p-3 mb-3 text-black"
              style={{ backgroundColor: "var(--input-bg)" }}
              placeholder="Sucursal (opcional)"
              disabled={newUser.externo}
              value={newUser.sucursal}
              onChange={e => setNewUser({ ...newUser, sucursal: e.target.value})}
            />

            <button
              onClick={handleRegisterClient}
              className="w-full text-white p-3 rounded-md font-semibold mt-3 transition hover:scale-105"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Registrar
            </button>

            {registerError && <p className="text-red-600 mt-3 text-center">{registerError}</p>}
            {registerSuccess && <p className="text-green-600 mt-3 text-center">{registerSuccess}</p>}

            <p className="mt-5 text-center text-sm">
              <button onClick={() => setShowRegister(false)} className="text-gray-700 underline">
                Volver al login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}













