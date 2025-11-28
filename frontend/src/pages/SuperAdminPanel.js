import { useState, useEffect } from "react";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

const SuperAdminPanel = () => {
  const [staffTeams, setStaffTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [headAdmins, setHeadAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState("teams");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    head_admin_id: ""
  });
  const [newStaff, setNewStaff] = useState({
    discord_id: "",
    username: "",
    team_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        axios.get(`${API}/staff-teams`, { withCredentials: true }),
        axios.get(`${API}/users`, { withCredentials: true })
      ]);
      
      setStaffTeams(teamsRes.data);
      setAllUsers(usersRes.data);
      setHeadAdmins(usersRes.data.filter(u => u.role === "head_admin"));
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/staff-teams`, newTeam, { withCredentials: true });
      toast.success("Staff team oprettet!");
      setNewTeam({ name: "", description: "", head_admin_id: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kunne ikke oprette team");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Er du sikker på du vil slette dette team?")) return;
    
    try {
      await axios.delete(`${API}/staff-teams/${teamId}`, { withCredentials: true });
      toast.success("Team slettet");
      fetchData();
    } catch (error) {
      toast.error("Kunne ikke slette team");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/add-staff`, newStaff, { withCredentials: true });
      toast.success("Staff tilføjet! Head admin får besked.");
      setNewStaff({ discord_id: "", username: "", team_id: "" });
      fetchData();
    } catch (error) {
      toast.error("Kunne ikke tilføje staff");
    }
  };

  const tabs = [
    { id: "teams", label: "Staff Teams", icon: "👥", count: staffTeams.length },
    { id: "create", label: "Opret Team", icon: "➕" },
    { id: "add-staff", label: "Tilføj Staff", icon: "👤" },
    { id: "manage-staff", label: "Administrer Staff", icon: "⚙️" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] bg-grid">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-24">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 gradient-text" data-testid="super-admin-panel-title">
            Admin Overview
          </h1>
          <p className="text-gray-400">Administrer alle staff teams og medlemmer</p>
        </div>

        {/* Dropdown for mobile + Small tabs for desktop */}
        <div className="mb-8">
          {/* Mobile Dropdown */}
          <div className="md:hidden relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full glass-card p-4 rounded-xl flex items-center justify-between text-white hover:border-[#4A90E2] transition-all"
            >
              <span className="flex items-center gap-2">
                <span>{tabs.find(t => t.id === activeTab)?.icon}</span>
                <span className="font-semibold">{tabs.find(t => t.id === activeTab)?.label}</span>
                {tabs.find(t => t.id === activeTab)?.count !== undefined && (
                  <span className="text-[#4A90E2]">({tabs.find(t => t.id === activeTab)?.count})</span>
                )}
              </span>
              <ChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl overflow-hidden z-10 border border-[#4A90E2]/30">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full p-4 text-left flex items-center gap-2 hover:bg-[#4A90E2]/20 transition-all ${
                      activeTab === tab.id ? 'bg-[#4A90E2]/30 text-[#4A90E2]' : 'text-white'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                    {tab.count !== undefined && <span>({tab.count})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Small Tabs */}
          <div className="hidden md:flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#4A90E2] text-white'
                    : 'bg-[#1a1a1b] text-gray-400 hover:bg-[#4A90E2]/20 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && <span>({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "teams" && (
          <div className="space-y-6 animate-fade-in">
            {staffTeams.map((team) => {
              const headAdmin = allUsers.find(u => u.discord_id === team.head_admin_id);
              const members = allUsers.filter(u => team.members.includes(u.discord_id));
              
              return (
                <div key={team.id} className="glass-card p-6 rounded-xl" data-testid={`team-${team.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{team.name}</h3>
                      <p className="text-gray-400 mb-3">{team.description}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-500">
                          Head Admin: <span className="text-[#4A90E2] font-semibold">{headAdmin?.username || "Ikke fundet"}</span>
                        </p>
                        <p className="text-gray-500">
                          Medlemmer: <span className="text-[#4A90E2] font-semibold">{team.members.length}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteTeam(team.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Slet Team
                    </Button>
                  </div>

                  {members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#4A90E2]/20">
                      <p className="text-sm text-gray-400 mb-2">Team Medlemmer:</p>
                      <div className="flex flex-wrap gap-2">
                        {members.map(member => (
                          <span key={member.discord_id} className="px-3 py-1 bg-[#4A90E2]/20 text-[#4A90E2] rounded-full text-xs">
                            {member.username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {staffTeams.length === 0 && (
              <div className="glass-card p-12 rounded-2xl text-center">
                <p className="text-gray-400">Ingen staff teams oprettet endnu</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="animate-fade-in">
            <form onSubmit={handleCreateTeam} className="glass-card p-8 rounded-2xl space-y-6">
              <h2 className="text-2xl font-bold text-[#4A90E2]">Opret Nyt Staff Team</h2>
              
              <div>
                <Label className="text-white mb-2 block">Team Navn *</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                  placeholder="f.eks. Alpha Team"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Beskrivelse *</Label>
                <Textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  required
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                  placeholder="Beskriv teamets formål..."
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Head Admin *</Label>
                <Select value={newTeam.head_admin_id} onValueChange={(value) => setNewTeam({ ...newTeam, head_admin_id: value })}>
                  <SelectTrigger className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white">
                    <SelectValue placeholder="Vælg head admin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30">
                    {headAdmins.map((admin) => (
                      <SelectItem key={admin.discord_id} value={admin.discord_id} className="text-white hover:bg-[#4A90E2]/20">
                        {admin.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {headAdmins.length === 0 && (
                  <p className="text-sm text-yellow-500 mt-2">⚠️ Ingen head admins tilgængelige. Promovér en bruger først.</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 py-6 text-lg">
                Opret Staff Team
              </Button>
            </form>
          </div>
        )}

        {activeTab === "add-staff" && (
          <div className="animate-fade-in">
            <form onSubmit={handleAddStaff} className="glass-card p-8 rounded-2xl space-y-6">
              <h2 className="text-2xl font-bold text-[#4A90E2]">Tilføj Staff Manuelt</h2>
              
              <div>
                <Label className="text-white mb-2 block">Discord ID *</Label>
                <Input
                  value={newStaff.discord_id}
                  onChange={(e) => setNewStaff({ ...newStaff, discord_id: e.target.value })}
                  required
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                  placeholder="123456789012345678"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Brugernavn *</Label>
                <Input
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                  required
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                  placeholder="Username"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Team *</Label>
                <Select value={newStaff.team_id} onValueChange={(value) => setNewStaff({ ...newStaff, team_id: value })}>
                  <SelectTrigger className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white">
                    <SelectValue placeholder="Vælg team" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30">
                    {staffTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id} className="text-white hover:bg-[#4A90E2]/20">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 py-6 text-lg">
                Tilføj Staff
              </Button>
            </form>
          </div>
        )}

        {activeTab === "manage-staff" && (
          <div className="animate-fade-in">
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-[#4A90E2] mb-6">Administrer Staff Medlemmer</h2>
              
              {allUsers.filter(u => ["staff_member", "admin", "head_admin"].includes(u.role)).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Ingen staff medlemmer fundet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allUsers
                    .filter(u => ["staff_member", "admin", "head_admin"].includes(u.role))
                    .map((staff) => {
                      const team = staffTeams.find(t => t.members.includes(staff.discord_id));
                      return (
                        <div key={staff.discord_id} className="bg-[#1a1a1b] p-6 rounded-xl border border-[#4A90E2]/20">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-white">{staff.username}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  staff.role === "head_admin" ? "bg-purple-500/20 text-purple-400" :
                                  staff.role === "admin" ? "bg-blue-500/20 text-blue-400" :
                                  "bg-green-500/20 text-green-400"
                                }`}>
                                  {staff.role === "head_admin" ? "Head Admin" : staff.role === "admin" ? "Admin" : "Staff"}
                                </span>
                                {staff.strikes > 0 && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                                    ⚠️ {staff.strikes} Strike{staff.strikes > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-gray-400">
                                <p>Discord ID: <span className="text-gray-300">{staff.discord_id}</span></p>
                                {staff.staff_rank && (
                                  <p>Rank: <span className="text-[#4A90E2]">{staff.staff_rank}</span></p>
                                )}
                                {team && (
                                  <p>Team: <span className="text-[#4A90E2]">{team.name}</span></p>
                                )}
                                {staff.on_probation && (
                                  <p className="text-yellow-500">🕐 På prøvetid</p>
                                )}
                              </div>
                            </div>
                            
                            {staff.strikes > 0 && (
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={async () => {
                                    if (!window.confirm(`Er du sikker på du vil fjerne 1 strike fra ${staff.username}?`)) return;
                                    
                                    try {
                                      await axios.post(`${API}/super-admin/strikes/remove/${staff.discord_id}`, {}, { withCredentials: true });
                                      toast.success(`Strike fjernet fra ${staff.username}`);
                                      fetchData();
                                    } catch (error) {
                                      toast.error(error.response?.data?.detail || "Kunne ikke fjerne strike");
                                    }
                                  }}
                                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"
                                  size="sm"
                                >
                                  Fjern 1 Strike
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;
