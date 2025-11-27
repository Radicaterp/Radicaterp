import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${API}/auth/login`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#4A90E2] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#5fa3f5] rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-5xl animate-fade-in">
          <div className="mb-8 flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-48 w-48 object-contain glow-pulse"
            />
          </div>
          
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold mb-6 gradient-text tracking-tight">
            REDICATE
          </h1>
          
          <p className="text-2xl sm:text-3xl text-gray-300 mb-4 font-semibold">
            FiveM Roleplay Server
          </p>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Oplev den ultimative roleplay oplevelse. Ansøg om whitelist jobs, bliv en del af vores community, og skriv din egen historie i Los Santos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {!user ? (
              <>
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white text-xl px-10 py-7 rounded-xl font-bold glow-hover"
                  data-testid="hero-login-button"
                >
                  Kom i Gang
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/about")}
                  className="border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10 text-xl px-10 py-7 rounded-xl font-bold"
                  data-testid="about-button"
                >
                  Lær Mere
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => navigate("/applications")}
                  size="lg"
                  className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white text-xl px-10 py-7 rounded-xl font-bold glow-hover"
                  data-testid="applications-button"
                >
                  Se Ansøgninger
                </Button>
                <Button 
                  onClick={() => navigate("/my-applications")}
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10 text-xl px-10 py-7 rounded-xl font-bold"
                  data-testid="my-applications-button"
                >
                  Mine Ansøgninger
                </Button>
              </>
            )}
          </div>

          {/* Server Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="glass-card p-6 rounded-xl" data-testid="stat-players">
              <div className="text-4xl font-bold text-[#4A90E2] mb-2">50+</div>
              <div className="text-gray-400 text-sm">Aktive Spillere</div>
            </div>
            <div className="glass-card p-6 rounded-xl" data-testid="stat-jobs">
              <div className="text-4xl font-bold text-[#4A90E2] mb-2">15+</div>
              <div className="text-gray-400 text-sm">Whitelist Jobs</div>
            </div>
            <div className="glass-card p-6 rounded-xl" data-testid="stat-uptime">
              <div className="text-4xl font-bold text-[#4A90E2] mb-2">99%</div>
              <div className="text-gray-400 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent to-[#0a0a0b]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-bold text-center mb-4 gradient-text">
            Hvorfor Redicate?
          </h2>
          <p className="text-center text-gray-400 text-lg mb-16">Alt du har brug for i én server</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card glass-card p-8 rounded-2xl hover-lift" data-testid="feature-jobs">
              <div className="text-5xl mb-4">👮</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Whitelist Jobs</h3>
              <p className="text-gray-400 leading-relaxed">
                Politi, EMS, Mekaniker og meget mere. Professionelle jobs med dedikeret træning.
              </p>
            </div>

            <div className="feature-card glass-card p-8 rounded-2xl hover-lift" data-testid="feature-gangs">
              <div className="text-5xl mb-4">🔫</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Bande System</h3>
              <p className="text-gray-400 leading-relaxed">
                Opret eller join eksisterende bander. Territorie krige og organiseret kriminalitet.
              </p>
            </div>

            <div className="feature-card glass-card p-8 rounded-2xl hover-lift" data-testid="feature-economy">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Økonomi System</h3>
              <p className="text-gray-400 leading-relaxed">
                Realistisk økonomi med jobs, businesses og illegal aktivitet. Byg din formue.
              </p>
            </div>

            <div className="feature-card glass-card p-8 rounded-2xl hover-lift" data-testid="feature-custom">
              <div className="text-5xl mb-4">🚗</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Custom Køretøjer</h3>
              <p className="text-gray-400 leading-relaxed">
                100+ custom køretøjer. Fra supercars til motorcykler. Alle optimeret.
              </p>
            </div>

            <div className="feature-card glass-card p-8 rounded-2xl hover-lift" data-testid="feature-staff">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Dedikeret Staff</h3>
              <p className="text-gray-400 leading-relaxed">
                24/7 staff support. Hurtig respons på reports. Fair og konsistent håndtering.
              </p>
            </div>

            <div className="feature-card glass-card p-8 rounded-2xl hover-lift" data-testid="feature-updates">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Regelmæssige Updates</h3>
              <p className="text-gray-400 leading-relaxed">
                Nye features hver uge. Community feedback bliver lyttet til og implementeret.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center glass-card p-12 rounded-3xl">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
            Klar til at starte?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundredvis af andre spillere i Redicate i dag
          </p>
          {!user ? (
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white text-xl px-12 py-7 rounded-xl font-bold glow-hover"
              data-testid="cta-login-button"
            >
              Log Ind Med Discord
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/applications")}
              size="lg"
              className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white text-xl px-12 py-7 rounded-xl font-bold glow-hover"
              data-testid="cta-applications-button"
            >
              Ansøg Nu
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
