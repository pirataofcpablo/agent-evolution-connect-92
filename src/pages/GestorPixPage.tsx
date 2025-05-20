
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CreditCard, Users, Save, Trash2, Edit, Check, Package, BadgeDollarSign, ChartBar, ChartPie } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import FinancialProgressBar from "@/components/FinancialProgressBar";
import { getAllClients } from "@/services/clientService";
import { getMercadoPagoConfig, saveMercadoPagoConfig } from "@/services/mercadoPagoService";
import { formatCurrency, formatDate, calculateDaysUntil } from "@/lib/utils";
import { getFinancialSummary } from "@/services/financialService";
import { ChargeTemplate, getChargeTemplates, saveChargeTemplate, updateChargeTemplate, deleteChargeTemplate, processTemplate } from "@/services/chargeTemplateService";

const GestorPixPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [clients, setClients] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    totalPlans: 0,
    upcomingRevenue: 0,
    dueClients: []
  });
  
  // Estados para o Mercado Pago
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    accessToken: "",
    enabled: false,
    notifyDaysBeforeExpiration: 3,
    reminderMessage: "Olá {nome}, sua mensalidade de {valor} vence em {dias} dias. Para renovar, acesse: {link}",
    thankYouMessage: "Obrigado {nome}! Seu pagamento foi confirmado com sucesso."
  });
  
  // Estados para Templates de Cobrança
  const [templates, setTemplates] = useState<ChargeTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<ChargeTemplate>>({
    name: "",
    template: ""
  });
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  
  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Carregar clientes
        const clientList = getAllClients();
        setClients(clientList);
        
        // Calcular resumo financeiro
        const summary = getFinancialSummary(clientList);
        setFinancialSummary(summary);
        
        // Carregar configuração do Mercado Pago
        const instanceName = localStorage.getItem('instanceName')?.replace("_Cliente", "") || "";
        if (instanceName) {
          const mpConfig = getMercadoPagoConfig(instanceName);
          if (mpConfig) {
            setMercadoPagoConfig(mpConfig);
          }
        }
        
        // Carregar templates de cobrança
        const savedTemplates = getChargeTemplates();
        setTemplates(savedTemplates);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do sistema",
          variant: "destructive"
        });
      }
    };
    
    loadInitialData();
  }, [toast]);
  
  // Funções para gerenciar templates de cobrança
  const handleTemplateChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentTemplate({
      ...currentTemplate,
      [field]: e.target.value
    });
  };
  
  const handleSaveTemplate = () => {
    try {
      if (!currentTemplate.name || !currentTemplate.template) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o nome e o conteúdo do template",
          variant: "destructive"
        });
        return;
      }
      
      if (isEditingTemplate && currentTemplate.id) {
        const updated = updateChargeTemplate(currentTemplate.id, {
          name: currentTemplate.name,
          template: currentTemplate.template
        });
        
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        toast({
          title: "Template atualizado",
          description: "O template de cobrança foi atualizado com sucesso"
        });
      } else {
        const newTemplate = saveChargeTemplate({
          name: currentTemplate.name,
          template: currentTemplate.template
        });
        
        setTemplates(prev => [...prev, newTemplate]);
        toast({
          title: "Template criado",
          description: "O template de cobrança foi criado com sucesso"
        });
      }
      
      resetTemplateForm();
      setShowTemplateDialog(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o template",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteTemplate = (id: string) => {
    if (deleteChargeTemplate(id)) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Template excluído",
        description: "O template foi removido com sucesso"
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template",
        variant: "destructive"
      });
    }
  };
  
  const handleEditTemplate = (template: ChargeTemplate) => {
    setCurrentTemplate(template);
    setIsEditingTemplate(true);
    setShowTemplateDialog(true);
  };
  
  const resetTemplateForm = () => {
    setCurrentTemplate({ name: "", template: "" });
    setIsEditingTemplate(false);
  };
  
  // Salvar configurações do Mercado Pago
  const handleSaveMercadoPagoConfig = async () => {
    try {
      const instanceName = localStorage.getItem('instanceName')?.replace("_Cliente", "") || "";
      if (!instanceName) {
        toast({
          title: "Erro",
          description: "Nenhuma instância conectada",
          variant: "destructive"
        });
        return;
      }
      
      const success = await saveMercadoPagoConfig(instanceName, mercadoPagoConfig);
      
      if (success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações do Mercado Pago foram salvas com sucesso"
        });
      } else {
        throw new Error("Falha ao salvar configurações");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    }
  };
  
  // Função para gerar mensagem com base em um template
  const previewTemplateMessage = (templateId: string, clientId?: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return "Template não encontrado";
    
    const client = clientId ? 
      clients.find(c => c.id === clientId) : 
      (clients.length > 0 ? clients[0] : null);
    
    if (!client) return "Cliente não encontrado";
    
    return processTemplate(template.template, {
      nome: client.name,
      valor: client.planValue,
      vencimento: client.dueDate,
      dias: calculateDaysUntil(client.dueDate),
      whatsapp: client.whatsapp
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          {/* Cabeçalho com nome e barra de progresso */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <h1 className="text-3xl font-bold">Gestor Pix</h1>
              <div className="w-full md:w-1/2">
                <FinancialProgressBar currentValue={financialSummary.totalRevenue} />
              </div>
            </div>
          </div>
          
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BadgeDollarSign className="mr-2 h-5 w-5 text-green-400" />
                  Recebimentos Futuros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(financialSummary.upcomingRevenue)}</p>
                <p className="text-sm text-gray-400">nos próximos 30 dias</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Package className="mr-2 h-5 w-5 text-blue-400" />
                  Total de Planos Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-400">{financialSummary.totalPlans}</p>
                <p className="text-sm text-gray-400">clientes ativos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ChartBar className="mr-2 h-5 w-5 text-purple-400" />
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(financialSummary.totalRevenue)}</p>
                <p className="text-sm text-gray-400">em assinaturas</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Abas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="visao-geral">📊 Visão Geral</TabsTrigger>
              <TabsTrigger value="clientes">👥 Clientes</TabsTrigger>
              <TabsTrigger value="configuracoes">⚙️ Configurações</TabsTrigger>
            </TabsList>
            
            {/* Aba de Visão Geral */}
            <TabsContent value="visao-geral">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Visão Geral Financeira</CardTitle>
                  <CardDescription className="text-gray-400">
                    Acompanhe o desempenho dos seus recebimentos e clientes em um único lugar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gráfico de Distribuição de Clientes */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Próximas Cobranças</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {financialSummary.dueClients.length > 0 ? (
                          <div className="space-y-4">
                            {financialSummary.dueClients.map(client => (
                              <div 
                                key={client.id}
                                className="flex justify-between items-center rounded p-3 bg-gray-800"
                              >
                                <div>
                                  <p className="font-medium">{client.name}</p>
                                  <p className="text-sm text-gray-400">Vence em: {formatDate(client.dueDate)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-400">{formatCurrency(client.planValue)}</p>
                                  <p className="text-xs text-gray-400">Faltam {calculateDaysUntil(client.dueDate)} dias</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-400 py-4">
                            Não há cobranças próximas do vencimento
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Templates de Cobrança */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader className="pb-2 flex flex-row justify-between items-center">
                        <CardTitle className="text-lg">Templates de Cobrança</CardTitle>
                        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                resetTemplateForm();
                                setShowTemplateDialog(true);
                              }}
                            >
                              Novo Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 text-white">
                            <DialogHeader>
                              <DialogTitle>{isEditingTemplate ? 'Editar Template' : 'Novo Template de Cobrança'}</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Crie mensagens personalizadas para cobranças com variáveis como {"{nome}"}, {"{valor}"}, etc.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="template-name">Nome do Template</Label>
                                <Input
                                  id="template-name"
                                  value={currentTemplate.name || ''}
                                  onChange={handleTemplateChange('name')}
                                  className="bg-gray-700 border-gray-600"
                                />
                              </div>
                              <div>
                                <Label htmlFor="template-content">Conteúdo</Label>
                                <Textarea
                                  id="template-content"
                                  rows={6}
                                  value={currentTemplate.template || ''}
                                  onChange={handleTemplateChange('template')}
                                  className="bg-gray-700 border-gray-600"
                                  placeholder="Exemplo: Olá {nome}, sua mensalidade de {valor} vence em {dias} dias."
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                  Variáveis disponíveis: {"{nome}"}, {"{valor}"}, {"{vencimento}"}, {"{dias}"}, {"{whatsapp}"}
                                </p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancelar</Button>
                              <Button onClick={handleSaveTemplate}>
                                {isEditingTemplate ? 'Atualizar' : 'Salvar'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {templates.length > 0 ? (
                          <div className="space-y-3">
                            {templates.map(template => (
                              <div 
                                key={template.id}
                                className="flex justify-between items-center rounded p-3 bg-gray-800"
                              >
                                <div>
                                  <p className="font-medium">{template.name}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {template.template}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEditTemplate(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-400 py-4">
                            Nenhum template criado
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-400 w-full text-center">
                          Templates ajudam a padronizar sua comunicação e economizar tempo
                        </p>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Clientes */}
            <TabsContent value="clientes">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Gerenciamento de Clientes</CardTitle>
                  <CardDescription className="text-gray-400">
                    Visualize e gerencie todos os seus clientes e planos vendidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clients.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clients.map(client => {
                            const daysUntil = calculateDaysUntil(client.dueDate);
                            let status = "Ativo";
                            let statusClass = "text-green-400";
                            
                            if (daysUntil < 0) {
                              status = "Vencido";
                              statusClass = "text-red-400";
                            } else if (daysUntil <= 3) {
                              status = "Prestes a vencer";
                              statusClass = "text-yellow-400";
                            }
                            
                            return (
                              <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>{client.whatsapp}</TableCell>
                                <TableCell>{formatCurrency(client.planValue)}</TableCell>
                                <TableCell>{formatDate(client.dueDate)}</TableCell>
                                <TableCell className={statusClass}>{status}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        // Implementação do Mercado Pago - envio de cobrança
                                        toast({
                                          title: "Cobrança enviada",
                                          description: `Cobrança enviada para ${client.name}`
                                        });
                                      }}
                                    >
                                      Cobrar
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhum cliente cadastrado</h3>
                      <p className="mt-1 text-gray-400">
                        Seus clientes aparecerão aqui quando cadastrados
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Configurações */}
            <TabsContent value="configuracoes">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Configurações de Pagamento</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure a integração com Mercado Pago e outras opções de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Integração Mercado Pago */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Integração com Mercado Pago
                      </h3>
                      
                      <div className="grid gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id="enable-mp"
                            checked={mercadoPagoConfig.enabled}
                            onChange={(e) => setMercadoPagoConfig({
                              ...mercadoPagoConfig,
                              enabled: e.target.checked
                            })}
                            className="rounded border-gray-400 text-blue-500 focus:ring-blue-500"
                          />
                          <Label htmlFor="enable-mp">Ativar integração com Mercado Pago</Label>
                        </div>
                        
                        {mercadoPagoConfig.enabled && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="mp-token">Access Token</Label>
                              <Input
                                id="mp-token"
                                type="password"
                                value={mercadoPagoConfig.accessToken}
                                onChange={(e) => setMercadoPagoConfig({
                                  ...mercadoPagoConfig,
                                  accessToken: e.target.value
                                })}
                                className="bg-gray-700 border-gray-600"
                                placeholder="TEST-0000000000000000-000000-00000000000000000000000000000000-000000000"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Obtenha seu Access Token no painel do Mercado Pago
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="mp-days">Notificar dias antes do vencimento</Label>
                              <Input
                                id="mp-days"
                                type="number"
                                min={1}
                                max={30}
                                value={mercadoPagoConfig.notifyDaysBeforeExpiration}
                                onChange={(e) => setMercadoPagoConfig({
                                  ...mercadoPagoConfig,
                                  notifyDaysBeforeExpiration: parseInt(e.target.value) || 3
                                })}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="mp-reminder">Mensagem de Lembrete</Label>
                              <Textarea
                                id="mp-reminder"
                                value={mercadoPagoConfig.reminderMessage}
                                onChange={(e) => setMercadoPagoConfig({
                                  ...mercadoPagoConfig,
                                  reminderMessage: e.target.value
                                })}
                                className="bg-gray-700 border-gray-600"
                                rows={4}
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Variáveis: {"{nome}"}, {"{valor}"}, {"{dias}"}, {"{link}"}
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="mp-thanks">Mensagem de Agradecimento</Label>
                              <Textarea
                                id="mp-thanks"
                                value={mercadoPagoConfig.thankYouMessage}
                                onChange={(e) => setMercadoPagoConfig({
                                  ...mercadoPagoConfig,
                                  thankYouMessage: e.target.value
                                })}
                                className="bg-gray-700 border-gray-600"
                                rows={3}
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Variáveis: {"{nome}"}
                              </p>
                            </div>
                            
                            <Button onClick={handleSaveMercadoPagoConfig}>
                              Salvar Configurações
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GestorPixPage;
