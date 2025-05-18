
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import BotIntegration from "@/components/BotIntegration";
import WhatsAppConnection from "@/components/WhatsAppConnection";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  
  // Verifica se há uma instância conectada ao carregar a página
  useState(() => {
    const storedInstanceName = localStorage.getItem('instanceName');
    const storedInstanceStatus = localStorage.getItem('instanceStatus');
    
    if (storedInstanceName && storedInstanceStatus && storedInstanceStatus !== "Desligada") {
      setInstanceConnected(true);
      setInstanceName(storedInstanceName.replace("_Cliente", ""));
    }
  });

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
              <Card className="border-blue-500/20 bg-black">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-400">Status do Sistema</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monitoramento de instâncias e integrações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {instanceConnected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-md">
                        <h3 className="font-medium text-green-400">✓ Instância Conectada</h3>
                        <p className="text-gray-300">Nome: {instanceName}</p>
                        <p className="text-gray-300">Status: Online</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-md">
                          <h3 className="font-medium text-blue-400">Dify IA</h3>
                          <div className="flex justify-between mt-2">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-yellow-400">Configuração pendente</span>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-md">
                          <h3 className="font-medium text-purple-400">n8n</h3>
                          <div className="flex justify-between mt-2">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-yellow-400">Configuração pendente</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-md">
                      <h3 className="font-medium text-yellow-400">⚠ Instância desconectada</h3>
                      <p className="text-gray-300 mt-2">
                        Conecte-se à instância primeiro para ver o status do sistema.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
