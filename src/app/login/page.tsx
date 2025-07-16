"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Usuario o contraseña inválida.");
    } else {
      setError("");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4 text-[#0e5d6d]">
      <Image
        src="/logo-yeah.png"
        alt="Yeah Logo"
        width={300}
        height={180}
        className="mb-8"
      />
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>

        <div>
          <label className="block mb-1 text-sm font-semibold">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a96af]"
            placeholder="tucorreo@email.com"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a96af]"
            placeholder="********"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-[#c83b94] text-white p-2 rounded hover:bg-[#a72d7a]"
        >
          Entrar
        </button>
      </div>

      <footer className="mt-6 text-sm text-[#c83b94]">
        © 2025 Yeah Global Education
      </footer>
    </div>
  );
}
