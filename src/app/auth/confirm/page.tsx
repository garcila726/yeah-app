'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/dashboard"); // destino final
    }, 3500); // espera visible antes de redirigir
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0e5d6d] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo-yeah.png" alt="Yeah" width={84} height={84} />
        </div>

        <h1 className="text-2xl font-bold text-[#0e5d6d]">
          ✅ ¡Cuenta confirmada!
        </h1>
        <p className="mt-2 text-[#0e5d6d]">
          Tu sesión se inició correctamente. Te llevaremos al dashboard…
        </p>

        <div className="mt-6 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c83b94] border-t-transparent" />
        </div>

        <p className="mt-6 text-sm text-[#0e5d6d]">
          ¿No pasa nada?
          {" "}
          <Link href="/dashboard" className="underline text-[#c83b94]">
            Ir ahora
          </Link>
        </p>
      </div>
    </main>
  );
}
