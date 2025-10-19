'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Origen actual (local o prod) — asegura que el email redirija a tu callback
    const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://app.yeahservices.au";

const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    // ⬇️ IMPORTANTE: enviamos "next=/auth/confirm"
    emailRedirectTo: `${origin}/auth/callback?next=/auth/confirm`,
    data: { full_name: fullName || "" },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Registro exitoso. Revisa tu correo para confirmar.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <main className="flex items-center justify-center h-screen bg-[#0e5d6d] text-white">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-[#0e5d6d]">
        <div className="flex justify-center mb-4">
          <Image src="/logo-yeah.png" alt="Logo" width={80} height={80} />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Registro</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre completo (opcional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#c83b94] text-white p-2 rounded hover:bg-pink-600"
          >
            Crear cuenta
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm font-medium">{message}</p>
        )}
      </div>
    </main>
  );
}
