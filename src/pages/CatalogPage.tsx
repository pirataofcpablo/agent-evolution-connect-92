
import React from 'react';
import { Store, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SideNav from "@/components/SideNav";

const CatalogPage = () => {
  return (
    <div className="flex min-h-screen bg-[#14182B] text-white">
      <SideNav />
      
      <main className="flex-1 p-6">
        <div className="container mx-auto py-8">
          <div className="bg-[#1F2544] p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-purple-400">Meu Catálogo</h1>
            
            <p className="text-base mb-8">
              Tenha sua lojinha ou catalogo virtual em nossas plataformas Multilojas. Para Usuarios do WHATSVENDA a mensalidade de um catálogo virtual é apenas R$7,99 ou R$69,99 anual, um valor simbólico para ajudarmos ainda mais nossos clientes.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="flex items-center justify-center gap-2 text-lg h-14 bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto px-8" 
                onClick={() => window.open("https://conheca.comprasofc.shop", "_blank")}
              >
                <Store className="h-5 w-5" />
                LOJA VIRTUAL
              </Button>
              <Button 
                size="lg"
                variant="secondary" 
                className="flex items-center justify-center gap-2 text-lg h-14 bg-gray-600 hover:bg-gray-700 text-white w-full md:w-auto px-8" 
                onClick={() => window.open("https://lojasofc.shop", "_blank")}
              >
                <ShoppingBag className="h-5 w-5" />
                DELIVERY VIRTUAL
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CatalogPage;
