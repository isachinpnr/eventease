import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl md:text-3xl font-bold hover:scale-105 transition-transform duration-200 flex items-center gap-2">
            <span className="text-3xl md:text-4xl">🎫</span>
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              EventEase
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 lg:gap-6 items-center">
            <Link to="/events" className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-1 text-sm lg:text-base">
              <span>📅</span> <span className="hidden lg:inline">Events</span>
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-1 text-sm lg:text-base">
                  <span>📊</span> <span className="hidden lg:inline">Dashboard</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-1 text-sm lg:text-base">
                    <span>⚙️</span> <span className="hidden lg:inline">Admin</span>
                  </Link>
                )}
                <span className="text-blue-100 px-2 lg:px-3 py-1 bg-blue-800/30 rounded-full text-xs lg:text-sm">
                  👤 <span className="hidden lg:inline">{user.name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 font-medium backdrop-blur-sm border border-white/20 text-sm lg:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition-colors duration-200 font-medium text-sm lg:text-base">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-700 px-4 lg:px-6 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm lg:text-base"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
            <div className="flex flex-col gap-3">
              <Link 
                to="/events" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-2 py-2"
              >
                <span>📅</span> Events
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-2 py-2"
                  >
                    <span>📊</span> Dashboard
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:text-blue-200 transition-colors duration-200 font-medium flex items-center gap-2 py-2"
                    >
                      <span>⚙️</span> Admin
                    </Link>
                  )}
                  <div className="text-blue-100 px-3 py-2 bg-blue-800/30 rounded-lg">
                    👤 {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 font-medium backdrop-blur-sm border border-white/20 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-blue-200 transition-colors duration-200 font-medium py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

