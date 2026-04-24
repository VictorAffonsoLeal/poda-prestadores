"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function CadastroPrestadorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [valorCorte, setValorCorte] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
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
        valorMedioCorte: parseFloat(valorCorte.replace(',', '.')),
        status: "Pendente",
        createdAt: new Date().toISOString()
      });

      alert("Cadastro enviado com sucesso! Aguarde a aprovação da prefeitura.");
      router.push("/login");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Este e-mail já está em uso.");
      } else {
        alert("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-8 justify-center">
      <section className="w-full max-w-lg mx-auto flex flex-col items-center justify-center">
        <header className="text-center mb-8">
          <div className="text-5xl mb-4">👷‍♂️</div>
          <h1 className="text-3xl font-bold text-emerald-800">Seja um Parceiro</h1>
          <p className="text-slate-600 mt-2">Cadastre sua empresa e receba Ordens de Serviço da prefeitura.</p>
        </header>
        
        <main className="w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <form onSubmit={cadastrarPrestador} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">Razão Social / Nome da Empresa</label>
              <input type="text" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium" placeholder="Ex: Poda Rápida Ltda" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700">CNPJ</label>
                <input type="text" value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium" placeholder="00.000.000/0000-00" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Telefone / WhatsApp</label>
                <input type="text" value={contato} onChange={e => setContato(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium" placeholder="(00) 00000-0000" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Valor Médio de Corte / Poda (R$)</label>
              <p className="text-xs text-slate-500 mb-1">Este valor será usado pela prefeitura para aprovar seu credenciamento.</p>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">R$</span>
                <input type="number" step="0.01" min="0" value={valorCorte} onChange={e => setValorCorte(e.target.value)} className="block w-full pl-9 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-bold" placeholder="150,00" required />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 pt-4">Dados de Acesso</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700">E-mail</label>
              <p className="text-xs text-slate-500 mb-1">Seu e-mail será usado para fazer login no sistema.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium" placeholder="contato@empresa.com" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Senha</label>
              <div className="relative mt-1">
                <input type={showPassword ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm pr-10 text-slate-900 font-medium" placeholder="Crie uma senha forte" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">👁️</button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-md hover:bg-emerald-700 mt-6 disabled:opacity-50">
              {isLoading ? "Enviando Cadastro..." : "Solicitar Credenciamento"}
            </button>
          </form>
        </main>
        
        <footer className="text-center mt-6">
          <p className="text-sm text-slate-600 font-medium">Já é credenciado? <Link href="/login" className="text-emerald-700 hover:underline">Faça login aqui.</Link></p>
        </footer>
      </section>
    </div>
  );
}
