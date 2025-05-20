
import { Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import ChatwootPage from '@/pages/ChatwootPage';
import CampaignPage from '@/pages/CampaignPage';
import IAPersonalityPage from '@/pages/IAPersonalityPage';
import CatalogPage from '@/pages/CatalogPage';
import AffiliatePage from '@/pages/AffiliatePage';
import ClientsPage from '@/pages/ClientsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/bots" element={<Index />} />
      <Route path="/status" element={<Index />} />
      <Route path="/help" element={<ChatwootPage />} />
      <Route path="/campaigns" element={<CampaignPage />} />
      <Route path="/ia-personality" element={<IAPersonalityPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/affiliate" element={<AffiliatePage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
