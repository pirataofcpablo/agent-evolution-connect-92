
import { useState, useEffect, useRef } from "react";
import { Book, Frame, Upload, Send, FileText, Image, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";

const IAPersonalityPage = () => {
  // Google Sheets iframe state
  const [url, setUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // N8n webhook state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isWebhookConfigured, setIsWebhookConfigured] = useState(false);
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    // Load Google Sheets/Form URL
    const savedUrl = localStorage.getItem('iaPersonalityUrl');
    if (savedUrl) {
      setUrl(savedUrl);
      setIframeUrl(savedUrl);
    }
    
    // Load webhook URL
    const savedWebhookUrl = localStorage.getItem('n8nWebhookUrl');
    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
      setIsWebhookConfigured(true);
    }
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

  // N8n webhook configuration
  const configureWebhook = () => {
    if (!webhookUrl) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira o link do webhook do n8n.",
        variant: "destructive",
      });
      return;
    }

    // Validate webhook URL
    try {
      new URL(webhookUrl);
    } catch (e) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira um URL válido para o webhook.",
        variant: "destructive",
      });
      return;
    }

    // Save webhook URL to localStorage
    localStorage.setItem('n8nWebhookUrl', webhookUrl);
    setIsWebhookConfigured(true);
    
    toast({
      title: "Webhook configurado",
      description: "Seu webhook do n8n foi configurado com sucesso.",
    });
  };

  // Reset webhook configuration
  const resetWebhook = () => {
    localStorage.removeItem('n8nWebhookUrl');
    setWebhookUrl("");
    setIsWebhookConfigured(false);
    
    toast({
      title: "Webhook removido",
      description: "A configuração do webhook foi removida.",
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

  // Send data to n8n webhook
  const sendToWebhook = async () => {
    if (!isWebhookConfigured) {
      toast({
        title: "Webhook não configurado",
        description: "Por favor, configure o webhook do n8n primeiro.",
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
      const formData = new FormData();
      formData.append("text", text);
      
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // Retrieve webhook URL from localStorage
      const savedWebhookUrl = localStorage.getItem('n8nWebhookUrl');
      
      // Send data to webhook
      const response = await fetch(savedWebhookUrl || webhookUrl, {
        method: "POST",
        body: formData,
        mode: "no-cors" // Use no-cors to avoid CORS errors
      });

      // Clear form after successful submission
      setText("");
      setSelectedFiles([]);
      
      toast({
        title: "Enviado com sucesso",
        description: "Seu conhecimento foi enviado para o webhook do n8n.",
      });
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar os dados para o webhook.",
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
              {/* Webhook Configuration Card */}
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle>Configuração do Webhook</CardTitle>
                  <CardDescription>
                    Configure o webhook do n8n para enviar conhecimento para sua IA.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isWebhookConfigured ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url">URL do Webhook do n8n</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="webhook-url" 
                            value={webhookUrl} 
                            onChange={(e) => setWebhookUrl(e.target.value)} 
                            placeholder="https://n8n.seu-dominio.com/webhook/..."
                            className="bg-gray-800 border-gray-700 flex-1"
                          />
                          <Button 
                            onClick={configureWebhook}
                            className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          >
                            Configurar
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400">
                          Cole aqui o link do webhook do n8n que receberá os dados de conhecimento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-green-400">Webhook Configurado</h3>
                            <p className="text-sm text-gray-300 truncate max-w-[400px]">{webhookUrl}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={resetWebhook}
                            className="border-red-500 text-red-500 hover:bg-red-900/20"
                          >
                            Desconectar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Knowledge Form Card */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Enviar Conhecimento</CardTitle>
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
                      />
                    </div>
                    
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label>Arquivos</Label>
                      <div 
                        className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={triggerFileUpload}
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
                      onClick={sendToWebhook}
                      disabled={isSending || (!isWebhookConfigured)}
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
