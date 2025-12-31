import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import AssignmentCard from "../components/AssignmentCard";
import UploadAssignmentModal from "../components/UploadAssignmentModal";
import { HiPlus, HiFilter } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";

const Assignments = () => {
    const { userData } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [branchFilter, setBranchFilter] = useState("All");
    const [yearFilter, setYearFilter] = useState("All");

    const branches = ["All", "B.Tech", "MBA", "B.Com", "Pharmacy", "Law", "BBA"];
    const years = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];

    useEffect(() => {
        let q = query(collection(db, "assignments"), orderBy("timestamp", "desc"));

        // Client-side filtering is easier for multi-field without complex indexes for MVP, 
        // but Firestore `where` is better. Let's do client side for simplicity if dataset is small, 
        // or properly construct query. Firestore requires composite index for multiple where + orderBy.
        // For MVP, fetch all (or limit) and filter in UI is safer to avoid "Missing Index" errors immediately.
        // But let's try to filter by branch if possible.
        // Actually, let's just fetch recent ones and filter in client memory to keep it fast MVP.

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const filtered = docs.filter(doc => {
                const b = branchFilter === "All" || doc.branch === branchFilter;
                const y = yearFilter === "All" || doc.year === yearFilter;
                return b && y;
            });
            setAssignments(filtered);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching assignments:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, [branchFilter, yearFilter]);

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Assignments
                    </h1>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                        <HiPlus size={16} />
                        Upload
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none"
                    >
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <p>No assignments found.</p>
                    <p className="text-xs mt-2">Be a hero, help your juniors!</p>
                </div>
            ) : (
                assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} />)
            )}

            {showUploadModal && <UploadAssignmentModal onClose={() => setShowUploadModal(false)} />}
        </div>
    );
};

export default Assignments;
