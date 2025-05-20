import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  saveDifyConfig, 
  getDifyConfig, 
  testDifyConnection, 
  registerDifyBot, 
  checkInstanceStatus,
  checkExistingWebhooks,
  setupDifyWebhookViaProxy,
  configureDifyWebhook,
  buildDifyWebhookPayload
} from '@/services/difyService';
import { 
  getInstanceDetails, 
  fetchAllInstances 
} from '@/services/evoService';
import { Loader2, Bot, CheckCircle, AlertCircle, InfoIcon, RefreshCw, ExternalLink, Copy, RotateCw, Settings, Webhook, Wrench } from "lucide-react";
import DifySetupIframe from './DifySetupIframe';
import { Textarea } from '@/components/ui/textarea';

interface DifyIntegrationProps {
  instanceName: string;
}

const DifyIntegration: React.FC<DifyIntegrationProps> = ({ instanceName }) => {
  // Base configuration state
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.dify.ai/v1");
  const [applicationId, setApplicationId] = useState("");
  const [modelType, setModelType] = useState("chat");
  
  // Webhook configuration state
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [difyWebhookUrl, setDifyWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [n8nIntegration, setN8nIntegration] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  
  // Operational state
  const [isLoading, setIsLoading] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [integrationComplete, setIntegrationComplete] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [instanceVerifying, setInstanceVerifying] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<{exists: boolean, connected: boolean} | null>(null);
  const [instanceDetails, setInstanceDetails] = useState<any>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [manualWebhookMode, setManualWebhookMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [integrationAttempts, setIntegrationAttempts] = useState(0);
  const [existingWebhooks, setExistingWebhooks] = useState<any[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [usingProxySetup, setUsingProxySetup] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [webhookPayloadTemplate, setWebhookPayloadTemplate] = useState(
`{
  "message": "{{message}}",
  "sender": "{{sender}}",
  "instance": "{{instance}}",
  "timestamp": "{{timestamp}}"
}`
  );
  
  // Função para copiar dados para a área de transferência com feedback
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(label);
        setTimeout(() => setCopySuccess(null), 2000);
        
        toast({
          title: "Copiado!",
          description: `${label} copiado para a área de transferência.`,
          duration: 2000,
        });
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto.",
          variant: "destructive",
        });
      });
  };
  
  // Verificar webhooks existentes
  const checkWebhooks = async () => {
    if (!instanceName) return;
    
    try {
      const webhooks = await checkExistingWebhooks(instanceName);
      console.log("Webhooks encontrados:", webhooks);
      setExistingWebhooks(webhooks || []);
      
      // Se encontrou webhooks do tipo dify, considerar integração completa
      if (webhooks && webhooks.length > 0) {
        console.log("Webhook Dify já configurado!");
        setIntegrationComplete(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar webhooks:", error);
      return false;
    }
  };
  
  // Nova função para verificar status da instância de forma mais robusta
  const verifyInstanceStatus = async () => {
    if (!instanceName) return;
    
    setInstanceVerifying(true);
    setRegistrationError(null);
    
    try {
      console.log(`Verificando status da instância: ${instanceName}`);
      
      // 1. Primeiro, tentar obter detalhes diretos da instância
      const baseName = instanceName.replace("_Cliente", "");
      const fullName = `${baseName}_Cliente`;
      
      // Verificar com ambos os nomes possíveis
      const details = await getInstanceDetails(fullName);
      setInstanceDetails(details);
      
      if (details) {
        console.log(`Detalhes da instância obtidos:`, details);
        
        // Verificar status de conexão
        const status = details.status || details.connectionStatus;
        const connected = 
          status === "CONNECTED" || 
          status === "ONLINE" || 
          status === "On" ||
          status === "Connected" ||
          status === "open";
        
        setInstanceStatus({
          exists: true,
          connected: connected
        });
        
        // Verificar webhooks existentes
        await checkWebhooks();
        
        if (connected) {
          console.log(`Instância ${details.instanceName || details.name} está conectada!`);
        } else {
          setRegistrationError(`A instância ${details.instanceName || details.name} existe, mas não está conectada (status: ${status}). Verifique na aba Conectar.`);
        }
      } else {
        // 2. Se não obteve detalhes diretos, tentar buscar na lista de instâncias
        console.log("Tentando buscar na lista completa de instâncias...");
        const instances = await fetchAllInstances();
        
        // Verificar correspondências na lista
        const matchedInstance = instances.find(inst => {
          const instName = inst.instanceName || inst.name;
          if (!instName) return false;
          
          return instName.toLowerCase() === fullName.toLowerCase() ||
                 instName.toLowerCase() === instanceName.toLowerCase() ||
                 instName.toLowerCase().includes(baseName.toLowerCase());
        });
        
        if (matchedInstance) {
          console.log(`Instância encontrada na lista completa: ${matchedInstance.instanceName || matchedInstance.name}`);
          setInstanceDetails(matchedInstance);
          
          // Verificar status
          const status = matchedInstance.status || matchedInstance.connectionStatus;
          const connected = 
            status === "CONNECTED" || 
            status === "ONLINE" || 
            status === "On" ||
            status === "Connected" ||
            status === "open";
            
          setInstanceStatus({
            exists: true,
            connected: connected
          });
          
          // Verificar webhooks existentes
          await checkWebhooks();
          
          if (!connected) {
            setRegistrationError(`A instância ${matchedInstance.instanceName || matchedInstance.name} existe, mas não está conectada (status: ${status}). Verifique na aba Conectar.`);
          }
        } else {
          // 3. Se ainda não encontrou, usar o checkInstanceStatus como último recurso
          console.log("Último recurso: checkInstanceStatus");
          const status = await checkInstanceStatus(instanceName);
          setInstanceStatus(status);
          
          if (!status.exists) {
            setRegistrationError(`A instância ${instanceName} não foi encontrada. Verifique se você criou e conectou corretamente.`);
          } else if (!status.connected) {
            setRegistrationError(`A instância ${instanceName} existe, mas não está conectada. Volte à aba Conectar e escaneie o QR Code.`);
          } else {
            // Verificar webhooks existentes
            await checkWebhooks();
          }
        }
      }
    } catch (error) {
      console.error("Erro ao verificar instância:", error);
      setRegistrationError("Erro ao verificar status da instância. Por favor, tente novamente.");
    } finally {
      setInstanceVerifying(false);
    }
  };
  
  // Botão para atualizar status manualmente
  const handleRefreshStatus = async () => {
    setRefreshingStatus(true);
    try {
      await verifyInstanceStatus();
    } finally {
      setRefreshingStatus(false);
    }
  };
  
  // Verificar status da instância quando o componente é montado
  useEffect(() => {
    verifyInstanceStatus();
    
    // Tentar carregar configuração salva do Dify
    if (instanceName) {
      try {
        const normalizedName = instanceName.replace("_Cliente", "");
        const savedConfig = getDifyConfig(normalizedName);
        
        if (savedConfig) {
          console.log("Configuração Dify encontrada para", normalizedName);
          setApiKey(savedConfig.apiKey);
          setApiUrl(savedConfig.apiUrl || "https://api.dify.ai/v1");
          setApplicationId(savedConfig.applicationId || "");
          setModelType(savedConfig.modelType || "chat");
          
          // Carregar configurações de webhook, se existirem
          setWebhookEnabled(savedConfig.webhookEnabled || false);
          setDifyWebhookUrl(savedConfig.difyWebhookUrl || "");
          setWebhookSecret(savedConfig.webhookSecret || "");
          setN8nIntegration(savedConfig.n8nIntegration || false);
          setN8nWebhookUrl(savedConfig.n8nWebhookUrl || "");
          setWebhookPayloadTemplate(savedConfig.webhookPayloadTemplate || webhookPayloadTemplate);
          
          // Verificar se tem uma integração válida
          const hasValidWebhook = checkWebhooks();
          
          if (hasValidWebhook) {
            setIntegrationComplete(true);
            setConnectionSuccess(true);
          } else {
            // Se tem configuração mas não tem webhook, permitir reintegração
            setIntegrationComplete(false);
            // Testar conexão
            testDifyConnection(savedConfig).then(success => {
              setConnectionSuccess(success);
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configuração Dify:", error);
      }
    }
  }, [instanceName]);

  const handleTestConnection = async () => {
    if (!apiKey || !applicationId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a API Key e o ID da Aplicação",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionSuccess(false);
    setRegistrationError(null);
    
    try {
      const config = {
        apiKey,
        apiUrl,
        applicationId,
        modelType,
        webhookEnabled,
        difyWebhookUrl,
        webhookSecret,
        n8nIntegration,
        n8nWebhookUrl,
        webhookPayloadTemplate
      };
      
      console.log("Testando conexão com Dify...");
      console.log("Configuração:", config);
      const success = await testDifyConnection(config);
      
      if (success) {
        setConnectionSuccess(true);
        toast({
          title: "Conexão bem-sucedida",
          description: "A conexão com o Dify foi estabelecida com sucesso.",
        });
      } else {
        throw new Error("Não foi possível conectar ao Dify. Verifique a URL da API e suas credenciais.");
      }
    } catch (error: any) {
      console.error("Erro na conexão:", error);
      setConnectionSuccess(false);
      toast({
        title: "Erro na conexão",
        description: error.message || "Não foi possível conectar ao Dify. Verifique suas credenciais.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleManualWebhookToggle = () => {
    setManualWebhookMode(!manualWebhookMode);
  };
  
  // Função para mostrar iframe de configuração
  const handleShowIframe = () => {
    setShowIframe(true);
  };

  // Função para configurar via proxy
  const handleProxySetup = async () => {
    if (!apiKey || !applicationId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    setUsingProxySetup(true);
    setProcessingStatus("Configurando webhook via proxy...");
    
    try {
      const config = {
        apiKey,
        apiUrl,
        applicationId,
        modelType,
        webhookEnabled,
        difyWebhookUrl,
        webhookSecret,
        n8nIntegration,
        n8nWebhookUrl,
        webhookPayloadTemplate
      };
      
      const success = await setupDifyWebhookViaProxy(instanceName, config);
      
      if (success) {
        setIntegrationComplete(true);
        saveDifyConfig({
          instanceName: instanceName.replace("_Cliente", ""),
          apiKey,
          apiUrl,
          applicationId,
          modelType,
          webhookEnabled,
          difyWebhookUrl,
          webhookSecret,
          n8nIntegration,
          n8nWebhookUrl,
          enabled: true,
          webhookPayloadTemplate
        });
        
        toast({
          title: "Integração realizada",
          description: "O bot Dify foi integrado com sucesso à instância " + instanceName,
        });
        
        // Verificar se o webhook foi realmente registrado
        await checkWebhooks();
      } else {
        throw new Error("Não foi possível configurar o webhook via proxy.");
      }
    } catch (error: any) {
      console.error("Erro na configuração via proxy:", error);
      setRegistrationError(error.message);
      
      toast({
        title: "Erro na configuração",
        description: error.message || "Não foi possível configurar o webhook via proxy.",
        variant: "destructive",
      });
    } finally {
      setUsingProxySetup(false);
      setProcessingStatus(null);
    }
  };

  const handleConfigureWebhook = async () => {
    if (!webhookEnabled) return;
    
    setIsLoading(true);
    setProcessingStatus("Configurando webhook do Dify...");
    
    try {
      // Verificar se é necessário configurar o webhook do Dify
      if (webhookEnabled && difyWebhookUrl) {
        const config = {
          apiKey,
          apiUrl,
          applicationId,
          modelType,
          webhookEnabled,
          difyWebhookUrl,
          webhookSecret,
          n8nIntegration,
          n8nWebhookUrl,
          webhookPayloadTemplate
        };
        
        const webhookConfigured = await configureDifyWebhook(config);
        
        if (webhookConfigured) {
          toast({
            title: "Webhook configurado",
            description: "O webhook do Dify foi configurado com sucesso.",
          });
        } else {
          toast({
            title: "Aviso",
            description: "Não foi possível configurar o webhook automaticamente. Você pode precisar configurá-lo manualmente no painel do Dify.",
            // Changed from "warning" to "destructive" as only "default" or "destructive" are valid options
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Erro na configuração do webhook:", error);
      
      toast({
        title: "Erro na configuração do webhook",
        description: error.message || "Não foi possível configurar o webhook do Dify.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey || !applicationId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRegistrationError(null);
    setProcessingStatus("Iniciando processo de integração...");
    setIntegrationAttempts(prev => prev + 1);
    
    try {
      if (!instanceName) {
        throw new Error("Nome da instância não fornecido");
      }
      
      // Verificar status da instância antes de prosseguir
      setProcessingStatus("Verificando status da instância...");
      const status = await checkInstanceStatus(instanceName);
      if (!status.exists) {
        throw new Error(`Instância ${instanceName} não encontrada. Verifique se você criou a instância corretamente.`);
      }
      
      if (!status.connected) {
        throw new Error(`Instância ${instanceName} existe, mas não está conectada. Conecte-a primeiro na aba Conectar.`);
      }
      
      console.log(`Iniciando integração com Dify para a instância: ${instanceName}`);
      console.log(`Status da conexão antes do registro: ${connectionSuccess ? "Conectado" : "Não conectado"}`);
      
      // Configuração do Dify
      const config = {
        apiKey,
        apiUrl,
        applicationId,
        modelType,
        webhookEnabled,
        difyWebhookUrl,
        webhookSecret,
        n8nIntegration,
        n8nWebhookUrl,
        webhookPayloadTemplate
      };
      
      // Testar conexão antes de prosseguir
      setProcessingStatus("Testando conexão com Dify...");
      console.log("Testando conexão com Dify antes da integração...");
      const isConnected = await testDifyConnection(config);
      
      if (!isConnected) {
        throw new Error("Não foi possível conectar ao Dify. Verifique suas credenciais e a URL da API.");
      }
      
      console.log("Conexão com Dify estabelecida com sucesso.");
      
      // Verificar webhooks existentes
      setProcessingStatus("Verificando webhooks existentes...");
      const hasExistingWebhook = await checkWebhooks();
      
      if (hasExistingWebhook) {
        console.log("Webhook já configurado, atualizando configuração local");
        saveDifyConfig({
          instanceName: instanceName.replace("_Cliente", ""),
          apiKey,
          apiUrl,
          applicationId,
          modelType,
          webhookEnabled,
          difyWebhookUrl,
          webhookSecret,
          n8nIntegration,
          n8nWebhookUrl,
          enabled: true,
          webhookPayloadTemplate
        });
        setIntegrationComplete(true);
        
        toast({
          title: "Integração atualizada",
          description: "O webhook já estava configurado. Configuração local atualizada.",
        });
        
        // Se webhook está ativado, configurá-lo
        if (webhookEnabled && difyWebhookUrl) {
          await handleConfigureWebhook();
        }
        
        return;
      }
      
      // Registrar o bot Dify na Evolution API
      setProcessingStatus("Registrando webhook na Evolution API...");
      console.log(`Registrando bot Dify para a instância: ${instanceName}`);
      
      try {
        await registerDifyBot(instanceName, config);
        setIntegrationComplete(true);
        
        // Se webhook está ativado, configurá-lo
        if (webhookEnabled && difyWebhookUrl) {
          await handleConfigureWebhook();
        }
        
        toast({
          title: "Integração realizada",
          description: "O bot Dify foi integrado com sucesso à instância " + instanceName,
        });
        
        // Verificar se o webhook foi realmente registrado
        await checkWebhooks();
      } catch (webhookError: any) {
        console.error("Erro específico no registro do webhook:", webhookError);
        
        // Salvar configuração local mesmo com erro no webhook
        saveDifyConfig({
          instanceName: instanceName.replace("_Cliente", ""),
          apiKey,
          apiUrl,
          applicationId,
          modelType,
          webhookEnabled,
          difyWebhookUrl,
          webhookSecret,
          n8nIntegration,
          n8nWebhookUrl,
          enabled: true,
          webhookPayloadTemplate
        });
        
        // Mostrar alerta específico de webhook
        setRegistrationError(`Configuração do Dify foi salva localmente, mas houve um problema no registro do webhook: ${webhookError.message || "Erro desconhecido no webhook"}`);
        
        // Mover para modo manual de configuração de webhook
        setManualWebhookMode(true);
        
        // Consideramos parcialmente configurado
        setIntegrationComplete(true);
        
        toast({
          title: "Integração parcial",
          description: "Configuração salva localmente, mas houve um problema no registro do webhook.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Erro ao realizar integração:", error);
      setRegistrationError(error.message || "Erro desconhecido");
      toast({
        title: "Erro na Integração",
        description: error.message || "Houve um erro ao realizar a integração do Dify.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };

  const handleCancel = () => {
    console.log("Cancelando operação");
    setApiKey("");
    setApiUrl("https://api.dify.ai/v1");
    setApplicationId("");
    setModelType("chat");
    setDifyWebhookUrl("");
    setWebhookSecret("");
    setN8nIntegration(false);
    setN8nWebhookUrl("");
  };

  // Fix for buildDifyWebhookPayload parameters
  const handleWebhookPayloadExample = () => {
    try {
      // Use specific string values for the payload example
      const messageText = "Exemplo de mensagem";
      const senderValue = "5511999999999";
      const instanceValue = instanceName || "instance_name";
      const timestampValue = new Date().toISOString();
      
      // Create payload with these explicit values
      const examplePayload = buildDifyWebhookPayload(
        messageText,
        senderValue,
        instanceValue,
        webhookPayloadTemplate
      );
      
      return JSON.stringify(examplePayload, null, 2);
    } catch (error) {
      console.error("Erro ao gerar exemplo de payload:", error);
      return "{ \"error\": \"Não foi possível gerar o exemplo\" }";
    }
  };

  return (
    <div className="space-y-6">
      <DifySetupIframe
        isOpen={showIframe}
        onClose={() => setShowIframe(false)}
        instanceName={instanceName}
        config={{
          apiKey,
          apiUrl,
          applicationId,
          modelType
        }}
      />
      
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-400 mb-2">Sobre a integração com Dify</h3>
        <p className="text-gray-300">
          Dify é uma plataforma avançada de IA que permite criar assistentes virtuais e chatbots 
          com facilidade. Com esta integração, você pode conectar seu agente Dify diretamente à sua 
          instância WhatsApp.
        </p>
      </div>

      {/* Status e ação de atualização */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-blue-400">Status da Instância</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshStatus}
          disabled={refreshingStatus || instanceVerifying}
        >
          {refreshingStatus ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar Status
        </Button>
      </div>

      {/* Verificação de instância */}
      {instanceVerifying ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-300">Verificando status da instância...</span>
        </div>
      ) : (
        <>
          {instanceStatus && instanceStatus.exists && instanceStatus.connected && (
            <Alert className="bg-green-900/20 border-green-500/30 mb-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <AlertTitle className="text-green-400">Instância Verificada</AlertTitle>
              <AlertDescription className="text-gray-300">
                A instância {instanceDetails?.instanceName || instanceDetails?.name || instanceName} está conectada e pronta para integração.
              </AlertDescription>
            </Alert>
          )}
          
          {instanceStatus && instanceStatus.exists && !instanceStatus.connected && (
            <Alert className="bg-yellow-900/20 border-yellow-500/30 mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <AlertTitle className="text-yellow-400">Instância Desconectada</AlertTitle>
              <AlertDescription className="text-gray-300">
                A instância {instanceDetails?.instanceName || instanceDetails?.name || instanceName} existe, mas não está conectada. Volte à aba Conectar e escaneie o QR Code.
              </AlertDescription>
            </Alert>
          )}
          
          {instanceStatus && !instanceStatus.exists && (
            <Alert className="bg-red-900/20 border-red-500/30 mb-4">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <AlertTitle className="text-red-400">Instância Não Encontrada</AlertTitle>
              <AlertDescription className="text-gray-300">
                A instância {instanceName} não foi encontrada. Verifique se você criou e nomeou corretamente.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Detalhes de status se disponíveis */}
      {instanceDetails && (
        <div className="p-3 bg-gray-800/50 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Detalhes da Instância:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Nome:</div>
            <div className="text-blue-400">{instanceDetails.instanceName || instanceDetails.name}</div>
            <div className="text-gray-400">Status:</div>
            <div className={`${instanceStatus?.connected ? 'text-green-400' : 'text-yellow-400'}`}>
              {instanceDetails.status || instanceDetails.connectionStatus || "Desconhecido"}
            </div>
          </div>
        </div>
      )}

      {/* Informações de webhook existente */}
      {existingWebhooks.length > 0 && (
        <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-md mb-4">
          <h4 className="text-sm font-medium text-green-300 mb-2">
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Webhook Dify já configurado
            </span>
          </h4>
          <div className="text-sm text-gray-300">
            Esta instância já possui um webhook para o Dify configurado. 
            Qualquer alteração nas configurações será apenas local.
          </div>
        </div>
      )}

      {/* Mostrar informações adicionais quando houver problemas de webhook */}
      {manualWebhookMode && (
        <Alert className="bg-yellow-900/20 border-yellow-500/30 mb-4">
          <InfoIcon className="h-5 w-5 text-yellow-400" />
          <AlertTitle className="text-yellow-400">Configuração Manual de Webhook Necessária</AlertTitle>
          <AlertDescription className="text-gray-300 space-y-2">
            <p>
              Devido a limitações na API Evolution, pode ser necessário configurar o webhook do Dify manualmente.
              A configuração local foi salva e o serviço está parcialmente operacional.
            </p>
            
            {/* Informações para configuração manual */}
            <div className="mt-3 p-3 rounded-md bg-black/30 border border-gray-700">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">Dados para configuração manual:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">URL da API Dify:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400">{apiUrl}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(apiUrl, "URL da API")}
                    >
                      <Copy className={`h-3.5 w-3.5 ${copySuccess === "URL da API" ? "text-green-400" : "text-gray-400"}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">API Key:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400">{apiKey.substring(0, 10)}...</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(apiKey, "API Key")}
                    >
                      <Copy className={`h-3.5 w-3.5 ${copySuccess === "API Key" ? "text-green-400" : "text-gray-400"}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Instância WhatsApp:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400">{instanceDetails?.instanceName || instanceName}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(instanceDetails?.instanceName || instanceName, "Nome da instância")}
                    >
                      <Copy className={`h-3.5 w-3.5 ${copySuccess === "Nome da instância" ? "text-green-400" : "text-gray-400"}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                onClick={handleShowIframe}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar no Navegador
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="border-green-500 text-green-400 hover:bg-green-500/20"
                onClick={handleProxySetup}
                disabled={usingProxySetup}
              >
                {usingProxySetup ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                Configurar via Proxy
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
                onClick={() => window.open("https://v2.solucoesweb.uk/manager", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Evolution Manager
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {integrationComplete && !manualWebhookMode && (
        <Alert className="bg-green-900/20 border-green-500/30">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <AlertTitle className="text-green-400">Integração Completa</AlertTitle>
          <AlertDescription className="text-gray-300">
            O bot Dify está configurado para responder automaticamente às mensagens do WhatsApp.
          </AlertDescription>
        </Alert>
      )}

      {registrationError && (
        <Alert className="bg-red-900/20 border-red-500/30">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-400">Erro na Integração</AlertTitle>
          <AlertDescription className="text-gray-300">
            {registrationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Exibir o status de processamento quando estiver carregando */}
      {(isLoading || usingProxySetup) && processingStatus && (
        <div className="p-3 bg-blue-900/20 rounded-md flex items-center">
          <RotateCw className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          <span className="text-blue-300">{processingStatus}</span>
        </div>
      )}

      <form onSubmit={handleSaveIntegration} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="basic" className="text-sm">Configuração Básica</TabsTrigger>
            <TabsTrigger value="webhook" className="text-sm">Webhooks & Integrações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key do Dify</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Insira sua API Key do Dify"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-400">
                  Encontre sua API Key no painel de desenvolvedor do Dify
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  placeholder="URL da API (ex: https://api.dify.ai/v1)"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-400">
                  URL base da API do Dify (geralmente termina com /v1)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationId">ID da Aplicação</Label>
                <Input
                  id="applicationId"
                  placeholder="ID da sua aplicação no Dify"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelType">Tipo de Modelo</Label>
                <Select 
                  value={modelType} 
                  onValueChange={setModelType}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o tipo de modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="text-generation">Geração de Texto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="webhook" className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-400">Webhook do Dify</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Configure o webhook para o Dify enviar mensagens para outros sistemas
                </p>
              </div>
              <Switch 
                checked={webhookEnabled} 
                onCheckedChange={setWebhookEnabled} 
              />
            </div>
            
            {webhookEnabled && (
              <div className="pl-4 border-l-2 border-blue-700/40 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="difyWebhookUrl">URL do Webhook</Label>
                  <Input
                    id="difyWebhookUrl"
                    placeholder="https://seu-webhook.com/endpoint"
                    value={difyWebhookUrl}
                    onChange={(e) => setDifyWebhookUrl(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    URL para onde o Dify enviará as notificações de eventos (respostas da IA)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Segredo do Webhook</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    placeholder="Chave secreta para autenticar webhooks"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Opcional: Uma chave secreta para validar as solicitações do webhook
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookPayloadTemplate">Template do Payload</Label>
                  <Textarea
                    id="webhookPayloadTemplate"
                    placeholder='{"message": "{{message}}", "sender": "{{sender}}"}'
                    value={webhookPayloadTemplate}
                    onChange={(e) => setWebhookPayloadTemplate(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-32 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400">
                    Template JSON para enviar dados. Use {{message}}, {{sender}}, {{instance}}, {{timestamp}}
                  </p>
                  
                  {/* Add example section to show how the payload will look */}
                  <div className="mt-2 p-2 bg-gray-900 rounded-md border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Exemplo de payload:</p>
                    <pre className="text-xs text-blue-400 overflow-auto max-h-24">
                      {handleWebhookPayloadExample()}
                    </pre>
                  </div>
                </div>
                
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleConfigureWebhook}
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                  disabled={isLoading || !difyWebhookUrl}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Webhook className="h-4 w-4 mr-2" />
                  )}
                  Configurar Webhook
                </Button>
              </div>
            )}
            
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-purple-400">Automação n8n</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Use o n8n como intermediário entre o Dify e a Evolution API
                  </p>
                </div>
                <Switch 
                  checked={n8nIntegration} 
                  onCheckedChange={setN8nIntegration} 
                />
              </div>
              
              {n8nIntegration && (
                <div className="pl-4 border-l-2 border-purple-700/40 space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="n8nWebhookUrl">URL do Webhook n8n</Label>
                    <Input
                      id="n8nWebhookUrl"
                      placeholder="https://seu-n8n.com/webhook/123456"
                      value={n8nWebhookUrl}
                      onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <p className="text-xs text-gray-400">
                      URL do nó de webhook no seu fluxo n8n
                    </p>
                  </div>
                  
                  <Alert className="bg-purple-900/10 border-purple-700/30">
                    <Wrench className="h-4 w-4 text-purple-400" />
                    <AlertTitle className="text-purple-400 text-sm">Fluxo Recomendado no n8n</AlertTitle>
                    <AlertDescription className="text-gray-300 text-xs">
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Use um nó Webhook para receber dados do Dify</li>
                        <li>Processe os dados conforme necessário</li>
                        <li>Faça requisições para a API Evolution usando o nó HTTP</li>
                        <li>Retorne os resultados formatados para o Dify via API</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>Configurações da Instância</Label>
          <div className="p-3 bg-gray-800 rounded-md">
            <div className="flex justify-between">
              <span className="text-gray-300">Instância conectada:</span>
              <span className="text-blue-400">
                {instanceDetails?.instanceName || instanceDetails?.name || instanceName || "Nenhuma"}
              </span>
            </div>
          </div>
        </div>

        <Alert className="bg-yellow-900/10 border-yellow-500/30 mt-4">
          <InfoIcon className="h-5 w-5 text-yellow-400" />
          <AlertTitle className="text-yellow-400">Dica de Integração</AlertTitle>
          <AlertDescription className="text-gray-300">
            A integração com webhook permite que o Dify se comunique com outros sistemas, como n8n ou 
            diretamente com a Evolution API. Configure corretamente o webhook no painel do Dify para 
            enviar eventos de chat para o endpoint especificado.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <Button 
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection || !apiKey || !applicationId}
            variant="outline"
            className="border-blue-600 hover:bg-blue-900/20 text-blue-400"
          >
            {testingConnection ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando...</>
            ) : (
              <>Testar Conexão</>
            )}
          </Button>
          
          {connectionSuccess && (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Conexão verificada
            </span>
          )}
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || usingProxySetup || (integrationComplete && !manualWebhookMode && existingWebhooks.length > 0) || 
                     !connectionSuccess || (instanceStatus && (!instanceStatus.exists || !instanceStatus.connected))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Integrando...</>
            ) : integrationComplete && !manualWebhookMode ? (
              <>{existingWebhooks.length > 0 ? <Bot className="mr-2 h-4 w-4" /> : <RotateCw className="mr-2 h-4 w-4" />} {existingWebhooks.length > 0 ? "Integração Completa" : "Tentar novamente"}</>
            ) : (
              <><Bot className="mr-2 h-4 w-4" /> Integrar com Dify IA</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DifyIntegration;
