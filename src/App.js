import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/scrolltotop';
import HomePage from './pages/home';
import FaqPage from './components/faq';
import TeamPage from './components/team';
import DashboardPage from './pages/dashboard';
import VotingPage from './voting/VotingPage';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/:tab" element={<DashboardPage />} />
        <Route path="/voting/:eventId" element={<VotingPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
