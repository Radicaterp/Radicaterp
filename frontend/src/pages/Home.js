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
      <div className="relative z-10 py-24 px-6 diagonal-bg">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-5xl sm:text-6xl font-black mb-2 gradient-text tracking-wider">
              SERVER FEATURES
            </h2>
            <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="feature-card glass-card corner-cut p-6 hover-lift" data-testid="feature-jobs">
              <div className="text-[#00d9ff] font-mono text-sm mb-2 tracking-wider">&gt; WHITELIST_JOBS</div>
              <h3 className="text-xl font-bold mb-3 text-white uppercase">Politi • EMS • Mekaniker</h3>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                Professionelle jobs med træning og progression. Dedikeret ledelse og struktur.
              </p>
            </div>

            <div className="feature-card glass-card corner-cut p-6 hover-lift" data-testid="feature-gangs">
              <div className="text-[#00d9ff] font-mono text-sm mb-2 tracking-wider">&gt; GANG_SYSTEM</div>
              <h3 className="text-xl font-bold mb-3 text-white uppercase">Territorier • Krige • Crew</h3>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                Byg dit imperium. Kæmp om territorier. Organiseret kriminalitet og street beef.
              </p>
            </div>

            <div className="feature-card glass-card corner-cut p-6 hover-lift" data-testid="feature-economy">
              <div className="text-[#00d9ff] font-mono text-sm mb-2 tracking-wider">&gt; ECONOMY</div>
              <h3 className="text-xl font-bold mb-3 text-white uppercase">Legal • Illegal • Business</h3>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                Realistisk økonomi. Byg din formue gennem legit eller dirty money.
              </p>
            </div>

            <div className="feature-card glass-card corner-cut p-6 hover-lift" data-testid="feature-custom">
              <div className="text-[#00d9ff] font-mono text-sm mb-2 tracking-wider">&gt; CUSTOM_VEHICLES</div>
              <h3 className="text-xl font-bold mb-3 text-white uppercase">100+ Biler • Tuning</h3>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                Supercars, bikes, trucks. Alle optimeret. Full tuning muligheder.
              </p>
            </div>

            <div className="feature-card glass-card corner-cut p-6 hover-lift" data-testid="feature-staff">
              <div className="text-[#00d9ff] font-mono text-sm mb-2 tracking-wider">&gt; STAFF_SUPPORT</div>
              <h3 className="text-xl font-bold mb-3 text-white uppercase">24/7 • Fair • Aktiv</h3>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                Dedikeret staff team. Hurtig respons. Konsistent håndtering af regler.
              </p>
            </div>

            <div className="feature-card glass-card corner-cut p-6 hover-lift" data-testid="feature-updates">
              <div className="text-[#00d9ff] font-mono text-sm mb-2 tracking-wider">&gt; DEVELOPMENT</div>
              <h3 className="text-xl font-bold mb-3 text-white uppercase">Updates • Events • Patches</h3>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                Konstant udvikling. Community feedback. Nye features hver uge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center glass-card corner-cut p-12">
          <div className="mb-6">
            <div className="inline-block border-2 border-[#00d9ff] px-4 py-2 corner-cut mb-4">
              <span className="text-[#00d9ff] font-mono text-sm tracking-widest">SYSTEM_READY</span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4 gradient-text tracking-wider">
            READY TO JOIN?
          </h2>
          <p className="text-lg text-gray-400 mb-8 font-mono">
            &gt; Connect til serveren og start din RP career
          </p>
          {!user ? (
            <button
              onClick={handleLogin}
              className="cyber-btn cyber-btn-primary text-xl px-16 py-5"
              data-testid="cta-login-button"
            >
              [ CONNECT VIA DISCORD ]
            </button>
          ) : (
            <button
              onClick={() => navigate("/applications")}
              className="cyber-btn cyber-btn-primary text-xl px-16 py-5"
              data-testid="cta-applications-button"
            >
              [ START ANSØGNING ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
