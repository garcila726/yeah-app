"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 4000); // Redirige a la página principal después de 4 segundos

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h1 className="text-3xl font-bold text-[#0e5d6d] mb-4">✅ ¡Cuenta confirmada con éxito!</h1>
      <p className="text-gray-700 mb-2">Gracias por verificar tu correo electrónico.</p>
      <p className="text-sm text-gray-500">Te estamos redirigiendo a la página principal...</p>
    </div>
  );
}
