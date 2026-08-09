import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, PlusCircle, LogOut, Baby } from 'lucide-react';
// import { supabase } from '../lib/supabase'; // TODO: integrate later

// Mock auth for now
const isAuthenticated = true;

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Simulasi penghapusan sesi/token
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/admin', icon: Home, label: 'Dashboard', exact: true },
    { path: '/admin/balita', icon: Users, label: 'Data Balita' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-sky-100 p-2 rounded-lg">
            <Baby className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">PELITA Cibelok</h1>
            <p className="text-xs text-slate-500 font-medium">Bina Balita Sehat</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path || location.pathname === item.path + '/'
              : location.pathname.startsWith(item.path);
              
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-sky-600'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
