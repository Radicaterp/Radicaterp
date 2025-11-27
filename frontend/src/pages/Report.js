import { useState } from "react";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Report = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reported_player: "",
    report_type: "",
    description: "",
    evidence: ""
  });

  const reportTypes = [
    "RDM (Random Deathmatch)",
    "VDM (Vehicle Deathmatch)",
    "FailRP",
    "Metagaming",
    "Power Gaming",
    "NLR (New Life Rule)",
    "Combat Logging",
    "Exploiting",
    "Toxicitet",
    "Andet"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.report_type) {
      toast.error("Vælg venligst en rapport type");
      return;
    }

    try {
      await axios.post(
        `${API}/reports`,
        formData,
        { withCredentials: true }
      );
      
      toast.success("Rapport indsendt! Staff vil behandle den hurtigst muligt.");
      setFormData({
        reported_player: "",
        report_type: "",
        description: "",
        evidence: ""
      });
      
      setTimeout(() => navigate("/my-reports"), 2000);
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Kunne ikke indsende rapport");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-red-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <Navbar />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 mt-24">
        <div className="mb-8 text-center animate-fade-in">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 gradient-text" data-testid="report-title">
            Rapportér Spiller
          </h1>
          <p className="text-gray-400 text-lg">Hjælp os med at holde serveren fair og sjov for alle</p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              <strong>Vigtigt:</strong> Falske rapporter kan resultere i sanktioner. Sørg for at have bevis og være ærlig i din rapport.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="report-form">
            <div>
              <Label htmlFor="reported_player" className="text-white mb-2 block text-lg">
                Spiller Navn (IC navn) *
              </Label>
              <Input
                id="reported_player"
                value={formData.reported_player}
                onChange={(e) => setFormData({ ...formData, reported_player: e.target.value })}
                required
                className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white text-lg"
                placeholder="f.eks. John Doe"
                data-testid="reported-player-input"
              />
            </div>

            <div>
              <Label htmlFor="report_type" className="text-white mb-2 block text-lg">
                Rapport Type *
              </Label>
              <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                <SelectTrigger className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white" data-testid="report-type-select">
                  <SelectValue placeholder="Vælg regelbrydelse" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30">
                  {reportTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-[#4A90E2]/20" data-testid={`report-type-${type}`}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-white mb-2 block text-lg">
                Beskrivelse *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white min-h-[200px]"
                placeholder="Beskriv hvad der skete detaljeret... Inkluder tid, sted, og hvad der førte til situationen."
                data-testid="description-input"
              />
              <p className="text-sm text-gray-500 mt-2">Vær så detaljeret som muligt</p>
            </div>

            <div>
              <Label htmlFor="evidence" className="text-white mb-2 block text-lg">
                Bevis (Links til Clips/Screenshots)
              </Label>
              <Textarea
                id="evidence"
                value={formData.evidence}
                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white min-h-[100px]"
                placeholder="Indsæt links til clips, screenshots eller andet bevis her...\n\nEksempel:\nClip: https://medal.tv/...\nScreenshot: https://imgur.com/..."
                data-testid="evidence-input"
              />
              <p className="text-sm text-gray-500 mt-2">Clips og screenshots øger chancen for hurtig behandling</p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white py-6 text-lg font-bold rounded-xl"
                data-testid="submit-report-button"
              >
                Indsend Rapport
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/my-reports")}
                variant="outline"
                className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10 py-6 text-lg font-bold rounded-xl"
                data-testid="view-reports-button"
              >
                Mine Rapporter
              </Button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 glass-card p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-4">📋 Hvad sker der efter jeg rapporterer?</h3>
          <ol className="space-y-2 text-gray-300">
            <li>1. Din rapport modtages af staff teamet</li>
            <li>2. Staff undersøger situationen og gennemgår beviset</li>
            <li>3. Du kan se status på din rapport under "Mine Rapporter"</li>
            <li>4. Hvis nødvendigt, vil staff kontakte dig for mere information</li>
            <li>5. Du får besked når rapporten er behandlet</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Report;
