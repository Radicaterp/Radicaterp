import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext, API } from "../App";
import axios from "axios";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      
      if (!code) {
        navigate("/");
        return;
      }

      try {
        await axios.get(`${API}/auth/callback?code=${code}`, { withCredentials: true });
        await checkAuth();
        navigate("/dashboard");
      } catch (error) {
        console.error("Auth callback failed", error);
        navigate("/");
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[#4A90E2] text-xl mb-4">Logger ind...</div>
        <div className="w-16 h-16 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
