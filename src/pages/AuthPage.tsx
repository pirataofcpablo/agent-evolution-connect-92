
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

// Schema de validação para registro com regras específicas para senha
const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Digite um email válido"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .refine(val => /[0-9]/.test(val), "Senha deve conter pelo menos um número")
    .refine(val => /[^a-zA-Z0-9]/.test(val), "Senha deve conter pelo menos um caractere especial"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos")
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const WEBHOOK_URL = "https://8n.solucoesweb.uk/webhook/7419adc7abc043b2a0fc07ec29527b";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form para login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  // Form para registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      whatsapp: ""
    }
  });

  // Função para lidar com o login
  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Simular verificação de login (em produção, isso seria feito com uma API real)
      
      console.log("Tentando login com:", values);
      
      // Para demonstração, vamos armazenar os dados no localStorage
      localStorage.setItem('userEmail', values.email);
      localStorage.setItem('isLoggedIn', 'true');
      
      // Adicionar algum atraso para simular uma operação de rede
      setTimeout(() => {
        toast({
          title: "Login realizado com sucesso",
          description: "Você será redirecionado para a dashboard.",
        });
        
        // Redirecionar para a dashboard após um pequeno atraso
        navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  // Função para lidar com o registro
  const handleRegister = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      console.log("Registrando usuário:", values);
      
      // Simular envio ao webhook - em produção, usaria o real webhook
      // No ambiente de desenvolvimento, podemos simular a resposta
      console.log("Dados que seriam enviados ao webhook:", {
        name: values.name,
        email: values.email,
        password: values.password,
        whatsapp: values.whatsapp,
      });
      
      // Salvar informações localmente para simular autenticação
      localStorage.setItem('userEmail', values.email);
      localStorage.setItem('userName', values.name);
      localStorage.setItem('isLoggedIn', 'true');
      
      // Adicionar atraso para simular uma operação de rede
      setTimeout(() => {
        toast({
          title: "Conta criada com sucesso",
          description: "Suas credenciais foram processadas. Você será redirecionado para a dashboard.",
        });
        
        // Redirecionar para a dashboard após um pequeno atraso
        navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao registrar:", error);
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um erro ao criar sua conta. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-8">
          <img 
            src="https://whatsvenda.online/img/logologin.png"
            alt="WhatsVenda Logo"
            className="h-16"
          />
        </div>
        
        <Card className="w-full bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">WhatsVenda CRM</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Acesse sua conta ou crie uma nova
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 bg-gray-700">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Seu nome completo" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage className="text-xs">
                            Deve ter pelo menos 8 caracteres, um número e um caractere especial
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 11912345678" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex justify-center pb-6 pt-2">
            <p className="text-sm text-gray-400">
              WhatsVenda CRM - Sistema SAAS de Agentes IA
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
