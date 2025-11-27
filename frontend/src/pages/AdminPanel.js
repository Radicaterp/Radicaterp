import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    type: "whitelist",
    icon: "",
    color: "#4A90E2"
  });
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchTeams();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`, { withCredentials: true });
      setApplications(response.data);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API}/teams`);
      setTeams(response.data);
    } catch (error) {
      console.error("Failed to fetch teams", error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/teams`, newTeam, { withCredentials: true });
      toast.success("Team oprettet!");
      setNewTeam({
        name: "",
        description: "",
        type: "whitelist",
        icon: "",
        color: "#4A90E2"
      });
      fetchTeams();
    } catch (error) {
      toast.error("Kunne ikke oprette team");
    }
  };

  const handleReviewApplication = async (appId, status) => {
    try {
      await axios.post(
        `${API}/applications/${appId}/review`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Ansøgning ${status === "approved" ? "godkendt" : "afvist"}!`);
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error("Kunne ikke behandle ansøgning");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Er du sikker på du vil slette dette team?")) return;
    
    try {
      await axios.delete(`${API}/teams/${teamId}`, { withCredentials: true });
      toast.success("Team slettet");
      fetchTeams();
    } catch (error) {
      toast.error("Kunne ikke slette team");
    }
  };

  const pendingApplications = applications.filter(app => app.status === "pending");

  return (
    <div className="min-h-screen bg-[#0a0a0b] grid-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-20">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text" data-testid="admin-panel-title">Admin Panel</h1>
          <p className="text-gray-400 text-lg">Administrer teams og ansøgninger</p>
        </div>

        <Tabs defaultValue="applications" className="space-y-6" data-testid="admin-tabs">
          <TabsList className="bg-[#1a1a1b] border border-[#4A90E2]/20">
            <TabsTrigger value="applications" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-applications">
              Ansøgninger ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-teams">
              Teams
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-create">
              Opret Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4" data-testid="applications-content">
            {pendingApplications.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-400 text-lg">Ingen afventende ansøgninger</p>
              </div>
            ) : (
              pendingApplications.map((app) => (
                <div key={app.id} className="card" data-testid={`pending-app-${app.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{app.username}</h3>
                      <p className="text-[#4A90E2]">{app.team_name}</p>
                      <p className="text-sm text-gray-500">Type: {app.type === "staff" ? "Staff" : "Whitelist"}</p>
                    </div>
                    <span className="text-yellow-500 font-semibold">Afventer</span>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10"
                        onClick={() => setSelectedApp(app)}
                        data-testid={`view-app-${app.id}`}
                      >
                        Se Detaljer
                      </Button>
                    </DialogTrigger>
                    {selectedApp && selectedApp.id === app.id && (
                      <DialogContent className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl gradient-text">{selectedApp.username} - {selectedApp.team_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <h4 className="font-semibold text-[#4A90E2] mb-1">Navn:</h4>
                            <p className="text-gray-300">{selectedApp.answers.name}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4A90E2] mb-1">Alder:</h4>
                            <p className="text-gray-300">{selectedApp.answers.age}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4A90E2] mb-1">Erfaring:</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{selectedApp.answers.experience}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4A90E2] mb-1">Tilgængelighed:</h4>
                            <p className="text-gray-300">{selectedApp.answers.availability}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4A90E2] mb-1">Hvorfor:</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{selectedApp.answers.why}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4A90E2] mb-1">Scenario:</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{selectedApp.answers.scenario}</p>
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => handleReviewApplication(selectedApp.id, "approved")}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              data-testid="approve-button"
                            >
                              Godkend
                            </Button>
                            <Button
                              onClick={() => handleReviewApplication(selectedApp.id, "rejected")}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                              data-testid="reject-button"
                            >
                              Afvis
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4" data-testid="teams-content">
            {teams.map((team) => (
              <div key={team.id} className="card" style={{ borderColor: team.color }} data-testid={`team-card-${team.id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {team.icon && <span className="text-2xl">{team.icon}</span>}
                      <h3 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h3>
                    </div>
                    <p className="text-gray-400 mb-2">{team.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">Type: <span style={{ color: team.color }}>{team.type === "staff" ? "Staff" : "Whitelist"}</span></span>
                      <span className="text-gray-500">Medlemmer: <span style={{ color: team.color }}>{team.members.length}</span></span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteTeam(team.id)}
                    variant="destructive"
                    size="sm"
                    data-testid={`delete-team-${team.id}`}
                  >
                    Slet
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="create" data-testid="create-team-content">
            <form onSubmit={handleCreateTeam} className="card space-y-6" data-testid="create-team-form">
              <h2 className="text-2xl font-bold text-[#4A90E2]">Opret Nyt Team</h2>
              
              <div>
                <Label htmlFor="team-name" className="text-white mb-2 block">Team Navn *</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                  className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
                  placeholder="f.eks. Politi"
                  data-testid="team-name-input"
                />
              </div>

              <div>
                <Label htmlFor="team-desc" className="text-white mb-2 block">Beskrivelse *</Label>
                <Textarea
                  id="team-desc"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  required
                  className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white min-h-[100px]"
                  placeholder="Beskrivelse af teamet..."
                  data-testid="team-desc-input"
                />
              </div>

              <div>
                <Label htmlFor="team-type" className="text-white mb-2 block">Type *</Label>
                <Select value={newTeam.type} onValueChange={(value) => setNewTeam({ ...newTeam, type: value })}>
                  <SelectTrigger className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white" data-testid="team-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30">
                    <SelectItem value="whitelist" className="text-white hover:bg-[#4A90E2]/20">Whitelist Job</SelectItem>
                    <SelectItem value="staff" className="text-white hover:bg-[#4A90E2]/20">Staff Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="team-icon" className="text-white mb-2 block">Icon (emoji)</Label>
                <Input
                  id="team-icon"
                  value={newTeam.icon}
                  onChange={(e) => setNewTeam({ ...newTeam, icon: e.target.value })}
                  className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
                  placeholder="👮"
                  data-testid="team-icon-input"
                />
              </div>

              <div>
                <Label htmlFor="team-color" className="text-white mb-2 block">Farve</Label>
                <Input
                  id="team-color"
                  type="color"
                  value={newTeam.color}
                  onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                  className="bg-[#1a1a1b] border-[#4A90E2]/30 h-12"
                  data-testid="team-color-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 py-6 text-lg"
                data-testid="create-team-submit"
              >
                Opret Team
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
