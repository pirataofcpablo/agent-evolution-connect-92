
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import BotIntegration from "@/components/BotIntegration";
import WhatsAppConnection from "@/components/WhatsAppConnection";
import BotStatus from "@/components/BotStatus";
import { toast } from "@/components/ui/use-toast";
import { getDifyConfig } from '@/services/difyService';
import { getN8nConfig } from '@/services/n8nService';

const Index = () => {
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [difyConfigured, setDifyConfigured] = useState(false);
  const [n8nConfigured, setN8nConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState("conexao");
  
  // Verifica se há uma instância conectada ao carregar a página
  useEffect(() => {
    try {
      const storedInstanceName = localStorage.getItem('instanceName');
      const storedInstanceStatus = localStorage.getItem('instanceStatus');
      
      console.log("Verificando instância:", storedInstanceName, storedInstanceStatus);
      
      if (storedInstanceName && storedInstanceStatus && storedInstanceStatus !== "Desligada") {
        const baseInstanceName = storedInstanceName.replace("_Cliente", "");
        setInstanceConnected(true);
        setInstanceName(baseInstanceName);
        console.log("Instância conectada:", baseInstanceName);
        
        // Verificar se há configurações para Dify e n8n
        try {
          const difyConfig = getDifyConfig(baseInstanceName);
          const n8nConfig = getN8nConfig(baseInstanceName);
          
          console.log("Configuração Dify:", difyConfig ? "Encontrada" : "Não encontrada");
          console.log("Configuração n8n:", n8nConfig ? "Encontrada" : "Não encontrada");
          
          setDifyConfigured(!!difyConfig);
          setN8nConfigured(!!n8nConfig);
          
          // Redirecionar para status se já estiver configurado
          if (difyConfig || n8nConfig) {
            setActiveTab("status");
            toast({
              title: "Serviços Ativos",
              description: `${difyConfig ? "Dify IA" : ""}${difyConfig && n8nConfig ? " e " : ""}${n8nConfig ? "n8n" : ""} configurados e ativos`,
            });
          }
        } catch (error) {
          console.error("Erro ao verificar configurações:", error);
        }
      } else {
        console.log("Nenhuma instância conectada");
      }
    } catch (error) {
      console.error("Erro ao carregar dados da instância:", error);
    }
  }, []);

  // Função segura para mudar de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">Sistema SAAS de Agentes IA</h1>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
