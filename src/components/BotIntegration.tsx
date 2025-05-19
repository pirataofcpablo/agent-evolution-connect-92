
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { checkInstanceStatus } from '@/services/difyService';
import DifyIntegration from './DifyIntegration';
import N8nIntegration from './N8nIntegration';
import IntegrationCard from './IntegrationCard';
import { Loader2 } from 'lucide-react';

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
  
  // Verificar o status da instância quando o componente é montado
  useEffect(() => {
    const verifyInstance = async () => {
      if (!initialInstanceName) {
        setInstanceConnected(false);
        return;
      }
      
      setVerifyingInstance(true);
      try {
        const status = await checkInstanceStatus(initialInstanceName);
        setInstanceConnected(status.exists && status.connected);
        
        if (!status.exists) {
          setInstanceError(`Instância ${initialInstanceName} não encontrada. Verifique se você criou e conectou corretamente.`);
        } else if (!status.connected) {
          setInstanceError(`Instância ${initialInstanceName} encontrada, mas não está conectada. Volte à aba Conectar e escaneie o QR Code.`);
        } else {
          setInstanceError(null);
        }
      } catch (error) {
        console.error("Erro ao verificar instância:", error);
        setInstanceConnected(false);
      } finally {
        setVerifyingInstance(false);
      }
    };
    
    verifyInstance();
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
            <button 
              onClick={() => document.querySelector('[value="conexao"]')?.dispatchEvent(new Event('click'))}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
            >
              Ir para Conexão
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/20 bg-black">
      <CardHeader>
        <CardTitle className="text-xl text-blue-400">Integração de Bots</CardTitle>
        <CardDescription className="text-gray-400">
          Integre bots Dify e n8n à instância {instanceName}
        </CardDescription>
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
