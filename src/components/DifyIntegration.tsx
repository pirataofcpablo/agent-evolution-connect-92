import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  saveDifyConfig, 
  getDifyConfig, 
  testDifyConnection, 
  registerDifyBot, 
  checkInstanceStatus 
} from '@/services/difyService';
import { 
  getInstanceDetails, 
  fetchAllInstances 
} from '@/services/evoService';
import { Loader2, Bot, CheckCircle, AlertCircle, InfoIcon, RefreshCw, ExternalLink } from "lucide-react";

interface DifyIntegrationProps {
  instanceName: string;
}

const DifyIntegration: React.FC<DifyIntegrationProps> = ({ instanceName }) => {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.dify.ai/v1");
  const [applicationId, setApplicationId] = useState("");
  const [modelType, setModelType] = useState("chat");
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
          setApiUrl(savedConfig.apiUrl);
          setApplicationId(savedConfig.applicationId);
          setModelType(savedConfig.modelType);
          setIntegrationComplete(true);
          setConnectionSuccess(true);
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
        modelType
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
    
    try {
      if (!instanceName) {
        throw new Error("Nome da instância não fornecido");
      }
      
      // Verificar status da instância antes de prosseguir
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
        modelType
      };
      
      // Testar conexão antes de prosseguir
      console.log("Testando conexão com Dify antes da integração...");
      const isConnected = await testDifyConnection(config);
      
      if (!isConnected) {
        throw new Error("Não foi possível conectar ao Dify. Verifique suas credenciais e a URL da API.");
      }
      
      console.log("Conexão com Dify estabelecida com sucesso.");
      
      // Registrar o bot Dify na Evolution API
      console.log(`Registrando bot Dify para a instância: ${instanceName}`);
      
      try {
        await registerDifyBot(instanceName, config);
        setIntegrationComplete(true);
        
        toast({
          title: "Integração realizada",
          description: "O bot Dify foi integrado com sucesso à instância " + instanceName,
        });
      } catch (webhookError: any) {
        console.error("Erro específico no registro do webhook:", webhookError);
        
        // Salvar configuração local mesmo com erro no webhook
        saveDifyConfig(instanceName.replace("_Cliente", ""), config);
        
        // Mostrar alerta específico de webhook
        setRegistrationError(`Configuração do Dify foi salva localmente, mas houve um problema no registro do webhook: ${webhookError.message || "Erro desconhecido no webhook"}`);
        
        // Mover para modo manual de configuração de webhook
        setManualWebhookMode(true);
        
        // Consideramos parcialmente configurado
        setIntegrationComplete(true);
        
        toast({
          title: "Integração parcial",
          description: "Configuração salva localmente, mas houve um problema no registro do webhook.",
          variant: "warning",
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
    }
  };

  const handleCancel = () => {
    console.log("Cancelando operação");
    setApiKey("");
    setApiUrl("https://api.dify.ai/v1");
    setApplicationId("");
    setModelType("chat");
  };

  return (
    <div className="space-y-6">
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
            <div className="mt-2">
              <p className="font-semibold">Configuração manual na Evolution API:</p>
              <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                <li>Acesse o painel da Evolution API</li>
                <li>Vá para Configurações {'>'} Webhooks</li>
                <li>Adicione um novo webhook do tipo "Dify IA"</li>
                <li>Use a mesma API Key e URL configuradas aqui</li>
                <li>Ative o webhook para a instância {instanceName}</li>
              </ol>
            </div>
            <div className="mt-3 flex">
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
                onClick={() => window.open("https://v2.solucoesweb.uk/", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Evolution API
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

      <form onSubmit={handleSaveIntegration} className="space-y-4">
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
            Certifique-se de que sua API Key do Dify tem permissões de acesso corretas e que sua aplicação está configurada para responder a consultas externas.
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
            disabled={isLoading || (integrationComplete && !manualWebhookMode) || !connectionSuccess || 
                     (instanceStatus && (!instanceStatus.exists || !instanceStatus.connected))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Integrando...</>
            ) : integrationComplete && !manualWebhookMode ? (
              <><Bot className="mr-2 h-4 w-4" /> Integração Completa</>
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
