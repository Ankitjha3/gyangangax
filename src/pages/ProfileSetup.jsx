import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ProfileSetup = () => {
    const { user, setUserData } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.displayName || "",
        branch: "",
        year: "",
    });

    const branches = ["B.Tech", "MBA", "B.Com", "Pharmacy", "Law", "BBA"];
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const userProfile = {
                uid: user.uid,
                name: formData.name,
                email: user.email,
                branch: formData.branch,
                year: formData.year,
                college: "Gyan Ganga Group of Institutions",
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, "users", user.uid), userProfile);
            setUserData(userProfile);
            navigate("/");
        } catch (error) {
            console.error("Error creating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                    Setup Profile
                </h1>
                <p className="text-neutral-400 mb-8 text-sm">
                    Join the community. Just a few details.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-neutral-400 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-400 mb-1">College</label>
                        <input
                            type="text"
                            value="Gyan Ganga Group of Institutions"
                            disabled
                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-neutral-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-neutral-400 mb-1">Course</label>
                            <select
                                required
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Select</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-neutral-400 mb-1">Year</label>
                            <select
                                required
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Select</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-medium py-3 rounded-xl mt-6 hover:bg-neutral-200 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Creating Profile..." : "Get Started"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
