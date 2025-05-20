
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import FinancialProgressBar from "@/components/FinancialProgressBar";
import { getAllClients } from "@/services/clientService";
import { calculateTotalRevenue } from "@/services/financialService";

const Header = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [userName, setUserName] = useState<string>("");
  
  useEffect(() => {
    // Obter o nome do usuário salvo no localStorage
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      // Se não tiver nome, usar o email como alternativa
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        setUserName(userEmail.split('@')[0]); // Usar parte antes do @
      }
    }
    
    // Carregar dados financeiros
    try {
      const clients = getAllClients();
      const revenue = calculateTotalRevenue(clients);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    }
  }, []);

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button className="block md:hidden mr-4 p-2 text-gray-300 hover:text-white">
                <Menu />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-900 border-r border-gray-800 p-0">
              <nav className="h-full flex flex-col justify-between">
                <div className="p-4">
                  <div className="mb-6 flex items-center">
                    <img 
                      src="https://whatsvenda.online/img/logologin.png"
                      alt="WhatsVenda Logo" 
                      className="w-10 h-10 mr-3" 
                    />
                    <h3 className="font-semibold text-white">WhatsVenda</h3>
                  </div>
                  <ul className="space-y-1">
                    <li>
                      <Link 
                        to="/" 
                        className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                      >
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/bots" 
                        className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                      >
                        Integrar Bots
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/gestor-pix" 
                        className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                      >
                        Gestor Pix
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/clients" 
                        className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                      >
                        Clientes
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <Link 
            to="/" 
            className="flex items-center"
          >
            <img 
              src="https://whatsvenda.online/img/logologin.png" 
              alt="WhatsVenda Logo" 
              className="w-8 h-8 mr-2" 
            />
            <span className="text-xl font-semibold text-white hidden sm:block">WhatsVenda</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-2 text-gray-300 hover:text-white">
              <Bell className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center">
            {userName && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{userName}</p>
                {totalRevenue > 0 && (
                  <div className="w-40">
                    <FinancialProgressBar 
                      currentValue={totalRevenue} 
                      className="mt-1" 
                    />
                  </div>
                )}
              </div>
            )}
            <div className="ml-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
