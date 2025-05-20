
import React from 'react';
import { Link } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SideNav from "@/components/SideNav";
import Header from "@/components/Header";

const AffiliatePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#14182B] text-white">
      <Header />
      <div className="flex flex-1">
        <SideNav />
        
        <main className="flex-1 p-6">
          <div className="container mx-auto py-8">
            <div className="bg-[#1F2544] p-6 rounded-lg">
              <h1 className="text-2xl font-bold mb-4 text-yellow-400">Quero Me Afiliar</h1>
              
              <p className="text-base mb-4">
                Torne-se um Afiliado do WhatsVenda e ganhe 50% de comissão em cada venda realizada! 
                Aproveite para divulgar uma solução completa em automação de WhatsApp e aumente sua renda.
              </p>
              
              <p className="text-base mb-8">
                Com o nosso programa de afiliados, você receberá comissões mensais por cada cliente que se cadastrar 
                através do seu link personalizado. É simples, rápido e altamente lucrativo!
              </p>
              
              <div className="flex justify-center">
                <Button 
                  variant="catalog"
                  size="lg" 
                  className="flex items-center justify-center gap-2 text-lg h-14 bg-yellow-600 hover:bg-yellow-700 text-white px-8" 
                  onClick={() => window.open("https://app.cakto.com.br/affiliate/invite/dc935857-492b-487e-91fa-2ef456a6eeef", "_blank")}
                >
                  <Link className="h-5 w-5" />
                  TORNAR-SE AFILIADO
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AffiliatePage;
