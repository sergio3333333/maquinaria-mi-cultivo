export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center">
      <h1 className="text-3xl font-bold text-gray-800">🚜 Bienvenido a Mi Cultivo</h1>
      <p className="mt-3 text-gray-600">
        Plataforma para gestión de maquinaria, solicitudes y soporte técnico.
      </p>

      <a
        href="/login"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Ir al Login
      </a>
    </div>
  );
}
