
import { useState } from "react";
import { Book, Iframe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";

const IAPersonalityPage = () => {
  const [url, setUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Carregar URL do localStorage no primeiro carregamento
  useState(() => {
    const savedUrl = localStorage.getItem('iaPersonalityUrl');
    if (savedUrl) {
      setUrl(savedUrl);
      setIframeUrl(savedUrl);
    }
  });

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
          
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle>Configurar Personalidade</CardTitle>
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
                  <Iframe className="mr-2 h-5 w-5 text-green-500" />
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
        </div>
      </div>
    </div>
  );
};

export default IAPersonalityPage;
