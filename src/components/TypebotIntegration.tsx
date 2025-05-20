
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Check, Info, Loader2 } from 'lucide-react';
import { getTypebotConfig, saveTypebotConfig, testTypebotConnection } from '@/services/typebotService';

interface TypebotIntegrationProps {
  instanceName: string;
}

interface TypebotConfig {
  apiKey: string;
  workspaceId: string;
  botId: string;
  publicId: string;
  enabled: boolean;
}

const TypebotIntegration: React.FC<TypebotIntegrationProps> = ({ instanceName }) => {
  const [config, setConfig] = useState<TypebotConfig>({
    apiKey: '',
    workspaceId: '',
    botId: '',
    publicId: '',
    enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    loadConfig();
  }, [instanceName]);

  const loadConfig = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      const existingConfig = getTypebotConfig(instanceName);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração do Typebot:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!instanceName) {
      toast({
        title: "Erro",
        description: "Nome da instância não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (!config.apiKey || !config.workspaceId) {
      toast({
        title: "Campos obrigatórios",
        description: "API Key e Workspace ID são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveTypebotConfig(instanceName, config);
      
      toast({
        title: "Configuração salva",
        description: "Configuração do Typebot salva com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração do Typebot.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.apiKey || !config.workspaceId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha API Key e Workspace ID antes de testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testTypebotConnection(config);
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: "Conexão com Typebot estabelecida com sucesso!",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message || "Não foi possível conectar ao Typebot.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setTestResult({
        success: false,
        message: "Erro ao testar conexão com Typebot."
      });
      
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro ao testar a conexão com o Typebot.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="ml-2 text-blue-500">Carregando configuração...</span>
      </div>
    );
  }

  return (
    <Card className="border-green-500/20 bg-black text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-3xl">💬</span>
          <div>
            <CardTitle className="text-xl text-green-400">Integração com Typebot</CardTitle>
            <CardDescription className="text-gray-400">
              Configure a integração com fluxos do Typebot para sua instância {instanceName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-green-900/20 border-green-500/30">
          <Info className="h-5 w-5 text-green-400" />
          <AlertTitle className="text-green-400">O que você pode fazer</AlertTitle>
          <AlertDescription className="text-gray-300">
            Com o Typebot, você pode criar fluxos conversacionais avançados para seu bot WhatsApp, 
            incluindo botões, formulários, condições, variáveis e muito mais.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key do Typebot</Label>
            <Input 
              id="apiKey"
              name="apiKey"
              value={config.apiKey}
              onChange={handleInputChange}
              placeholder="Insira sua API key do Typebot"
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              Encontrada nas configurações da sua conta Typebot
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workspaceId">Workspace ID</Label>
            <Input 
              id="workspaceId"
              name="workspaceId"
              value={config.workspaceId}
              onChange={handleInputChange}
              placeholder="ID do seu workspace no Typebot"
              className="bg-gray-900 border-gray-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="botId">Bot ID (opcional)</Label>
            <Input 
              id="botId"
              name="botId"
              value={config.botId}
              onChange={handleInputChange}
              placeholder="ID do bot específico que deseja usar"
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              Se deixado em branco, o sistema usará o bot configurado no webhook do Typebot
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="publicId">ID Público (opcional)</Label>
            <Input 
              id="publicId"
              name="publicId"
              value={config.publicId}
              onChange={handleInputChange}
              placeholder="ID público do bot para links compartilháveis"
              className="bg-gray-900 border-gray-700"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={config.enabled}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="enabled">Habilitar integração</Label>
          </div>
          
          {testResult && (
            <Alert className={testResult.success ? 
              "bg-green-900/20 border-green-500/30" : 
              "bg-red-900/20 border-red-500/30"}
            >
              {testResult.success ? 
                <Check className="h-5 w-5 text-green-400" /> : 
                <AlertCircle className="h-5 w-5 text-red-400" />
              }
              <AlertTitle className={testResult.success ? "text-green-400" : "text-red-400"}>
                {testResult.success ? "Conexão bem-sucedida" : "Falha na conexão"}
              </AlertTitle>
              <AlertDescription className="text-gray-300">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
          
          <Separator className="my-4 bg-gray-800" />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleTest}
              disabled={testing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {testing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando</>
              ) : (
                <>Testar Conexão</>
              )}
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando</>
              ) : (
                <>Salvar Configuração</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TypebotIntegration;
