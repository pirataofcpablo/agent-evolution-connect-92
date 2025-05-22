
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from 'react-router-dom';
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import BotIntegration from "@/components/BotIntegration";
import WhatsAppConnection from "@/components/WhatsAppConnection";
import BotStatus from "@/components/BotStatus";
import AuthCheck from "@/components/AuthCheck";
import { toast } from "@/components/ui/use-toast";
import { getN8nConfig } from '@/services/n8nService';
import { verifyConnectedInstance, fetchAllInstances, getInstanceDetails } from '@/services/evoService';

const Index = () => {
  const location = useLocation();
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [n8nConfigured, setN8nConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set initial tab based on path
  const getInitialTab = () => {
    if (location.pathname === "/bots") return "bots";
    if (location.pathname === "/status") return "status";
    return "conexao";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // Check if an instance is connected when loading the page
  useEffect(() => {
    // Update active tab when route changes
    setActiveTab(getInitialTab());
    
    const checkInstances = async () => {
      setLoading(true);
      try {
        console.log("Verificando instâncias conectadas na API Evolution...");
        
        // Verificar diretamente na API Evolution se há instâncias disponíveis
        const instances = await fetchAllInstances();
        console.log(`Encontradas ${instances.length} instâncias na API`);
        
        // Exibir todas instâncias para debug
        if (Array.isArray(instances) && instances.length > 0) {
          console.log("Todas instâncias disponíveis:");
          instances.forEach((inst, idx) => {
            console.log(`${idx + 1}. Nome: ${inst.instanceName || inst.name || 'N/A'} | Status: ${inst.status || inst.connectionStatus || 'N/A'}`);
          });
          
          // Verificar diretamente se há alguma instância com status "open" ou "connected"
          for (const inst of instances) {
            const status = inst.status || inst.connectionStatus;
            const isConnected = 
              status === "CONNECTED" || 
              status === "ONLINE" || 
              status === "On" ||
              status === "Connected" ||
              status === "open";
              
            if (isConnected) {
              const instName = inst.instanceName || inst.name;
              if (instName) {
                const baseInstanceName = instName.replace("_Cliente", "");
                setInstanceConnected(true);
                setInstanceName(baseInstanceName);
                
                // Atualizar localStorage com dados verificados
                localStorage.setItem('instanceName', instName);
                localStorage.setItem('instanceStatus', status || 'Connected');
                
                // Verificar apenas n8n
                try {
                  const n8nConfig = getN8nConfig(baseInstanceName);
                  
                  console.log("n8n config:", n8nConfig ? "Encontrada" : "Não encontrada");
                  
                  setN8nConfigured(!!n8nConfig);
                  
                  // Redirect to status if already configured
                  if (n8nConfig) {
                    setActiveTab("status");
                    
                    toast({
                      title: "Serviços Ativos",
                      description: "n8n configurado e ativo",
                    });
                  } else {
                    // Se encontrou instância mas não tem configurações, ir para a aba de bots
                    setActiveTab("bots");
                    
                    toast({
                      title: "Instância Conectada",
                      description: `Instância ${baseInstanceName} está conectada. Configure os bots agora.`,
                    });
                  }
                } catch (error) {
                  console.error("Erro ao verificar configurações:", error);
                  setActiveTab("bots");
                }
                
                setLoading(false);
                return;
              }
            }
          }
        }
        
        // Verificar se alguma instância está conectada usando o método verifyConnectedInstance
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
          
          // Buscar detalhes adicionais da instância
          const instanceDetails = await getInstanceDetails(`${baseInstanceName}_Cliente`);
          if (instanceDetails) {
            console.log("Detalhes completos da instância:", instanceDetails);
          }
          
          // Verificar apenas n8n
          try {
            const n8nConfig = getN8nConfig(baseInstanceName);
            
            console.log("n8n config:", n8nConfig ? "Encontrada" : "Não encontrada");
            
            setN8nConfigured(!!n8nConfig);
            
            // Redirect to status if already configured
            if (n8nConfig) {
              setActiveTab("status");
              
              toast({
                title: "Serviços Ativos",
                description: "n8n configurado e ativo",
              });
            } else {
              // Se encontrou instância mas não tem configurações, ir para a aba de bots
              setActiveTab("bots");
              
              toast({
                title: "Instância Conectada",
                description: `Instância ${baseInstanceName} está conectada. Configure os bots agora.`,
              });
            }
          } catch (error) {
            console.error("Erro ao verificar configurações:", error);
            setActiveTab("bots");
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
          
          // Verificar apenas n8n
          const n8nConfig = getN8nConfig(baseInstanceName);
          
          setN8nConfigured(!!n8nConfig);
          
          // Ir para aba de integração se tiver instância mas não tiver configurações
          if (!n8nConfig) {
            setActiveTab("bots");
          } else {
            setActiveTab("status");
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
  }, [location.pathname]);

  // Safe function to change tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <AuthCheck>
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
    </AuthCheck>
  );
};

export default Index;
