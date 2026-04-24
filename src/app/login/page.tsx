"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPrestadorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      alert("Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-8 justify-center">
      <section className="w-full max-w-sm mx-auto flex flex-col items-center justify-center">
        <header className="text-center mb-8">
          <div className="text-5xl mb-4">🌳</div>
          <h1 className="text-3xl font-bold text-emerald-800">Portal do Prestador</h1>
          <p className="text-slate-600 mt-2">Acesse suas Ordens de Serviço</p>
        </header>
        
        <main className="w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <form onSubmit={fazerLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700">E-mail Corporativo</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium" 
                placeholder="contato@empresa.com" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Senha</label>
              <div className="relative mt-1">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm pr-10 text-slate-900 font-medium" 
                  placeholder="Sua senha" 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">👁️</button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-md hover:bg-emerald-700 mt-6 disabled:opacity-50">
              {isLoading ? "Entrando..." : "Acessar Sistema"}
            </button>
          </form>
        </main>
        
        <footer className="text-center mt-6">
          <p className="text-sm text-slate-600 font-medium">Ainda não é parceiro? <Link href="/cadastro" className="text-emerald-700 hover:underline">Solicite o credenciamento.</Link></p>
        </footer>
      </section>
    </div>
  );
}
