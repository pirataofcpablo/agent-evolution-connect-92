
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthCheckProps {
  children: React.ReactNode;
}

const AuthCheck = ({ children }: AuthCheckProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificar se o usuário está logado
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Se não estiver logado, redirecionar para a página de autenticação
    if (!isLoggedIn) {
      navigate('/auth');
    }
  }, [navigate]);

  return <>{children}</>;
};

export default AuthCheck;
