import { useEffect, useState } from "react";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API}/teams`);
      setTeams(response.data);
    } catch (error) {
      console.error("Failed to fetch teams", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] grid-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-20">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text" data-testid="teams-title">Teams & Jobs</h1>
          <p className="text-gray-400 text-lg">Gennemse alle tilgængelige teams og whitelist jobs</p>
        </div>

        {teams.length === 0 ? (
          <div className="card text-center py-12" data-testid="no-teams">
            <p className="text-gray-400 text-lg">Der er ingen teams endnu.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="teams-grid">
            {teams.map((team) => (
              <div key={team.id} className="card" style={{ borderColor: team.color }} data-testid={`team-${team.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: team.color }}>
                      {team.name}
                    </h3>
                    <span className="text-sm px-3 py-1 rounded-full" style={{ 
                      backgroundColor: `${team.color}20`, 
                      color: team.color 
                    }}>
                      {team.type === "staff" ? "Staff" : "Whitelist"}
                    </span>
                  </div>
                  {team.icon && <div className="text-3xl">{team.icon}</div>}
                </div>
                
                <p className="text-gray-400 mb-4">{team.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{team.members.length} medlemmer</span>
                  <Button 
                    onClick={() => navigate("/applications", { state: { teamId: team.id } })}
                    className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90"
                    data-testid={`apply-button-${team.id}`}
                  >
                    Ansøg
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
