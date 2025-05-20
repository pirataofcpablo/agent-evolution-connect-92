
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Loader2, Bot, Info } from 'lucide-react';
import { getTelegramConfig, saveTelegramConfig, testTelegramConnection } from '@/services/telegramService';

interface TelegramIntegrationProps {
  instanceName: string;
}

const TelegramIntegration: React.FC<TelegramIntegrationProps> = ({ instanceName }) => {
  const [config, setConfig] = useState({
    botToken: '',
    chatId: '',
    enabled: false,
    notifyRenewal: true,
    notifyPayment: true,
    sendRenewalNotice: true,
    sendScheduledMessages: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [instanceName]);

  const loadConfig = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      const existingConfig = getTelegramConfig(instanceName);
      if (existingConfig) {
        setConfig({
          botToken: existingConfig.botToken || '',
          chatId: existingConfig.chatId || '',
          enabled: existingConfig.enabled || false,
          notifyRenewal: existingConfig.notifyRenewal !== false,
          notifyPayment: existingConfig.notifyPayment !== false,
          sendRenewalNotice: existingConfig.sendRenewalNotice !== false,
          sendScheduledMessages: existingConfig.sendScheduledMessages || false
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configuração do Telegram:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = e.target.checked;
      setConfig(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: e.target.value
      }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      [name]: checked
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

    if (!config.botToken) {
      toast({
        title: "Campo obrigatório",
        description: "O token do bot Telegram é um campo obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!config.chatId) {
      toast({
        title: "Campo obrigatório",
        description: "O ID do chat é um campo obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveTelegramConfig(instanceName, config);
      
      toast({
        title: "Configuração salva",
        description: "Bot do Telegram configurado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração do Telegram.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.botToken || !config.chatId) {
      toast({
        title: "Campos obrigatórios",
        description: "O token do bot e ID do chat são obrigatórios para testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const result = await testTelegramConnection(config);
      
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: "Conexão com bot do Telegram estabelecida com sucesso!",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message || "Não foi possível conectar ao Telegram.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro ao testar a conexão com o Telegram.",
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
    <Card className="border-blue-500/20 bg-black text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-3xl">💬</span>
          <div>
            <CardTitle className="text-xl text-blue-400">Bot do Telegram</CardTitle>
            <CardDescription className="text-gray-400">
              Configure seu bot do Telegram para enviar notificações automáticas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-blue-900/20 border-blue-500/30">
          <Info className="h-5 w-5 text-blue-400" />
          <AlertTitle className="text-blue-400">Notificações automáticas</AlertTitle>
          <AlertDescription className="text-gray-300">
            Configure seu bot do Telegram para enviar notificações sobre renovações, 
            pagamentos e mensagens programadas para clientes ou para você mesmo.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="botToken">Token do Bot Telegram</Label>
            <Input 
              id="botToken"
              name="botToken"
              value={config.botToken}
              onChange={handleInputChange}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              Obtenha com @BotFather no Telegram
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chatId">ID do Chat/Grupo/Canal</Label>
            <Input 
              id="chatId"
              name="chatId"
              value={config.chatId}
              onChange={handleInputChange}
              placeholder="-100123456789 ou @seucanalname"
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              ID do chat, grupo ou canal onde as mensagens serão enviadas
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => 
                handleCheckboxChange("enabled", checked as boolean)
              }
            />
            <Label htmlFor="enabled">Habilitar integração</Label>
          </div>
          
          <div className="mt-6 border-t border-gray-800 pt-6">
            <h3 className="font-medium text-blue-400 mb-4">Tipos de Notificação</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyRenewal"
                  checked={config.notifyRenewal}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("notifyRenewal", checked as boolean)
                  }
                />
                <Label htmlFor="notifyRenewal">Notificar renovação de cliente</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyPayment"
                  checked={config.notifyPayment}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("notifyPayment", checked as boolean)
                  }
                />
                <Label htmlFor="notifyPayment">Notificar venda (quando cliente paga o PIX)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendRenewalNotice"
                  checked={config.sendRenewalNotice}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("sendRenewalNotice", checked as boolean)
                  }
                />
                <Label htmlFor="sendRenewalNotice">Enviar renovação para cliente</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendScheduledMessages"
                  checked={config.sendScheduledMessages}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("sendScheduledMessages", checked as boolean)
                  }
                />
                <Label htmlFor="sendScheduledMessages">Enviar mensagens programadas (para usuário ou grupo/canal)</Label>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
              onClick={handleTest}
              disabled={testing}
              variant="outline"
              className="border-blue-700 text-blue-400 hover:bg-blue-950"
            >
              {testing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando</>
              ) : (
                <><Bot className="mr-2 h-4 w-4" /> Testar Conexão</>
              )}
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando</>
              ) : (
                <><MessageSquare className="mr-2 h-4 w-4" /> Salvar Configuração</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramIntegration;
