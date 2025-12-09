"use client";
import { auth } from "../../firebase/config";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) return <p className="text-center p-10">Cargando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Perfil del usuario</h1>
      <p className="mt-4"><strong>Email:</strong> {user.email}</p>
      <p className="mt-2"><strong>ID:</strong> {user.uid}</p>

      <button
        onClick={() => auth.signOut() && router.push("/login")}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
