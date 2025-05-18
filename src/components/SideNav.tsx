
import React from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex items-center w-full px-4 py-3 rounded-lg transition-colors",
          active
            ? "bg-blue-800/30 text-blue-400"
            : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
        )}
      >
        <span className="mr-3 text-lg">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  );
};

const SideNav = () => {
  return (
    <aside className="hidden md:block w-64 bg-gray-900 p-4 border-r border-gray-800">
      <nav>
        <ul className="space-y-2">
          <NavItem icon="📲" label="Conectar" active />
          <NavItem icon="🤖" label="Integrar Bots" />
          <NavItem icon="📊" label="Status" />
          <NavItem icon="👩" label="Personalidade IA" />
          <NavItem icon="📳" label="Campanhas" />
          <NavItem icon="🏠" label="Meu Catálogo" />
          <NavItem icon="📽️" label="Ajuda" />
          <NavItem icon="💰" label="Quero Me Afiliar" />
        </ul>
      </nav>
      
      <div className="absolute bottom-4 w-56">
        <button className="flex items-center justify-center w-full px-4 py-3 mt-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors">
          <span className="mr-2">🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default SideNav;
