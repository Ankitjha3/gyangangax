import { formatDistanceToNow } from "date-fns";
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiTrash } from "react-icons/hi";
import { useState } from "react";

const emojis = ["❤️", "😂", "😮", "😢", "😡"];

const ConfessionCard = ({ post }) => {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleReaction = async (emoji) => {
        if (!user) return;
        const postRef = doc(db, "confessions", post.id);

        // Find if user has already reacted with any emoji
        const reactions = post.reactions || {};
        const currentEmoji = Object.keys(reactions).find(key =>
            reactions[key]?.includes(user.uid)
        );

        if (currentEmoji === emoji) {
            // User clicked the same emoji -> remove it (toggle off)
            await updateDoc(postRef, {
                [`reactions.${emoji}`]: arrayRemove(user.uid)
            });
        } else {
            // User clicked a different emoji OR hasn't reacted yet
            const updates = {
                [`reactions.${emoji}`]: arrayUnion(user.uid)
            };

            // If there was a previous reaction, remove it
            if (currentEmoji) {
                updates[`reactions.${currentEmoji}`] = arrayRemove(user.uid);
            }

            await updateDoc(postRef, updates);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this confession?")) return;
        try {
            await deleteDoc(doc(db, "confessions", post.id));
        } catch (error) {
            console.error("Error deleting confession:", error);
        }
    };

    return (
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border-l-4 border-l-purple-600 rounded-r-xl p-5 mb-4 shadow-lg">
            <p className="text-xs text-purple-400 font-bold tracking-widest uppercase mb-2">Anonymous Confession</p>

            <div className={`relative mb-4 ${!isExpanded ? 'max-h-[8.5em] overflow-hidden' : ''}`}>
                <p className={`text-white font-serif text-lg leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
                    "{post.text || ""}"
                </p>
                {!isExpanded && (post.text || "").length > 150 && (
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-neutral-900 to-transparent flex items-end">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-purple-400 hover:text-purple-300 font-bold text-sm bg-neutral-900 px-2 py-0.5 rounded"
                        >
                            Read More
                        </button>
                    </div>
                )}
            </div>
            {isExpanded && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-neutral-500 hover:text-neutral-400 text-xs font-medium mb-4 hover:underline"
                >
                    Show Less
                </button>
            )}

            <div className="flex justify-between items-end">
                <div className="flex gap-2">
                    {emojis.map(emoji => {
                        const count = post.reactions?.[emoji]?.length || 0;
                        const active = post.reactions?.[emoji]?.includes(user?.uid);
                        return (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all active:scale-90 ${active ? "bg-white/20 text-white" : "text-neutral-500 hover:bg-white/10"}`}
                            >
                                <span>{emoji}</span>
                                {count > 0 && <span>{count}</span>}
                            </button>
                        );
                    })}
                </div>
                <span className="text-[10px] text-neutral-500">
                    {post.timestamp?.seconds ? formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true }) : "Just now"}
                </span>

                {user?.uid === post.authorId && (
                    <button
                        onClick={handleDelete}
                        className="text-neutral-600 hover:text-red-500 ml-2"
                        title="Delete"
                    >
                        <HiTrash size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConfessionCard;
