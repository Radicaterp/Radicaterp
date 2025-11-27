import { useEffect, useState } from "react";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`);
      setStaff(response.data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatar, discordId) => {
    if (avatar) {
      return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4A90E2] rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-24">
        <div className="mb-12 text-center animate-fade-in">
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 gradient-text" data-testid="staff-title">
            Mød Vores Staff Team
          </h1>
          <p className="text-gray-400 text-xl">De mennesker der holder Redicate kørende</p>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <div className="text-[#4A90E2] text-xl">Indlæser staff...</div>
          </div>
        ) : staff.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center" data-testid="no-staff">
            <p className="text-gray-400 text-lg">Ingen staff medlemmer fundet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="staff-grid">
            {staff.map((member) => (
              <div
                key={member.discord_id}
                className="glass-card p-8 rounded-2xl hover-lift text-center"
                data-testid={`staff-${member.discord_id}`}
              >
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(member.avatar, member.discord_id)}
                      alt={member.username}
                      className="w-32 h-32 rounded-full border-4 border-[#4A90E2] shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-[#4A90E2] rounded-full p-3 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{member.username}</h3>
                <div className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full mb-4">
                  <span className="text-purple-400 font-semibold">Staff</span>
                </div>

                <p className="text-gray-400 text-sm">
                  Ansvarlig for at holde serveren sikker og sjov for alle spillere
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 glass-card p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Vil du være staff?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">📋 Ansvar som Staff:</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Behandle rapporter fra spillere</li>
                <li>✓ Håndhæve server regler</li>
                <li>✓ Hjælpe spillere med spørgsmål</li>
                <li>✓ Holde øje med RP kvalitet</li>
                <li>✓ Deltage i staff møder</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">🎯 Krav:</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Minimum 18 år</li>
                <li>✓ God RP erfaring</li>
                <li>✓ Aktiv på serveren (15+ timer/uge)</li>
                <li>✓ Godt kendskab til regler</li>
                <li>✓ Professionel og hjælpsom attitude</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center">
            <a href="/applications" className="inline-block">
              <button className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white px-8 py-4 rounded-xl text-lg font-bold transition-opacity">
                Ansøg om Staff
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staff;
