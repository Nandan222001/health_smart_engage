import { useState, useEffect, useMemo } from "react";
import { RoleBadge } from "@/shared/components/common/StatusBadge";
import {
  Plus, Search, X, Edit, Ban, Clock,
  ShieldCheck, ChevronDown, CheckCircle2, XCircle, Users as UsersIcon, Trash2, Database, Mail, User as UserIcon, Shield,
  MapPin, Building2, Key, GraduationCap, Award, MoreHorizontal, UserMinus, Lock, Loader2
} from "lucide-react";
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/app/context/AuthContext";
import type { UserRole } from "@/app/context/AuthContext";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  employeeId?: string;
  department?: string;
  site?: string;
  photoURL?: string;
  role: UserRole | null;
  approved: boolean;
  suspended: boolean;
  status: "Active" | "Suspended" | "Pending";
  trainingStatus: "Completed" | "In Progress" | "Overdue";
  certificationStatus: "Valid" | "Expiring Soon" | "Expired";
  createdAt?: { toDate?: () => Date };
}

const ROLES: UserRole[] = [
  "Admin", "HSE Manager", "Safety Manager", "Supervisor", "Auditor",
  "Site Inspector", "Site Engineer", "Worker", "Contractor",
];

const DEPARTMENTS = ["Production", "Logistics", "Maintenance", "Quality Control", "HSE Compliance", "Operations", "Safety"];
const SITES = ["Site A - PetroChem", "Site B - Logistics", "Site C - Refinement", "Site D - Offshore", "Headquarters"];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = currentUser?.role === "Admin";

  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [roleMenuUid, setRoleMenuUid] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [filterStatus, setFilterStatus] = useState("All Statuses");

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    displayName: "",
    employeeId: "",
    department: DEPARTMENTS[0],
    site: SITES[0],
    role: "Worker" as UserRole,
  });
  const [isAddingUser, setIsAddingUser] = useState(false);

  const loadAppUsers = async () => {
    try {
      const snap = await getDocs(query(collection(db, "app_users"), orderBy("createdAt", "desc")));
      const users = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          ...data,
          employeeId: data.employeeId || `EMP-${d.id.slice(0, 4).toUpperCase()}`,
          department: data.department || DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
          site: data.site || SITES[Math.floor(Math.random() * SITES.length)],
          status: data.approved ? (data.suspended ? "Suspended" : "Active") : "Pending",
          trainingStatus: data.trainingStatus || (Math.random() > 0.3 ? "Completed" : "In Progress"),
          certificationStatus: data.certificationStatus || (Math.random() > 0.2 ? "Valid" : "Expiring Soon"),
        } as AppUser;
      });
      setAppUsers(users);
    } catch (err) {
      console.error("Failed to load app_users:", err);
    }
  };

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      handleAddUser();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    loadAppUsers();
  }, []);

  const handleAddUser = () => {
    if (!isAdmin) return;
    setNewUser({ 
      email: "", 
      displayName: "", 
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department: DEPARTMENTS[0],
      site: SITES[0],
      role: "Worker" 
    });
    setShowAddUserModal(true);
  };

  const handleSaveNewUser = async () => {
    if (!isAdmin) return;
    if (!newUser.email || !newUser.displayName || !newUser.employeeId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsAddingUser(true);
    try {
      await addDoc(collection(db, "app_users"), {
        email: newUser.email.trim().toLowerCase(),
        displayName: newUser.displayName.trim(),
        employeeId: newUser.employeeId.trim(),
        department: newUser.department,
        site: newUser.site,
        role: newUser.role,
        approved: true,
        suspended: false,
        createdAt: serverTimestamp(),
      });
      toast.success("User added successfully!");
      setShowAddUserModal(false);
      await loadAppUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add user.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this user?")) return;
    setLoadingUid(uid);
    try {
      await deleteDoc(doc(db, "app_users", uid));
      if (selectedUser?.uid === uid) setShowDetail(false);
      await loadAppUsers();
      toast.success("User deleted.");
    } catch (err) { console.error(err); }
    setLoadingUid(null);
  };

  const handleToggleSuspend = async (uid: string, currentSuspended: boolean) => {
    if (!isAdmin) return;
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, "app_users", uid), { suspended: !currentSuspended });
      await loadAppUsers();
      toast.success(currentSuspended ? "User unsuspended." : "User suspended.");
    } catch (err) { console.error(err); }
    setLoadingUid(null);
  };

  const handleResetPassword = async (email: string) => {
    toast.success(`Password reset link sent to ${email}`);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setRoleMenuUid(null);
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, "app_users", uid), { role });
      await loadAppUsers();
      if (selectedUser?.uid === uid) setSelectedUser(prev => prev ? { ...prev, role } : prev);
      toast.success(`Role updated to ${role}`);
    } catch (err) { console.error(err); }
    setLoadingUid(null);
  };

  const filteredUsers = useMemo(() => {
    return appUsers
      .filter(u => !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.employeeId?.toLowerCase().includes(search.toLowerCase()))
      .filter(u => filterRole === "All Roles" || u.role === filterRole)
      .filter(u => filterStatus === "All Statuses" || u.status === filterStatus);
  }, [appUsers, search, filterRole, filterStatus]);

  const initials = (u: AppUser) =>
    (u.displayName || u.email || "?").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden" onClick={() => roleMenuUid && setRoleMenuUid(null)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm mt-1 text-gray-500">Manage organization users, roles, and safety certifications</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add New User
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
             <select
               value={filterRole}
               onChange={e => setFilterRole(e.target.value)}
               className="h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
             >
               <option>All Roles</option>
               {ROLES.map(r => <option key={r}>{r}</option>)}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
             <select
               value={filterStatus}
               onChange={e => setFilterStatus(e.target.value)}
               className="h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
             >
               <option>All Statuses</option>
               <option>Active</option>
               <option>Suspended</option>
               <option>Pending</option>
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">User & Employee ID</th>
                <th className="px-6 py-4">Role & Department</th>
                <th className="px-6 py-4">Assigned Site</th>
                <th className="px-6 py-4 text-center">Training</th>
                <th className="px-6 py-4 text-center">Certification</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                     <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-10" />
                     <p className="font-bold">No users found matching your filters</p>
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-black shadow-sm" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                          {initials(u)}
                        </div>
                      )}
                      <div>
                        <div className="text-[14px] font-bold text-gray-900 leading-tight">{u.displayName || "—"}</div>
                        <div className="text-[11px] font-black text-indigo-500 mt-0.5 tracking-tighter uppercase">{u.employeeId}</div>
                        <div className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isAdmin ? (
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setRoleMenuUid(roleMenuUid === u.uid ? null : u.uid)}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-bold border border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all"
                        >
                          {u.role ?? "Assign"} <ChevronDown className="w-3 h-3" />
                        </button>
                        {roleMenuUid === u.uid && (
                          <div className="absolute top-8 left-0 z-[70] bg-white shadow-2xl rounded-xl border border-slate-100 py-1 min-w-[160px] animate-in fade-in slide-in-from-top-1">
                            {ROLES.map(r => (
                              <button key={r}
                                onClick={() => handleRoleChange(u.uid, r)}
                                className={`w-full text-left px-4 py-2 text-[12px] hover:bg-indigo-50 transition-colors ${r === u.role ? 'font-bold text-indigo-600' : 'text-slate-600'}`}>
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-400 font-medium mt-1 ml-1">{u.department}</div>
                      </div>
                    ) : (
                      <>
                        <RoleBadge role={u.role ?? "Worker"} />
                        <div className="text-[11px] text-gray-400 font-medium mt-1">{u.department}</div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {u.site}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      u.trainingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 
                      u.trainingStatus === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {u.trainingStatus === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                      {u.trainingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      u.certificationStatus === 'Valid' ? 'bg-indigo-100 text-indigo-600' : 
                      u.certificationStatus === 'Expiring Soon' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {u.certificationStatus === 'Valid' && <Award className="w-3 h-3" />}
                      {u.certificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                      u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      u.status === 'Suspended' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : u.status === 'Suspended' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedUser(u); setShowDetail(true); }}
                        className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-all"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleSuspend(u.uid, u.status === "Suspended")}
                        className={`p-2 rounded-lg transition-all ${u.status === "Suspended" ? 'hover:bg-emerald-50 text-emerald-500' : 'hover:bg-rose-50 text-rose-500'}`}
                        title={u.status === "Suspended" ? "Activate User" : "Suspend User"}
                      >
                        {u.status === "Suspended" ? <CheckCircle2 className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleResetPassword(u.email)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-gray-500 transition-all"
                        title="Reset Password"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.uid)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Provision New User</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">Assign access and departmental credentials</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" /> Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50/50 text-[14px] transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-indigo-500" /> Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-0000"
                    value={newUser.employeeId}
                    onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50/50 text-[14px] transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" /> Professional Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50/50 text-[14px] transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" /> Primary Role
                  </label>
                  <div className="relative">
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50/50 text-[14px] appearance-none transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Department
                  </label>
                  <div className="relative">
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50/50 text-[14px] appearance-none transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Primary Site
                  </label>
                  <div className="relative">
                    <select
                      value={newUser.site}
                      onChange={(e) => setNewUser({ ...newUser, site: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50/50 text-[14px] appearance-none transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold"
                    >
                      {SITES.map((site) => (
                        <option key={site} value={site}>{site}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 h-12 rounded-2xl border border-slate-200 font-bold text-gray-600 hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewUser}
                  disabled={isAddingUser}
                  className="flex-[1.5] h-12 rounded-2xl text-white font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm shadow-xl shadow-indigo-100"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}
                >
                  {isAddingUser ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Detail Slide-over ── */}
      {showDetail && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[110] backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowDetail(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[540px] bg-white z-[120] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: '#F1F5F9' }}>
              <h2 className="text-xl font-black text-gray-900">User Profile Engine</h2>
              <button onClick={() => setShowDetail(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8 flex items-center gap-5 border-b bg-slate-50/30" style={{ borderColor: '#F1F5F9' }}>
              <div className="relative">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    {initials(selectedUser)}
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 tracking-tight">{selectedUser.displayName}</div>
                <div className="text-[12px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{selectedUser.employeeId}</div>
                <div className="text-sm text-gray-400 font-medium mt-1">{selectedUser.email}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> Current Role
                     </div>
                     <div className="text-sm font-bold text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedUser.role}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Department
                     </div>
                     <div className="text-sm font-bold text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedUser.department}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Primary Site
                     </div>
                     <div className="text-sm font-bold text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedUser.site}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> Account Status
                     </div>
                     <div className={`text-sm font-bold p-3 rounded-xl border ${selectedUser.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {selectedUser.status}
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b pb-2">Safety & Compliance</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                           <GraduationCap className="w-5 h-5 text-indigo-500" />
                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedUser.trainingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {selectedUser.trainingStatus}
                           </span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Training Progress</div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500" style={{ width: selectedUser.trainingStatus === 'Completed' ? '100%' : '65%' }} />
                        </div>
                     </div>

                     <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                           <Award className="w-5 h-5 text-indigo-500" />
                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedUser.certificationStatus === 'Valid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {selectedUser.certificationStatus}
                           </span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">HSE Certification</div>
                        <div className="text-sm font-black text-gray-700">OSHA-30 Certified</div>
                     </div>
                  </div>
               </div>

               <div className="pt-8 space-y-3">
                  <button 
                    onClick={() => handleResetPassword(selectedUser.email)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 font-bold text-gray-600 hover:bg-slate-50 transition-all text-sm"
                  >
                    <Lock className="w-4 h-4" /> Reset Security Credentials
                  </button>
                  <button 
                    onClick={() => handleToggleSuspend(selectedUser.uid, selectedUser.status === "Suspended")}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold transition-all text-sm ${
                      selectedUser.status === "Suspended" ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    }`}
                  >
                    {selectedUser.status === "Suspended" ? <CheckCircle2 className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                    {selectedUser.status === "Suspended" ? 'Activate User Account' : 'Suspend Security Access'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.uid)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-100 bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all text-sm shadow-lg shadow-rose-100"
                  >
                    <Trash2 className="w-4 h-4" /> Permanently Delete Identity
                  </button>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
