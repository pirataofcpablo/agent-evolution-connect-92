
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
    
    // Simulando uma chamada de API
    setTimeout(() => {
      console.log("Integrando n8n com a instância:", instanceName);
      console.log("Webhook URL:", webhookUrl);
      console.log("API Key:", apiKey);
      console.log("n8n URL:", n8nUrl);
      
      toast({
        title: "Integração realizada",
        description: "O n8n foi integrado com sucesso à instância " + instanceName,
      });
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-md mb-6">
        <h3 className="text-lg font-medium text-purple-400 mb-2">Sobre a integração com n8n</h3>
        <p className="text-gray-300">
          n8n é uma ferramenta poderosa de automação de fluxo de trabalho que permite conectar diferentes 
          serviços e APIs. Com esta integração, você pode automatizar processos complexos e integrar 
          seu WhatsApp com outras ferramentas.
        </p>
      </div>

      <form onSubmit={handleSaveIntegration} className="space-y-4">
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
              />
              <p className="text-xs text-gray-400">
                Cole a URL do nó de webhook no seu fluxo n8n
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
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? "Integrando..." : "Integrar com n8n"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default N8nIntegration;
