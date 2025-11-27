import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Applications = () => {
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(location.state?.teamId || "");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    experience: "",
    availability: "",
    why: "",
    scenario: ""
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      toast.error("Vælg venligst et team");
      return;
    }

    try {
      await axios.post(
        `${API}/applications`,
        {
          team_id: selectedTeam,
          answers: formData
        },
        { withCredentials: true }
      );
      
      toast.success("Ansøgning indsendt!");
      setFormData({
        name: "",
        age: "",
        experience: "",
        availability: "",
        why: "",
        scenario: ""
      });
      setSelectedTeam("");
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Kunne ikke indsende ansøgning");
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] grid-bg">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-6 py-8 mt-20">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text" data-testid="applications-title">Ansøg</h1>
          <p className="text-gray-400 text-lg">Send din ansøgning til et team eller whitelist job</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6" data-testid="application-form">
          <div>
            <Label htmlFor="team" className="text-white mb-2 block">Vælg Team/Job *</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white" data-testid="team-select">
                <SelectValue placeholder="Vælg et team" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30">
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} className="text-white hover:bg-[#4A90E2]/20" data-testid={`team-option-${team.id}`}>
                    {team.name} ({team.type === "staff" ? "Staff" : "Whitelist"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name" className="text-white mb-2 block">Fulde Navn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
              placeholder="Dit fulde navn"
              data-testid="name-input"
            />
          </div>

          <div>
            <Label htmlFor="age" className="text-white mb-2 block">Alder *</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
              required
              className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
              placeholder="Din alder"
              data-testid="age-input"
            />
          </div>

          <div>
            <Label htmlFor="experience" className="text-white mb-2 block">Erfaring med FiveM/Roleplay *</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              required
              className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white min-h-[100px]"
              placeholder="Beskriv din erfaring..."
              data-testid="experience-input"
            />
          </div>

          <div>
            <Label htmlFor="availability" className="text-white mb-2 block">Tilgængelighed (timer per uge) *</Label>
            <Input
              id="availability"
              value={formData.availability}
              onChange={(e) => handleChange("availability", e.target.value)}
              required
              className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white"
              placeholder="f.eks. 10-20 timer"
              data-testid="availability-input"
            />
          </div>

          <div>
            <Label htmlFor="why" className="text-white mb-2 block">Hvorfor vil du være en del af dette team? *</Label>
            <Textarea
              id="why"
              value={formData.why}
              onChange={(e) => handleChange("why", e.target.value)}
              required
              className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white min-h-[120px]"
              placeholder="Fortæl os hvorfor..."
              data-testid="why-input"
            />
          </div>

          <div>
            <Label htmlFor="scenario" className="text-white mb-2 block">Scenario spørgsmål: Hvordan ville du håndtere en konflikt situation? *</Label>
            <Textarea
              id="scenario"
              value={formData.scenario}
              onChange={(e) => handleChange("scenario", e.target.value)}
              required
              className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white min-h-[120px]"
              placeholder="Beskriv din tilgang..."
              data-testid="scenario-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 py-6 text-lg"
            data-testid="submit-button"
          >
            Send Ansøgning
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Applications;
