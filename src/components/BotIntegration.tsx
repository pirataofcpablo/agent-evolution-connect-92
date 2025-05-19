
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { checkInstanceStatus } from '@/services/difyService';
import { verifyConnectedInstance, getInstanceStatus } from '@/services/evoService';
import DifyIntegration from './DifyIntegration';
import N8nIntegration from './N8nIntegration';
import IntegrationCard from './IntegrationCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface BotIntegrationProps {
  instanceConnected: boolean;
  instanceName: string;
}

const BotIntegration: React.FC<BotIntegrationProps> = ({ 
  instanceConnected: initialInstanceConnected,
  instanceName: initialInstanceName 
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [verifyingInstance, setVerifyingInstance] = useState(false);
  const [instanceConnected, setInstanceConnected] = useState(initialInstanceConnected);
  const [instanceName, setInstanceName] = useState(initialInstanceName);
  const [instanceError, setInstanceError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Função para atualizar manualmente o status da instância
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await checkInstanceConnection();
    } finally {
      setRefreshing(false);
    }
  };
  
  // Função para verificar o status da instância diretamente na API Evolution
  const checkInstanceConnection = async () => {
    setVerifyingInstance(true);
    try {
      console.log("Verificando conexão da instância diretamente na API Evolution...");
      
      // Verificar instâncias conectadas na Evolution API
      const { instanceName: connectedName, status } = await verifyConnectedInstance();
      
      if (connectedName) {
        console.log(`Instância encontrada na Evolution API: ${connectedName} com status: ${status}`);
        setInstanceName(connectedName);
        setInstanceConnected(true);
        setInstanceError(null);
        
        // Atualizar localStorage com a instância verificada
        localStorage.setItem('instanceName', `${connectedName}_Cliente`);
        localStorage.setItem('instanceStatus', status || 'Connected');
        
        toast({
          title: "Instância verificada",
          description: `${connectedName} está conectada à Evolution API.`,
        });
      } else {
        console.log("Nenhuma instância conectada encontrada na Evolution API.");
        
        // Se não encontrou na verificação direta, tentar pelo nome armazenado
        if (initialInstanceName) {
          const status = await getInstanceStatus(initialInstanceName);
          
          if (status) {
            console.log(`Instância ${initialInstanceName} encontrada com status: ${status}`);
            setInstanceConnected(true);
            setInstanceError(null);
          } else {
            console.log(`Instância ${initialInstanceName} não encontrada ou não está conectada.`);
            setInstanceConnected(false);
            setInstanceError(`Instância ${initialInstanceName} não encontrada ou não está conectada. Verifique na aba Conectar.`);
          }
        } else {
          setInstanceConnected(false);
          setInstanceError("Nenhuma instância conectada encontrada. Por favor, conecte uma instância primeiro.");
        }
      }
    } catch (error) {
      console.error("Erro ao verificar instância:", error);
      setInstanceConnected(false);
      setInstanceError("Erro ao verificar o status da instância. Tente novamente.");
    } finally {
      setVerifyingInstance(false);
    }
  };
  
  // Verificar o status da instância quando o componente é montado
  useEffect(() => {
    checkInstanceConnection();
  }, [initialInstanceName]);

  if (verifyingInstance) {
    return (
      <Card className="border-blue-500/20 bg-black">
        <CardHeader>
          <CardTitle className="text-xl text-blue-400">Integração de Bots</CardTitle>
          <CardDescription className="text-gray-400">
            Verificando instância...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!instanceConnected) {
    return (
      <Card className="border-blue-500/20 bg-black">
        <CardHeader>
          <CardTitle className="text-xl text-blue-400">Integração de Bots</CardTitle>
          <CardDescription className="text-gray-400">
            Integre bots Dify e n8n ao seu sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-md text-center">
            <div className="text-yellow-400 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-white mb-2">Instância não conectada</h3>
            <p className="text-gray-300">
              {instanceError || "Você precisa conectar uma instância primeiro para poder integrar bots."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <button 
                onClick={() => document.querySelector('[value="conexao"]')?.dispatchEvent(new Event('click'))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
              >
                Ir para Conexão
              </button>
              <Button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="flex items-center gap-2"
                variant="outline"
              >
                {refreshing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
                ) : (
                  <><RefreshCw className="h-4 w-4" /> Verificar Novamente</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/20 bg-black">
      <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl text-blue-400">Integração de Bots</CardTitle>
          <CardDescription className="text-gray-400">
            Integre bots Dify e n8n à instância {instanceName}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="mt-1"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1 hidden sm:inline">
            {refreshing ? "Atualizando..." : "Atualizar"}
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="dify">Dify IA</TabsTrigger>
            <TabsTrigger value="n8n">n8n</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IntegrationCard 
                title="Dify IA"
                description="Plataforma de desenvolvimento de aplicativos de IA conversacional"
                icon="🧠"
                color="blue"
                buttonText="Configurar Dify"
                buttonAction={() => setActiveTab("dify")}
              />
              
              <IntegrationCard 
                title="n8n"
                description="Automação de fluxos de trabalho e integração entre serviços"
                icon="⚙️"
                color="purple" 
                buttonText="Configurar n8n"
                buttonAction={() => setActiveTab("n8n")}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="dify">
            <DifyIntegration instanceName={instanceName} />
          </TabsContent>
          
          <TabsContent value="n8n">
            <N8nIntegration instanceName={instanceName} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BotIntegration;
