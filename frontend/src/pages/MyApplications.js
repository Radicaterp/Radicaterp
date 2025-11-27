import { useEffect, useState, useContext } from "react";
import { AuthContext, API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MyApplications = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`, { withCredentials: true });
      setApplications(response.data);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "text-green-500";
      case "rejected": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "approved": return "bg-green-500/20 border-green-500/50";
      case "rejected": return "bg-red-500/20 border-red-500/50";
      default: return "bg-yellow-500/20 border-yellow-500/50";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved": return "✅ Godkendt";
      case "rejected": return "❌ Afvist";
      default: return "⏳ Afventer";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return "✅";
      case "rejected": return "❌";
      default: return "⏳";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#4A90E2] rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Navbar />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 mt-24">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold mb-2 gradient-text" data-testid="my-applications-title">
            Velkommen, {user?.username}!
          </h1>
          <p className="text-gray-400 text-xl">Her kan du se status på dine ansøgninger</p>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <div className="text-[#4A90E2] text-xl">Indlæser...</div>
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center" data-testid="no-applications">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white mb-4">Ingen ansøgninger endnu</h2>
            <p className="text-gray-400 text-lg mb-8">Du har ikke indsendt nogen ansøgninger endnu.</p>
            <Button 
              onClick={() => navigate("/applications")}
              size="lg"
              className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white px-8 py-6 text-lg font-bold"
              data-testid="go-to-applications-button"
            >
              Se Tilgængelige Ansøgninger
            </Button>
          </div>
        ) : (
          <div className="space-y-6" data-testid="applications-list">
            {applications.map((app) => (
              <div 
                key={app.id} 
                className={`glass-card p-8 rounded-2xl border-2 ${getStatusBg(app.status)}`}
                data-testid={`application-${app.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-3xl font-bold text-white">{app.application_type_name}</h3>
                      <span className={`text-2xl ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-gray-300">
                      <p>
                        <span className="text-gray-500">Status:</span>{" "}
                        <span className={`font-semibold ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Indsendt:</span>{" "}
                        {new Date(app.submitted_at).toLocaleDateString("da-DK", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      {app.reviewed_by && (
                        <p>
                          <span className="text-gray-500">Behandlet af:</span> {app.reviewed_by}
                        </p>
                      )}
                      {app.reviewed_at && (
                        <p>
                          <span className="text-gray-500">Behandlet:</span>{" "}
                          {new Date(app.reviewed_at).toLocaleDateString("da-DK", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-6 py-3 rounded-xl font-bold text-lg ${getStatusBg(app.status)}`}>
                      {getStatusText(app.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {applications.length > 0 && (
          <div className="mt-12 text-center glass-card p-8 rounded-2xl">
            <p className="text-gray-400 mb-6">
              Vil du ansøge om noget andet?
            </p>
            <Button 
              onClick={() => navigate("/applications")}
              size="lg"
              className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white px-8 py-6 text-lg font-bold"
              data-testid="new-application-button"
            >
              Se Tilgængelige Ansøgninger
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
