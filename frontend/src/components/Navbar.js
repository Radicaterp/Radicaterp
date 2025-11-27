import { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  
  const isAdminRouteActive = () => {
    return isActive("/admin") || isActive("/head-admin") || isActive("/super-admin");
  };

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
                
                {/* Admin Dropdown */}
                {(user.is_admin || user.is_head_admin) && (
                  <div className="relative">
                    <button
                      onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                      onBlur={() => setTimeout(() => setAdminDropdownOpen(false), 200)}
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        isAdminRouteActive() ? "text-[#4A90E2]" : "text-gray-300 hover:text-[#4A90E2]"
                      }`}
                      data-testid="nav-admin-dropdown"
                    >
                      Admin
                      <ChevronDown className={`w-4 h-4 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {adminDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 glass-card rounded-lg border border-[#4A90E2]/30 shadow-xl overflow-hidden">
                        {user.is_admin && (
                          <Link
                            to="/admin"
                            onClick={() => setAdminDropdownOpen(false)}
                            className={`block px-4 py-3 text-white hover:bg-[#4A90E2]/20 transition-colors ${
                              isActive("/admin") ? "bg-[#4A90E2]/30" : ""
                            }`}
                          >
                            <div className="font-medium">Admin Panel</div>
                            <div className="text-xs text-gray-400">Ansøgninger & Rapporter</div>
                          </Link>
                        )}
                        {user.is_head_admin && (
                          <Link
                            to="/head-admin"
                            onClick={() => setAdminDropdownOpen(false)}
                            className={`block px-4 py-3 text-white hover:bg-[#4A90E2]/20 transition-colors ${
                              isActive("/head-admin") ? "bg-[#4A90E2]/30" : ""
                            }`}
                          >
                            <div className="font-medium">Head Admin</div>
                            <div className="text-xs text-gray-400">Mit Team Management</div>
                          </Link>
                        )}
                        {user.is_admin && (
                          <Link
                            to="/super-admin"
                            onClick={() => setAdminDropdownOpen(false)}
                            className={`block px-4 py-3 text-white hover:bg-[#4A90E2]/20 transition-colors ${
                              isActive("/super-admin") ? "bg-[#4A90E2]/30" : ""
                            }`}
                          >
                            <div className="font-medium">Team Management</div>
                            <div className="text-xs text-gray-400">Opret & Administrér Teams</div>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
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
