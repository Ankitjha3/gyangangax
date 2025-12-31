import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const Layout = () => {
    return (
        <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto relative bg-neutral-950 w-full max-w-md md:max-w-2xl mx-auto shadow-2xl pb-20 no-scrollbar">
                <Outlet />
            </div>
            <BottomNav />
        </div>
    );
};

export default Layout;
