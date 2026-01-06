import { useState } from "react";
import { HiX } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const CreateRoommateModal = ({ onClose }) => {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: "Flat",
        location: "",
        budget: "",
        gender: "Any",
        contact: "",
        description: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "roommate_posts"), {
                ...formData,
                authorId: user.uid,
                authorName: userData.name,
                timestamp: serverTimestamp(),
            });
            onClose();
        } catch (error) {
            console.error("Error creating listing:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-6 border border-neutral-800 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
                    <HiX size={24} />
                </button>

                <h2 className="text-xl font-bold mb-6">Find Room/Roommate</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="Flat"
                                checked={formData.type === "Flat"}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="hidden peer"
                            />
                            <div className="text-center py-2 rounded-lg border border-neutral-700 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:text-white text-neutral-400 transition-all">Flat</div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="Hostel"
                                checked={formData.type === "Hostel"}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="hidden peer"
                            />
                            <div className="text-center py-2 rounded-lg border border-neutral-700 peer-checked:bg-purple-600 peer-checked:border-purple-600 peer-checked:text-white text-neutral-400 transition-all">Hostel</div>
                        </label>
                    </div>

                    <input
                        type="text"
                        required
                        placeholder="Location (e.g., Tilwara, Medical)"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            required
                            placeholder="Budget (₹)"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 appearance-none"
                        />
                        <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 appearance-none"
                        >
                            <option value="Any">Any Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    <input
                        type="tel"
                        required
                        placeholder="WhatsApp Number (with 91)"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                    />

                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Additional requirements (WiFi, Food, etc.)"
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 h-20 resize-none focus:outline-none focus:border-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl mt-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Posting..." : "Create Listing"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateRoommateModal;
