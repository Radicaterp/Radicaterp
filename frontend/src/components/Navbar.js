import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#4A90E2]/20" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="nav-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-xl font-bold gradient-text">REDICATE RP</h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-300 hover:text-[#4A90E2] transition-colors" data-testid="nav-dashboard">
              Dashboard
            </Link>
            <Link to="/teams" className="text-gray-300 hover:text-[#4A90E2] transition-colors" data-testid="nav-teams">
              Teams
            </Link>
            <Link to="/applications" className="text-gray-300 hover:text-[#4A90E2] transition-colors" data-testid="nav-apply">
              Ansøg
            </Link>
            
            {user && ["head_admin", "owner"].includes(user.role) && (
              <Link to="/admin" className="text-gray-300 hover:text-[#4A90E2] transition-colors" data-testid="nav-admin">
                Admin
              </Link>
            )}
            
            {user && user.role === "owner" && (
              <Link to="/owner" className="text-gray-300 hover:text-[#4A90E2] transition-colors" data-testid="nav-owner">
                Ejer
              </Link>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#4A90E2]/30">
              <div className="text-right" data-testid="nav-user-info">
                <div className="text-white font-semibold text-sm">{user?.username}</div>
                <div className="text-[#4A90E2] text-xs">{user?.role}</div>
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
