import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b-2 border-[#00d9ff]" data-testid="navbar" style={{ backgroundColor: 'rgba(13, 13, 15, 0.95)' }}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all" data-testid="nav-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-9 w-9 object-contain"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0, 217, 255, 0.5))' }}
            />
            <h1 className="text-xl font-black gradient-text tracking-widest">REDICATE</h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-bold tracking-wider transition-all ${
                isActive("/") ? "text-[#00d9ff]" : "text-gray-400 hover:text-[#00d9ff]"
              }`}
              data-testid="nav-home"
            >
              [ HOME ]
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/applications" 
                  className={`text-sm font-bold tracking-wider transition-all ${
                    isActive("/applications") ? "text-[#00d9ff]" : "text-gray-400 hover:text-[#00d9ff]"
                  }`}
                  data-testid="nav-applications"
                >
                  [ ANSØG ]
                </Link>
                <Link 
                  to="/my-applications" 
                  className={`text-sm font-bold tracking-wider transition-all ${
                    isActive("/my-applications") ? "text-[#00d9ff]" : "text-gray-400 hover:text-[#00d9ff]"
                  }`}
                  data-testid="nav-my-applications"
                >
                  [ STATUS ]
                </Link>
                <Link 
                  to="/report" 
                  className={`text-sm font-bold tracking-wider transition-all ${
                    isActive("/report") ? "text-[#00d9ff]" : "text-gray-400 hover:text-[#00d9ff]"
                  }`}
                  data-testid="nav-report"
                >
                  [ REPORT ]
                </Link>
                {user.is_admin && (
                  <Link 
                    to="/admin" 
                    className={`text-sm font-bold tracking-wider transition-all ${
                      isActive("/admin") ? "text-[#7b2ff7]" : "text-gray-400 hover:text-[#7b2ff7]"
                    }`}
                    data-testid="nav-admin"
                  >
                    [ ADMIN ]
                  </Link>
                )}
              </>
            )}
            
            <Link 
              to="/staff" 
              className={`text-sm font-bold tracking-wider transition-all ${
                isActive("/staff") ? "text-[#00d9ff]" : "text-gray-400 hover:text-[#00d9ff]"
              }`}
              data-testid="nav-staff"
            >
              [ STAFF ]
            </Link>
            
            <Link 
              to="/about" 
              className={`text-sm font-bold tracking-wider transition-all ${
                isActive("/about") ? "text-[#00d9ff]" : "text-gray-400 hover:text-[#00d9ff]"
              }`}
              data-testid="nav-about"
            >
              [ INFO ]
            </Link>

            {/* User Info & Logout */}
            {user ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l-2 border-[#00d9ff]">
                <div className="text-right" data-testid="nav-user-info">
                  <div className="text-white font-bold text-xs tracking-wider">&gt; {user.username}</div>
                  {user.is_admin && <div className="text-[#7b2ff7] text-xs font-mono">ADMIN</div>}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-500 hover:text-red-400 tracking-wider"
                  data-testid="logout-button"
                >
                  [ EXIT ]
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
