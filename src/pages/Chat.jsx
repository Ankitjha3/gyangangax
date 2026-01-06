import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiArrowLeft, HiPaperAirplane } from "react-icons/hi";

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
                lastMessageTimestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    if (loading) return <div className="flex justify-center pt-20 text-neutral-500">Loading chat...</div>;

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 bg-neutral-900 border-b border-neutral-800">
                <Link to="/chats" className="p-2 rounded-full hover:bg-neutral-800 text-white">
                    <HiArrowLeft size={20} />
                </Link>
                {otherUser && (
                    <Link to={`/u/${otherUser.id}`} className="flex items-center gap-3 flex-1 hover:bg-neutral-800/50 p-1 rounded-lg transition-colors">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
                            <img
                                src={otherUser.photoUrl || `https://ui-avatars.com/api/?name=${otherUser.name}&background=random`}
                                alt={otherUser.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm">{otherUser.name}</h2>
                            <p className="text-[10px] text-green-500 font-medium">Online</p>
                        </div>
                    </Link>
                )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-neutral-600">
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs">Say hi! 👋</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-neutral-800 text-neutral-200 rounded-bl-none"
                                    }`}
                            >
                                <p className="break-words">{msg.text}</p>
                                <p className={`text-[9px] mt-1 text-right ${isMe ? "text-blue-200" : "text-neutral-500"}`}>
                                    {msg.timestamp?.seconds
                                        ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : "..."}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <HiPaperAirplane className="rotate-90 ml-0.5" size={20} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
