
import { Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import ChatwootPage from '@/pages/ChatwootPage';
import CampaignPage from '@/pages/CampaignPage';
import IAPersonalityPage from '@/pages/IAPersonalityPage';
import CatalogPage from '@/pages/CatalogPage';
import AffiliatePage from '@/pages/AffiliatePage';
import ClientsPage from '@/pages/ClientsPage';
import AuthPage from '@/pages/AuthPage';
import AuthCheck from '@/components/AuthCheck';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Routes>
        {/* Rota de autenticação não protegida */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Rotas protegidas por autenticação */}
        <Route path="/" element={
          <AuthCheck>
            <Index />
          </AuthCheck>
        } />
        <Route path="/bots" element={
          <AuthCheck>
            <Index />
          </AuthCheck>
        } />
        <Route path="/status" element={
          <AuthCheck>
            <Index />
          </AuthCheck>
        } />
        <Route path="/help" element={
          <AuthCheck>
            <ChatwootPage />
          </AuthCheck>
        } />
        <Route path="/campaigns" element={
          <AuthCheck>
            <CampaignPage />
          </AuthCheck>
        } />
        <Route path="/ia-personality" element={
          <AuthCheck>
            <IAPersonalityPage />
          </AuthCheck>
        } />
        <Route path="/catalog" element={
          <AuthCheck>
            <CatalogPage />
          </AuthCheck>
        } />
        <Route path="/affiliate" element={
          <AuthCheck>
            <AffiliatePage />
          </AuthCheck>
        } />
        <Route path="/clients" element={
          <AuthCheck>
            <ClientsPage />
          </AuthCheck>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
