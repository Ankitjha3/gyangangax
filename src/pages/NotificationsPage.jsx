import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { HiArrowLeft, HiHeart, HiChat, HiUserAdd } from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Extract unique sender IDs
            const senderIds = [...new Set(notifs.map(n => n.senderId).filter(Boolean))];

            // Fetch latest user data for senders
            // Note: In production, consider caching or batching this differently
            const newUsersMap = {};
            await Promise.all(senderIds.map(async (uid) => {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                    newUsersMap[uid] = userSnap.data();
                }
            }));

            setUsersMap(prev => ({ ...prev, ...newUsersMap }));
            setNotifications(notifs);
            setLoading(false);

            // Mark unread notifications as read
            const unreadNotifs = notifs.filter(n => !n.isRead);
            if (unreadNotifs.length > 0) {
                const batch = writeBatch(db);
                unreadNotifs.forEach(n => {
                    const ref = doc(db, "users", user.uid, "notifications", n.id);
                    batch.update(ref, { isRead: true });
                });
                batch.commit().catch(err => console.error("Error marking read:", err));
            }
        });

        return unsubscribe;
    }, [user]);

    const getIcon = (type) => {
        switch (type) {
            case "like": return <HiHeart className="text-red-500" size={20} />;
            case "comment": return <HiChat className="text-blue-500" size={20} />;
            case "follow": return <HiUserAdd className="text-green-500" size={20} />;
            default: return <HiHeart className="text-neutral-500" size={20} />;
        }
    };

    const getLink = (notif) => {
        if (notif.type === "follow") return `/u/${notif.senderId}`;
        if (notif.postId) return `/post/${notif.postId}`; // Assuming a post detail page exists or feed anchor
        // For MVP, if no post detail page, maybe just profile or do nothing
        return "#";
    };

    if (loading) return <div className="flex justify-center pt-20 text-neutral-500">Loading notifications...</div>;

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <Link to="/" className="p-2 rounded-full hover:bg-neutral-800 text-white">
                    <HiArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Notifications
                </h1>
            </header>

            <div className="space-y-2">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    notifications.map(notif => {
                        const sender = usersMap[notif.senderId] || { name: notif.senderName, photoUrl: notif.senderPhoto };
                        return (
                            <Link
                                key={notif.id}
                                to={getLink(notif)}
                                className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700 relative">
                                    <img
                                        src={sender.photoUrl || `https://ui-avatars.com/api/?name=${sender.name}&background=random`}
                                        alt={sender.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${sender.name || "User"}&background=random`;
                                        }}
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-1 border border-neutral-800">
                                        {getIcon(notif.type)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white">
                                        <span className="font-bold">{sender.name || "User"}</span>{" "}
                                        <span className="text-neutral-400">
                                            {notif.type === "like" && "liked your post."}
                                            {notif.type === "comment" && "commented on your post."}
                                            {notif.type === "follow" && "started following you."}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-neutral-500 mt-1">
                                        {notif.timestamp?.seconds ? formatDistanceToNow(new Date(notif.timestamp.seconds * 1000), { addSuffix: true }) : "Just now"}
                                    </p>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
