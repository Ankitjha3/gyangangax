import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import ConfessionCard from "../components/ConfessionCard";
import CreateConfessionModal from "../components/CreateConfessionModal";
import { HiPlus } from "react-icons/hi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Confessions = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "confessions"), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(docs);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen bg-black">
            <header className="flex justify-between items-center mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 -mx-4 px-6 border-b border-neutral-900">
                <h1 className="text-2xl font-bold text-purple-500">
                    Confessions 🤫
                </h1>
                <Link to={`/u/${user?.uid}`} className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700">
                    <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || "User"}&background=random`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </Link>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 text-neutral-600">
                    <p>It's quiet here...</p>
                    <p className="text-xs mt-2">Spill the tea!</p>
                </div>
            ) : (
                posts.map((post) => <ConfessionCard key={post.id} post={post} />)
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-20 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-500 transition-all active:scale-90 z-20 shadow-purple-900/20"
            >
                <HiPlus size={28} />
            </button>

            {showCreateModal && <CreateConfessionModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
};

export default Confessions;
