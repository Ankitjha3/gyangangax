import { useState, useEffect } from "react";
import { HiX, HiSearch, HiUserCircle } from "react-icons/hi";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Link } from "react-router-dom";

const UserSearchModal = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);

    const [allUsers, setAllUsers] = useState([]);

    // Fetch all users once on mount for client-side search (MVP optimization)
    // For large scale, we'd use server-side search (Algolia/Typesense)
    useEffect(() => {
        const fetchUsers = async () => {
            const q = query(collection(db, "users"));
            const snapshot = await getDocs(q);
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!searchTerm.trim()) {
                setResults([]);
                return;
            }

            const lowerTerm = searchTerm.toLowerCase();
            const filtered = allUsers.filter(user =>
                user.name?.toLowerCase().includes(lowerTerm) ||
                user.username?.toLowerCase().includes(lowerTerm) ||
                user.email?.toLowerCase().includes(lowerTerm)
            );
            setResults(filtered.slice(0, 10)); // Limit to top 10
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, allUsers]);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-4 border border-neutral-800 shadow-2xl relative animate-in slide-in-from-bottom-5 duration-300">
                <div className="flex items-center gap-3 mb-4">
                    <HiSearch className="text-neutral-500 text-xl" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search for people..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none text-lg"
                    />
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400">
                        <HiX size={24} />
                    </button>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                    {results.map(user => (
                        <Link
                            key={user.id}
                            to={`/u/${user.id}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700">
                                <img
                                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{user.name}</h3>
                                <p className="text-xs text-neutral-500">
                                    {user.branch ? `${user.branch} • ` : ""}{user.year || "Student"}
                                </p>
                            </div>
                        </Link>
                    ))}
                    {searchTerm && results.length === 0 && (
                        <p className="text-center text-neutral-500 py-4 text-sm">No users found.</p>
                    )}
                    {!searchTerm && (
                        <p className="text-center text-neutral-600 py-4 text-xs">Type to search students...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSearchModal;
