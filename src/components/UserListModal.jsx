import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { HiX } from "react-icons/hi";
import { Link } from "react-router-dom";

const UserListModal = ({ userId, type, onClose, initialUserIds }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                let userIds = [];

                if (initialUserIds && initialUserIds.length > 0) {
                    userIds = initialUserIds;
                } else if (userId && type) {
                    // 1. Get the list of user IDs from the subcollection
                    const subCollRef = collection(db, "users", userId, type); // type is "followers" or "following"
                    const snapshot = await getDocs(subCollRef);
                    userIds = snapshot.docs.map(doc => doc.id);
                }

                if (userIds.length === 0) {
                    setUsers([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch user details for each ID
                // Note: In a real app with many users, we'd paginate or use a query 'in' batch (limit 10)
                // For MVP, parallel requests are okay for small lists
                const userPromises = userIds.map(uid => getDoc(doc(db, "users", uid)));
                const userSnaps = await Promise.all(userPromises);

                const userList = userSnaps
                    .filter(snap => snap.exists())
                    .map(snap => ({ id: snap.id, ...snap.data() }));

                setUsers(userList);
            } catch (error) {
                console.error("Error fetching user list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [userId, type, initialUserIds]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl relative animate-in fade-in zoom-in duration-200 h-[400px] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                >
                    <HiX size={20} />
                </button>

                <h2 className="text-lg font-bold text-white mb-4 capitalize">{type}</h2>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center text-neutral-500 py-10">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-neutral-500 py-10">No users found.</div>
                    ) : (
                        users.map(user => (
                            <Link
                                key={user.id}
                                to={`/u/${user.id}`}
                                onClick={onClose}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
                                    <img
                                        src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate">{user.name}</h4>
                                    <p className="text-xs text-neutral-500 truncate">{user.branch} • {user.year}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
