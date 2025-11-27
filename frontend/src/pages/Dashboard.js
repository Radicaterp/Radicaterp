import { useContext, useEffect, useState } from "react";
import { AuthContext, API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && ["head_admin", "owner"].includes(user.role)) {
      fetchStats();
    }
    fetchMyApplications();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, { withCredentials: true });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`, { withCredentials: true });
      setMyApplications(response.data);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "text-green-500";
      case "rejected": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved": return "Godkendt";
      case "rejected": return "Afvist";
      default: return "Afventer";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] grid-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-20">
        <div className="mb-8 animate-fade-in" data-testid="dashboard-welcome">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text">Velkommen, {user?.username}!</h1>
          <p className="text-gray-400 text-lg">Din rolle: <span className="text-[#4A90E2] font-semibold">{user?.role}</span></p>
        </div>

        {/* Admin Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in" data-testid="admin-stats">
            <div className="card">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.total_users}</div>
              <div className="text-gray-400">Totalt brugere</div>
            </div>
            <div className="card">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.total_teams}</div>
              <div className="text-gray-400">Teams</div>
            </div>
            <div className="card">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.pending_applications}</div>
              <div className="text-gray-400">Afventende ansøgninger</div>
            </div>
            <div className="card">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.staff_count}</div>
              <div className="text-gray-400">Staff medlemmer</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" data-testid="quick-actions">
          <div className="card cursor-pointer" onClick={() => navigate("/teams")} data-testid="action-view-teams">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-xl font-bold mb-2 text-[#4A90E2]">Se Teams</h3>
            <p className="text-gray-400">Gennemse alle tilgængelige teams og jobs</p>
          </div>

          <div className="card cursor-pointer" onClick={() => navigate("/applications")} data-testid="action-apply">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-xl font-bold mb-2 text-[#4A90E2]">Ansøg</h3>
            <p className="text-gray-400">Send ansøgning til teams eller jobs</p>
          </div>

          {user && ["head_admin", "owner"].includes(user.role) && (
            <div className="card cursor-pointer" onClick={() => navigate("/admin")} data-testid="action-admin-panel">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold mb-2 text-[#4A90E2]">Admin Panel</h3>
              <p className="text-gray-400">Administrer teams og ansøgninger</p>
            </div>
          )}

          {user && user.role === "owner" && (
            <div className="card cursor-pointer" onClick={() => navigate("/owner")} data-testid="action-owner-panel">
              <div className="text-3xl mb-3">👑</div>
              <h3 className="text-xl font-bold mb-2 text-[#4A90E2]">Ejer Panel</h3>
              <p className="text-gray-400">Fuld system kontrol</p>
            </div>
          )}
        </div>

        {/* My Applications */}
        <div className="card" data-testid="my-applications">
          <h2 className="text-2xl font-bold mb-6 text-[#4A90E2]">Mine Ansøgninger</h2>
          {myApplications.length === 0 ? (
            <p className="text-gray-400">Du har ingen ansøgninger endnu.</p>
          ) : (
            <div className="space-y-4">
              {myApplications.map((app) => (
                <div key={app.id} className="bg-[#1a1a1b] p-4 rounded-lg border border-[#4A90E2]/20" data-testid={`application-${app.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{app.team_name}</h3>
                      <p className="text-sm text-gray-400">Type: {app.type === "staff" ? "Staff" : "Whitelist"}</p>
                    </div>
                    <span className={`font-semibold ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Indsendt: {new Date(app.submitted_at).toLocaleDateString("da-DK")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
