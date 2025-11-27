import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FiveMPanel = () => {
  const { user } = useContext(AuthContext);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
    // Refresh players every 10 seconds
    const interval = setInterval(fetchPlayers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/fivem/players`);
      setPlayers(response.data.players || []);
    } catch (error) {
      console.error("Failed to fetch players", error);
    }
  };

  const handleKick = async (playerId) => {
    if (!window.confirm(`Er du sikker på at du vil kicke denne spiller?`)) return;
    
    const reason = prompt("Grund til kick:");
    if (!reason) return;

    try {
      setLoading(true);
      await axios.post(`${API}/fivem/kick`, { player_id: playerId, reason });
      alert("Spiller kicked!");
      fetchPlayers();
    } catch (error) {
      alert("Fejl: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (playerId) => {
    if (!window.confirm(`Er du sikker på at du vil banne denne spiller?`)) return;
    
    const reason = prompt("Grund til ban:");
    if (!reason) return;
    
    const duration = prompt("Varighed i dage (0 = permanent):");
    if (duration === null) return;

    try {
      setLoading(true);
      await axios.post(`${API}/fivem/ban`, { 
        player_id: playerId, 
        reason,
        duration: parseInt(duration) || 0
      });
      alert("Spiller banned!");
      fetchPlayers();
    } catch (error) {
      alert("Fejl: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTeleport = async (playerId) => {
    const coords = prompt("Koordinater (x,y,z) eller 'me' for at teleportere til dig:");
    if (!coords) return;

    try {
      setLoading(true);
      await axios.post(`${API}/fivem/teleport`, { 
        player_id: playerId, 
        coordinates: coords
      });
      alert("Spiller teleporteret!");
    } catch (error) {
      alert("Fejl: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleHeal = async (playerId) => {
    try {
      setLoading(true);
      await axios.post(`${API}/fivem/heal`, { player_id: playerId });
      alert("Spiller healed!");
    } catch (error) {
      alert("Fejl: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncement = async () => {
    if (!announcement.trim()) return;

    try {
      setLoading(true);
      await axios.post(`${API}/fivem/announce`, { message: announcement });
      alert("Announcement sendt!");
      setAnnouncement("");
    } catch (error) {
      alert("Fejl: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Adgang Nægtet</h1>
          <p className="text-gray-400">Du skal være admin for at se dette panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">FiveM Admin Panel</h1>

        <Tabs defaultValue="players" className="space-y-4">
          <TabsList className="bg-[#1a1a1b]">
            <TabsTrigger value="players">Online Spillere ({players.length})</TabsTrigger>
            <TabsTrigger value="announce">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
              <CardHeader>
                <CardTitle className="text-white">Online Spillere</CardTitle>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <p className="text-gray-400">Ingen spillere online lige nu.</p>
                ) : (
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="bg-[#0a0a0b] p-4 rounded-lg border border-[#4A90E2]/20 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-semibold">{player.name}</p>
                          <p className="text-gray-400 text-sm">ID: {player.id} | Ping: {player.ping}ms</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleHeal(player.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            💚 Heal
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTeleport(player.id)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            📍 TP
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleKick(player.id)}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            👢 Kick
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleBan(player.id)}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            🔨 Ban
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announce">
            <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
              <CardHeader>
                <CardTitle className="text-white">Send Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Skriv din besked her..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                  />
                  <Button
                    onClick={handleAnnouncement}
                    disabled={loading || !announcement.trim()}
                    className="bg-[#4A90E2] hover:bg-[#5fa3f5]"
                  >
                    📢 Send til alle spillere
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FiveMPanel;
