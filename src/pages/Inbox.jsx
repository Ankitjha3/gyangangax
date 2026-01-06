import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { HiArrowLeft } from "react-icons/hi";

const Inbox = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="flex justify-center pt-20 text-neutral-500">Loading inbox...</div>;

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <Link to="/" className="p-2 rounded-full hover:bg-neutral-800 text-white">
                    <HiArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Messages
                </h1>
            </header>

            <div className="space-y-2">
                {chats.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        <p>No messages yet.</p>
                        <p className="text-xs mt-2">Visit a profile to start chatting.</p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <Link
                            key={chat.id}
                            to={`/chat/${chat.id}`}
                            className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
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
                                    <h3 className="font-bold text-white text-sm truncate">{chat.otherUser.name}</h3>
                                    <span className="text-[10px] text-neutral-500 shrink-0 ml-2">
                                        {chat.lastMessageTimestamp?.seconds ? formatDistanceToNow(new Date(chat.lastMessageTimestamp.seconds * 1000), { addSuffix: true }) : ""}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 truncate">
                                    {chat.lastMessageBy === user.uid ? "You: " : ""}{chat.lastMessage}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default Inbox;
