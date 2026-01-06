import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { HiTrash, HiBan, HiCheckCircle, HiStar, HiSearch, HiFilter } from "react-icons/hi";
import PostCard from "../components/PostCard";
import AssignmentCard from "../components/AssignmentCard";
import RoommateCard from "../components/RoommateCard";
import ConfessionCard from "../components/ConfessionCard";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("content"); // 'content' or 'users'
    const [contentCategory, setContentCategory] = useState("posts"); // 'posts', 'assignments', 'roommate_posts', 'confessions'
    const [content, setContent] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userSearch, setUserSearch] = useState("");

    const categories = [
        { id: "posts", name: "Feed Posts" },
        { id: "assignments", name: "Assignments" },
        { id: "roommate_posts", name: "Roommates" },
        { id: "confessions", name: "Confessions" }
    ];

    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, contentCategory), orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            setContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(`Error fetching ${contentCategory}:`, error);
        } finally {
            setLoading(false);
        }
    }, [contentCategory]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"));
            const snapshot = await getDocs(q);
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "content") {
            fetchContent();
        } else {
            fetchUsers();
        }
    }, [activeTab, fetchContent, fetchUsers]);

    const handlePinPost = async (postId, currentStatus) => {
        // Only for Feed Posts for now
        if (contentCategory !== "posts") return;
        try {
            await updateDoc(doc(db, "posts", postId), {
                isPinned: !currentStatus
            });
            setContent(content.map(p => p.id === postId ? { ...p, isPinned: !currentStatus } : p));
        } catch (error) {
            console.error("Error pinning post:", error);
        }
    };

    const handleDeleteContent = async (itemId) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this item?")) return;
        try {
            await deleteDoc(doc(db, contentCategory, itemId));
            setContent(content.filter(p => p.id !== itemId));
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    const handleSuspendUser = async (userId, currentStatus) => {
        if (currentStatus && !confirm("Unsuspend this user?")) return;
        if (!currentStatus && !confirm("Suspend this user? They will be logged out immediately.")) return;

        try {
            await updateDoc(doc(db, "users", userId), {
                isSuspended: !currentStatus
            });
            setUsers(users.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
        } catch (error) {
            console.error("Error suspending user:", error);
        }
    };

    const handleMigratePosts = async () => {
        if (!confirm("This will fix 'missing posts' in Feed (backfill isPinned). Continue?")) return;
        setLoading(true);
        try {
            const q = query(collection(db, "posts"));
            const snapshot = await getDocs(q);

            let count = 0;
            const batchPromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                if (data.isPinned === undefined) {
                    await updateDoc(doc(db, "posts", docSnap.id), { isPinned: false });
                    count++;
                }
            });

            await Promise.all(batchPromises);
            alert(`Fixed ${count} posts! Refresh the Feed now.`);
            fetchContent();
        } catch (error) {
            console.error("Migration error:", error);
            alert("Error fixing posts. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                    Admin Dashboard 🛡️
                </h1>

                <div className="flex gap-4 mt-4">
                    <button
                        onClick={() => setActiveTab("content")}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "content" ? "bg-red-600 text-white" : "bg-neutral-900 text-neutral-400"}`}
                    >
                        Manage Content
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "users" ? "bg-red-600 text-white" : "bg-neutral-900 text-neutral-400"}`}
                    >
                        Manage Users
                    </button>
                </div>

                {activeTab === "content" && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setContentCategory(cat.id)}
                                className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border ${contentCategory === cat.id ? "bg-red-900/30 text-red-400 border-red-500" : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700"}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                        {contentCategory === "posts" && (
                            <button
                                onClick={handleMigratePosts}
                                className="px-4 py-2 text-xs font-bold rounded-full bg-orange-600/20 text-orange-500 border border-orange-600/50 whitespace-nowrap"
                            >
                                Fix Feed
                            </button>
                        )}
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="mt-4 relative">
                        <HiSearch className="absolute left-3 top-3 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-red-500"
                        />
                    </div>
                )}
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div>
                    {activeTab === "content" && (
                        <div className="space-y-4">
                            {content.length === 0 ? (
                                <p className="text-center text-neutral-500 py-10">No items found in {contentCategory}.</p>
                            ) : (
                                content.map(item => (
                                    <div key={item.id} className="relative group">
                                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                                            {contentCategory === "posts" && (
                                                <button
                                                    onClick={() => handlePinPost(item.id, item.isPinned)}
                                                    className={`p-2 rounded-full shadow-lg transition-all ${item.isPinned ? "bg-green-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-green-400"}`}
                                                    title={item.isPinned ? "Unpin Post" : "Pin Post"}
                                                >
                                                    <HiStar size={20} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteContent(item.id)}
                                                className="p-2 bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-full shadow-lg transition-all"
                                                title="Delete Item"
                                            >
                                                <HiTrash size={20} />
                                            </button>
                                        </div>

                                        <div className={item.isPinned ? "border-2 border-green-500/50 rounded-xl" : ""}>
                                            {contentCategory === "posts" && <PostCard post={item} />}
                                            {contentCategory === "assignments" && <AssignmentCard assignment={item} />}
                                            {contentCategory === "roommate_posts" && <RoommateCard post={item} />}
                                            {contentCategory === "confessions" && <ConfessionCard post={item} />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="space-y-3">
                            {filteredUsers.length === 0 ? (
                                <p className="text-center text-neutral-500 py-10">No users found.</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <div key={user.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden">
                                                <img src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white">{user.name}</h3>
                                                    {user.isSuspended && <span className="text-[10px] bg-red-900/50 text-red-500 px-2 rounded">SUSPENDED</span>}
                                                </div>
                                                <p className="text-xs text-neutral-500">{user.email}</p>
                                                <p className="text-xs text-neutral-600">{user.branch} • {user.year}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSuspendUser(user.id, user.isSuspended)}
                                            className={`p-2 rounded-lg font-medium text-sm transition-colors ${user.isSuspended ? "bg-green-900/20 text-green-500 border border-green-900" : "bg-red-900/20 text-red-500 border border-red-900"}`}
                                        >
                                            {user.isSuspended ? "Unsuspend" : "Suspend"}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
