import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${API}/auth/login`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] grid-bg relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#4A90E2] rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#5fa3f5] rounded-full opacity-10 blur-3xl"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#4A90E2]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-2xl font-bold gradient-text">REDICATE RP</h1>
          </div>
          <Button 
            onClick={handleLogin}
            className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 transition-opacity"
            data-testid="login-button"
          >
            Log ind med Discord
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-4xl animate-fade-in">
          <div className="mb-8 flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-40 w-40 object-contain glow"
            />
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 gradient-text">
            REDICATE RP
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Den bedste FiveM roleplay oplevelse. Ansøg om whitelist jobs, join vores staff team, og vær en del af fællesskabet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 transition-all text-lg px-8 py-6 glow-hover"
              data-testid="hero-login-button"
            >
              Kom i gang
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10 text-lg px-8 py-6"
              data-testid="learn-more-button"
            >
              Læs mere
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 gradient-text">
            Hvad tilbyder vi?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card" data-testid="feature-whitelist">
              <div className="text-4xl mb-4">👮</div>
              <h3 className="text-2xl font-bold mb-3 text-[#4A90E2]">Whitelist Jobs</h3>
              <p className="text-gray-400">
                Ansøg om jobs som politi, EMS, mekaniker og meget mere. Vær en del af det professionelle miljø.
              </p>
            </div>

            <div className="card" data-testid="feature-staff">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-2xl font-bold mb-3 text-[#4A90E2]">Staff Team</h3>
              <p className="text-gray-400">
                Bliv en del af vores staff team og hjælp med at forme serveren. Moderation, events og support.
              </p>
            </div>

            <div className="card" data-testid="feature-community">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold mb-3 text-[#4A90E2]">Fællesskab</h3>
              <p className="text-gray-400">
                Join et aktivt og engageret community. Discord integration og nem kommunikation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
