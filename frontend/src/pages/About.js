import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../App";

const About = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#0a0a0b] bg-grid">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 py-8 mt-24">
        <div className="animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 gradient-text text-center" data-testid="about-title">
            Om Redicate
          </h1>
          
          <div className="glass-card p-8 rounded-2xl mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Hvem er vi?</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              Redicate er en FiveM roleplay server dedikeret til at levere den bedste RP oplevelse i Danmark. 
              Vi har fokus på seriøs roleplay, et aktivt community og et dedikeret staff team.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              Vores server har været online siden 2025 og vokser hurtigt til at blive et af de største danske FiveM communities.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Server Regler</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">1.</span>
                <p><strong>Respekt:</strong> Behandl andre spillere med respekt, både IC og OOC.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">2.</span>
                <p><strong>RDM/VDM:</strong> Random Deathmatch og Vehicle Deathmatch er strengt forbudt.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">3.</span>
                <p><strong>Metagaming:</strong> Brug ikke information din karakter ikke ved IC.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">4.</span>
                <p><strong>FailRP:</strong> Spil din karakter realistisk og troværdigt.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">5.</span>
                <p><strong>NLR:</strong> New Life Rule - du husker ikke hvad der skete før du døde.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">6.</span>
                <p><strong>Power Gaming:</strong> Tving ikke andre spillere til scenarier uden deres samtykke.</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-2xl mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Whitelist Jobs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1a1a1b] p-4 rounded-xl">
                <div className="text-3xl mb-2">👮</div>
                <h3 className="text-xl font-bold text-white mb-2">Politi</h3>
                <p className="text-gray-400 text-sm">Håndhæv loven og beskyt borgerne</p>
              </div>
              <div className="bg-[#1a1a1b] p-4 rounded-xl">
                <div className="text-3xl mb-2">🚑</div>
                <h3 className="text-xl font-bold text-white mb-2">EMS</h3>
                <p className="text-gray-400 text-sm">Reddere og læger der redder liv</p>
              </div>
              <div className="bg-[#1a1a1b] p-4 rounded-xl">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="text-xl font-bold text-white mb-2">Mekaniker</h3>
                <p className="text-gray-400 text-sm">Reparer og modificer køretøjer</p>
              </div>
              <div className="bg-[#1a1a1b] p-4 rounded-xl">
                <div className="text-3xl mb-2">🔫</div>
                <h3 className="text-xl font-bold text-white mb-2">Bande</h3>
                <p className="text-gray-400 text-sm">Organiseret kriminalitet og territorie</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-2xl mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Kom i Gang</h2>
            <ol className="space-y-3 text-gray-300 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">1.</span>
                <p>Log ind med Discord</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">2.</span>
                <p>Ansøg om whitelist jobs</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">3.</span>
                <p>Vent på godkendelse (normalt 24-48 timer)</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#4A90E2] font-bold">4.</span>
                <p>Join serveren og start din RP rejse!</p>
              </li>
            </ol>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => navigate(user ? "/applications" : "/")}
              size="lg"
              className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white text-xl px-12 py-7 rounded-xl font-bold"
              data-testid="about-cta-button"
            >
              {user ? "Ansøg Nu" : "Log Ind"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
