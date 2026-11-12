import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col md:flex-row">

      <AdminSidebar />

      <div className="flex-1 min-w-0">

        <AdminNavbar />

        <main className="p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>

      </div>

    </div>
  );
}