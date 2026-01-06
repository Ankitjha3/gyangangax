import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const Layout = () => {
    return (
        <div className="bg-neutral-950 min-h-screen text-white pb-20">
            <div className="max-w-md mx-auto min-h-screen relative bg-neutral-950 shadow-2xl">
                <Outlet />
            </div>
            <BottomNav />
        </div>
    );
};

export default Layout;
