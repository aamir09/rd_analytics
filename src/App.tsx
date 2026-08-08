import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import LeagueTable from './pages/LeagueTable';
import Fixtures from './pages/Fixtures';
import Results from './pages/Results';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import TeamStats from './pages/TeamStats';
import Compare from './pages/Compare';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/table"      element={<LeagueTable />} />
          <Route path="/fixtures"   element={<Fixtures />} />
          <Route path="/results"    element={<Results />} />
          <Route path="/players"    element={<Players />} />
          <Route path="/players/:name" element={<PlayerDetail />} />
          <Route path="/team"       element={<TeamStats />} />
          <Route path="/compare"    element={<Compare />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
