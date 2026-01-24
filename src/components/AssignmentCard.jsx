import { HiDocumentText, HiChatAlt, HiTrash, HiCurrencyRupee } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import CommentSection from "./CommentSection";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence } from "framer-motion";
import { deleteDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const AssignmentCard = ({ assignment }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showComments, setShowComments] = useState(false);

    const handleMessage = async () => {
        if (!user) return;
        try {
            const participantIds = [user.uid, assignment.authorId].sort();
            const chatId = `${participantIds[0]}_${participantIds[1]}`;
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                await setDoc(chatRef, {
                    participants: participantIds,
                    lastMessage: "",
                    lastMessageTimestamp: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            }
            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Could not start chat.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this assignment?")) return;
        try {
            await deleteDoc(doc(db, "assignments", assignment.id));
        } catch (error) {
            console.error("Error deleting assignment:", error);
        }
    };
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 bg-blue-900/20 text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                        <HiDocumentText size={20} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{assignment.title}</h3>
                        <p className="text-xs text-neutral-400 truncate">
                            {assignment.subject} • {assignment.branch} • {assignment.year}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                            By <Link to={`/u/${assignment.authorId}`} className="hover:text-blue-400 hover:underline">{assignment.authorName}</Link> • {assignment.timestamp?.seconds ? formatDistanceToNow(new Date(assignment.timestamp.seconds * 1000), { addSuffix: true }) : "Just now"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center text-green-400 font-bold text-sm">
                        <HiCurrencyRupee size={16} />
                        <span>{assignment.price || "Free"}</span>
                    </div>
                    {assignment.whatsapp && (
                        <a
                            href={`https://wa.me/${assignment.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in your assignment: ${assignment.title}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-500 transition-colors"
                            title="Chat on WhatsApp"
                        >
                            <FaWhatsapp size={16} />
                        </a>
                    )}
                    {user?.uid !== assignment.authorId && (
                        <button
                            onClick={handleMessage}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
                            title="Message internally"
                        >
                            <HiChatAlt size={16} />
                        </button>
                    )}
                </div>
            </div>

            {assignment.caption && (
                <p className="text-sm text-neutral-300 mb-3 bg-neutral-950/50 p-2 rounded-lg break-words">
                    {assignment.caption}
                </p>
            )}

            <button
                onClick={() => setShowComments(!showComments)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
                <HiChatAlt size={14} />
                {showComments ? "Hide Replies" : `Reply/Discuss (${assignment.commentCount || 0})`}
            </button>

            {user?.uid === assignment.authorId && (
                <button
                    onClick={handleDelete}
                    className="text-xs text-neutral-600 hover:text-red-400 flex items-center gap-1 ml-auto"
                >
                    <HiTrash size={14} />
                    Delete
                </button>
            )}

            <AnimatePresence>
                {showComments && <CommentSection collectionName="assignments" postId={assignment.id} />}
            </AnimatePresence>
        </div>
    );
};

export default AssignmentCard;
