import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FiveMPanel = () => {
  const { user } = useContext(AuthContext);

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
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-[#1a1a1b] border border-[#4A90E2]/30 rounded-2xl p-12 shadow-2xl">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-5xl font-bold gradient-text mb-4">FiveM Admin Panel</h1>
          </div>
          
          <div className="bg-[#0a0a0b] border border-[#4A90E2]/20 rounded-lg p-8 mb-6">
            <h2 className="text-3xl font-bold text-[#4A90E2] mb-4">Kommer Snart</h2>
            <p className="text-gray-300 text-lg mb-6">
              Vi arbejder på at integrere FiveM server administration direkte i panelet.
            </p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-2xl">⏳</span>
                <span>Live spiller oversigt</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-2xl">⏳</span>
                <span>Kick & Ban funktioner</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-2xl">⏳</span>
                <span>Teleport & Heal commands</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-2xl">⏳</span>
                <span>Server announcements</span>
              </div>
            </div>
          </div>
          
          <div className="text-gray-500 text-sm">
            Holder dig opdateret når vi går live! 🚀
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiveMPanel;
