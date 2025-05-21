
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  saveDifyConfig,
  getDifyConfig,
  checkInstanceStatus
} from '@/services/difyService';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DifyIntegrationProps {
  instanceName: string;
}

const DifyIntegration: React.FC<DifyIntegrationProps> = ({ instanceName }) => {
  const [difyApiKey, setDifyApiKey] = useState("");
  const [difyApiUrl, setDifyApiUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [n8nIntegration, setN8nIntegration] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [webhookPayloadTemplate, setWebhookPayloadTemplate] = useState('{"message": "{{message}}", "sender": "{{sender}}", "instance": "{{instance}}", "timestamp": "{{timestamp}}"}');
  const [webhookPayloadExample, setWebhookPayloadExample] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<string | null>(null);

  useEffect(() => {
    const savedConfig = getDifyConfig(instanceName);
    if (savedConfig) {
      setDifyApiKey(savedConfig.difyApiKey || "");
      setDifyApiUrl(savedConfig.difyUrl || "");
      setEnabled(savedConfig.enabled || false);
      setN8nIntegration(savedConfig.n8nIntegration || false);
      setN8nWebhookUrl(savedConfig.n8nWebhookUrl || "");
      setWebhookPayloadTemplate(savedConfig.webhookPayloadTemplate || '{"message": "{{message}}", "sender": "{{sender}}", "instance": "{{instance}}", "timestamp": "{{timestamp}}"}');
    }
  }, [instanceName]);

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (enabled && (!difyApiKey || !difyApiUrl)) {
      toast({
        title: "Campos obrigatórios",
        description: "Para habilitar a integração com o Dify, preencha a API Key e a URL da API.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      saveDifyConfig({
        instanceName,
        difyApiKey,
        difyUrl: difyApiUrl,
        enabled,
        n8nIntegration,
        n8nWebhookUrl,
        webhookPayloadTemplate,
        apiKey: difyApiKey
      });

      toast({
        title: "Integração realizada",
        description: "O Dify foi integrado com sucesso à instância " + instanceName,
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao salvar a configuração do Dify.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckInstanceStatus = async () => {
    setCheckingStatus(true);
    try {
      const status = await checkInstanceStatus(instanceName);
      if (typeof status === 'string') {
        setInstanceStatus(status);
      } else if (status && typeof status === 'object') {
        setInstanceStatus(status.connected ? 'connected' : 'disconnected');
      }
      
      toast({
        title: "Status da instância",
        description: `A instância do Dify está ${instanceStatus || 'verificada'}`,
      });
    } catch (error) {
      console.error("Erro ao verificar status da instância:", error);
      setInstanceStatus(null);
      toast({
        title: "Erro",
        description: "Houve um erro ao verificar o status da instância do Dify.",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleWebhookPayloadExample = () => {
    // Define variables for the payload example
    const messageText = "Hello, this is a test message";
    const senderPhone = "+551199998888";
    const instanceNameValue = "instance_name";
    const currentTimestamp = new Date().toISOString();

    let template = webhookPayloadTemplate || '{"message": "{{message}}", "sender": "{{sender}}", "instance": "{{instance}}", "timestamp": "{{timestamp}}"}';
    
    // Replace placeholders with actual values
    const processedTemplate = template
      .replace(/{{message}}/g, messageText)
      .replace(/{{sender}}/g, senderPhone)
      .replace(/{{instance}}/g, instanceNameValue)
      .replace(/{{timestamp}}/g, currentTimestamp);
    
    try {
      const jsonObject = JSON.parse(processedTemplate);
      setWebhookPayloadExample(JSON.stringify(jsonObject, null, 2));
    } catch (error) {
      console.error("Error parsing webhook template:", error);
      toast({
        title: "Erro no template",
        description: "O formato do template de webhook é inválido. Verifique o JSON.",
        variant: "destructive",
      });
      setWebhookPayloadExample('{"error": "Invalid template format"}');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-400 mb-2">Sobre a integração com Dify</h3>
        <p className="text-gray-300">
          Dify é uma plataforma de desenvolvimento de aplicativos de IA conversacional que permite criar bots 
          inteligentes e personalizados. Com esta integração, você pode conectar seu WhatsApp a um bot Dify 
          e automatizar conversas e tarefas.
        </p>
      </div>

      <form onSubmit={handleSaveIntegration} className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">Habilitar Integração</h3>
              <p className="text-sm text-gray-400">Ative para conectar o Dify ao seu WhatsApp</p>
            </div>
            <Switch 
              checked={enabled} 
              onCheckedChange={setEnabled} 
            />
          </div>

          {enabled && (
            <div className="pl-4 border-l-2 border-blue-700/50 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difyApiUrl">URL da API do Dify</Label>
                <Input
                  id="difyApiUrl"
                  placeholder="https://seu-dify.com/api"
                  value={difyApiUrl}
                  onChange={(e) => setDifyApiUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difyApiKey">API Key do Dify</Label>
                <Input
                  id="difyApiKey"
                  type="password"
                  placeholder="Sua API Key do Dify"
                  value={difyApiKey}
                  onChange={(e) => setDifyApiKey(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button"
                  onClick={handleCheckInstanceStatus}
                  disabled={checkingStatus}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Status da Instância"
                  )}
                </Button>
              </div>

              {instanceStatus && (
                <Alert className="mt-4 bg-green-900/20 border-green-500/30">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-500">Instância Ativa</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    A instância do Dify está {instanceStatus}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">Usar n8n como intermediário</h3>
              <p className="text-sm text-gray-400">
                Encaminhe as mensagens para o n8n antes de enviar para o Dify
              </p>
            </div>
            <Switch 
              checked={n8nIntegration} 
              onCheckedChange={setN8nIntegration} 
            />
          </div>

          {n8nIntegration && (
            <div className="pl-4 border-l-2 border-blue-700/50 space-y-4">
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
                  Cole a URL do nó de webhook no seu fluxo n8n
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookPayloadTemplate">Template do Payload Webhook</Label>
                <Input
                  id="webhookPayloadTemplate"
                  placeholder='{"message": "{{message}}", "sender": "{{sender}}", "instance": "{{instance}}", "timestamp": "{{timestamp}}"}'
                  value={webhookPayloadTemplate}
                  onChange={(e) => setWebhookPayloadTemplate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-400">
                  Use os placeholders {{message}}, {{sender}}, {{instance}} e {{timestamp}}
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button"
                  onClick={handleWebhookPayloadExample}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Gerar Exemplo
                </Button>
              </div>

              {webhookPayloadExample && (
                <div className="space-y-2">
                  <Label>Exemplo de Payload</Label>
                  <pre className="bg-gray-800 rounded-md p-2 text-sm text-gray-300">
                    {webhookPayloadExample}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Configurações da Instância</Label>
          <div className="p-3 bg-gray-800 rounded-md">
            <div className="flex justify-between">
              <span className="text-gray-300">Instância conectada:</span>
              <span className="text-blue-400">{instanceName}</span>
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
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Integrando..." : "Salvar Configuração"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DifyIntegration;
