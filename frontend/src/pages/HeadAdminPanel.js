import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

const HeadAdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [myTeam, setMyTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("team");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchMyTeam();
  }, []);

  const fetchMyTeam = async () => {
    try {
      const response = await axios.get(`${API}/staff-teams`, { withCredentials: true });
      // Find team where user is head admin
      const team = response.data.find(t => t.head_admin_id === user.discord_id);
      setMyTeam(team);
      
      if (team && team.members.length > 0) {
        // Fetch team member details
        const usersResponse = await axios.get(`${API}/users`, { withCredentials: true });
        const members = usersResponse.data.filter(u => team.members.includes(u.discord_id));
        setTeamMembers(members);
      }
    } catch (error) {
      console.error("Failed to fetch team", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Er du sikker på du vil fjerne dette medlem fra teamet?")) return;
    
    try {
      await axios.post(
        `${API}/staff-teams/${myTeam.id}/members/${memberId}`,
        {},
        { withCredentials: true }
      );
      toast.success("Medlem fjernet fra teamet");
      fetchMyTeam();
    } catch (error) {
      toast.error("Kunne ikke fjerne medlem");
    }
  };

  const getAvatarUrl = (avatar, discordId) => {
    if (avatar) {
      return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Navbar />
        <div className="text-[#4A90E2] text-xl">Indlæser...</div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] bg-grid">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-8 mt-24">
          <div className="glass-card p-12 rounded-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Intet Team Tildelt</h2>
            <p className="text-gray-400">Du har ikke et staff team endnu. Kontakt en Super Admin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] bg-grid">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-24">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text" data-testid="head-admin-panel-title">
            Head Admin Panel
          </h1>
          <p className="text-gray-400 text-lg">Administrer dit staff team</p>
        </div>

        {/* Team Info */}
        <div className="glass-card p-8 rounded-2xl mb-8" data-testid="team-info">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{myTeam.name}</h2>
              <p className="text-gray-400">{myTeam.description}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[#4A90E2]">{teamMembers.length}</div>
              <div className="text-gray-400 text-sm">Team Medlemmer</div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">📋 Dine Ansvarsområder:</h3>
            <ul className="text-gray-300 space-y-1 text-sm">
              <li>• Træn og vejled nye staff medlemmer</li>
              <li>• Overvåg dit teams præstationer</li>
              <li>• Behandl reports og ansøgninger sammen med teamet</li>
              <li>• Rapportér til Super Admins om vigtige situationer</li>
            </ul>
          </div>
        </div>

        {/* Team Members */}
        <div className="glass-card p-8 rounded-2xl" data-testid="team-members">
          <h2 className="text-2xl font-bold text-white mb-6">Dit Team</h2>
          
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-400 text-lg mb-4">Dit team er tomt</p>
              <p className="text-gray-500 text-sm">Nye staff medlemmer vil automatisk blive tildelt dit team når deres ansøgninger godkendes.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <div 
                  key={member.discord_id} 
                  className="bg-[#1a1a1b] p-6 rounded-xl border border-[#4A90E2]/20 hover:border-[#4A90E2] transition-all"
                  data-testid={`member-${member.discord_id}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={getAvatarUrl(member.avatar, member.discord_id)}
                      alt={member.username}
                      className="w-16 h-16 rounded-full border-2 border-[#4A90E2]"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{member.username}</h3>
                      <p className="text-sm text-gray-400">Staff Medlem</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    ID: {member.discord_id}
                  </div>

                  <Button
                    onClick={() => handleRemoveMember(member.discord_id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    data-testid={`remove-member-${member.discord_id}`}
                  >
                    Fjern fra Team
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guide Section */}
        <div className="mt-8 glass-card p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">📚 Head Admin Guide</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-[#4A90E2] mb-2">1. Velkomst Nye Medlemmer</h3>
              <p className="text-sm">Når et nyt medlem tilføjes, får du en Discord DM. Tag kontakt med dem med det samme og byd dem velkommen til teamet.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#4A90E2] mb-2">2. Træning</h3>
              <p className="text-sm">Giv dem en grundig introduktion til server regler, staff guidelines, og hvordan de bruger admin kommandoer.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#4A90E2] mb-2">3. Shadowing</h3>
              <p className="text-sm">Lad nye medlemmer følge dig eller erfarne staff for at lære workflows og best practices.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#4A90E2] mb-2">4. Første Opgaver</h3>
              <p className="text-sm">Start med simple opgaver som at besvare spørgsmål i Discord eller hjælpe spillere med mindre problemer.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#4A90E2] mb-2">5. Løbende Support</h3>
              <p className="text-sm">Vær tilgængelig for dit team. Svar på spørgsmål, giv feedback, og rapportér problemer til Super Admins.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadAdminPanel;
