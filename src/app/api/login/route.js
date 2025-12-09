import { NextResponse } from "next/server";
import { auth, db } from "../../../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Login Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Obtener rol desde Realtime Database
    const roleRef = ref(db, `roles/${uid}`);
    const snapshot = await get(roleRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Usuario sin rol asignado" }, { status: 403 });
    }

    const role = snapshot.val();

    // Crear respuesta
    const response = NextResponse.json({ ok: true, role });

    // Guardar cookies por 7 días
    response.cookies.set("token", uid, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "strict",
      path: "/"
    });

    response.cookies.set("role", role, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "strict",
      path: "/"
    });

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }
}
