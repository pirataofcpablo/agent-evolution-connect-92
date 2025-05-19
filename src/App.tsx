
import { Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import ChatwootPage from '@/pages/ChatwootPage';
import CampaignPage from '@/pages/CampaignPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/bots" element={<Index />} />
      <Route path="/status" element={<Index />} />
      <Route path="/help" element={<ChatwootPage />} />
      <Route path="/campaigns" element={<CampaignPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
