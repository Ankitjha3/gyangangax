import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for loading to finish before making decision
        if (!loading && user) {
            console.log("Login page: User found and not loading. Redirecting to /");
            navigate("/");
        }
    }, [user, loading, navigate]);

    const handleLogin = async () => {
        try {
            await login();
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                    GyanGanga X
                </h1>
                <p className="text-neutral-400 text-sm">
                    Campus Community App
                </p>
            </div>

            <button
                onClick={handleLogin}
                className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
                <FcGoogle size={24} />
                Continue with Google
            </button>

            <p className="mt-8 text-xs text-neutral-600">
                Only for Gyan Ganga Group of Institutions
            </p>
        </div>
    );
};

export default Login;
