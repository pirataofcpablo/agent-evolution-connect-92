
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
import { verifyConnectedInstance } from '@/services/evoService';

const Index = () => {
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [difyConfigured, setDifyConfigured] = useState(false);
  const [n8nConfigured, setN8nConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState("conexao");
  const [loading, setLoading] = useState(true);
  
  // Check if an instance is connected when loading the page
  useEffect(() => {
    const checkInstances = async () => {
      setLoading(true);
      try {
        // Verificar diretamente na API Evolution se há instâncias conectadas
        console.log("Verificando instâncias conectadas na API Evolution...");
        const { instanceName: connectedName, status } = await verifyConnectedInstance();
        
        if (connectedName) {
          console.log(`Instância conectada encontrada: ${connectedName} com status: ${status}`);
          
          // Extract base name without "_Cliente" suffix for display and configuration lookup
          const baseInstanceName = connectedName.replace("_Cliente", "");
          setInstanceConnected(true);
          setInstanceName(baseInstanceName);
          
          // Atualizar localStorage com dados verificados
          localStorage.setItem('instanceName', `${baseInstanceName}_Cliente`);
          localStorage.setItem('instanceStatus', status || 'Connected');
          
          // Check if there are Dify and n8n configurations
          try {
            const difyConfig = getDifyConfig(baseInstanceName);
            const n8nConfig = getN8nConfig(baseInstanceName);
            
            console.log("Configuração Dify:", difyConfig ? "Encontrada" : "Não encontrada");
            console.log("Configuração n8n:", n8nConfig ? "Encontrada" : "Não encontrada");
            
            setDifyConfigured(!!difyConfig);
            setN8nConfigured(!!n8nConfig);
            
            // Redirect to status if already configured
            if (difyConfig || n8nConfig) {
              setActiveTab("status");
              
              // Show services that are active
              let activeServices = [];
              if (difyConfig) activeServices.push("Dify IA");
              if (n8nConfig) activeServices.push("n8n");
              
              const servicesMessage = activeServices.join(" e ");
              
              toast({
                title: "Serviços Ativos",
                description: `${servicesMessage} configurado${activeServices.length > 1 ? 's' : ''} e ativo${activeServices.length > 1 ? 's' : ''}`,
              });
            } else {
              // Se encontrou instância mas não tem configurações, ir para a aba de bots
              setActiveTab("bots");
            }
          } catch (error) {
            console.error("Erro ao verificar configurações:", error);
          }
        } else {
          console.log("Nenhuma instância conectada encontrada na API.");
          
          // Cair no fallback de verificar no localStorage
          checkLocalStorage();
        }
      } catch (error) {
        console.error("Erro ao verificar instâncias na API Evolution:", error);
        
        // Em caso de erro, tentar verificar o localStorage
        checkLocalStorage();
      } finally {
        setLoading(false);
      }
    };
    
    // Função de fallback para verificar localStorage
    const checkLocalStorage = () => {
      try {
        const storedInstanceName = localStorage.getItem('instanceName');
        const storedInstanceStatus = localStorage.getItem('instanceStatus');
        
        console.log("Verificando instância no localStorage:", storedInstanceName, storedInstanceStatus);
        
        if (storedInstanceName && storedInstanceStatus && storedInstanceStatus !== "Desligada") {
          // Extract base name without "_Cliente" suffix for display
          const baseInstanceName = storedInstanceName.replace("_Cliente", "");
          setInstanceConnected(true);
          setInstanceName(baseInstanceName);
          console.log("Instância conectada pelo localStorage:", baseInstanceName);
          
          // Check if there are Dify and n8n configurations
          const difyConfig = getDifyConfig(baseInstanceName);
          const n8nConfig = getN8nConfig(baseInstanceName);
          
          setDifyConfigured(!!difyConfig);
          setN8nConfigured(!!n8nConfig);
          
          // Ir para aba de integração se tiver instância mas não tiver configurações
          if (!difyConfig && !n8nConfig) {
            setActiveTab("bots");
          }
        } else {
          console.log("Nenhuma instância conectada no localStorage");
          setInstanceConnected(false);
          setInstanceName("");
          setActiveTab("conexao");
        }
      } catch (error) {
        console.error("Erro ao carregar dados da instância do localStorage:", error);
        setInstanceConnected(false);
        setInstanceName("");
      }
    };
    
    checkInstances();
  }, []);

  // Safe function to change tabs
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
