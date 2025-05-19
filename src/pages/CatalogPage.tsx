
import React from 'react';
import { Store, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import SideNav from "@/components/SideNav";

const CatalogPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav />
      
      <main className="flex-1 p-6">
        <div className="container mx-auto py-8">
          <Card className="w-full max-w-4xl mx-auto border-purple-600/20">
            <CardHeader className="bg-purple-600/10">
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400">Meu Catálogo</CardTitle>
              <CardDescription className="text-base mt-2">
                Tenha sua lojinha ou catalogo virtual em nossas plataformas Multilojas, Para Usuarios do WHATSVENDA a mensalidade de um catálogo virtual é apenas R$7,99 ou R$69,99 anual, um valor simbólico para ajudarmos ainda mais nossos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 justify-center p-8">
              <Button 
                variant="catalog" 
                size="lg" 
                className="flex items-center gap-2 text-lg h-14" 
                onClick={() => window.open("https://conheca.comprasofc.shop", "_blank")}
              >
                <Store className="h-5 w-5" />
                LOJA VIRTUAL
              </Button>
              <Button 
                size="lg"
                variant="secondary" 
                className="flex items-center gap-2 text-lg h-14 bg-gray-600 text-white hover:bg-gray-700" 
                onClick={() => window.open("https://lojasofc.shop", "_blank")}
              >
                <ShoppingBag className="h-5 w-5" />
                DELIVERY VIRTUAL
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CatalogPage;
