"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut, CheckCircle, MapPin, FileText, Camera, Clock, CheckCircle2, ShieldAlert, Upload, X, Search, ShieldCheck, Award, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function PrestadorDashboardPage() {
  const router = useRouter();
  const { user, prestadorData, loading } = useAuth();
  const { showToast } = useToast();
  
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States para conclusão de OS
  const [osSendoConcluida, setOsSendoConcluida] = useState<string | null>(null);
  const [fotoFinal, setFotoFinal] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        dados.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFotoFinal(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCancelConcluir = () => {
    setOsSendoConcluida(null);
    setFotoFinal(null);
    setPreviewUrl(null);
  };

  const getUploadUrl = () => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal && process.env.NEXT_PUBLIC_UPLOAD_URL) {
        return process.env.NEXT_PUBLIC_UPLOAD_URL;
      }
    }
    return "https://poda-app.nivl.com.br/api/upload.php";
  };

  const handleConcluirOS = async (idOS: string) => {
    if (!fotoFinal || !user) {
      showToast("É obrigatório anexar uma foto do serviço finalizado.", "erro");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload da foto de conclusão via Hostinger API
      const formDataUpload = new FormData();
      formDataUpload.append("userId", user.uid);
      formDataUpload.append("files[]", fotoFinal);

      const resUpload = await fetch(getUploadUrl(), {
        method: "POST",
        body: formDataUpload,
      });

      const dataUpload = await resUpload.json();

      if (dataUpload.urls && dataUpload.urls.length > 0) {
        const url = dataUpload.urls[0];

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

        showToast("Ordem de Serviço marcada como concluída com sucesso!", "sucesso");
        handleCancelConcluir();
        
        // Atualizar lista localmente
        setSolicitacoes(prev => prev.map(s => s.id === idOS ? { ...s, status: "Concluído", fotoConclusao: url } : s));
      } else {
        const errorMsg = dataUpload.errors && dataUpload.errors.length > 0 
          ? dataUpload.errors.join(", ") 
          : "Erro desconhecido no servidor de arquivos.";
        showToast("Erro ao fazer upload da imagem: " + errorMsg, "erro");
      }
    } catch (e) {
      console.error(e);
      showToast("Erro ao concluir a OS.", "erro");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !user || !prestadorData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Carregando painel do prestador...</p>
      </div>
    );
  }

  if (prestadorData.status === "Pendente") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-4xl mb-6 shadow-inner border border-amber-200 animate-pulse">
          ⏳
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Conta em Análise</h1>
        <p className="text-slate-500 max-w-md mt-2 text-sm sm:text-base leading-relaxed">
          Seu cadastro está aguardando aprovação e homologação pela prefeitura. Assim que validarem seu credenciamento, você terá acesso imediato às Ordens de Serviço.
        </p>
        <div className="mt-8 pt-6 border-t border-slate-200 w-full max-w-sm">
          <button 
            onClick={efetuarLogout} 
            className="text-emerald-600 hover:text-emerald-800 font-bold text-sm tracking-wide bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/30 px-5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  const pendentes = solicitacoes.filter(s => s.status === "Aprovado");
  const concluidas = solicitacoes.filter(s => s.status === "Concluído");

  // Filtragem
  const pendentesFiltrados = pendentes.filter(os => 
    os.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const concluidasFiltrados = concluidas.filter(os => 
    os.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Award className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Portal do Prestador</h1>
              <p className="text-emerald-200/95 text-[10px] sm:text-xs font-medium truncate max-w-[150px] sm:max-w-none">
                {prestadorData.razaoSocial}
              </p>
            </div>
          </div>
          <button 
            onClick={efetuarLogout} 
            className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl backdrop-blur-sm cursor-pointer border border-white/5"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Sair
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Card de Boas-Vindas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Empresa Credenciada e Homologada
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Olá, {prestadorData.razaoSocial}!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Bem-vindo ao seu painel corporativo. Aqui você pode visualizar as Ordens de Serviço (OS) delegadas à sua empresa pela prefeitura, acompanhar prazos e enviar comprovações fotográficas de finalização do serviço.
            </p>
          </div>

          {/* Mini Cards de Métricas */}
          <div className="flex gap-4 shrink-0">
            <div className="bg-slate-50/80 border border-slate-200/50 p-4 rounded-2xl min-w-[110px] text-center shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pendentes</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendentes.length}</span>
            </div>
            <div className="bg-slate-50/80 border border-slate-200/50 p-4 rounded-2xl min-w-[110px] text-center shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Concluídos</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{concluidas.length}</span>
            </div>
          </div>
        </div>

        {/* Toolbar de Busca */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar OS por endereço, protocolo ou tipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-all focus:outline-none"
            />
          </div>
          {searchTerm && (
            <div className="text-xs text-slate-400 font-bold shrink-0 hidden sm:block">
              Filtrado: {pendentesFiltrados.length + concluidasFiltrados.length} encontrados
            </div>
          )}
        </div>

        {/* Seção OS Executar */}
        <section className="space-y-5">
          <div className="flex items-center gap-2 pl-1">
            <span className="p-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg inline-flex">
              <Clock className="w-4.5 h-4.5" />
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Ordens de Serviço a Executar</h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-orange-200/30">
              {pendentesFiltrados.length}
            </span>
          </div>

          {loadingDados ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-medium">Carregando ordens de serviço...</p>
            </div>
          ) : pendentesFiltrados.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-bold text-sm">Nenhuma OS em aberto encontrada</p>
              <p className="text-slate-400 text-xs">
                {searchTerm ? "Tente buscar por outros termos de pesquisa." : "Novos chamados delegados pela prefeitura aparecerão aqui."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendentesFiltrados.map(os => (
                <div 
                  key={os.id} 
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-orange-400"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      #{os.id.substring(0,8)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200/40 px-2.5 py-1 rounded-lg">
                      Aguardando Execução
                    </span>
                  </div>
                  
                  <div className="space-y-3.5 flex-1 font-sans">
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                      {os.type}
                    </h4>
                    
                    <p className="text-sm text-slate-500 flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                      {os.address}
                    </p>

                    {os.prazoDias && os.prazoDias !== "Não definido" && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Prazo de Execução: {os.prazoDias} dias
                      </div>
                    )}
                    
                    {os.risco && os.risco !== "Nenhum risco aparente" && (
                      <div className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-2.5 rounded-xl border border-rose-100 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                        Grau de Risco: {os.risco}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100">
                    {osSendoConcluida === os.id ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Comprovação do Serviço</label>
                          <button 
                            type="button" 
                            onClick={handleCancelConcluir}
                            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Selecione uma foto do local com o serviço concluído para anexar no laudo municipal.</p>
                        
                        {/* Seletor com Preview */}
                        <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 text-center hover:bg-emerald-50/10 transition-all relative cursor-pointer min-h-[140px] flex items-center justify-center">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          
                          {previewUrl ? (
                            <div className="relative group/preview w-32 h-32 rounded-xl overflow-hidden shadow-md border border-slate-200 bg-white">
                              <img src={previewUrl} className="w-full h-full object-cover" alt="Pré-visualização" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-all">
                                <button 
                                  type="button" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFotoFinal(null);
                                    setPreviewUrl(null);
                                  }}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer shadow-md"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
                                <Upload className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-extrabold text-emerald-700">Escolher Imagem Comprovante</span>
                              <span className="text-[10px] text-slate-400">Clique para selecionar do seu dispositivo</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button 
                            onClick={() => handleConcluirOS(os.id)} 
                            disabled={isUploading || !fotoFinal}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                          >
                            {isUploading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Finalizar e Salvar OS"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setOsSendoConcluida(os.id)}
                        className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/40 hover:border-emerald-200 font-bold py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> Informar Conclusão do Serviço
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção OS Concluídas */}
        <section className="space-y-5">
          <div className="flex items-center gap-2 pl-1">
            <span className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg inline-flex">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Serviços Concluídos (Histórico)</h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200/30">
              {concluidasFiltrados.length}
            </span>
          </div>
          
          {concluidasFiltrados.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <p className="text-slate-400 italic text-sm">
                {searchTerm ? "Nenhum histórico corresponde ao filtro." : "Nenhum serviço foi concluído pela sua empresa ainda."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {concluidasFiltrados.map(os => (
                <div 
                  key={os.id} 
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 overflow-hidden group/concluida"
                >
                  {/* Foto de Conclusão como Banner */}
                  {os.fotoConclusao && (
                    <div className="h-44 w-full overflow-hidden border-b border-slate-100 relative bg-slate-100">
                      <img 
                        src={os.fotoConclusao.startsWith("http://") ? os.fotoConclusao.replace("http://", "https://") : os.fotoConclusao} 
                        className="w-full h-full object-cover group-hover/concluida:scale-105 transition-transform duration-300"
                        alt="Comprovante de conclusão"
                      />
                      <a 
                        href={os.fotoConclusao.startsWith("http://") ? os.fotoConclusao.replace("http://", "https://") : os.fotoConclusao} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="absolute bottom-3 right-3 bg-slate-900/60 hover:bg-slate-900/80 text-white p-2 rounded-xl backdrop-blur-sm transition-colors text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <Camera className="w-3.5 h-3.5" /> Ver Original
                      </a>
                    </div>
                  )}
                  
                  <div className="px-5 pb-5 pt-1 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400">#{os.id.substring(0,8)}</span>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/60 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Finalizado
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-extrabold text-slate-800 leading-snug truncate">{os.type}</h4>
                      <p className="text-xs text-slate-500 flex items-start gap-1 leading-relaxed">
                        <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{os.address}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
