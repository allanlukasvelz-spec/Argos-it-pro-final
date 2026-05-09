"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useAuthStore } from "@/lib/auth";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/api/auth/login", { email, password });

      login(res.data.token, res.data.user);
      toast.success("Sesion iniciada");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error en login");
    }

    setLoading(false);
  };

  return (
    <ArgosPageShell variant="portal">
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-xl shadow-[#0B1E33]/10">
        <h1 className="mb-2 text-center text-3xl font-black text-[#0B1E33]">Iniciar sesión</h1>
        <p className="mb-6 text-center text-[#4B5563]">Accede al portal de cliente ARGOS-IT.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email profesional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-[#E5E7EB] bg-white p-3 text-[#07111F] outline-none focus:border-[#2563EB]"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-[#E5E7EB] bg-white p-3 text-[#07111F] outline-none focus:border-[#2563EB]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded border border-[#2563EB] bg-[#2563EB] p-3 font-black text-white transition hover:bg-[#1D4ED8] disabled:bg-[#93C5FD]"
          >
            {loading ? "Iniciando..." : "Iniciar sesion"}
          </button>
        </form>

        <p className="mt-4 text-center text-[#4B5563]">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/register" className="text-[#2563EB] hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
    </ArgosPageShell>
  );
}
