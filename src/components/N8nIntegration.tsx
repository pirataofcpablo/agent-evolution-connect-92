
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  saveN8nConfig, 
  getN8nConfig, 
  updateN8nFlowAiModel,
  createN8nFlow,
  checkN8nFlowExists
} from '@/services/n8nService';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface N8nIntegrationProps {
  instanceName: string;
}

const N8nIntegration: React.FC<N8nIntegrationProps> = ({ instanceName }) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [n8nUrl, setN8nUrl] = useState("");
  const [enableWebhook, setEnableWebhook] = useState(true);
  const [enableApi, setEnableApi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("config");
  
  // AI Model integration
  const [selectedAiModel, setSelectedAiModel] = useState<'groq' | 'openai' | null>(null);
  const [groqApiKey, setGroqApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [isAiConfiguring, setIsAiConfiguring] = useState(false);
  const [flowExists, setFlowExists] = useState(false);
  const [checkingFlow, setCheckingFlow] = useState(true);

  // Carregar configuração se existir
  useEffect(() => {
    const savedConfig = getN8nConfig(instanceName);
    if (savedConfig) {
      setWebhookUrl(savedConfig.webhookUrl || "");
      setApiKey(savedConfig.apiKey || "");
      setN8nUrl(savedConfig.n8nUrl || "");
      setEnableWebhook(savedConfig.enableWebhook);
      setEnableApi(savedConfig.enableApi);
      setSelectedAiModel(savedConfig.aiModel || null);
      
      if (savedConfig.aiApiKey) {
        if (savedConfig.aiModel === 'groq') {
          setGroqApiKey(savedConfig.aiApiKey);
        } else if (savedConfig.aiModel === 'openai') {
          setOpenAiApiKey(savedConfig.aiApiKey);
        }
      }
    }
    
    // Verificar se já existe um fluxo para esta instância
    checkN8nFlowExists(instanceName).then(exists => {
      setFlowExists(exists);
      setCheckingFlow(false);
    });
  }, [instanceName]);

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (enableWebhook && !webhookUrl) {
      toast({
        title: "URL do Webhook obrigatória",
        description: "Por favor, insira a URL do webhook do n8n",
        variant: "destructive",
      });
      return;
    }

    if (enableApi && (!apiKey || !n8nUrl)) {
      toast({
        title: "Campos obrigatórios",
        description: "Para usar a API do n8n, preencha a URL e a API Key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Salvar a configuração
      saveN8nConfig(instanceName, {
        webhookUrl,
        apiKey,
        n8nUrl,
        enableWebhook,
        enableApi,
        aiModel: selectedAiModel,
        aiApiKey: selectedAiModel === 'groq' ? groqApiKey : openAiApiKey
      });
      
      toast({
        title: "Integração realizada",
        description: "O n8n foi integrado com sucesso à instância " + instanceName,
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao salvar a configuração do n8n.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateFlow = async () => {
    setIsLoading(true);
    try {
      const result = await createN8nFlow({
        instanceName,
        userName: instanceName,
        webhookUrl: ""
      });
      
      if (result.success && result.webhookUrl) {
        setWebhookUrl(result.webhookUrl);
        setFlowExists(true);
        setEnableWebhook(true);
        
        saveN8nConfig(instanceName, {
          webhookUrl: result.webhookUrl,
          apiKey,
          n8nUrl,
          enableWebhook: true,
          enableApi,
          aiModel: selectedAiModel,
          aiApiKey: selectedAiModel === 'groq' ? groqApiKey : openAiApiKey
        });
        
        toast({
          title: "Fluxo criado com sucesso",
          description: "Um novo fluxo no n8n foi criado para " + instanceName,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o fluxo no n8n.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar fluxo:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao criar o fluxo no n8n.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAiConfig = async (model: 'groq' | 'openai') => {
    setIsAiConfiguring(true);
    
    const apiKey = model === 'groq' ? groqApiKey : openAiApiKey;
    
    if (!apiKey) {
      toast({
        title: "API Key obrigatória",
        description: `Por favor, insira sua API Key do ${model === 'groq' ? 'Groq' : 'OpenAI'}`,
        variant: "destructive",
      });
      setIsAiConfiguring(false);
      return;
    }
    
    try {
      const success = await updateN8nFlowAiModel(instanceName, model, apiKey);
      
      if (success) {
        setSelectedAiModel(model);
        
        toast({
          title: "Modelo configurado",
          description: `Seu agente agora está usando ${model === 'groq' ? 'Groq LLM' : 'OpenAI GPT'}`,
        });
        
        // Salvar a configuração atualizada
        const currentConfig = getN8nConfig(instanceName) || {
          webhookUrl,
          apiKey: "",
          n8nUrl: "",
          enableWebhook: true,
          enableApi: false
        };
        
        saveN8nConfig(instanceName, {
          ...currentConfig,
          aiModel: model,
          aiApiKey: apiKey
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível configurar o modelo de IA no fluxo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao configurar modelo de IA:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao configurar o modelo de IA.",
        variant: "destructive",
      });
    } finally {
      setIsAiConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-md mb-6">
        <h3 className="text-lg font-medium text-purple-400 mb-2">Sobre a integração com n8n</h3>
        <p className="text-gray-300">
          n8n é uma ferramenta poderosa de automação de fluxo de trabalho que permite conectar diferentes 
          serviços e APIs. Com esta integração, você pode automatizar processos complexos e integrar 
          seu WhatsApp com outras ferramentas e modelos de IA.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="config">Configuração Básica</TabsTrigger>
          <TabsTrigger value="ai">Agente IA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config">
          {checkingFlow ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="ml-2 text-gray-400">Verificando configuração...</p>
            </div>
          ) : (
            <>
              {flowExists ? (
                <Alert className="bg-green-900/20 border-green-500/30 mb-6">
                  <Check className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500">Fluxo já configurado</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Detectamos que você já possui um fluxo n8n configurado para esta instância.
                    Você pode gerenciar suas configurações abaixo.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-900/20 border-yellow-500/30 mb-6">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <AlertTitle className="text-yellow-500">Fluxo não detectado</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Não detectamos um fluxo n8n para esta instância. Clique em "Criar Fluxo Automático"
                    para configurar seu fluxo agora.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSaveIntegration} className="space-y-4">
                {!flowExists && (
                  <div className="mb-6 flex justify-center">
                    <Button 
                      type="button"
                      onClick={handleCreateFlow}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando Fluxo...
                        </>
                      ) : (
                        "Criar Fluxo Automático"
                      )}
                    </Button>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">Integração via Webhook</h3>
                      <p className="text-sm text-gray-400">Receba notificações do WhatsApp no n8n</p>
                    </div>
                    <Switch 
                      checked={enableWebhook} 
                      onCheckedChange={setEnableWebhook} 
                    />
                  </div>
                  
                  {enableWebhook && (
                    <div className="pl-4 border-l-2 border-purple-700/50 space-y-2">
                      <Label htmlFor="webhookUrl">URL do Webhook n8n</Label>
                      <Input
                        id="webhookUrl"
                        placeholder="https://seu-n8n.com/webhook/123456"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        readOnly={flowExists}
                      />
                      <p className="text-xs text-gray-400">
                        {flowExists 
                          ? "Este webhook foi configurado automaticamente." 
                          : "Cole a URL do nó de webhook no seu fluxo n8n"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">Integração via API</h3>
                      <p className="text-sm text-gray-400">Execute fluxos n8n a partir do WhatsApp</p>
                    </div>
                    <Switch 
                      checked={enableApi} 
                      onCheckedChange={setEnableApi} 
                    />
                  </div>
                  
                  {enableApi && (
                    <div className="pl-4 border-l-2 border-purple-700/50 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="n8nUrl">URL do servidor n8n</Label>
                        <Input
                          id="n8nUrl"
                          placeholder="https://seu-n8n.com"
                          value={n8nUrl}
                          onChange={(e) => setN8nUrl(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key do n8n</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Sua API Key do n8n"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Configurações da Instância</Label>
                  <div className="p-3 bg-gray-800 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Instância conectada:</span>
                      <span className="text-purple-400">{instanceName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-gray-600 hover:bg-gray-800 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || (flowExists && enableWebhook)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? "Integrando..." : "Salvar Configuração"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="ai">
          {!flowExists ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Fluxo n8n não configurado</h3>
              <p className="text-gray-400 mb-4">
                Você precisa criar um fluxo n8n primeiro antes de configurar seu agente IA.
                Volte para a aba "Configuração Básica" e clique em "Criar Fluxo Automático".
              </p>
              <Button 
                onClick={() => setActiveTab("config")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Voltar para Configuração Básica
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Groq Integration Card */}
                <Card className={`bg-gray-900 border-gray-800 ${selectedAiModel === 'groq' ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="text-2xl mr-2">🧠</span>
                      Groq LLM
                      {selectedAiModel === 'groq' && <Check className="ml-2 h-5 w-5 text-green-500" />}
                    </CardTitle>
                    <CardDescription>
                      Groq é um modelo de linguagem rápido com baixa latência
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groq-api-key">API Key da Groq</Label>
                      <Input
                        id="groq-api-key"
                        type="password"
                        placeholder="Insira sua API Key da Groq"
                        value={groqApiKey}
                        onChange={(e) => setGroqApiKey(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Obtenha sua API key em{" "}
                        <a 
                          href="https://console.groq.com/keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:underline"
                        >
                          console.groq.com
                        </a>
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        onClick={() => handleSaveAiConfig('groq')}
                        disabled={isAiConfiguring || !groqApiKey}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isAiConfiguring && selectedAiModel === 'groq' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Configurando...
                          </>
                        ) : (
                          selectedAiModel === 'groq' ? "Atualizar Configuração" : "Usar Groq LLM"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* OpenAI Integration Card */}
                <Card className={`bg-gray-900 border-gray-800 ${selectedAiModel === 'openai' ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="text-2xl mr-2">🤖</span>
                      OpenAI GPT
                      {selectedAiModel === 'openai' && <Check className="ml-2 h-5 w-5 text-blue-500" />}
                    </CardTitle>
                    <CardDescription>
                      Modelos GPT da OpenAI como o GPT-4o com alta qualidade de resposta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openai-api-key">API Key da OpenAI</Label>
                      <Input
                        id="openai-api-key"
                        type="password"
                        placeholder="Insira sua API Key da OpenAI"
                        value={openAiApiKey}
                        onChange={(e) => setOpenAiApiKey(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Obtenha sua API key em{" "}
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          platform.openai.com
                        </a>
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        onClick={() => handleSaveAiConfig('openai')}
                        disabled={isAiConfiguring || !openAiApiKey}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isAiConfiguring && selectedAiModel === 'openai' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Configurando...
                          </>
                        ) : (
                          selectedAiModel === 'openai' ? "Atualizar Configuração" : "Usar OpenAI GPT"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {selectedAiModel && (
                <Alert className="bg-green-900/20 border-green-500/30">
                  <Check className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500">Agente IA Configurado</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Seu agente está usando {selectedAiModel === 'groq' ? 'Groq LLM' : 'OpenAI GPT'}.
                    Acesse a página "Personalidade IA" para enviar conhecimento para seu agente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default N8nIntegration;
