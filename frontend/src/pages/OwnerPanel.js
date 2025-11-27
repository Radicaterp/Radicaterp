import { useState, useEffect } from "react";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const OwnerPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) {
      toast.error("Vælg både bruger og rolle");
      return;
    }

    try {
      await axios.put(
        `${API}/users/${selectedUser}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success("Rolle opdateret!");
      setSelectedUser(null);
      setNewRole("");
      fetchUsers();
    } catch (error) {
      toast.error("Kunne ikke opdatere rolle");
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner": return "text-purple-500";
      case "head_admin": return "text-red-500";
      case "staff": return "text-blue-500";
      default: return "text-gray-400";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner": return "Ejer";
      case "head_admin": return "Head Admin";
      case "staff": return "Staff";
      default: return "Spiller";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] grid-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-20">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 gradient-text" data-testid="owner-panel-title">Ejer Panel</h1>
          <p className="text-gray-400 text-lg">Fuld system kontrol - administrer bruger roller</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Role Management */}
          <div className="card" data-testid="role-management">
            <h2 className="text-2xl font-bold mb-6 text-[#4A90E2]">Tildel Rolle</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Vælg Bruger</Label>
                <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white" data-testid="user-select">
                    <SelectValue placeholder="Vælg en bruger" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30 max-h-[300px]">
                    {users.map((user) => (
                      <SelectItem key={user.discord_id} value={user.discord_id} className="text-white hover:bg-[#4A90E2]/20" data-testid={`user-option-${user.discord_id}`}>
                        {user.username} - {getRoleLabel(user.role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white mb-2 block">Ny Rolle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white" data-testid="role-select">
                    <SelectValue placeholder="Vælg en rolle" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1b] border-[#4A90E2]/30">
                    <SelectItem value="player" className="text-white hover:bg-[#4A90E2]/20">Spiller</SelectItem>
                    <SelectItem value="staff" className="text-white hover:bg-[#4A90E2]/20">Staff</SelectItem>
                    <SelectItem value="head_admin" className="text-white hover:bg-[#4A90E2]/20">Head Admin</SelectItem>
                    <SelectItem value="owner" className="text-white hover:bg-[#4A90E2]/20">Ejer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleUpdateRole}
                className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90"
                data-testid="update-role-button"
              >
                Opdater Rolle
              </Button>
            </div>
          </div>

          {/* User List */}
          <div className="card" data-testid="user-list">
            <h2 className="text-2xl font-bold mb-6 text-[#4A90E2]">Alle Brugere ({users.length})</h2>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {users.map((user) => (
                <div 
                  key={user.discord_id} 
                  className="bg-[#1a1a1b] p-4 rounded-lg border border-[#4A90E2]/20 flex justify-between items-center"
                  data-testid={`user-card-${user.discord_id}`}
                >
                  <div>
                    <h3 className="text-white font-semibold">{user.username}</h3>
                    <p className="text-sm text-gray-500">ID: {user.discord_id}</p>
                  </div>
                  <span className={`font-semibold ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerPanel;
