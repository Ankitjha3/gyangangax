import { useState, useRef } from "react";
import { HiX, HiPhotograph, HiShieldCheck } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

const CreatePostModal = ({ onClose }) => {
    const { user, userData } = useAuth();
    const [text, setText] = useState("");
    const [image, setImage] = useState(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !image) return;
        setLoading(true);

        try {
            let imageUrl = "";
            if (image) {
                const imageRef = ref(storage, `feed/${Date.now()}_${image.name}`);
                const snapshot = await uploadBytes(imageRef, image);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, "posts"), {
                text,
                imageUrl,
                authorId: user.uid,
                authorName: userData.name,
                authorPhoto: userData.photoURL,
                isAnonymous,
                likes: [],
                isPinned: false, // Default for sorting
                timestamp: serverTimestamp(),
                college: userData.college // For security rules easier check
            });

            onClose();
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-4 border border-neutral-800 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
                    <HiX size={24} />
                </button>

                <h2 className="text-xl font-bold mb-4">Create Post</h2>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's happening on campus?"
                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-3 h-32 resize-none focus:outline-none focus:border-blue-500 mb-4"
                    />

                    {image && (
                        <div className="relative mb-4 rounded-lg overflow-hidden h-32 w-full">
                            <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setImage(null)}
                                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"
                            >
                                <HiX size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
                        >
                            <HiPhotograph size={20} />
                            Add Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                                if (e.target.files[0]) setImage(e.target.files[0]);
                            }}
                            className="hidden"
                            accept="image/*"
                        />

                        <button
                            type="button"
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-all ${isAnonymous ? 'bg-neutral-800 border-neutral-700 text-white' : 'border-transparent text-neutral-500 hover:bg-neutral-800'}`}
                        >
                            <HiShieldCheck size={18} />
                            {isAnonymous ? "Posting Anonymously" : "Public Post"}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!text.trim() && !image)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Posting..." : "Post"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
