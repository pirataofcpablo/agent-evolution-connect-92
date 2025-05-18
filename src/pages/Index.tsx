
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import BotIntegration from "@/components/BotIntegration";
import WhatsAppConnection from "@/components/WhatsAppConnection";
import BotStatus from "@/components/BotStatus";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  
  // Verifica se há uma instância conectada ao carregar a página
  useEffect(() => {
    const storedInstanceName = localStorage.getItem('instanceName');
    const storedInstanceStatus = localStorage.getItem('instanceStatus');
    
    if (storedInstanceName && storedInstanceStatus && storedInstanceStatus !== "Desligada") {
      setInstanceConnected(true);
      setInstanceName(storedInstanceName.replace("_Cliente", ""));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">Sistema SAAS de Agentes IA</h1>
          
          <Tabs defaultValue="conexao" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="conexao">📲 Conectar</TabsTrigger>
              <TabsTrigger value="bots">🤖 Integrar Bots</TabsTrigger>
              <TabsTrigger value="status">📊 Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conexao">
              <WhatsAppConnection />
            </TabsContent>
            
            <TabsContent value="bots">
              <BotIntegration 
                instanceConnected={instanceConnected} 
                instanceName={instanceName} 
              />
            </TabsContent>
            
            <TabsContent value="status">
              <BotStatus instanceName={instanceConnected ? `${instanceName}_Cliente` : null} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
