"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Briefcase, ArrowLeft, Info, FileText, Phone, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CadastroPrestadorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  // Form states
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Máscara de CNPJ: 00.000.000/0000-00
  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length === 0) return "";
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
  };

  // Máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
  const formatTelefone = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length === 0) return "";
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  const cadastrarPrestador = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Criar Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2. Salvar como Prestador Pendente
      await setDoc(doc(db, "prestadores", user.uid), {
        razaoSocial,
        cnpj,
        contato,
        email,
        status: "Pendente",
        createdAt: new Date().toISOString()
      });

      showToast("Cadastro enviado com sucesso! Aguarde a aprovação da prefeitura.", "sucesso");
      router.push("/login");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      if (error.code === 'auth/email-already-in-use') {
        showToast("Este e-mail já está em uso.", "erro");
      } else {
        showToast("Erro ao criar conta. Tente novamente.", "erro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Botão Voltar */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o Login
        </Link>

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seja um Parceiro</h1>
          <p className="text-slate-500 text-sm mt-2">
            Cadastre sua empresa de poda e receba Ordens de Serviço da prefeitura
          </p>
        </div>

        {/* Card de Alerta/Aviso */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs leading-relaxed shadow-sm mb-6">
          <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Aviso de Indicação Municipal:</span>
            Ao obter o credenciamento de sua empresa, você será exibido no aplicativo dos cidadãos como um prestador recomendado pela prefeitura para a realização de serviços autorizados de poda e supressão de árvores.
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

          <form onSubmit={cadastrarPrestador} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Razão Social / Nome da Empresa
              </label>
              <div className="relative">
                <Briefcase className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={razaoSocial} 
                  onChange={e => setRazaoSocial(e.target.value)} 
                  className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none" 
                  placeholder="Ex: Poda Rápida Serviços Ltda" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  CNPJ
                </label>
                <div className="relative">
                  <FileText className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={cnpj} 
                    onChange={e => setCnpj(formatCNPJ(e.target.value))} 
                    className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none font-mono" 
                    placeholder="00.000.000/0000-00" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={contato} 
                    onChange={e => setContato(formatTelefone(e.target.value))} 
                    className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none" 
                    placeholder="(00) 00000-0000" 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Dados de Acesso</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                E-mail de Login
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none" 
                  placeholder="contato@empresa.com" 
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
                  placeholder="Senha de no mínimo 6 caracteres" 
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-6 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Solicitar Credenciamento
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
