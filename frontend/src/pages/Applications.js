import { useState, useEffect } from "react";
import { API } from "../App";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const Applications = () => {
  const [applicationTypes, setApplicationTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchApplicationTypes();
  }, []);

  const fetchApplicationTypes = async () => {
    try {
      const response = await axios.get(`${API}/application-types`);
      setApplicationTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch application types", error);
    }
  };

  const handleApply = (appType) => {
    setSelectedType(appType);
    setFormData({});
    setShowDialog(true);
  };

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedType) return;

    // Check if all required questions are answered
    const requiredQuestions = selectedType.questions.filter(q => q.required);
    for (const q of requiredQuestions) {
      if (!formData[q.id] || formData[q.id].trim() === "") {
        toast.error(`Besvar venligst: ${q.label}`);
        return;
      }
    }

    try {
      await axios.post(
        `${API}/applications`,
        {
          application_type_id: selectedType.id,
          answers: formData
        },
        { withCredentials: true }
      );
      
      toast.success("Ansøgning indsendt!");
      setShowDialog(false);
      setSelectedType(null);
      setFormData({});
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Kunne ikke indsende ansøgning");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#4A90E2] rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-24">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 gradient-text" data-testid="applications-title">
            Ansøgninger
          </h1>
          <p className="text-gray-400 text-xl">Vælg en ansøgningstype og start din rejse</p>
        </div>

        {applicationTypes.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center" data-testid="no-applications">
            <p className="text-gray-400 text-lg">Der er ingen ansøgninger tilgængelige endnu.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="applications-grid">
            {applicationTypes.map((appType) => (
              <div 
                key={appType.id} 
                className="glass-card p-8 rounded-2xl hover-lift cursor-pointer" 
                style={{ borderColor: appType.color }}
                data-testid={`application-type-${appType.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold mb-2" style={{ color: appType.color }}>
                      {appType.name}
                    </h3>
                  </div>
                  {appType.icon && <div className="text-5xl">{appType.icon}</div>}
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed min-h-[60px]">{appType.description}</p>
                
                <Dialog open={showDialog && selectedType?.id === appType.id} onOpenChange={(open) => {
                  if (!open) {
                    setShowDialog(false);
                    setSelectedType(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => handleApply(appType)}
                      className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 text-white py-6 text-lg font-bold rounded-xl"
                      data-testid={`apply-button-${appType.id}`}
                    >
                      Ansøg Nu
                    </Button>
                  </DialogTrigger>
                  
                  {selectedType?.id === appType.id && (
                    <DialogContent className="bg-[#1a1a1b] border-[#4A90E2]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-3xl gradient-text mb-2">
                          {selectedType.name} Ansøgning
                        </DialogTitle>
                        <p className="text-gray-400">{selectedType.description}</p>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                        {selectedType.questions && selectedType.questions.length > 0 ? (
                          selectedType.questions.map((question) => (
                            <div key={question.id}>
                              <Label className="text-white mb-2 block text-lg">
                                {question.label} {question.required && <span className="text-red-500">*</span>}
                              </Label>
                              {question.type === "textarea" ? (
                                <Textarea
                                  value={formData[question.id] || ""}
                                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                                  required={question.required}
                                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white min-h-[120px]"
                                  placeholder={question.placeholder || ""}
                                  data-testid={`question-${question.id}`}
                                />
                              ) : (
                                <Input
                                  type={question.type || "text"}
                                  value={formData[question.id] || ""}
                                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                                  required={question.required}
                                  className="bg-[#0a0a0b] border-[#4A90E2]/30 text-white"
                                  placeholder={question.placeholder || ""}
                                  data-testid={`question-${question.id}`}
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">Ingen spørgsmål konfigureret endnu.</p>
                          </div>
                        )}
                        
                        {selectedType.questions && selectedType.questions.length > 0 && (
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#4A90E2] to-[#5fa3f5] hover:opacity-90 py-6 text-lg font-bold"
                            data-testid="submit-application-button"
                          >
                            Send Ansøgning
                          </Button>
                        )}
                      </form>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
