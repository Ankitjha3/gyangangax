import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiX } from "react-icons/hi";

const EditProfileModal = ({ onClose }) => {
    const { user, userData, setUserData } = useAuth();
    const [name, setName] = useState(userData?.name || "");
    const [bio, setBio] = useState(userData?.bio || "");
    const [branch, setBranch] = useState(userData?.branch || "");
    const [year, setYear] = useState(userData?.year || "");
    const [instagram, setInstagram] = useState(userData?.socialLinks?.instagram || "");
    const [linkedin, setLinkedin] = useState(userData?.socialLinks?.linkedin || "");
    const [github, setGithub] = useState(userData?.socialLinks?.github || "");
    const [youtube, setYoutube] = useState(userData?.socialLinks?.youtube || ""); // Added youtube state
    const [loading, setLoading] = useState(false);

    const branches = ["B.Tech", "MBA", "B.Com", "Pharmacy", "Law", "BBA"];
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userRef = doc(db, "users", user.uid);
            const updates = {
                name, bio, branch, year,
                socialLinks: { instagram, linkedin, github, youtube }
            };

            await updateDoc(userRef, updates);

            // Update local state immediately
            setUserData(prev => ({ ...prev, ...updates }));
            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                >
                    <HiX size={24} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Course</label>
                            <select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Select</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Select</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3 pt-2 border-t border-neutral-800/50">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Social Links</p>
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Instagram</label>
                            <input
                                type="text"
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors"
                                placeholder="Instagram Profile URL"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">LinkedIn</label>
                            <input
                                type="text"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
                                placeholder="LinkedIn Profile URL"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">GitHub</label>
                            <input
                                type="text"
                                value={github}
                                onChange={(e) => setGithub(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
                                placeholder="GitHub Profile URL"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">YouTube</label>
                            <input
                                type="text"
                                value={youtube}
                                onChange={(e) => setYoutube(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="YouTube Channel URL"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mt-2"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
