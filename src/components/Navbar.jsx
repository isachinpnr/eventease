import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold hover:scale-105 transition-transform duration-200 flex items-center gap-2">
            <span className="text-4xl">🎫</span>
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              EventEase
            </span>
          </Link>
          
          <div className="flex gap-6 items-center">
            <Link to="/events" className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-1">
              <span>📅</span> Events
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-1">
                  <span>📊</span> Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-1">
                    <span>⚙️</span> Admin
                  </Link>
                )}
                <span className="text-blue-100 px-3 py-1 bg-blue-800/30 rounded-full text-sm">
                  👤 {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 font-medium backdrop-blur-sm border border-white/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition-colors duration-200 font-medium">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-700 px-6 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

