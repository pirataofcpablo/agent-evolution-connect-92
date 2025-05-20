
import { useState, useEffect, useRef } from "react";
import { Book, Frame, Upload, Send, FileText, Image, Video, Bot, Brain, Loader2, AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import { getN8nConfig, sendKnowledgeToN8nAgent } from "@/services/n8nService";

const IAPersonalityPage = () => {
  // Google Sheets iframe state
  const [url, setUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // State for n8n integration
  const [instanceName, setInstanceName] = useState<string>("");
  const [n8nConfig, setN8nConfig] = useState<any>(null);
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);

  // Load saved data on component mount
  useEffect(() => {
    // Load Google Sheets/Form URL
    const savedUrl = localStorage.getItem('iaPersonalityUrl');
    if (savedUrl) {
      setUrl(savedUrl);
      setIframeUrl(savedUrl);
    }
    
    // Get instance name and n8n config
    const storedInstanceName = localStorage.getItem('instanceName');
    if (storedInstanceName) {
      const baseInstanceName = storedInstanceName.replace("_Cliente", "");
      setInstanceName(baseInstanceName);
      
      // Load n8n config for this instance
      const config = getN8nConfig(baseInstanceName);
      setN8nConfig(config);
    }
    
    setIsCheckingConfig(false);
  }, []);

  // Google Sheets iframe handling
  const handleLoadIframe = () => {
    if (!url) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira o link da planilha ou formulário Google.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se a URL é do Google Sheets ou Google Forms
    if (!url.includes("docs.google.com") && !url.includes("forms.gle") && !url.includes("forms.google.com")) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira um link válido do Google Sheets ou Google Forms.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Se for um link de edição, convertê-lo em um link de visualização/embed
    let embedUrl = url;
    
    // Para Google Sheets
    if (url.includes("docs.google.com/spreadsheets")) {
      // Converter /edit para /htmlview ou /pubhtml
      embedUrl = url.replace(/\/edit.*$/, '/pubhtml?widget=true');
    }
    
    // Para Google Forms
    else if (url.includes("docs.google.com/forms") || url.includes("forms.gle")) {
      // Certificar-se de que estamos usando o link de incorporação
      if (!url.includes("viewform")) {
        embedUrl = url.includes("forms.gle") 
          ? url 
          : url.replace(/\/edit.*$/, '/viewform?embedded=true');
      } else if (!url.includes("embedded=true")) {
        embedUrl += url.includes("?") ? "&embedded=true" : "?embedded=true";
      }
    }

    setIframeUrl(embedUrl);
    
    // Salvar no localStorage para persistência
    localStorage.setItem('iaPersonalityUrl', embedUrl);
    
    setLoading(false);
    
    toast({
      title: "Carregado com sucesso",
      description: "O documento foi carregado no iframe."
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...filesArray]);
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (size: number) => {
    if (size < 1024) return size + " bytes";
    else if (size < 1048576) return (size / 1024).toFixed(1) + " KB";
    else return (size / 1048576).toFixed(1) + " MB";
  };

  // Send knowledge to n8n agent
  const sendKnowledgeToAgent = async () => {
    if (!instanceName || !n8nConfig || !n8nConfig.webhookUrl) {
      toast({
        title: "Agente não configurado",
        description: "Configure seu agente IA na aba Integrar Bots > n8n primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!text && selectedFiles.length === 0) {
      toast({
        title: "Conteúdo vazio",
        description: "Por favor, insira um texto ou selecione arquivos para enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Primeiro enviar o texto se existir
      if (text) {
        const textSuccess = await sendKnowledgeToN8nAgent(instanceName, text, 'text');
        if (!textSuccess) {
          throw new Error("Falha ao enviar texto");
        }
      }
      
      // Depois enviar cada arquivo
      for (const file of selectedFiles) {
        const fileSuccess = await sendKnowledgeToN8nAgent(instanceName, file, 'file');
        if (!fileSuccess) {
          throw new Error(`Falha ao enviar arquivo: ${file.name}`);
        }
      }

      // Limpar formulário após sucesso
      setText("");
      setSelectedFiles([]);
      
      toast({
        title: "Conhecimento enviado",
        description: "Seu conhecimento foi enviado para o agente IA com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao enviar conhecimento:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar conhecimento para o agente IA.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Get file icon by type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-400" />;
    } else if (fileType.startsWith("video/")) {
      return <Video className="h-5 w-5 text-red-400" />;
    } else {
      return <FileText className="h-5 w-5 text-green-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          <div className="flex items-center mb-6">
            <Book className="mr-2 h-6 w-6 text-green-500" />
            <h1 className="text-3xl font-bold">Personalidade IA</h1>
          </div>
          
          <Tabs defaultValue="knowledge" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="knowledge">Enviar Conhecimento</TabsTrigger>
              <TabsTrigger value="document">Documento Google</TabsTrigger>
            </TabsList>
            
            <TabsContent value="knowledge">
              {/* Agent Status Card */}
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="mr-2 h-5 w-5 text-blue-500" />
                    Status do Agente IA
                  </CardTitle>
                  <CardDescription>
                    Verifique o status do seu agente IA integrado ao n8n
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isCheckingConfig ? (
                    <div className="flex items-center text-gray-400">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verificando configuração...
                    </div>
                  ) : n8nConfig && n8nConfig.webhookUrl ? (
                    <>
                      <Alert className="bg-green-900/20 border-green-500/30 mb-4">
                        <Check className="h-5 w-5 text-green-500" />
                        <AlertTitle className="text-green-500">Agente IA Conectado</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Seu agente está conectado ao n8n e pronto para receber conhecimento.
                          {n8nConfig.aiModel && (
                            <span className="block mt-1">
                              Modelo atual: <strong className="text-blue-400">
                                {n8nConfig.aiModel === 'groq' ? 'Groq LLM' : 'OpenAI GPT'}
                              </strong>
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                      
                      {!n8nConfig.aiModel && (
                        <Alert className="bg-yellow-900/20 border-yellow-500/30">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <AlertTitle className="text-yellow-500">Modelo de IA não selecionado</AlertTitle>
                          <AlertDescription className="text-gray-300">
                            Você ainda não selecionou um modelo de IA para seu agente.
                            Acesse a aba Integrar Bots > n8n > Agente IA para selecionar um modelo.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert className="bg-yellow-900/20 border-yellow-500/30">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <AlertTitle className="text-yellow-500">Agente IA não configurado</AlertTitle>
                      <AlertDescription className="text-gray-300">
                        Você ainda não configurou seu agente IA. Acesse a aba Integrar Bots > n8n 
                        para criar e configurar seu agente automaticamente.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {/* Knowledge Form Card */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-green-500" />
                    Enviar Conhecimento para o Agente IA
                  </CardTitle>
                  <CardDescription>
                    Envie texto ou arquivos para alimentar sua IA com conhecimento personalizado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Text Input */}
                    <div className="space-y-2">
                      <Label htmlFor="knowledge-text">Texto</Label>
                      <Textarea 
                        id="knowledge-text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="Digite o conhecimento que deseja enviar para sua IA..."
                        className="bg-gray-800 border-gray-700 min-h-[150px]"
                        disabled={!n8nConfig || !n8nConfig.webhookUrl}
                      />
                    </div>
                    
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label>Arquivos</Label>
                      <div 
                        className={`border-2 border-dashed border-gray-700 rounded-lg p-6 text-center ${
                          (!n8nConfig || !n8nConfig.webhookUrl) 
                            ? 'opacity-60 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-gray-800/50'
                        } transition-colors`}
                        onClick={(!n8nConfig || !n8nConfig.webhookUrl) ? undefined : triggerFileUpload}
                      >
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-300 font-medium">
                          Clique para selecionar arquivos ou arraste e solte aqui
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Suporta texto, PDF, imagens e vídeos
                        </p>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden" 
                          multiple
                          accept=".txt,.pdf,.doc,.docx,image/*,video/*"
                          disabled={!n8nConfig || !n8nConfig.webhookUrl}
                        />
                      </div>
                    </div>
                    
                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Arquivos Selecionados</Label>
                        <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3">
                              <div className="flex items-center space-x-3">
                                {getFileIcon(file.type)}
                                <div>
                                  <p className="text-sm font-medium text-gray-200">{file.name}</p>
                                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeFile(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                Remover
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Submit Button */}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={sendKnowledgeToAgent}
                      disabled={isSending || !n8nConfig || !n8nConfig.webhookUrl || (!text && selectedFiles.length === 0)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSending ? "Enviando..." : "Enviar Conhecimento"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="document">
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle>Configurar Documento Google</CardTitle>
                  <CardDescription>
                    Insira o link da sua planilha ou formulário Google para personalizar a IA.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sheet-url">URL da Planilha/Formulário Google</Label>
                      <div className="flex space-x-2">
                        <Input 
                          id="sheet-url" 
                          value={url} 
                          onChange={(e) => setUrl(e.target.value)} 
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="bg-gray-800 border-gray-700 flex-1"
                        />
                        <Button 
                          onClick={handleLoadIframe}
                          className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          disabled={loading}
                        >
                          {loading ? "Carregando..." : "Carregar"}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400">
                        Cole aqui o link de uma planilha do Google Sheets ou formulário do Google Forms.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {iframeUrl && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center">
                      <Frame className="mr-2 h-5 w-5 text-green-500" />
                      <CardTitle>Documento Carregado</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-md overflow-hidden w-full">
                      <iframe 
                        src={iframeUrl} 
                        className="w-full min-h-[70vh] border-0"
                        title="Google Sheet"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default IAPersonalityPage;
