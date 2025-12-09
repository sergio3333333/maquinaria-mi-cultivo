import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  const url = req.nextUrl.pathname;

  // ----------------------------
  // 1️⃣ Usuario SIN sesión → Sólo puede ir a /login
  // ----------------------------
  if (!token && url !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ----------------------------
  // 2️⃣ Usuario CON sesión → NO permitir ir al login otra vez
  // ----------------------------
  if (token && url === "/login") {
    if (role === "admin")
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));

    if (role === "cliente")
      return NextResponse.redirect(new URL("/dashboard/cliente", req.url));

    if (role === "tecnico")
      return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
  }

  // ----------------------------
  // 3️⃣ Si intenta entrar a /dashboard directo → redirigir según rol
  // ----------------------------
  if (url === "/dashboard") {
    if (role === "admin")
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));

    if (role === "cliente")
      return NextResponse.redirect(new URL("/dashboard/cliente", req.url));

    if (role === "tecnico")
      return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
  }

  // ----------------------------
  // 4️⃣ Reglas de seguridad por rol
  // ----------------------------

  // Cliente NO puede entrar a vistas de Admin o Técnico
  if (role === "cliente") {
    if (
      url.startsWith("/dashboard/admin") ||
      url.startsWith("/dashboard/tecnico")
    ) {
      return NextResponse.redirect(new URL("/dashboard/cliente", req.url));
    }
  }

  // Técnico NO puede entrar a vistas de Admin
  if (role === "tecnico") {
    if (url.startsWith("/dashboard/admin")) {
      return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
    }
  }

  return NextResponse.next();
}

// ----------------------------
// 🔧 IMPORTANTE: matcher sin "/"
// ----------------------------
export const config = {
  matcher: ["/dashboard/:path*", "/solicitud/:path*", "/login"],
};







