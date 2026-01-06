import { useState } from "react";
import { HiX, HiUpload, HiCurrencyRupee } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const UploadAssignmentModal = ({ onClose }) => {
    const { user, userData } = useAuth();
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [caption, setCaption] = useState("");
    const [price, setPrice] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [year, setYear] = useState(userData?.year || "");
    const [branch, setBranch] = useState(userData?.branch || "");
    const [loading, setLoading] = useState(false);

    const branches = ["B.Tech", "MBA", "B.Com", "Pharmacy", "Law", "BBA"];
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !subject || !price || !whatsapp) return;
        setLoading(true);

        try {
            await addDoc(collection(db, "assignments"), {
                title,
                subject,
                caption,
                price,
                whatsapp,
                branch,
                year,
                authorId: user.uid,
                authorName: userData.name,
                timestamp: serverTimestamp(),
            });

            onClose();
        } catch (error) {
            console.error("Error posting assignment:", error);
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

                <h2 className="text-xl font-bold mb-6">Upload Assignment</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Assignment Title"
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                    />

                    <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject Name"
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                    />

                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Description/Caption (Optional)"
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 h-20 resize-none focus:outline-none focus:border-blue-500"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                <HiCurrencyRupee size={18} />
                            </div>
                            <input
                                type="number"
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="Price"
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                <FaWhatsapp size={18} />
                            </div>
                            <input
                                type="tel"
                                required
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="WhatsApp No."
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-green-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 appearance-none"
                        >
                            <option value="">Course</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>

                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 appearance-none"
                        >
                            <option value="">Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl mt-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Publishing..." : "Sell Assignment"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadAssignmentModal;
