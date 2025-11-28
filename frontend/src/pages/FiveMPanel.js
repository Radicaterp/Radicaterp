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
  const [activeTab, setActiveTab] = useState("players");

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
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

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold gradient-text">FiveM ESX Admin Panel</h1>
          <div className="flex gap-2">
            <Button onClick={handleAnnouncement} className="bg-[#4A90E2]">
              📢 Announcement
            </Button>
            <Button onClick={fetchPlayers} className="bg-green-600">
              🔄 Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-[#1a1a1b] border-[#4A90E2]/30">
          <CardHeader>
            <CardTitle className="text-white">Online Spillere ({players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <p className="text-gray-400">Ingen spillere online.</p>
            ) : (
              <div className="space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="bg-[#0a0a0b] p-4 rounded-lg border border-[#4A90E2]/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold text-lg">{player.name}</p>
                        <p className="text-gray-400 text-sm">ID: {player.id} | Ping: {player.ping}ms</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                        className="bg-[#4A90E2]"
                      >
                        {selectedPlayer === player.id ? "Skjul ▲" : "Vis Commands ▼"}
                      </Button>
                    </div>
                    
                    {selectedPlayer === player.id && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4 pt-4 border-t border-[#4A90E2]/20">
                        <Button size="sm" onClick={() => handleRevive(player.id)} className="bg-green-600">💚 Revive</Button>
                        <Button size="sm" onClick={() => handleHeal(player.id)} className="bg-green-500">🩹 Heal</Button>
                        <Button size="sm" onClick={() => handleArmor(player.id)} className="bg-blue-600">🛡️ Armor</Button>
                        <Button size="sm" onClick={() => handleFreeze(player.id)} className="bg-cyan-600">❄️ Freeze</Button>
                        <Button size="sm" onClick={() => handleUnfreeze(player.id)} className="bg-orange-500">🔥 Unfreeze</Button>
                        <Button size="sm" onClick={() => handleBring(player.id)} className="bg-purple-600">📍 Bring</Button>
                        <Button size="sm" onClick={() => handleGoto(player.id)} className="bg-purple-500">🚀 Goto</Button>
                        <Button size="sm" onClick={() => handleTeleport(player.id)} className="bg-blue-500">📌 TP</Button>
                        <Button size="sm" onClick={() => handleSpectate(player.id)} className="bg-indigo-600">👁️ Spectate</Button>
                        <Button size="sm" onClick={() => handleGiveMoney(player.id)} className="bg-emerald-600">💰 Money</Button>
                        <Button size="sm" onClick={() => handleSetJob(player.id)} className="bg-teal-600">💼 Set Job</Button>
                        <Button size="sm" onClick={() => handleGiveItem(player.id)} className="bg-yellow-600">📦 Give Item</Button>
                        <Button size="sm" onClick={() => handleGiveWeapon(player.id)} className="bg-red-500">🔫 Weapon</Button>
                        <Button size="sm" onClick={() => handleClearInventory(player.id)} className="bg-orange-600">🗑️ Clear Inv</Button>
                        <Button size="sm" onClick={() => handleKick(player.id)} className="bg-orange-700">👢 Kick</Button>
                        <Button size="sm" onClick={() => handleBan(player.id)} className="bg-red-600">🔨 Ban</Button>
                        <Button size="sm" onClick={() => handleWipe(player.id)} className="bg-red-900">⚠️ Wipe Data</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FiveMPanel;
