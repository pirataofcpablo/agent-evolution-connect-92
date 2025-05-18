
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { 
  createEvoInstance, 
  createWorkspace, 
  connectToInstance,
  logoutInstance,
  deleteInstance,
  EvoInstance
} from '@/services/evoService';
import { registerWebhook } from '@/services/webhookService';

interface UseEvoInstanceReturn {
  loading: boolean;
  qrcode: string | null;
  instanceName: string | null;
  instanceStatus: string | null;
  error: string | null;
  createInstance: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteInst: () => Promise<void>;
}

export const useEvoInstance = (): UseEvoInstanceReturn => {
  const [loading, setLoading] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar o status da instância do localStorage ao iniciar
  useEffect(() => {
    const storedName = localStorage.getItem('instanceName');
    const storedStatus = localStorage.getItem('instanceStatus');
    
    if (storedName && storedStatus) {
      setInstanceName(storedName);
      setInstanceStatus(storedStatus);
    }
  }, []);

  // Criar instância e workspace
  const createInstance = async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const fullInstanceName = `${name}_Cliente`;
      
      // Criar instância
      const instance: EvoInstance = await createEvoInstance(name);
      
      if (instance.qrcode?.base64) {
        setQrcode(instance.qrcode.base64);
        setInstanceName(fullInstanceName);
        
        // Conectar à instância
        const connectionData = await connectToInstance(fullInstanceName);
        const status = connectionData.status || "On";
        setInstanceStatus(status);
        
        // Salvar no localStorage
        localStorage.setItem('instanceName', fullInstanceName);
        localStorage.setItem('instanceStatus', status);
        
        // Criar workspace
        await createWorkspace(fullInstanceName);
        
        // Configurar webhook para receber mensagens
        // Este é um URL exemplo - em produção, seria o URL do seu backend
        const webhookUrl = `https://crispy-space-acorn-xj5654vq6rh99g9-3000.app.github.dev/api/whatsapp/webhook`;
        await registerWebhook(fullInstanceName, webhookUrl);
        
        toast({
          title: "Sucesso",
          description: "Instância criada com sucesso! Escaneie o QR Code para conectar.",
        });
      } else {
        throw new Error("QR Code não gerado");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar instância");
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar instância",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Desconectar da instância
  const logout = async () => {
    if (!instanceName) return;
    
    setLoading(true);
    try {
      await logoutInstance(instanceName);
      setInstanceStatus("Desligada");
      localStorage.setItem('instanceStatus', "Desligada");
      
      toast({
        title: "Sucesso",
        description: "Instância desconectada com sucesso",
      });
    } catch (err: any) {
      setError(err.message || "Erro ao desconectar instância");
      toast({
        title: "Erro",
        description: err.message || "Erro ao desconectar instância",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Excluir instância
  const deleteInst = async () => {
    if (!instanceName) return;
    
    setLoading(true);
    try {
      await deleteInstance(instanceName);
      setInstanceName(null);
      setInstanceStatus(null);
      setQrcode(null);
      
      localStorage.removeItem('instanceName');
      localStorage.removeItem('instanceStatus');
      
      toast({
        title: "Sucesso",
        description: "Instância excluída com sucesso",
      });
    } catch (err: any) {
      setError(err.message || "Erro ao excluir instância");
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir instância",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    qrcode,
    instanceName,
    instanceStatus,
    error,
    createInstance,
    logout,
    deleteInst
  };
};
