
import React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  Link as LinkIcon,
  Bot,
  Activity,
  User,
  Calendar,
  Book,
  MessageSquare,
  Users,
  LogOut
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to: string;
  onClick?: () => void;
  color?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, to, onClick, color }) => {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className={cn(
          "flex items-center w-full px-4 py-3 rounded-lg transition-colors",
          active
            ? "bg-blue-800/30 text-blue-400"
            : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
        )}
        style={{ color: color || "inherit" }}
      >
        <span className="mr-3 text-lg">{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
};

const SideNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const handleLogout = () => {
    // Clear any stored instance data
    localStorage.removeItem('instanceName');
    localStorage.removeItem('instanceStatus');
    
    // Redirect to home after logout
    window.location.href = "/";
  };

  return (
    <aside className="hidden md:block w-64 bg-gray-900 p-4 border-r border-gray-800 h-screen overflow-auto">
      <nav className="h-full flex flex-col justify-between">
        <ul className="space-y-2">
          <NavItem 
            icon={<LinkIcon size={18} />} 
            label="Conectar" 
            active={currentPath === "/"} 
            to="/"
          />
          <NavItem 
            icon={<Bot size={18} />} 
            label="Integrar Bots" 
            active={currentPath === "/bots"} 
            to="/bots" 
            color="#FF0000" // Vermelho como na imagem
          />
          <NavItem 
            icon={<Activity size={18} />} 
            label="Status" 
            active={currentPath === "/status"} 
            to="/status" 
            color="#FFFF00" // Amarelo como na imagem
          />
          <NavItem 
            icon={<User size={18} />} 
            label="Personalidade IA" 
            active={currentPath === "/ia-personality"} 
            to="/ia-personality"
            color="#00FF00" // Verde como na imagem
          />
          <NavItem 
            icon={<Users size={18} />} 
            label="Clientes" 
            active={currentPath === "/clients"} 
            to="/clients"
            color="#4169E1" // Azul royal para o item Clientes
          />
          <NavItem 
            icon={<Calendar size={18} />} 
            label="Campanhas" 
            active={currentPath === "/campaigns"} 
            to="/campaigns"
            color="#FFA500" // Laranja como na imagem
          />
          <NavItem 
            icon={<Book size={18} />} 
            label="Meu Catálogo" 
            active={currentPath === "/catalog"} 
            to="/catalog"
            color="#800080" // Roxo como na imagem
          />
          <NavItem 
            icon={<MessageSquare size={18} />} 
            label="CRM WHATSAPP" 
            active={currentPath === "/help"} 
            to="/help" 
            color="#FFA500" // Laranja como na imagem
          />
          <NavItem 
            icon={<Users size={18} />} 
            label="Quero Me Afiliar" 
            active={currentPath === "/affiliate"} 
            to="/affiliate"
            color="#FFFF00" // Amarelo como na imagem
          />
        </ul>
        
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 mt-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
          >
            <span className="mr-2"><LogOut size={18} /></span>
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SideNav;
