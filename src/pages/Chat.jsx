import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, limit, getDocs, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiArrowLeft, HiPaperAirplane, HiTrash } from "react-icons/hi";
import { format } from "date-fns";

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

    useEffect(() => {
        if (!user || !chatId) return;

        // Fetch Chat Details to get Other User
        const fetchChatDetails = async () => {
            const chatSnap = await getDoc(doc(db, "chats", chatId));
            if (chatSnap.exists()) {
                const chatData = chatSnap.data();
                const otherUserId = chatData.participants.find(uid => uid !== user.uid);

                if (otherUserId) {
                    const userSnap = await getDoc(doc(db, "users", otherUserId));
                    if (userSnap.exists()) {
                        setOtherUser({ id: otherUserId, ...userSnap.data() });
                    }
                }

                // Mark as read by adding user to readBy array
                // Using updateDoc directly without waiting to prevent blocking UI
                updateDoc(doc(db, "chats", chatId), {
                    readBy: arrayUnion(user.uid)
                }).catch(err => console.error("Error marking chat read:", err));

            } else {
                navigate("/chats"); // Chat not found
            }
            setLoading(false);
        };
        fetchChatDetails();

        // Real-time Messages
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return unsubscribe;
    }, [chatId, user, navigate]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage.trim();
        setNewMessage(""); // Optimistic clear

        try {
            // Add message to subcollection
            await addDoc(collection(db, "chats", chatId, "messages"), {
                text,
                senderId: user.uid,
                timestamp: serverTimestamp()
            });

            // Update last message in parent chat doc
            await updateDoc(doc(db, "chats", chatId), {
                lastMessage: text,
                lastMessageBy: user.uid,
                lastMessageTimestamp: serverTimestamp(),
                readBy: [user.uid] // Reset readBy to only sender (unread for others)
            });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm("Unsend this message?")) return;
        try {
            await deleteDoc(doc(db, "chats", chatId, "messages", messageId));

            // Fetch the new last message to update the main chat document
            const lastMsgQuery = query(
                collection(db, "chats", chatId, "messages"),
                orderBy("timestamp", "desc"),
                limit(1)
            );

            const lastMsgSnap = await getDocs(lastMsgQuery);

            if (!lastMsgSnap.empty) {
                const newLastMsg = lastMsgSnap.docs[0].data();
                await updateDoc(doc(db, "chats", chatId), {
                    lastMessage: newLastMsg.text,
                    lastMessageBy: newLastMsg.senderId,
                    lastMessageTimestamp: newLastMsg.timestamp
                });
            } else {
                // If no messages left, clear the last message data
                await updateDoc(doc(db, "chats", chatId), {
                    lastMessage: "",
                    lastMessageBy: "",
                    lastMessageTimestamp: null
                });
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    if (loading) return <div className="flex justify-center pt-20 text-neutral-500">Loading chat...</div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-neutral-950 w-full max-w-md mx-auto shadow-2xl overflow-hidden">
            <header className="flex items-center gap-4 py-3 px-4 bg-neutral-900 border-b border-neutral-800 shrink-0">
                <Link to="/chats" className="text-neutral-400 hover:text-white">
                    <HiArrowLeft size={24} />
                </Link>
                {otherUser && (
                    <Link to={`/u/${otherUser?.id}`} className="flex items-center gap-3 flex-1">
                        <img
                            src={otherUser?.photoUrl || `https://ui-avatars.com/api/?name=${otherUser?.name || "User"}&background=random`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <h2 className="font-bold text-white leading-tight">
                                {otherUser?.name || "Chat"}
                            </h2>

                        </div>
                    </Link>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-neutral-600">
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs">Say hi! 👋</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div
                            key={msg.id}
                            className={`flex items-center gap-2 mb-1 ${isMe ? "justify-end" : "justify-start"} group`}
                        >
                            {isMe && (
                                <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-2 text-neutral-500 hover:text-red-500 transition-all z-10 bg-neutral-900/80 rounded-full"
                                    title="Unsend"
                                >
                                    <HiTrash size={14} />
                                </button>
                            )}

                            <div
                                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-neutral-800 text-neutral-200 rounded-bl-none"
                                    }`}
                            >
                                {msg.text}
                                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-200" : "text-neutral-500"}`}>
                                    {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), "HH:mm") : "..."}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-neutral-800 shrink-0">
                <div className="flex items-center gap-2 bg-neutral-950 rounded-full px-4 py-2 border border-neutral-800 focus-within:border-blue-500 transition-colors">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                    >
                        <HiPaperAirplane size={16} className="rotate-90" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
