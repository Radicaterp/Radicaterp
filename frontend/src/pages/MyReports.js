import { useEffect, useState, useContext } from "react";
import { AuthContext, API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const MyReports = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const response = await axios.get(`${API}/reports`, { withCredentials: true });
      setReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "text-green-500";
      case "dismissed": return "text-red-500";
      case "investigating": return "text-blue-500";
      default: return "text-yellow-500";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "resolved": return "bg-green-500/20 border-green-500/50";
      case "dismissed": return "bg-red-500/20 border-red-500/50";
      case "investigating": return "bg-blue-500/20 border-blue-500/50";
      default: return "bg-yellow-500/20 border-yellow-500/50";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "resolved": return "✅ Afsluttet";
      case "dismissed": return "❌ Afvist";
      case "investigating": return "🔍 Undersøges";
      default: return "⏳ Afventer";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
      </div>

      <Navbar />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 mt-24">
        <div className="mb-8 flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-2 gradient-text" data-testid="my-reports-title">
              Mine Rapporter
            </h1>
            <p className="text-gray-400 text-lg">Se status på dine indsendte rapporter</p>
          </div>
          <Button
            onClick={() => navigate("/report")}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white px-6 py-6 text-lg font-bold"
            data-testid="new-report-button"
          >
            + Ny Rapport
          </Button>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <div className="text-[#4A90E2] text-xl">Indlæser...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center" data-testid="no-reports">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-white mb-4">Ingen rapporter endnu</h2>
            <p className="text-gray-400 text-lg mb-8">Du har ikke indsendt nogen rapporter.</p>
            <Button
              onClick={() => navigate("/report")}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white px-8 py-6 text-lg font-bold"
              data-testid="create-report-button"
            >
              Rapportér Spiller
            </Button>
          </div>
        ) : (
          <div className="space-y-6" data-testid="reports-list">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`glass-card p-6 rounded-2xl border-2 ${getStatusBg(report.status)}`}
                data-testid={`report-${report.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{report.reported_player}</h3>
                      <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-sm font-semibold">
                        {report.report_type}
                      </span>
                    </div>

                    <div className="space-y-2 text-gray-300">
                      <p className="line-clamp-2">{report.description}</p>
                      <p>
                        <span className="text-gray-500">Status:</span>{" "}
                        <span className={`font-semibold ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Indsendt:</span>{" "}
                        {new Date(report.submitted_at).toLocaleDateString("da-DK", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      {report.handled_by && (
                        <p>
                          <span className="text-gray-500">Behandlet af:</span> {report.handled_by}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-6 py-3 rounded-xl font-bold text-lg ${getStatusBg(report.status)}`}>
                      {getStatusText(report.status)}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10"
                          onClick={() => setSelectedReport(report)}
                          data-testid={`view-report-${report.id}`}
                        >
                          Se Detaljer
                        </Button>
                      </DialogTrigger>
                      {selectedReport && selectedReport.id === report.id && (
                        <DialogContent className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl gradient-text">
                              Rapport: {selectedReport.reported_player}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <h4 className="font-semibold text-[#4A90E2] mb-1">Type:</h4>
                              <p className="text-gray-300">{selectedReport.report_type}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#4A90E2] mb-1">Beskrivelse:</h4>
                              <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.description}</p>
                            </div>
                            {selectedReport.evidence && (
                              <div>
                                <h4 className="font-semibold text-[#4A90E2] mb-1">Bevis:</h4>
                                <p className="text-gray-300 whitespace-pre-wrap break-all">{selectedReport.evidence}</p>
                              </div>
                            )}
                            {selectedReport.admin_notes && (
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-400 mb-1">Staff Notater:</h4>
                                <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;
