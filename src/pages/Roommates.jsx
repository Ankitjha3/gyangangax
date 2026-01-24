import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import RoommateCard from "../components/RoommateCard";
import CreateRoommateModal from "../components/CreateRoommateModal";
import { HiPlus } from "react-icons/hi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Roommates = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterType, setFilterType] = useState("All");

    useEffect(() => {
        const q = query(collection(db, "roommate_posts"), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching roommates:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const filteredPosts = filterType === "All" ? posts : posts.filter(p => p.type === filterType);

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Find Room/Roomie
                </h1>
                <Link to={`/u/${user?.uid}`} className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700 shrink-0 ml-3">
                    <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || "User"}&background=random`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </Link>
                <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                    {["All", "Flat", "Hostel"].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterType === type ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <p>No listings found.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-blue-400 text-sm mt-2 hover:underline"
                    >
                        Create one?
                    </button>
                </div>
            ) : (
                filteredPosts.map((post) => <RoommateCard key={post.id} post={post} />)
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500 transition-all active:scale-90 z-20"
            >
                <HiPlus size={28} />
            </button>

            {showCreateModal && <CreateRoommateModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
};

export default Roommates;
