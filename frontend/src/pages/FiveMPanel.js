import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const FiveMPanel = () => {
  const { user } = useContext(AuthContext);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [serverStats, setServerStats] = useState({
    online: 0,
    maxPlayers: 64,
    uptime: "0h 0m",
    resources: 0
  });
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPlayers();
    fetchServerStats();
    const interval = setInterval(() => {
      fetchPlayers();
      fetchServerStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/fivem/players`);
      setPlayers(response.data.players || []);
      setServerStats(prev => ({ ...prev, online: response.data.players?.length || 0 }));
    } catch (error) {
      console.error("Failed to fetch players", error);
    }
  };

  const fetchServerStats = async () => {
    try {
      const response = await axios.get(`${API}/fivem/stats`);
      setServerStats(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const executeCommand = async (endpoint, data, successMsg) => {
    try {
      setLoading(true);
      await axios.post(`${API}/fivem/${endpoint}`, data);
      alert(successMsg);
      fetchPlayers();
    } catch (error) {
      alert("Fejl: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleKick = (playerId) => {
    const reason = prompt("Grund til kick:");
    if (reason) executeCommand("kick", { player_id: playerId, reason }, "Spiller kicked!");
  };

  const handleBan = (playerId) => {
    const reason = prompt("Grund til ban:");
    if (!reason) return;
    const duration = prompt("Varighed i dage (0 = permanent):");
    if (duration === null) return;
    executeCommand("ban", { player_id: playerId, reason, duration: parseInt(duration) || 0 }, "Spiller banned!");
  };

  const handleRevive = (playerId) => executeCommand("revive", { player_id: playerId }, "Spiller revived!");
  const handleHeal = (playerId) => executeCommand("heal", { player_id: playerId }, "Spiller healed!");
  const handleArmor = (playerId) => executeCommand("armor", { player_id: playerId }, "Armor givet!");
  
  const handleFreeze = (playerId) => executeCommand("freeze", { player_id: playerId }, "Spiller frozen!");
  const handleUnfreeze = (playerId) => executeCommand("unfreeze", { player_id: playerId }, "Spiller unfrozen!");

  const handleGiveMoney = (playerId) => {
    const amount = prompt("Hvor mange penge?");
    const type = prompt("Type: cash, bank, black");
    if (amount && type) executeCommand("give-money", { player_id: playerId, amount: parseInt(amount), account: type }, "Penge givet!");
  };

  const handleSetJob = (playerId) => {
    const job = prompt("Job navn (police, ambulance, mechanic, etc):");
    const grade = prompt("Grade (0-10):");
    if (job && grade !== null) executeCommand("set-job", { player_id: playerId, job, grade: parseInt(grade) }, "Job sat!");
  };

  const handleGiveItem = (playerId) => {
    const item = prompt("Item navn:");
    const count = prompt("Antal:");
    if (item && count) executeCommand("give-item", { player_id: playerId, item, count: parseInt(count) }, "Item givet!");
  };

  const handleGiveWeapon = (playerId) => {
    const weapon = prompt("Våben navn (WEAPON_PISTOL, WEAPON_AK47, etc):");
    const ammo = prompt("Ammo:");
    if (weapon) executeCommand("give-weapon", { player_id: playerId, weapon, ammo: parseInt(ammo) || 100 }, "Våben givet!");
  };

  const handleTeleport = (playerId) => {
    const coords = prompt("Koordinater (x,y,z) eller 'me' for at TP til dig:");
    if (coords) executeCommand("teleport", { player_id: playerId, coordinates: coords }, "Teleporteret!");
  };

  const handleBring = (playerId) => executeCommand("bring", { player_id: playerId }, "Spiller bragt til dig!");
  const handleGoto = (playerId) => executeCommand("goto", { player_id: playerId }, "Teleporteret til spiller!");

  const handleSpectate = (playerId) => executeCommand("spectate", { player_id: playerId }, "Spectating...");
  
  const handleAnnouncement = () => {
    const message = prompt("Besked til alle spillere:");
    if (message) executeCommand("announce", { message }, "Announcement sendt!");
  };

  const handleClearInventory = (playerId) => {
    if (window.confirm("Er du sikker på at du vil cleare inventory?")) {
      executeCommand("clear-inventory", { player_id: playerId }, "Inventory cleared!");
    }
  };

  const handleWipe = (playerId) => {
    if (window.confirm("⚠️ Dette vil slette ALLE data for spilleren! Er du sikker?")) {
      executeCommand("wipe-player", { player_id: playerId }, "Spiller data wipet!");
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

  const filteredPlayers = players.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id?.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#0f0f10] to-[#0a0a0b] py-6 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">FiveM Control Panel</h1>
            <p className="text-gray-400 text-sm">Server: 45.84.198.57:30120</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAnnouncement} className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5]">
              📢 Announcement
            </Button>
            <Button onClick={fetchPlayers} className="bg-gradient-to-r from-green-600 to-green-700">
              🔄 Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1a1a1b] border border-[#4A90E2]/20 p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#4A90E2]">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-[#4A90E2]">
              👥 Players ({players.length})
            </TabsTrigger>
            <TabsTrigger value="console" className="data-[state=active]:bg-[#4A90E2]">
              💻 Live Console
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-[#1a1a1b] to-[#0f0f10] border-[#4A90E2]/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Players Online</p>
                      <p className="text-3xl font-bold text-white">{serverStats.online}/{serverStats.maxPlayers}</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                  <div className="mt-3 w-full bg-[#0a0a0b] rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] h-2 rounded-full transition-all"
                      style={{ width: `${(serverStats.online / serverStats.maxPlayers) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1a1a1b] to-[#0f0f10] border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Server Status</p>
                      <p className="text-xl font-bold text-green-500">ONLINE</p>
                    </div>
                    <div className="text-4xl">✅</div>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Uptime: {serverStats.uptime}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1a1a1b] to-[#0f0f10] border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Resources</p>
                      <p className="text-3xl font-bold text-white">{serverStats.resources}</p>
                    </div>
                    <div className="text-4xl">📦</div>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Active resources running</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1a1a1b] to-[#0f0f10] border-orange-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Framework</p>
                      <p className="text-xl font-bold text-orange-500">ESX</p>
                    </div>
                    <div className="text-4xl">⚙️</div>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Legacy 1.2+</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button onClick={handleAnnouncement} className="bg-gradient-to-r from-blue-600 to-blue-700 h-20 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">📢</span>
                    <span>Announcement</span>
                  </Button>
                  <Button onClick={fetchPlayers} className="bg-gradient-to-r from-green-600 to-green-700 h-20 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">🔄</span>
                    <span>Refresh Data</span>
                  </Button>
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 h-20 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">🔴</span>
                    <span>Restart Server</span>
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 h-20 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">💾</span>
                    <span>Backup</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.slice(0, 5).map(player => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-[#0a0a0b] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-white">{player.name}</span>
                        <Badge variant="outline" className="text-gray-400">ID: {player.id}</Badge>
                      </div>
                      <span className="text-gray-400 text-sm">Connected • {player.ping}ms</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            {/* Search Bar */}
            <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
              <CardContent className="p-4">
                <Input
                  placeholder="🔍 Search players by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                />
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
              <CardHeader>
                <CardTitle className="text-white">Online Players ({filteredPlayers.length})</CardTitle>
              </CardHeader>
              <CardContent>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-400">Ingen spillere online lige nu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="bg-gradient-to-r from-[#0a0a0b] to-[#0f0f10] p-4 rounded-lg border border-[#4A90E2]/20 hover:border-[#4A90E2]/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-white font-semibold text-lg">{player.name}</p>
                          <div className="flex gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">ID: {player.id}</Badge>
                            <Badge variant="outline" className="text-xs text-green-400">{player.ping}ms</Badge>
                            {player.job && <Badge className="text-xs bg-purple-600">{player.job}</Badge>}
                            {player.money && <Badge className="text-xs bg-emerald-600">${player.money}</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                        className="bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5]"
                      >
                        {selectedPlayer === player.id ? "Hide ▲" : "Actions ▼"}
                      </Button>
                    </div>
                    
                    {selectedPlayer === player.id && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4 pt-4 border-t border-[#4A90E2]/20">
                        <Button size="sm" onClick={() => handleRevive(player.id)} className="bg-gradient-to-r from-green-600 to-green-700">💚 Revive</Button>
                        <Button size="sm" onClick={() => handleHeal(player.id)} className="bg-gradient-to-r from-green-500 to-green-600">🩹 Heal</Button>
                        <Button size="sm" onClick={() => handleArmor(player.id)} className="bg-gradient-to-r from-blue-600 to-blue-700">🛡️ Armor</Button>
                        <Button size="sm" onClick={() => handleFreeze(player.id)} className="bg-gradient-to-r from-cyan-600 to-cyan-700">❄️ Freeze</Button>
                        <Button size="sm" onClick={() => handleUnfreeze(player.id)} className="bg-gradient-to-r from-orange-500 to-orange-600">🔥 Unfreeze</Button>
                        <Button size="sm" onClick={() => handleBring(player.id)} className="bg-gradient-to-r from-purple-600 to-purple-700">📍 Bring</Button>
                        <Button size="sm" onClick={() => handleGoto(player.id)} className="bg-gradient-to-r from-purple-500 to-purple-600">🚀 Goto</Button>
                        <Button size="sm" onClick={() => handleTeleport(player.id)} className="bg-gradient-to-r from-blue-500 to-blue-600">📌 TP</Button>
                        <Button size="sm" onClick={() => handleSpectate(player.id)} className="bg-gradient-to-r from-indigo-600 to-indigo-700">👁️ Spectate</Button>
                        <Button size="sm" onClick={() => handleGiveMoney(player.id)} className="bg-gradient-to-r from-emerald-600 to-emerald-700">💰 Money</Button>
                        <Button size="sm" onClick={() => handleSetJob(player.id)} className="bg-gradient-to-r from-teal-600 to-teal-700">💼 Job</Button>
                        <Button size="sm" onClick={() => handleGiveItem(player.id)} className="bg-gradient-to-r from-yellow-600 to-yellow-700">📦 Item</Button>
                        <Button size="sm" onClick={() => handleGiveWeapon(player.id)} className="bg-gradient-to-r from-red-500 to-red-600">🔫 Weapon</Button>
                        <Button size="sm" onClick={() => handleClearInventory(player.id)} className="bg-gradient-to-r from-orange-600 to-orange-700">🗑️ Clear</Button>
                        <Button size="sm" onClick={() => handleKick(player.id)} className="bg-gradient-to-r from-orange-700 to-orange-800">👢 Kick</Button>
                        <Button size="sm" onClick={() => handleBan(player.id)} className="bg-gradient-to-r from-red-600 to-red-700">🔨 Ban</Button>
                        <Button size="sm" onClick={() => handleWipe(player.id)} className="bg-gradient-to-r from-red-900 to-black">⚠️ Wipe</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Live Console Tab */}
      <TabsContent value="console">
        <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Console Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0a0a0b] rounded-lg p-4 h-[600px] overflow-y-auto font-mono text-sm">
              <div className="space-y-1">
                <div className="text-green-400">[INFO] Server started successfully</div>
                <div className="text-blue-400">[RESOURCE] Started redicate-admin</div>
                <div className="text-yellow-400">[WARNING] High player count detected</div>
                <div className="text-gray-400">[DEBUG] Player connected: {players[0]?.name}</div>
                <div className="text-green-400">[INFO] ESX Framework loaded</div>
                <div className="text-blue-400">[ADMIN] {user?.username} accessed admin panel</div>
                <div className="text-gray-400 mt-4">─────────────────────────</div>
                <div className="text-gray-500 italic">Console feed will appear here in real-time...</div>
                <div className="text-gray-600 text-xs mt-2">Connect FiveM server resource for live updates</div>
              </div>
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
