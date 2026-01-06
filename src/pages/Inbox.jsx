import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { HiArrowLeft, HiSearch, HiPlus } from "react-icons/hi";
import UserSearchModal from "../components/UserSearchModal";

const Inbox = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", user.uid),
            orderBy("lastMessageTimestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatPromises = snapshot.docs.map(async (chatDoc) => {
                const chatData = chatDoc.data();
                // Identify the other participant
                const otherUserId = chatData.participants.find(uid => uid !== user.uid);

                let otherUserData = { name: "Unknown User", photoUrl: null };
                if (otherUserId) {
                    const userSnap = await getDoc(doc(db, "users", otherUserId));
                    if (userSnap.exists()) {
                        otherUserData = userSnap.data();
                    }
                }

                return {
                    id: chatDoc.id,
                    ...chatData,
                    otherUser: otherUserData
                };
            });

            const resolvedChats = await Promise.all(chatPromises);
            setChats(resolvedChats);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    // Filter chats based on search query
    const filteredChats = chats.filter(chat =>
        chat.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex justify-center pt-20 text-neutral-500">Loading inbox...</div>;

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 rounded-full hover:bg-neutral-800 text-white">
                            <HiArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Messages
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="p-2 rounded-full hover:bg-neutral-800 text-blue-400"
                    >
                        <HiPlus size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </header>

            <div className="space-y-2">
                {filteredChats.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        {searchQuery ? <p>No chats found matching "{searchQuery}".</p> : (
                            <>
                                <p>No messages yet.</p>
                                <p className="text-xs mt-2">Tap the + to start a new chat.</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredChats.map(chat => {
                        const isUnread = chat.lastMessage && chat.lastMessageBy !== user.uid && (!chat.readBy || !chat.readBy.includes(user.uid));

                        // Override name/photo if defined in chatData (fallback) but usually otherUser is best
                        return (
                            <Link
                                key={chat.id}
                                to={`/chat/${chat.id}`}
                                className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all relative"
                            >
                                <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700">
                                    <img
                                        src={chat.otherUser.photoUrl || `https://ui-avatars.com/api/?name=${chat.otherUser.name}&background=random`}
                                        alt={chat.otherUser.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm truncate ${isUnread ? "font-bold text-white" : "font-medium text-neutral-300"}`}>
                                            {chat.otherUser.name}
                                        </h3>
                                        <span className={`text-[10px] shrink-0 ml-2 ${isUnread ? "text-blue-400 font-bold" : "text-neutral-500"}`}>
                                            {chat.lastMessageTimestamp?.seconds ? formatDistanceToNow(new Date(chat.lastMessageTimestamp.seconds * 1000), { addSuffix: true }) : ""}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate max-w-[85%] ${isUnread ? "text-white font-semibold" : "text-neutral-400"}`}>
                                            {chat.lastMessageBy === user.uid ? "You: " : ""}{chat.lastMessage}
                                        </p>
                                        {isUnread && (
                                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0"></span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            {showSearchModal && <UserSearchModal onClose={() => setShowSearchModal(false)} />}
        </div>
    );
};

export default Inbox;
