"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock, Eye, EyeOff, Briefcase } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function LoginPrestadorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      showToast("Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.", "erro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logotipo/Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal do Prestador</h1>
          <p className="text-slate-500 text-sm mt-2">
            Acesse seu painel corporativo e gerencie suas Ordens de Serviço
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

          <form onSubmit={fazerLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none" 
                  placeholder="exemplo@empresa.com" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  className="pl-11 pr-11 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none" 
                  placeholder="Sua senha de acesso" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-6 cursor-pointer flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Acessar Sistema"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Ainda não é parceiro credenciado?{" "}
            <Link href="/cadastro" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Solicite o credenciamento.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
