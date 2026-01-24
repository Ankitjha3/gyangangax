import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiPlus, HiLink, HiDownload, HiVideoCamera, HiDocumentText, HiTrash, HiChatAlt, HiChat } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";

const StudyLinks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState(null); // ID of link with open comments

    // Filters
    const [branchFilter, setBranchFilter] = useState("All");
    const [subjectFilter, setSubjectFilter] = useState("All");

    const branches = ["All", "CS/IT", "ECE", "ME", "CE", "MBA", "BBA", "Pharmacy", "BCom", "Law"];
    // Simplified subject list for MVP
    const subjects = ["All", "Study Links", "Promotion", "Services", "Other"];

    useEffect(() => {
        const q = query(collection(db, "study_links"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const filteredLinks = links.filter(link => {
        const b = branchFilter === "All" || link.branch === branchFilter;
        const s = subjectFilter === "All" || link.subject === subjectFilter;
        return b && s;
    });

    const handleContact = async (link) => {
        if (!user) return;
        if (user.uid === link.authorId) return;

        try {
            const participantIds = [user.uid, link.authorId].sort();
            const chatId = `${participantIds[0]}_${participantIds[1]}`;
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                await setDoc(chatRef, {
                    participants: participantIds,
                    lastMessage: `Hi, checking about your study link: ${link.title}`,
                    lastMessageTimestamp: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            }
            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getInstagramEmbedUrl = (url) => {
        if (!url) return null;
        const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
        return match ? `https://www.instagram.com/p/${match[1]}/embed` : null;
    };

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen">
            <header className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">

                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                    Links
                </h1>
                <Link to={`/u/${user?.uid}`} className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700">
                    <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || "User"}&background=random`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </Link>
            </header>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
                <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm rounded-lg px-3 py-2 outline-none"
                >
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm rounded-lg px-3 py-2 outline-none"
                >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredLinks.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <p>No resources found.</p>
                    <p className="text-xs mt-2">Share a useful link to help others!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLinks.map(link => (
                        <div key={link.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition-colors relative group">
                            <div className="flex gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    {link.type === 'video' && <HiVideoCamera className="text-red-400" size={24} />}
                                    {link.type === 'pdf' && <HiDocumentText className="text-orange-400" size={24} />}
                                    {link.type === 'website' && <HiLink className="text-blue-400" size={24} />}
                                    {link.type === 'drive' && <HiDownload className="text-green-400" size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base truncate pr-8">{link.title}</h3>
                                    <p className="text-xs text-neutral-400 mb-2">{link.branch} • {link.subject}</p>
                                    <p className="text-sm text-neutral-300 mb-3 line-clamp-2">{link.description}</p>

                                    {/* YouTube Preview */}
                                    {/* YouTube Preview */}
                                    {getYouTubeId(link.url) && (
                                        <div className="mb-3 rounded-lg overflow-hidden relative w-full aspect-video bg-black">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute inset-0"
                                            ></iframe>
                                        </div>
                                    )}

                                    {/* Instagram Preview */}
                                    {getInstagramEmbedUrl(link.url) && (
                                        <div className="mb-3 rounded-lg overflow-hidden relative w-full aspect-[4/5] bg-black border border-neutral-800">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={getInstagramEmbedUrl(link.url)}
                                                title="Instagram post"
                                                frameBorder="0"
                                                scrolling="no"
                                                allowTransparency="true"
                                                className="absolute inset-0"
                                            ></iframe>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-full transition-colors"
                                            >
                                                Open Link
                                            </a>
                                            <button
                                                onClick={() => setActiveCommentId(activeCommentId === link.id ? null : link.id)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${activeCommentId === link.id ? "bg-green-600 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white"}`}
                                            >
                                                <HiChat /> Discuss ({Math.max(0, link.commentCount || 0)})
                                            </button>
                                            {user?.uid !== link.authorId && (
                                                <button
                                                    onClick={() => handleContact(link)}
                                                    className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                                >
                                                    <HiChatAlt /> Chat
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-neutral-500">
                                            Shared by {link.authorName}
                                        </div>
                                    </div>

                                    {activeCommentId === link.id && (
                                        <CommentSection linkId={link.id} />
                                    )}
                                </div>
                            </div>

                            {user?.uid === link.authorId && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.confirm("Delete this link?")) {
                                            deleteDoc(doc(db, "study_links", link.id));
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-2 text-neutral-500 hover:text-red-500 transition-colors bg-neutral-900/50 rounded-full"
                                    title="Delete Link"
                                >
                                    <HiTrash size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-500 transition-all active:scale-90 z-20"
            >
                <HiPlus size={28} />
            </button>

            {showModal && <SubmitLinkModal onClose={() => setShowModal(false)} branches={branches} subjects={subjects} />}
        </div>
    );
};

const SubmitLinkModal = ({ onClose, branches, subjects }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        type: "website",
        branch: "CS/IT",
        subject: "Study Links",
        description: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalUrl = formData.url;
            if (!/^https?:\/\//i.test(finalUrl)) {
                finalUrl = 'https://' + finalUrl;
            }

            await addDoc(collection(db, "study_links"), {
                ...formData,
                url: finalUrl,
                authorId: user.uid,
                authorName: user.displayName || "Student",
                timestamp: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-6 border border-neutral-800 animate-in slide-in-from-bottom-10">
                <h2 className="text-xl font-bold text-white mb-4">Share Resource</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        required
                        placeholder="Title (e.g. Java Notes Unit 1)"
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-green-500"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <input
                        required
                        placeholder="URL (Link)"
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-green-500"
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <select
                            className="bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="website">Website</option>
                            <option value="video">Video</option>
                            <option value="pdf">PDF</option>
                            <option value="drive">Drive Folder</option>
                        </select>
                        <select
                            className="bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none"
                            value={formData.branch}
                            onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        >
                            {branches.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <select
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    >
                        {subjects.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea
                        required
                        placeholder="Short description..."
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-green-500 h-24 resize-none"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-neutral-400 hover:bg-neutral-800">Cancel</button>
                        <button disabled={loading} type="submit" className="flex-1 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-500">
                            {loading ? "Sharing..." : "Share"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CommentSection = ({ linkId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "study_links", linkId, "comments"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [linkId]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);

        try {
            await addDoc(collection(db, "study_links", linkId, "comments"), {
                text: newComment,
                authorId: user.uid,
                authorName: user.displayName || "User",
                timestamp: serverTimestamp()
            });

            // Increment comment count on parent
            const linkRef = doc(db, "study_links", linkId);
            await updateDoc(linkRef, {
                commentCount: increment(1)
            });

            setNewComment("");
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await deleteDoc(doc(db, "study_links", linkId, "comments", commentId));

            // Decrement comment count
            const linkRef = doc(db, "study_links", linkId);
            await updateDoc(linkRef, {
                commentCount: increment(-1)
            });
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    return (
        <div className="mt-4 pt-3 border-t border-neutral-800 animate-in slide-in-from-top-2">
            <div className="max-h-60 overflow-y-auto mb-3 space-y-2 scrollbar-thin scrollbar-thumb-neutral-700">
                {comments.length === 0 && <p className="text-xs text-neutral-500 text-center py-2">No comments yet. Start the discussion!</p>}
                {comments.map(comment => (
                    <div key={comment.id} className="bg-neutral-950/50 p-2 rounded-lg border border-neutral-800/50 relative group">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-neutral-400">{comment.authorName}</span>
                            <span className="text-[10px] text-neutral-600">
                                {comment.timestamp ? new Date(comment.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-300 mt-1 pr-6">{comment.text}</p>

                        {user?.uid === comment.authorId && (
                            <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 transition-colors"
                            >
                                <HiTrash size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or say thanks..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
                />
                <button
                    disabled={loading || !newComment.trim()}
                    type="submit"
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default StudyLinks;
