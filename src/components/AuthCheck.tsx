
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

interface AuthCheckProps {
  children: React.ReactNode;
}

const AuthCheck = ({ children }: AuthCheckProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Verificar se o usuário está logado
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Se não estiver logado, redirecionar para a página de autenticação
    if (!isLoggedIn) {
      toast({
        title: "Acesso restrito",
        description: "Por favor, faça login para continuar",
        variant: "destructive",
      });
      navigate('/auth');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  // Renderiza os filhos apenas quando a autenticação for confirmada
  if (isAuthenticated === null) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-900">
      <div className="text-white">Verificando autenticação...</div>
    </div>;
  }
  
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthCheck;
