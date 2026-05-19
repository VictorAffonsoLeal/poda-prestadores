"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut, CheckCircle, MapPin, FileText, Camera } from "lucide-react";

export default function PrestadorDashboardPage() {
  const router = useRouter();
  const { user, prestadorData, loading } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  
  // States para conclusão de OS
  const [osSendoConcluida, setOsSendoConcluida] = useState<string | null>(null);
  const [fotoFinal, setFotoFinal] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchOS = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "solicitacoes"),
          where("prestadorId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const dados: any[] = [];
        snapshot.forEach(doc => dados.push({ id: doc.id, ...doc.data() }));
        
        // Sort by newest first
        dados.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setSolicitacoes(dados);
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error);
      } finally {
        setLoadingDados(false);
      }
    };

    if (user && prestadorData) {
      fetchOS();
    }
  }, [user, prestadorData]);

  const efetuarLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleConcluirOS = async (idOS: string) => {
    if (!fotoFinal) {
      alert("É obrigatório anexar uma foto do serviço finalizado.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload da foto de conclusão
      const fileRef = ref(storage, `conclusoes/${idOS}/${Date.now()}_${fotoFinal.name}`);
      const snapshot = await uploadBytes(fileRef, fotoFinal);
      const url = await getDownloadURL(snapshot.ref);

      // 2. Atualizar chamado
      const docRef = doc(db, "solicitacoes", idOS);
      const historicoEntry = {
        data: new Date().toLocaleDateString('pt-BR'),
        status: "Concluído",
        descricao: "Serviço finalizado pelo prestador parceiro."
      };

      await updateDoc(docRef, {
        status: "Concluído",
        fotoConclusao: url,
        historico: arrayUnion(historicoEntry)
      });

      alert("Ordem de Serviço marcada como concluída com sucesso!");
      setOsSendoConcluida(null);
      setFotoFinal(null);
      
      // Atualizar lista localmente
      setSolicitacoes(prev => prev.map(s => s.id === idOS ? { ...s, status: "Concluído", fotoConclusao: url } : s));

    } catch (e) {
      console.error(e);
      alert("Erro ao concluir a OS.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !user || !prestadorData) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-700">Carregando painel...</div>;
  }

  if (prestadorData.status === "Pendente") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Conta em Análise</h1>
        <p className="text-slate-600 max-w-md mb-8">Seu cadastro está aguardando aprovação da prefeitura. Assim que validarem seu credenciamento, você terá acesso às Ordens de Serviço.</p>
        <button onClick={efetuarLogout} className="text-emerald-600 font-bold hover:underline">Sair</button>
      </div>
    );
  }

  const pendentes = solicitacoes.filter(s => s.status === "Aprovado");
  const concluidas = solicitacoes.filter(s => s.status === "Concluído");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-800 text-white p-4 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Portal do Prestador</h1>
            <p className="text-emerald-200 text-sm">{prestadorData.razaoSocial}</p>
          </div>
          <button onClick={efetuarLogout} className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors text-sm font-semibold">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 py-8 space-y-8">
        
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <h2 className="text-xl font-bold text-slate-800">Ordens de Serviço (A Executar)</h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{pendentes.length}</span>
          </div>

          {loadingDados ? (
            <p className="text-slate-500">Carregando chamados...</p>
          ) : pendentes.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
              <p className="text-slate-500 font-medium">Nenhuma Ordem de Serviço pendente para sua empresa no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendentes.map(os => (
                <div key={os.id} className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">#{os.id.substring(0,6)}</span>
                    <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded">Aguardando Execução</span>
                  </div>
                  <h3 className="font-bold text-slate-800 flex items-start gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    {os.type}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    {os.address}
                  </p>

                  {os.prazoDias && os.prazoDias !== "Não definido" && (
                    <p className="text-sm text-orange-700 font-bold bg-orange-100/50 p-2 rounded-lg flex items-start gap-2 mb-2 border border-orange-200 w-max">
                      ⏳ Prazo de Execução: {os.prazoDias} dias
                    </p>
                  )}
                  
                  {os.risco && os.risco !== "Nenhum risco aparente" && (
                    <div className="bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-md mb-4 border border-red-200 flex items-center gap-2">
                      <span className="text-sm">🚨</span> {os.risco}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {osSendoConcluida === os.id ? (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                        <label className="block text-sm font-bold text-slate-700">Comprovação do Serviço</label>
                        <p className="text-xs text-slate-500 mb-2">Envie uma foto do local após a conclusão da poda.</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => setFotoFinal(e.target.files ? e.target.files[0] : null)}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => handleConcluirOS(os.id)} 
                            disabled={isUploading || !fotoFinal}
                            className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isUploading ? "Enviando..." : "Finalizar OS"}
                          </button>
                          <button 
                            onClick={() => { setOsSendoConcluida(null); setFotoFinal(null); }}
                            disabled={isUploading}
                            className="px-4 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm hover:bg-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setOsSendoConcluida(os.id)}
                        className="w-full bg-orange-100 text-orange-800 border border-orange-300 font-bold py-2.5 rounded-lg text-sm hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Informar Conclusão do Serviço
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <h2 className="text-xl font-bold text-slate-800">Serviços Concluídos</h2>
          </div>
          
          {concluidas.length === 0 ? (
            <p className="text-slate-500 italic text-sm">Nenhum serviço concluído ainda.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {concluidas.map(os => (
                <div key={os.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm opacity-80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">#{os.id.substring(0,6)}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Finalizado
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-2 truncate">{os.address}</p>
                  {os.fotoConclusao && (
                    <a 
                      href={os.fotoConclusao.startsWith("http://") ? os.fotoConclusao.replace("http://", "https://") : os.fotoConclusao} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" /> Ver Foto do Serviço
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
