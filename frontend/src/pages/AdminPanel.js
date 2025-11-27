import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [applicationTypes, setApplicationTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newAppType, setNewAppType] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#4A90E2",
    questions: []
  });
  const [newQuestion, setNewQuestion] = useState({
    id: "",
    label: "",
    type: "text",
    required: true,
    placeholder: ""
  });

  useEffect(() => {
    fetchApplications();
    fetchApplicationTypes();
    fetchReports();
    fetchStats();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`, { withCredentials: true });
      setApplications(response.data);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    }
  };

  const fetchApplicationTypes = async () => {
    try {
      const response = await axios.get(`${API}/application-types`);
      setApplicationTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch application types", error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}/reports`, { withCredentials: true });
      setReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, { withCredentials: true });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleReviewApplication = async (appId, status) => {
    try {
      await axios.post(
        `${API}/applications/${appId}/review`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Ansøgning ${status === "approved" ? "godkendt" : "afvist"}! Discord besked sendt.`);
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error("Kunne ikke behandle ansøgning");
    }
  };

  const addQuestion = () => {
    if (!newQuestion.label) {
      toast.error("Spørgsmål skal have en label");
      return;
    }
    
    const question = {
      ...newQuestion,
      id: `q_${Date.now()}`
    };
    
    setNewAppType(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));
    
    setNewQuestion({
      id: "",
      label: "",
      type: "text",
      required: true,
      placeholder: ""
    });
  };

  const removeQuestion = (questionId) => {
    setNewAppType(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleCreateAppType = async (e) => {
    e.preventDefault();
    
    if (newAppType.questions.length === 0) {
      toast.error("Tilføj mindst ét spørgsmål");
      return;
    }
    
    try {
      await axios.post(`${API}/application-types`, newAppType, { withCredentials: true });
      toast.success("Ansøgningstype oprettet!");
      setNewAppType({
        name: "",
        description: "",
        icon: "",
        color: "#4A90E2",
        questions: []
      });
      fetchApplicationTypes();
    } catch (error) {
      toast.error("Kunne ikke oprette ansøgningstype");
    }
  };

  const handleDeleteAppType = async (typeId) => {
    if (!window.confirm("Er du sikker på du vil slette denne ansøgningstype?")) return;
    
    try {
      await axios.delete(`${API}/application-types/${typeId}`, { withCredentials: true });
      toast.success("Ansøgningstype slettet");
      fetchApplicationTypes();
    } catch (error) {
      toast.error("Kunne ikke slette ansøgningstype");
    }
  };

  const handleReportUpdate = async (reportId, status, adminNotes) => {
    try {
      await axios.put(
        `${API}/reports/${reportId}`,
        { status, admin_notes: adminNotes },
        { withCredentials: true }
      );
      toast.success(`Rapport ${status === "resolved" ? "afsluttet" : status === "investigating" ? "sat til undersøges" : "afvist"}!`);
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      toast.error("Kunne ikke opdatere rapport");
    }
  };

  const pendingApplications = applications.filter(app => app.status === "pending");
  const pendingReports = reports.filter(rep => rep.status === "pending");

  return (
    <div className="min-h-screen bg-[#0a0a0b] bg-grid">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-24">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text" data-testid="admin-panel-title">
            Admin Panel
          </h1>
          <p className="text-gray-400 text-lg">Administrer ansøgninger og ansøgningstyper</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8" data-testid="admin-stats">
            <div className="glass-card p-6 rounded-xl">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.total_users}</div>
              <div className="text-gray-400">Brugere</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.total_application_types}</div>
              <div className="text-gray-400">Ansøgningstyper</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.pending_applications}</div>
              <div className="text-gray-400">Afventende Ans.</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-3xl font-bold text-[#4A90E2]">{stats.approved_applications}</div>
              <div className="text-gray-400">Godkendte</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-3xl font-bold text-red-500">{stats.pending_reports}</div>
              <div className="text-gray-400">Rapporter</div>
            </div>
          </div>
        )}

        <Tabs defaultValue="applications" className="space-y-6" data-testid="admin-tabs">
          <TabsList className="bg-[#1a1a1b] border border-[#4A90E2]/20">
            <TabsTrigger value="applications" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-applications">
              Ansøgninger ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-reports">
              Rapporter ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="types" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-types">
              Ansøgningstyper
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-[#4A90E2]" data-testid="tab-create">
              Opret Type
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4" data-testid="applications-content">
            {pendingApplications.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center">
                <p className="text-gray-400 text-lg">Ingen afventende ansøgninger</p>
              </div>
            ) : (
              pendingApplications.map((app) => (
                <div key={app.id} className="glass-card p-6 rounded-xl" data-testid={`pending-app-${app.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{app.username}</h3>
                      <p className="text-[#4A90E2]">{app.application_type_name}</p>
                      <p className="text-sm text-gray-500">
                        Indsendt: {new Date(app.submitted_at).toLocaleDateString("da-DK")}
                      </p>
                    </div>
                    <span className="text-yellow-500 font-semibold">⏳ Afventer</span>
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
                      <DialogContent className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl gradient-text">
                            {selectedApp.username} - {selectedApp.application_type_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {Object.entries(selectedApp.answers).map(([key, value]) => (
                            <div key={key}>
                              <h4 className="font-semibold text-[#4A90E2] mb-1 capitalize">
                                {key.replace(/_/g, " ")}:
                              </h4>
                              <p className="text-gray-300 whitespace-pre-wrap">{value}</p>
                            </div>
                          ))}
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => handleReviewApplication(selectedApp.id, "approved")}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              data-testid="approve-button"
                            >
                              ✅ Godkend
                            </Button>
                            <Button
                              onClick={() => handleReviewApplication(selectedApp.id, "rejected")}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                              data-testid="reject-button"
                            >
                              ❌ Afvis
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

          <TabsContent value="types" className="space-y-4" data-testid="types-content">
            {applicationTypes.map((type) => (
              <div key={type.id} className="glass-card p-6 rounded-xl" style={{ borderColor: type.color }} data-testid={`type-card-${type.id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {type.icon && <span className="text-3xl">{type.icon}</span>}
                      <h3 className="text-2xl font-bold" style={{ color: type.color }}>{type.name}</h3>
                    </div>
                    <p className="text-gray-400 mb-2">{type.description}</p>
                    <p className="text-sm text-gray-500">{type.questions.length} spørgsmål</p>
                  </div>
                  <Button
                    onClick={() => handleDeleteAppType(type.id)}
                    variant="destructive"
                    size="sm"
                    data-testid={`delete-type-${type.id}`}
                  >
                    Slet
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="create" data-testid="create-type-content">
            <form onSubmit={handleCreateAppType} className="glass-card p-8 rounded-2xl space-y-6" data-testid="create-type-form">
              <h2 className="text-2xl font-bold text-[#4A90E2]">Opret Ny Ansøgningstype</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white mb-2 block">Navn *</Label>
                  <Input
                    value={newAppType.name}
                    onChange={(e) => setNewAppType({ ...newAppType, name: e.target.value })}
                    required
                    className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                    placeholder="f.eks. Politi"
                    data-testid="type-name-input"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">Icon (emoji)</Label>
                  <Input
                    value={newAppType.icon}
                    onChange={(e) => setNewAppType({ ...newAppType, icon: e.target.value })}
                    className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                    placeholder="👮"
                    data-testid="type-icon-input"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Beskrivelse *</Label>
                <Textarea
                  value={newAppType.description}
                  onChange={(e) => setNewAppType({ ...newAppType, description: e.target.value })}
                  required
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                  placeholder="Beskrivelse af ansøgningstypen..."
                  data-testid="type-desc-input"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Farve</Label>
                <Input
                  type="color"
                  value={newAppType.color}
                  onChange={(e) => setNewAppType({ ...newAppType, color: e.target.value })}
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 h-12"
                  data-testid="type-color-input"
                />
              </div>

              <div className="border-t border-[#4A90E2]/30 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">Spørgsmål</h3>
                
                <div className="space-y-4 mb-6">
                  {newAppType.questions.map((q, index) => (
                    <div key={q.id} className="bg-[#0a0a0b] p-4 rounded-lg flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{index + 1}. {q.label}</p>
                        <p className="text-sm text-gray-400">Type: {q.type} | Påkrævet: {q.required ? "Ja" : "Nej"}</p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(q.id)}
                      >
                        Fjern
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0a0a0b] p-6 rounded-lg space-y-4">
                  <h4 className="text-white font-semibold">Tilføj Nyt Spørgsmål</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Spørgsmål *</Label>
                      <Input
                        value={newQuestion.label}
                        onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                        className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
                        placeholder="f.eks. Hvad er din alder?"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white mb-2 block">Type</Label>
                      <select
                        value={newQuestion.type}
                        onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                        className="w-full bg-[#1a1a1b] border border-[#4A90E2]/30 text-white p-2 rounded-md"
                      >
                        <option value="text">Kort tekst</option>
                        <option value="textarea">Lang tekst</option>
                        <option value="number">Nummer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Placeholder</Label>
                    <Input
                      value={newQuestion.placeholder}
                      onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                      className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
                      placeholder="Hjælpetekst..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newQuestion.required}
                      onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <Label className="text-white">Påkrævet</Label>
                  </div>

                  <Button
                    type="button"
                    onClick={addQuestion}
                    variant="outline"
                    className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10"
                  >
                    Tilføj Spørgsmål
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 py-6 text-lg font-bold"
                data-testid="create-type-submit"
              >
                Opret Ansøgningstype
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
