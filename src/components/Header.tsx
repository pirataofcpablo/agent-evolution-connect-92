
import React from "react";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img
            src="https://whatsvenda.online/img/logologin.png"
            alt="WHATSVENDA IA"
            className="h-10"
          />
        </div>
        <div>
          <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
            Sistema SAAS de Agentes IA
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
