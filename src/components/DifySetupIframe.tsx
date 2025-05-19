
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { setupDifyWebhookViaIframe } from '@/services/difyService';

interface DifySetupIframeProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  config: {
    apiKey: string;
    apiUrl: string;
    applicationId: string;
    modelType: string;
  };
}

const DifySetupIframe: React.FC<DifySetupIframeProps> = ({
  isOpen,
  onClose,
  instanceName,
  config
}) => {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && instanceName && config) {
      setLoading(true);
      setError(null);
      
      setupDifyWebhookViaIframe(instanceName, config)
        .then(url => {
          setIframeUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error("Erro ao gerar URL para iframe:", err);
          setError("Não foi possível carregar a configuração. Por favor, tente novamente.");
          setLoading(false);
        });
    } else {
      setIframeUrl(null);
    }
  }, [isOpen, instanceName, config]);
  
  // Função para abrir em uma nova janela
  const openInNewWindow = () => {
    if (iframeUrl) {
      window.open(iframeUrl, "_blank", "width=800,height=600");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configuração do Webhook Dify</DialogTitle>
          <DialogDescription>
            Complete a configuração do webhook do Dify para a instância {instanceName}.
            Este processo é feito diretamente na Evolution API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openInNewWindow}
            disabled={!iframeUrl || loading}
          >
            <ExternalLink className="h-4 w-4 mr-1" /> Abrir em nova janela
          </Button>
        </div>
        
        <div className="flex-grow bg-slate-900 rounded-md overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-white">Carregando configuração...</span>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 flex-col p-4">
              <div className="text-red-400 text-xl mb-2">⚠️ Erro</div>
              <p className="text-white text-center">{error}</p>
              <Button 
                variant="destructive" 
                className="mt-4" 
                onClick={onClose}
              >
                Fechar
              </Button>
            </div>
          )}
          
          {iframeUrl && !loading && !error && (
            <iframe 
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Configuração do Webhook Dify"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DifySetupIframe;
