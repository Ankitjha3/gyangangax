import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import { HiPlus } from "react-icons/hi";

import { useNavigate } from "react-router-dom";
import { HiSearch, HiPaperAirplane } from "react-icons/hi";
import UserSearchModal from "../components/UserSearchModal";

const Feed = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, "posts"),
            orderBy("isPinned", "desc"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching feed:", err);
            setError(err);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Campus Feed
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300"
                    >
                        <HiSearch size={24} />
                    </button>
                    <button
                        onClick={() => navigate("/chats")}
                        className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 rotate-90"
                    >
                        <HiPaperAirplane size={24} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="text-center py-20 px-4 text-red-400">
                    <p className="font-bold mb-2">Something went wrong</p>
                    <p className="text-xs font-mono bg-red-900/10 p-2 rounded break-all">{error.message}</p>
                    <p className="text-xs text-neutral-500 mt-4">Check the console for a fix link (Missing Index).</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <p>No posts yet. Be the first!</p>
                </div>
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500 transition-all active:scale-90 z-20"
            >
                <HiPlus size={28} />
            </button>

            {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}
            {showSearchModal && <UserSearchModal onClose={() => setShowSearchModal(false)} />}
        </div>
    );
};

export default Feed;
