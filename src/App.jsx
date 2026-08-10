import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Toddlers from './pages/Toddlers';
import ToddlerDetail from './pages/ToddlerDetail';
import ParentPortal from './pages/ParentPortal';
import PublicToddlerDetail from './pages/PublicToddlerDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<ParentPortal />} />
        <Route path="/cek-balita/:id" element={<PublicToddlerDetail />} />
        
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="balita" element={<Toddlers />} />
          <Route path="balita/:id" element={<ToddlerDetail />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
