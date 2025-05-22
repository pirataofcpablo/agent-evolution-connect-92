
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { getDifyConfig } from '@/services/difyService';
import { getN8nConfig, checkN8nFlowExists, createN8nFlow } from '@/services/n8nService';
import { getInstanceDetails } from '@/services/evoService';
import IntegrationStatusCard from './bot/IntegrationStatusCard';
import TestMessageForm from './bot/TestMessageForm';
import LastSentMessage from './bot/LastSentMessage';
import BotInfoCard from './bot/BotInfoCard';

interface BotStatusProps {
  instanceName: string | null;
}

const BotStatus: React.FC<BotStatusProps> = ({ instanceName }) => {
  const [difyActive, setDifyActive] = useState(false);
  const [n8nActive, setN8nActive] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null);
  const [lastRecipient, setLastRecipient] = useState<string | null>(null);
  const [isFixingN8n, setIsFixingN8n] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const checkIntegrations = async () => {
    if (instanceName) {
      try {
        // Get the current logged in user's ID
        const currentUserId = localStorage.getItem('currentUserId') || 'default';
        
        // Check if we have a user-specific instance name stored
        const userInstanceName = localStorage.getItem(`instanceName_${currentUserId}`) || instanceName;
        
        // Remove "_Cliente" suffix from instance name to check configurations
        const baseInstanceName = userInstanceName.replace("_Cliente", "");
        
        // Check Dify and n8n configurations
        const difyConfig = getDifyConfig();
        const n8nConfig = getN8nConfig(baseInstanceName);
        
        setDifyActive(!!difyConfig);
        setN8nActive(!!n8nConfig);

        // Collect diagnostic information
        const instanceDetails = await getInstanceDetails(userInstanceName);
        const n8nFlowExists = n8nConfig ? await checkN8nFlowExists(baseInstanceName) : false;

        setDiagnosticInfo({
          instanceName: userInstanceName,
          baseInstanceName,
          instanceDetails,
          n8nConfig,
          n8nFlowExists,
          lastChecked: new Date().toISOString()
        });

      } catch (error) {
        console.error("Erro ao verificar integrações:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar as integrações.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    checkIntegrations();
  }, [instanceName]);

  const handleMessageSent = (message: string, recipient: string) => {
    setLastSentMessage(message);
    setLastRecipient(recipient);
  };

  const handleFixN8nIntegration = async () => {
    if (!instanceName) return;
    
    setIsFixingN8n(true);
    try {
      // Extract base instance name
      const baseInstanceName = instanceName.replace("_Cliente", "");
      
      // Attempt to create a new n8n flow
      const result = await createN8nFlow({
        instanceName: baseInstanceName,
        userName: baseInstanceName,
        webhookUrl: ""
      });

      if (result.success) {
        toast({
          title: "Integração n8n Corrigida",
          description: `Novo fluxo criado com sucesso para ${baseInstanceName}`,
        });
        
        // Update status
        await checkIntegrations();
        setN8nActive(true);
      } else {
        toast({
          title: "Erro na Correção",
          description: "Não foi possível criar um novo fluxo n8n. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao corrigir integração n8n:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar corrigir a integração n8n.",
        variant: "destructive",
      });
    } finally {
      setIsFixingN8n(false);
    }
  };

  const hasActiveIntegrations = difyActive || n8nActive;

  return (
    <Card className="border-blue-500/20 bg-black">
      <CardHeader className="flex flex-row justify-between items-start space-y-0">
        <div>
          <CardTitle className="text-xl text-blue-400">Status dos Bots</CardTitle>
          <CardDescription className="text-gray-400">
            Verifique o status das integrações e teste os bots
          </CardDescription>
        </div>
        <div className="space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className="text-gray-400 hover:text-blue-400"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Diagnóstico
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkIntegrations}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Diagnóstico de problemas */}
          {showDiagnostic && diagnosticInfo && (
            <div className="p-4 border border-yellow-500/30 bg-yellow-900/20 rounded-md mb-4">
              <h3 className="text-yellow-400 text-lg font-medium mb-2">Informações de Diagnóstico</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 bg-black/30 rounded">
                    <p className="text-gray-400 text-sm">Instância: <span className="text-white">{diagnosticInfo.instanceName}</span></p>
                  </div>
                  <div className="p-2 bg-black/30 rounded">
                    <p className="text-gray-400 text-sm">Nome Base: <span className="text-white">{diagnosticInfo.baseInstanceName}</span></p>
                  </div>
                  <div className="p-2 bg-black/30 rounded">
                    <p className="text-gray-400 text-sm">Status n8n: <span className={diagnosticInfo.n8nFlowExists ? "text-green-400" : "text-red-400"}>
                      {diagnosticInfo.n8nFlowExists ? "Fluxo Detectado" : "Fluxo Não Detectado"}
                    </span></p>
                  </div>
                  <div className="p-2 bg-black/30 rounded">
                    <p className="text-gray-400 text-sm">Configuração n8n: <span className={diagnosticInfo.n8nConfig ? "text-green-400" : "text-red-400"}>
                      {diagnosticInfo.n8nConfig ? "Configurada" : "Não Configurada"}
                    </span></p>
                  </div>
                </div>
                
                {!diagnosticInfo.n8nFlowExists && (
                  <div className="mt-4">
                    <h4 className="text-white text-sm font-medium mb-2">Solução de Problemas:</h4>
                    <Button 
                      onClick={handleFixN8nIntegration}
                      disabled={isFixingN8n} 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {isFixingN8n ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Tentando Corrigir...
                        </>
                      ) : (
                        <>
                          Tentar Corrigir Integração n8n
                        </>
                      )}
                    </Button>
                    <p className="text-gray-400 text-xs mt-2">
                      Este botão tentará criar um novo fluxo n8n para sua instância.
                      Se o problema persistir, vá para a aba "Integrar Bots" e configure manualmente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status das integrações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationStatusCard 
              name="Dify IA"
              isActive={difyActive}
              description="Integração ativa e pronta para processar mensagens"
              activeMessage="Webhook configurado e recebendo mensagens do WhatsApp"
            />
            
            <IntegrationStatusCard 
              name="n8n"
              isActive={n8nActive}
              description="Integração ativa e pronta para processar mensagens"
              activeMessage="Webhook configurado e enviando mensagens para n8n"
            />
          </div>
          
          {/* Testar bot */}
          <TestMessageForm 
            instanceName={instanceName}
            hasActiveIntegrations={hasActiveIntegrations}
            onMessageSent={handleMessageSent}
          />
          
          <LastSentMessage 
            message={lastSentMessage}
            recipient={lastRecipient}
          />
          
          {/* Informações sobre o funcionamento */}
          <BotInfoCard />
        </div>
      </CardContent>
    </Card>
  );
};

export default BotStatus;
