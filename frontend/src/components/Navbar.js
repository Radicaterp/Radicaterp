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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[#4A90E2]/20" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="nav-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-xl font-bold gradient-text">REDICATE</h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                isActive("/") ? "text-[#4A90E2]" : ""
              }`}
              data-testid="nav-home"
            >
              Hjem
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/applications" 
                  className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                    isActive("/applications") ? "text-[#4A90E2]" : ""
                  }`}
                  data-testid="nav-applications"
                >
                  Ansøg
                </Link>
                <Link 
                  to="/my-applications" 
                  className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                    isActive("/my-applications") ? "text-[#4A90E2]" : ""
                  }`}
                  data-testid="nav-my-applications"
                >
                  Mine Ansøgninger
                </Link>
                <Link 
                  to="/report" 
                  className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                    isActive("/report") ? "text-[#4A90E2]" : ""
                  }`}
                  data-testid="nav-report"
                >
                  Rapportér
                </Link>
                {user.is_admin && (
                  <Link 
                    to="/admin" 
                    className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                      isActive("/admin") ? "text-[#4A90E2]" : ""
                    }`}
                    data-testid="nav-admin"
                  >
                    Admin
                  </Link>
                )}
                {user.is_head_admin && (
                  <Link 
                    to="/head-admin" 
                    className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                      isActive("/head-admin") ? "text-[#4A90E2]" : ""
                    }`}
                    data-testid="nav-head-admin"
                  >
                    Head Admin
                  </Link>
                )}
                {user.is_admin && (
                  <Link 
                    to="/super-admin" 
                    className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                      isActive("/super-admin") ? "text-[#4A90E2]" : ""
                    }`}
                    data-testid="nav-super-admin"
                  >
                    Team Management
                  </Link>
                )}
              </>
            )}
            
            <Link 
              to="/staff" 
              className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                isActive("/staff") ? "text-[#4A90E2]" : ""
              }`}
              data-testid="nav-staff"
            >
              Staff
            </Link>
            
            <Link 
              to="/about" 
              className={`text-gray-300 hover:text-[#4A90E2] transition-colors font-medium ${
                isActive("/about") ? "text-[#4A90E2]" : ""
              }`}
              data-testid="nav-about"
            >
              Om Os
            </Link>

            {/* User Info & Logout */}
            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#4A90E2]/30">
                <div className="text-right" data-testid="nav-user-info">
                  <div className="text-white font-semibold text-sm">{user.username}</div>
                  {user.is_admin && <div className="text-[#4A90E2] text-xs">Admin</div>}
                  {user.is_head_admin && <div className="text-[#4A90E2] text-xs">Head Admin</div>}
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10"
                  data-testid="logout-button"
                >
                  Log ud
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
