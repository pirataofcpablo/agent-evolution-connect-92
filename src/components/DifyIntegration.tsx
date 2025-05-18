
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveDifyConfig, getDifyConfig } from '@/services/difyService';

interface DifyIntegrationProps {
  instanceName: string;
}

const DifyIntegration: React.FC<DifyIntegrationProps> = ({ instanceName }) => {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.dify.ai/v1");
  const [applicationId, setApplicationId] = useState("");
  const [modelType, setModelType] = useState("text-generation");
  const [isLoading, setIsLoading] = useState(false);
  
  // Carregar configuração se existir
  useEffect(() => {
    const savedConfig = getDifyConfig(instanceName);
    if (savedConfig) {
      setApiKey(savedConfig.apiKey);
      setApiUrl(savedConfig.apiUrl);
      setApplicationId(savedConfig.applicationId);
      setModelType(savedConfig.modelType);
    }
  }, [instanceName]);

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
    
    try {
      // Salvar a configuração
      saveDifyConfig(instanceName, {
        apiKey,
        apiUrl,
        applicationId,
        modelType
      });
      
      toast({
        title: "Integração realizada",
        description: "O bot Dify foi integrado com sucesso à instância " + instanceName,
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
            <Label htmlFor="apiUrl">API URL (Opcional)</Label>
            <Input
              id="apiUrl"
              placeholder="URL da API"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">
              Deixe o padrão se estiver usando o Dify Cloud
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
                <SelectItem value="text-generation">Geração de Texto</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="text-to-image">Texto para Imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            {isLoading ? "Integrando..." : "Integrar com Dify IA"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DifyIntegration;
