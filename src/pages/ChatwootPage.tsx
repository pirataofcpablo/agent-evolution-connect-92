
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const ChatwootPage = () => {
  const openChatwootLink = () => {
    window.open("http://app.solucoesweb.uk", "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">Chatwoot</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-blue-500/20 bg-black">
              <CardHeader>
                <CardTitle className="text-xl text-blue-400">O que é o Chatwoot?</CardTitle>
                <CardDescription className="text-gray-400">
                  Plataforma de atendimento ao cliente multicanal e open source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-300">
                  <p>
                    O Chatwoot é uma plataforma open source de atendimento ao cliente que permite gerenciar 
                    conversas de diversos canais em um único lugar, incluindo WhatsApp, Facebook Messenger, 
                    Twitter, Instagram, e-mail e muito mais.
                  </p>
                  
                  <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-md">
                    <h3 className="font-medium text-blue-400 mb-2">Principais funcionalidades:</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Caixa de entrada unificada para todos os canais de comunicação</li>
                      <li>Gerenciamento de equipe com atribuição de conversas</li>
                      <li>Automações e chatbots para aumentar a eficiência</li>
                      <li>Etiquetas e notas para melhor organização</li>
                      <li>Relatórios e análises de desempenho</li>
                      <li>Integração direta com seu WhatsApp Business</li>
                    </ul>
                  </div>
                  
                  <p>
                    Com o Chatwoot, você pode oferecer um atendimento eficiente e organizado, sem precisar 
                    alternar entre diferentes plataformas. Toda a comunicação com seus clientes fica centralizada 
                    em um único lugar.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={openChatwootLink}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar Chatwoot
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-blue-500/20 bg-black">
              <CardHeader>
                <CardTitle className="text-xl text-blue-400">Como Funciona com o WhatsApp</CardTitle>
                <CardDescription className="text-gray-400">
                  Integrando seu WhatsApp Business à plataforma Chatwoot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-300">
                  <p>
                    A integração entre o Chatwoot e seu WhatsApp Business permite que você gerencie todas 
                    as conversas de WhatsApp através de uma interface profissional, com recursos avançados 
                    de atendimento ao cliente.
                  </p>
                  
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-md">
                    <h3 className="font-medium text-blue-400 mb-2">Benefícios da integração:</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Atendimento colaborativo com vários agentes simultaneamente</li>
                      <li>Histórico completo de conversas com seus clientes</li>
                      <li>Respostas rápidas pré-definidas para questões comuns</li>
                      <li>Transferência de conversas entre atendentes</li>
                      <li>Automações para filtrar e categorizar mensagens</li>
                      <li>Relatórios de produtividade e tempo de resposta</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <div className="text-center p-3 bg-gray-800 rounded-md">
                      <div className="text-3xl mb-2">📱</div>
                      <h4 className="text-blue-400 font-medium">Multi-dispositivo</h4>
                      <p className="text-xs mt-1">Acesse de qualquer dispositivo</p>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-800 rounded-md">
                      <div className="text-3xl mb-2">👥</div>
                      <h4 className="text-blue-400 font-medium">Multi-usuário</h4>
                      <p className="text-xs mt-1">Vários atendentes simultâneos</p>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-800 rounded-md">
                      <div className="text-3xl mb-2">🤖</div>
                      <h4 className="text-blue-400 font-medium">Automações</h4>
                      <p className="text-xs mt-1">Bots e respostas automáticas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={openChatwootLink}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configurar Meu Chatwoot
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="border-blue-500/20 bg-black mt-6">
            <CardHeader>
              <CardTitle className="text-xl text-blue-400">Como Começar</CardTitle>
              <CardDescription className="text-gray-400">
                Passos para configurar o Chatwoot com seu WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 pl-6 list-decimal text-gray-300">
                <li>
                  <strong className="text-blue-400">Acesse nossa plataforma Chatwoot</strong>
                  <p className="text-sm mt-1">
                    Clique no botão "Acessar Chatwoot" e faça login com as credenciais fornecidas
                    pela nossa equipe.
                  </p>
                </li>
                
                <li>
                  <strong className="text-blue-400">Crie uma caixa de entrada para WhatsApp</strong>
                  <p className="text-sm mt-1">
                    No painel do Chatwoot, vá em "Configurações" {'->'} "Caixas de Entrada" {'->'} "Adicionar Caixa de Entrada" 
                    e selecione "WhatsApp" como canal.
                  </p>
                </li>
                
                <li>
                  <strong className="text-blue-400">Escaneie o QR Code</strong>
                  <p className="text-sm mt-1">
                    Siga as instruções na tela para escanear o QR Code com seu WhatsApp Business.
                  </p>
                </li>
                
                <li>
                  <strong className="text-blue-400">Personalize suas configurações</strong>
                  <p className="text-sm mt-1">
                    Configure respostas rápidas, horários de atendimento, mensagens automáticas e outros recursos 
                    de acordo com suas necessidades.
                  </p>
                </li>
                
                <li>
                  <strong className="text-blue-400">Comece a atender</strong>
                  <p className="text-sm mt-1">
                    Pronto! Agora você pode gerenciar todas as conversas do WhatsApp através do Chatwoot.
                  </p>
                </li>
              </ol>
              
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-md">
                <h3 className="font-medium text-yellow-400 flex items-center">Precisa de ajuda?</h3>
                <p className="mt-2 text-gray-300 text-sm">
                  Nossa equipe está disponível para auxiliar na configuração e tirar dúvidas sobre o Chatwoot.
                  Entre em contato através da seção "Ajuda" ou clique no botão abaixo para acessar diretamente
                  nossa plataforma.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={openChatwootLink}
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Acesse a Plataforma Chatwoot
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatwootPage;
