"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useAuthStore } from "@/lib/auth";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Register() {
  const router = useRouter();
  const authenticated = useAuthStore((state) => state.authenticated);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      router.replace("/dashboard");
    }
  }, [authenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/api/auth/register", {
        name,
        email,
        password,
        company
      });

      toast.success("Registro exitoso, inicia sesión");
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error en registro");
    }

    setLoading(false);
  };

  return (
    <ArgosPageShell variant="portal">
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-xl shadow-[#0B1E33]/10">
        <h1 className="mb-2 text-center text-3xl font-bold text-[#0B1E33]">
          Crear cuenta ARGOS-IT
        </h1>
        <p className="mb-6 text-center text-[#4B5563]">
          Registra tu empresa para acceder al portal de mejoras y soporte.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="register-name" className="sr-only">
            Nombre
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border border-[#E5E7EB] bg-white p-3 text-[#07111F] outline-none focus:border-[#2563EB]"
          />

          <label htmlFor="register-email" className="sr-only">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-[#E5E7EB] bg-white p-3 text-[#07111F] outline-none focus:border-[#2563EB]"
          />

          <label htmlFor="register-company" className="sr-only">
            Empresa
          </label>
          <input
            id="register-company"
            name="company"
            type="text"
            placeholder="Empresa"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded border border-[#E5E7EB] bg-white p-3 text-[#07111F] outline-none focus:border-[#2563EB]"
          />

          <label htmlFor="register-password" className="sr-only">
            Contraseña (mín 10 caracteres)
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Contraseña (mín 10 caracteres)"
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
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-center text-[#4B5563]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-[#2563EB] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
    </ArgosPageShell>
  );
}
