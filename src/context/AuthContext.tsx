"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  prestadorData: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, prestadorData: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [prestadorData, setPrestadorData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Busca na coleção prestadores
          const prestadorDocRef = doc(db, "prestadores", currentUser.uid);
          const prestadorDoc = await getDoc(prestadorDocRef);
          
          if (prestadorDoc.exists()) {
            setPrestadorData(prestadorDoc.data());
          } else {
            // Se não existe na coleção prestadores, é um acesso indevido
            console.error("Acesso negado: Usuário não é um prestador.");
            await signOut(auth);
            setPrestadorData(null);
            setUser(null);
            alert("Acesso negado. Conta de prestador não encontrada.");
            router.push("/login");
          }
        } catch (error) {
          console.error("Error fetching prestador data:", error);
        }
      } else {
        setPrestadorData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, prestadorData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
