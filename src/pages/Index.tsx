
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import BotIntegration from "@/components/BotIntegration";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  
  const handleInstanceConnect = (name: string) => {
    setInstanceConnected(true);
    setInstanceName(name);
    toast({
      title: "Instância conectada",
      description: `Conectado à instância ${name}`,
    });
  };

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
              <Card className="border-blue-500/20 bg-black">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-400">Conectar à Instância</CardTitle>
                  <CardDescription className="text-gray-400">
                    Conecte-se à instância da Evolution para usar os agentes IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-900 rounded-md mb-4">
                    <h3 className="text-lg mb-2">Instruções:</h3>
                    <ol className="list-decimal ml-6 space-y-2 text-gray-300">
                      <li>Digite seu nome ou nome da empresa no campo abaixo</li>
                      <li>Clique em "Gerar QR Code" para conectar ao WhatsApp</li>
                      <li>Escaneie o QR Code com seu WhatsApp</li>
                      <li>Após conectar, você poderá integrar bots IA ao seu sistema</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 bg-blue-900/20 rounded-md">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const nameInput = form.elements.namedItem('nome') as HTMLInputElement;
                      handleInstanceConnect(nameInput.value);
                    }}>
                      <div className="mb-4">
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
                          Nome ou Empresa
                        </label>
                        <input 
                          type="text" 
                          id="nome" 
                          name="nome"
                          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white" 
                          placeholder="Seu Nome ou Nome da Empresa" 
                          required 
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
                      >
                        Gerar QR Code para WhatsApp
                      </button>
                    </form>
                    
                    <div className="mt-6 flex flex-col items-center">
                      <div id="qrcode" className="bg-white p-4 rounded-md">
                        {/* QR Code será exibido aqui */}
                        <img 
                          src="data:image/png;base64,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" 
                          alt="QR Code de exemplo" 
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="mt-4 text-sm text-gray-400">Escaneie o QR Code com seu WhatsApp</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
