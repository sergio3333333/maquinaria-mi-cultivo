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

      // Redirect by role
      if (role === "admin") router.push("/dashboard/admin");
      if (role === "tecnico") router.push("/dashboard/tecnico");
      if (role === "cliente") router.push("/dashboard/cliente");

    } catch (err) {
      setError("Credenciales incorrectas");
    }
  };

  // ------------------------ REGISTER CLIENT ------------------------
  const handleRegisterClient = async () => {
    setRegisterError("");
    setRegisterSuccess("");

    // Validar campos obligatorios
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

      // Reset fields
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
    <div className="min-h-screen p-10 flex justify-center items-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-96">

        {!showRegister ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Iniciar Sesión</h1>

            <input className="border p-2 w-full mb-3" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />

            <input type="password" className="border p-2 w-full mb-3" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />

            <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-2 rounded">Entrar</button>

            {error && <p className="text-red-600 mt-3">{error}</p>}

            <p className="mt-4 text-center">
              <button onClick={() => setShowRegister(true)} className="text-blue-600 hover:underline">
                Crear nuevo usuario cliente
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-4">Registrar Cliente</h1>

            {[
              {name: "nombre", label: "Nombre completo"},
              {name: "cedula", label: "Cédula"},
              {name: "telefono", label: "Teléfono"},
              {name: "correo", label: "Correo"},
              {name: "direccion", label: "Dirección"},
            ].map((field) => (
              <input key={field.name} className="border p-2 w-full mb-3"
                placeholder={field.label}
                value={newUser[field.name]}
                onChange={e => setNewUser({...newUser, [field.name]: e.target.value})}
              />
            ))}

            <input className="border p-2 w-full mb-3"
              placeholder="Sucursal (si aplica)"
              value={newUser.sucursal}
              onChange={e => setNewUser({...newUser, sucursal: e.target.value})}
              disabled={newUser.externo}
            />

            <label className="flex gap-2 mb-3 text-sm">
              <input type="checkbox" checked={newUser.externo}
                onChange={() => setNewUser({...newUser, externo: !newUser.externo, sucursal: ""})}
              />
              Soy externo (sin sucursal)
            </label>

            <input type="password" className="border p-2 w-full mb-3"
              placeholder="Contraseña"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />

            <button onClick={handleRegisterClient} className="w-full bg-green-600 text-white p-2 rounded">Registrar</button>

            {registerError && <p className="text-red-600 mt-3">{registerError}</p>}
            {registerSuccess && <p className="text-green-600 mt-3">{registerSuccess}</p>}

            <p className="mt-4 text-center">
              <button onClick={() => setShowRegister(false)} className="text-gray-600 hover:underline">
                Volver al login
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
}












