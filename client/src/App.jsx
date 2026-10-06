import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Investigations from './pages/Investigations';
import InvestigationDashboard from './pages/InvestigationDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Navigation />
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/investigations" element={<Investigations />} />
          <Route path="/investigate/:id" element={<InvestigationDashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
