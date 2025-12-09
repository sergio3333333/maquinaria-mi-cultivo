import { NextResponse } from "next/server";

// Función común para manejar todas las solicitudes
function handleRequest(req) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  const url = new URL(req.url).pathname;

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
    if (role === "admin") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    if (role === "cliente") return NextResponse.redirect(new URL("/dashboard/cliente", req.url));
    if (role === "tecnico") return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
  }

  // ----------------------------
  // 3️⃣ Si intenta entrar a /dashboard directo → redirigir según rol
  // ----------------------------
  if (url === "/dashboard") {
    if (role === "admin") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    if (role === "cliente") return NextResponse.redirect(new URL("/dashboard/cliente", req.url));
    if (role === "tecnico") return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
  }

  // ----------------------------
  // 4️⃣ Reglas de seguridad por rol
  // ----------------------------

  // Cliente NO puede entrar a vistas de Admin o Técnico
  if (role === "cliente" && (url.startsWith("/dashboard/admin") || url.startsWith("/dashboard/tecnico"))) {
    return NextResponse.redirect(new URL("/dashboard/cliente", req.url));
  }

  // Técnico NO puede entrar a vistas de Admin
  if (role === "tecnico" && url.startsWith("/dashboard/admin")) {
    return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
  }

  // Si no aplica ninguna regla → dejar pasar
  return NextResponse.next();
}

// ----------------------------
// 5️⃣ Exportar handlers para cada método HTTP que necesites
// ----------------------------
export function GET(req) {
  return handleRequest(req);
}

export function POST(req) {
  return handleRequest(req);
}

// Opcional: agregar PUT, DELETE si más adelante lo necesitas
// export function PUT(req) { return handleRequest(req); }
// export function DELETE(req) { return handleRequest(req); }

// ----------------------------
// 6️⃣ Configuración de las rutas a las que se aplica el proxy
// ----------------------------
export const config = {
  matcher: ["/dashboard/:path*", "/solicitud/:path*", "/login"],
};

