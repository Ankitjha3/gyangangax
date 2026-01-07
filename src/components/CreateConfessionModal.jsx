import { useState } from "react";
import { HiX } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const CreateConfessionModal = ({ onClose }) => {
    const { user, userData } = useAuth();
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);

        try {
            await addDoc(collection(db, "confessions"), {
                text,
                authorId: user.uid,
                college: userData.college,
                reactions: {},
                timestamp: serverTimestamp(),
            });
            onClose();
        } catch (error) {
            console.error("Error creating confession:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-6 border border-neutral-800 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300 border-l-4 border-l-purple-600">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
                    <HiX size={24} />
                </button>

                <h2 className="text-xl font-bold mb-6 text-purple-400">Secret Confession</h2>

                <form onSubmit={handleSubmit}>
                    <textarea
                        required
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your confession..."
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-4 h-32 resize-none focus:outline-none focus:border-purple-500 text-lg font-serif"
                    />

                    <button
                        type="submit"
                        disabled={loading || !text.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl mt-6 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Confessing..." : "Post Anonymously"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateConfessionModal;
