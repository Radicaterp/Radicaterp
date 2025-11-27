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
    <div className="min-h-screen bg-[#0d0d0f] relative overflow-hidden scanline">
      {/* Cyber Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid"></div>
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent opacity-30"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#7b2ff7] to-transparent opacity-20"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent opacity-30"></div>
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-[#00d9ff] rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#7b2ff7] rounded-full opacity-5 blur-3xl"></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-5xl animate-fade-in">
          <div className="mb-6 flex justify-center relative">
            <div className="absolute inset-0 bg-[#00d9ff] opacity-20 blur-2xl rounded-full"></div>
            <img 
              src="https://customer-assets.emergentagent.com/job_team-management-10/artifacts/pa8pgywq_7442CFA2-6A1F-48F7-81A5-9E9889D2D616-removebg-preview.png" 
              alt="Redicate Logo" 
              className="h-40 w-40 object-contain relative z-10"
              style={{ filter: 'drop-shadow(0 0 30px rgba(0, 217, 255, 0.6))' }}
            />
          </div>
          
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black mb-4 gradient-text glow-text" style={{ letterSpacing: '8px' }}>
            REDICATE
          </h1>
          <div className="h-1 w-64 mx-auto mb-6 bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent"></div>
          
          <p className="text-xl sm:text-2xl text-[#00d9ff] mb-3 font-bold tracking-widest">
            FIVEM ROLEPLAY
          </p>
          
          <p className="text-base sm:text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-mono">
            Dansk RP server | Whitelist jobs | Aktiv community | Seriøs roleplay
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {!user ? (
              <>
                <button
                  onClick={handleLogin}
                  className="cyber-btn cyber-btn-primary text-lg px-12 py-4"
                  data-testid="hero-login-button"
                >
                  [ LOG IND ]
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="cyber-btn text-lg px-12 py-4"
                  data-testid="about-button"
                >
                  [ INFO ]
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/applications")}
                  className="cyber-btn cyber-btn-primary text-lg px-12 py-4"
                  data-testid="applications-button"
                >
                  [ ANSØGNINGER ]
                </button>
                <button
                  onClick={() => navigate("/my-applications")}
                  className="cyber-btn text-lg px-12 py-4"
                  data-testid="my-applications-button"
                >
                  [ MINE ANS. ]
                </button>
              </>
            )}
          </div>

          {/* Server Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="glass-card corner-cut p-6" data-testid="stat-players">
              <div className="text-sm text-[#00d9ff] font-mono mb-1 tracking-wider">&gt; SPILLERE</div>
              <div className="text-4xl font-black text-white">50+</div>
            </div>
            <div className="glass-card corner-cut p-6" data-testid="stat-jobs">
              <div className="text-sm text-[#00d9ff] font-mono mb-1 tracking-wider">&gt; JOBS</div>
              <div className="text-4xl font-black text-white">15+</div>
            </div>
            <div className="glass-card corner-cut p-6" data-testid="stat-uptime">
              <div className="text-sm text-[#00d9ff] font-mono mb-1 tracking-wider">&gt; UPTIME</div>
              <div className="text-4xl font-black text-white">99%</div>
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
