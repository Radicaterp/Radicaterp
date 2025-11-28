import { useState, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "../components/Navbar";

const SearchApplications = () => {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API}/applications/search`, {
        params: { username: searchQuery }
      });
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error("Search failed", error);
      alert("Fejl ved søgning: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-600";
      case "rejected": return "bg-red-600";
      case "pending": return "bg-yellow-600";
      default: return "bg-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved": return "✅ Godkendt";
      case "rejected": return "❌ Afvist";
      case "pending": return "⏳ Afventer";
      default: return status;
    }
  };

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Adgang Nægtet</h1>
          <p className="text-gray-400">Kun admins kan søge efter ansøgninger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">Søg Ansøgninger</h1>

        {/* Search Bar */}
        <Card className="bg-[#1a1a1b] border-[#4A90E2]/30 mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Input
                placeholder="🔍 Søg efter brugernavn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading || !searchQuery.trim()}
                className="bg-[#4A90E2] hover:bg-[#5fa3f5]"
              >
                {loading ? "Søger..." : "Søg"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400">Søg efter en bruger for at se deres ansøgninger</p>
          </div>
        )}

        {searchResults.map((result) => (
          <Card key={result.user.discord_id} className="bg-[#1a1a1b] border-[#4A90E2]/30 mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-white text-2xl">{result.user.username}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">Discord ID: {result.user.discord_id}</Badge>
                      <Badge className={result.user.role === "player" ? "bg-gray-600" : "bg-purple-600"}>
                        {result.user.role || "player"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Total Ansøgninger</p>
                  <p className="text-3xl font-bold text-[#4A90E2]">{result.total_applications}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setExpandedUser(expandedUser === result.user.discord_id ? null : result.user.discord_id)}
                variant="outline"
                className="w-full mb-4"
              >
                {expandedUser === result.user.discord_id ? "Skjul Ansøgninger ▲" : "Vis Ansøgninger ▼"}
              </Button>

              {expandedUser === result.user.discord_id && (
                <div className="space-y-3">
                  {result.applications.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Ingen ansøgninger endnu</p>
                  ) : (
                    result.applications.map((app) => (
                      <div
                        key={app.id}
                        className="bg-[#0a0a0b] p-4 rounded-lg border border-[#4A90E2]/20"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold text-lg">{app.application_type_name}</p>
                            <p className="text-gray-400 text-sm">
                              Indsendt: {new Date(app.submitted_at).toLocaleDateString('da-DK')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(app.status)}>
                            {getStatusText(app.status)}
                          </Badge>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => setSelectedApplication(selectedApplication === app.id ? null : app.id)}
                          className="bg-[#4A90E2]"
                        >
                          {selectedApplication === app.id ? "Skjul Svar ▲" : "Vis Svar ▼"}
                        </Button>

                        {selectedApplication === app.id && (
                          <div className="mt-4 pt-4 border-t border-[#4A90E2]/20 space-y-4">
                            {app.application_type_details && app.application_type_details.questions ? (
                              app.application_type_details.questions.map((question, index) => {
                                const answer = app.answers[question.id] || "Ikke besvaret";
                                return (
                                  <div key={question.id} className="bg-[#1a1a1b] p-4 rounded-lg">
                                    <div className="flex items-start gap-2 mb-2">
                                      <span className="text-[#4A90E2] font-bold">{index + 1}.</span>
                                      <div className="flex-1">
                                        <p className="text-[#4A90E2] font-semibold mb-2">
                                          {question.label}
                                          {question.required && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                        <p className="text-gray-300 whitespace-pre-wrap bg-[#0a0a0b] p-3 rounded">
                                          {answer}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-gray-400">Ingen spørgsmål data tilgængelig</p>
                            )}

                            {app.reviewed_by && (
                              <div className="mt-4 pt-4 border-t border-[#4A90E2]/20">
                                <p className="text-gray-400 text-sm">
                                  Behandlet af: <span className="text-white">{app.reviewed_by}</span>
                                </p>
                                {app.reviewed_at && (
                                  <p className="text-gray-400 text-sm">
                                    Behandlet: {new Date(app.reviewed_at).toLocaleString('da-DK')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SearchApplications;
