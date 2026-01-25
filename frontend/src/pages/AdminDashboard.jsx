import React, { useState, useEffect } from 'react';
import {
    Users, Package, TrendingUp, LogOut, Plus, X, Shield, FileText, Trash2, MapPin,
    ChevronDown, ChevronRight, UserX, CheckCircle, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('network'); // 'network' | 'requests' | 'inventory' | 'reports'

    // Data States
    const [employees, setEmployees] = useState([]);
    const [shops, setShops] = useState([]); // New Shop Data
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [inventory, setInventory] = useState({ total: 0, dispensed: 0 });
    const [reports, setReports] = useState([]);

    // Filter & Sort States
    const [sortOption, setSortOption] = useState('name'); // 'name' | 'count'
    const [reportFilter, setReportFilter] = useState(''); // Employee email filter
    const [expandedShops, setExpandedShops] = useState({}); // { "Chennai South": true }
    const [expandedBeneficiaries, setExpandedBeneficiaries] = useState({}); // { ben_id: true }

    // Modal States

    const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);

    // Form States

    const [newEmployee, setNewEmployee] = useState({ name: '', email: '', shopLocation: '', gender: 'Male' });

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchInventory();
        fetchEmployees();
        fetchShops();
        fetchBeneficiaries();
        if (activeTab === 'reports') fetchReports();
    }, [activeTab]);

    const fetchInventory = async () => {
        try {
            const res = await fetch(`${API_URL}/inventory`);
            const data = await res.json();
            setInventory(data);
        } catch (err) { }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_URL}/employees`);
            const data = await res.json();
            setEmployees(data);
        } catch (err) { }
    };

    const fetchShops = async () => {
        try {
            const res = await fetch(`${API_URL}/shops`);
            const data = await res.json();
            setShops(data);
        } catch (err) { }
    };

    const fetchBeneficiaries = async () => {
        try {
            const res = await fetch(`${API_URL}/beneficiaries`);
            const data = await res.json();
            setBeneficiaries(data);
        } catch (err) { }
    };

    const fetchReports = async () => {
        try {
            const query = reportFilter ? `?employee=${reportFilter}` : '';
            const res = await fetch(`${API_URL}/reports${query}`);
            const data = await res.json();
            setReports(data);
        } catch (err) { }
    };

    // --- Actions ---

    const handleApproveDisable = async (id) => {
        await fetch(`${API_URL}/employees/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'disabled' })
        });
        fetchEmployees();
    };

    const handleDenyDisable = async (id) => {
        await fetch(`${API_URL}/employees/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
        });
        fetchEmployees();
    };




    const handleDeleteBeneficiary = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this beneficiary?")) return;
        await fetch(`${API_URL}/beneficiaries/${id}`, { method: 'DELETE' });
        fetchBeneficiaries();
    };

    const handleDeleteEmployee = async (id) => {
        if (!confirm("Are you sure you want to delete this employee?")) return;
        await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        fetchEmployees();
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee)
            });
            setIsAddEmpModalOpen(false);
            setNewEmployee({ name: '', email: '', shopLocation: '', gender: 'Male' });
            fetchEmployees();
            alert(`Employee Added!`);
        } catch (err) { alert("Failed to add employee"); }
    };

    // --- Helpers ---



    const toggleShop = (location) => {
        setExpandedShops(prev => ({ ...prev, [location]: !prev[location] }));
    };

    const toggleBeneficiary = (id) => {
        setExpandedBeneficiaries(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const [expandedTehsils, setExpandedTehsils] = useState({});

    const toggleTehsil = (tehsil) => {
        setExpandedTehsils(prev => ({ ...prev, [tehsil]: !prev[tehsil] }));
    };

    // Group Data
    // Use Shops as the primary list, fall back to employee locations if not in shop list (optional)
    const rawShops = shops.length > 0 ? shops : [...new Set(employees.map(e => e.shopLocation).filter(Boolean))].map(loc => ({ name: loc, code: 'N/A', ownerName: 'Pending', address: loc, tehsil: 'Other' }));

    const shopsByTehsil = rawShops.reduce((acc, shop) => {
        const tehsil = shop.tehsil || 'Other Locations';
        if (!acc[tehsil]) acc[tehsil] = [];
        acc[tehsil].push(shop);
        return acc;
    }, {});

    // Sort Tehsils alphabetically
    const sortedTehsils = Object.keys(shopsByTehsil).sort();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Unchanged) */}
            <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
                <div className="mb-10">
                    <h1 className="text-xl font-bold">Smart PDS Manager</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <button onClick={() => setActiveTab('network')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'network' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <MapPin size={20} /> Shop Network
                    </button>
                    {/* ... other nav items ... */}
                </nav>
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mt-auto">
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">

                {/* --- NETWORK TAB (Tree View) --- */}
                {activeTab === 'network' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Shop Network (Coimbatore District)</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddEmpModalOpen(true)} className="bg-white border text-indigo-600 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                                    <Shield size={18} /> Add Employee
                                </button>
                            </div>
                        </div>



                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-xs font-mono text-yellow-800 break-all">
                            <strong>Detailed DEBUG INFO:</strong><br />
                            Shops Count: {shops.length}<br />
                            Beneficiaries Count: {beneficiaries.length}<br />
                            <strong>Active Assigned Shops (from Bens):</strong><br />
                            {Array.from(new Set(beneficiaries.map(b => b.assignedShop).filter(Boolean))).slice(0, 10).join(', ')} ... (Total: {new Set(beneficiaries.map(b => b.assignedShop).filter(Boolean)).size})<br />
                        </div>
                        <div className="space-y-4">
                            {sortedTehsils.map(tehsil => {
                                const isTehsilExpanded = expandedTehsils[tehsil];
                                const count = shopsByTehsil[tehsil].length;

                                return (
                                    <div key={tehsil} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        {/* Tehsil Header */}
                                        <div
                                            className="bg-slate-100 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
                                            onClick={() => toggleTehsil(tehsil)}
                                        >
                                            <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                                                {isTehsilExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                {tehsil}
                                                <span className="bg-slate-300 text-slate-600 text-xs px-2 py-0.5 rounded-full">{count} Shops</span>
                                            </h3>
                                        </div>

                                        {/* Shops List within Tehsil */}
                                        {isTehsilExpanded && (
                                            <div className="p-4 space-y-4 border-t border-slate-200">
                                                {shopsByTehsil[tehsil].map(shop => {
                                                    // ... existing shop render logic ...
                                                    const locationName = shop.name || shop;
                                                    const shopIdentifier = shop._id || shop.code || locationName;
                                                    const shopEmployee = employees.find(e => (e.shopLocation?.trim().toLowerCase() === locationName?.trim().toLowerCase()) || (e.shopLocation === shop.tehsil));
                                                    const shopBeneficiaries = beneficiaries.filter(b => (b.assignedShop?.trim().toLowerCase() === locationName?.trim().toLowerCase()) || (b.assignedShop === shop.tehsil));
                                                    const isExpanded = expandedShops[locationName];

                                                    return (
                                                        <div key={shopIdentifier} className="border rounded-xl overflow-hidden">
                                                            {/* Shop Header */}
                                                            <div
                                                                className="bg-slate-50 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                                                                onClick={() => toggleShop(locationName)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                                                                    <div>
                                                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                                            <MapPin size={18} className="text-indigo-500" />
                                                                            {locationName}
                                                                            {shop.code && shop.code !== 'N/A' && <span className="text-xs font-mono bg-slate-200 px-1 rounded text-slate-600">{shop.code}</span>}
                                                                        </h3>
                                                                        {shop.address && <p className="text-xs text-slate-500 font-medium">{shop.address}</p>}
                                                                        <p className="text-xs text-slate-500 mt-1">
                                                                            {shop.ownerName && `Owner: ${shop.ownerName} • `}
                                                                            {shopBeneficiaries.length} Beneficiaries
                                                                            {shopEmployee ? ` • Managed by ${shopEmployee.name}` : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {shopEmployee && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${shopEmployee.status === 'active' ? 'bg-green-100 text-green-700' :
                                                                            shopEmployee.status === 'disabled' ? 'bg-slate-200 text-slate-500' :
                                                                                'bg-orange-100 text-orange-700'
                                                                            }`}>
                                                                            {shopEmployee.status}
                                                                        </span>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(shopEmployee._id); }} className="text-red-400 hover:text-red-700 p-1">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Shop Content (Employee & Beneficiaries) */}
                                                            {isExpanded && (
                                                                <div className="p-4 border-t bg-white pl-10">
                                                                    {/* Level 2: Employee Info */}
                                                                    {shopEmployee && (
                                                                        <div className="mb-6 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Shield size={16} /></div>
                                                                                <div>
                                                                                    <p className="font-bold text-sm text-indigo-900">{shopEmployee.name}</p>
                                                                                    <p className="text-xs text-indigo-600">{shopEmployee.email} • {shopEmployee.gender}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Level 3: Beneficiaries List */}
                                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">Registered Beneficiaries</h4>
                                                                    <div className="space-y-2">
                                                                        {shopBeneficiaries.map(ben => {
                                                                            const isBenExpanded = expandedBeneficiaries[ben._id];
                                                                            return (
                                                                                <div key={ben._id} className="border rounded-lg">
                                                                                    <div
                                                                                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                                                                        onClick={() => toggleBeneficiary(ben._id)}
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            {isBenExpanded ? <ChevronDown size={16} className="text-slate-300" /> : <ChevronRight size={16} className="text-slate-300" />}
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className="bg-slate-100 p-1.5 rounded-full"><Users size={14} className="text-slate-500" /></div>
                                                                                                <div>
                                                                                                    <p className="font-medium text-sm text-slate-800">{ben.name} ({ben.gender})</p>
                                                                                                    <p className="text-xs text-slate-500 font-mono">{ben.card} • {ben.familyMembers?.length || 0} Members</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <button onClick={(e) => handleDeleteBeneficiary(ben._id, e)} className="text-slate-300 hover:text-red-500">
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Level 4: Family Details */}
                                                                                    {isBenExpanded && (
                                                                                        <div className="bg-slate-50 p-3 border-t text-sm">
                                                                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                                                                <div>
                                                                                                    <p className="text-xs text-slate-400 uppercase">Address</p>
                                                                                                    <p className="text-slate-700">{ben.address}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <p className="text-xs text-slate-400 uppercase">Status</p>
                                                                                                    <span className={`text-xs font-bold ${ben.financialStatus === 'BPL' ? 'text-red-600' : 'text-blue-600'}`}>{ben.financialStatus}</span>
                                                                                                </div>
                                                                                            </div>

                                                                                            <p className="text-xs text-slate-400 uppercase mb-2">Family Members</p>
                                                                                            {ben.familyMembers && ben.familyMembers.length > 0 ? (
                                                                                                <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                                                                                                    {ben.familyMembers.map((m, i) => (
                                                                                                        <div key={i} className="flex justify-between text-slate-600">
                                                                                                            <span>{m.name}</span>
                                                                                                            <span className="text-slate-400 text-xs">{m.relation}, {m.age}y</span>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : <p className="text-slate-400 italic text-xs">No entries.</p>}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {shopBeneficiaries.length === 0 && (
                                                                            <div className="text-center p-4 text-slate-400 italic text-sm border border-dashed rounded-lg">No beneficiaries assigned to this shop.</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- REQUESTS TAB --- */}
                {/* ... (rest of tabs unchanged) ... */}
                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Pending Requests</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                        <th className="p-4">Employee</th>
                                        <th className="p-4">Shop</th>
                                        <th className="p-4">Request Type</th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employees.filter(e => e.status === 'pending_disable').map(emp => (
                                        <tr key={emp._id}>
                                            <td className="p-4 font-medium">{emp.name} <br /><span className="text-xs font-normal text-slate-500">{emp.email}</span></td>
                                            <td className="p-4 text-sm">{emp.shopLocation}</td>
                                            <td className="p-4"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Disable Account</span></td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleApproveDisable(emp._id)} className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm font-bold flex items-center gap-1"><CheckCircle size={14} /> Approve</button>
                                                <button onClick={() => handleDenyDisable(emp._id)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm font-bold flex items-center gap-1"><XCircle size={14} /> Deny</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.filter(e => e.status === 'pending_disable').length === 0 && (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">No pending requests</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- REPORTS TAB --- */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Transaction Reports</h2>
                            <select
                                className="px-4 py-2 border rounded-lg"
                                value={reportFilter}
                                onChange={(e) => setReportFilter(e.target.value)}
                            >
                                <option value="">All Employees</option>
                                {employees.map(e => <option key={e._id} value={e.email}>{e.name} ({e.email})</option>)}
                            </select>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium">Beneficiary</th>
                                        <th className="p-4 font-medium">Employee</th>
                                        <th className="p-4 font-medium">Items</th>
                                        <th className="p-4 font-medium">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reports.map(rep => (
                                        <tr key={rep._id} className="hover:bg-slate-50">
                                            <td className="p-4 text-slate-600 text-sm">{new Date(rep.date).toLocaleString()}</td>
                                            <td className="p-4 font-medium text-slate-900">
                                                {rep.beneficiaryName}
                                                <div className="text-xs text-slate-400">{rep.cardId}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 text-sm">{rep.employeeEmail}</td>
                                            <td className="p-4 text-sm">
                                                Rice: {rep.items?.rice}, Sugar: {rep.items?.sugar}
                                                {rep.items?.special && <div className="text-purple-600 text-xs font-bold mt-1">Bonus: {rep.items.special}</div>}
                                            </td>
                                            <td className="p-4 text-slate-600 text-sm">{rep.location}</td>
                                        </tr>
                                    ))}
                                    {reports.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-400">No transactions found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Inventory Monitoring</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <p className="text-slate-500 mb-2">Total Storage</p>
                                <div className="text-3xl font-bold text-slate-900">{inventory.total} Kg</div>
                                <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                                    <div className="bg-indigo-500 h-full w-full"></div>
                                </div>
                                <button onClick={() => handleAddStock(500)} className="mt-4 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                                    + Add 500 Kg Stock
                                </button>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <p className="text-slate-500 mb-2">Dispensed</p>
                                <div className="text-3xl font-bold text-purple-600">{inventory.dispensed?.toFixed(2) || 0} Kg</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <p className="text-slate-500 mb-2">Remaining</p>
                                <div className="text-3xl font-bold text-emerald-600">{(inventory.total - inventory.dispensed).toFixed(2)} Kg</div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* --- MODALS (Reused) --- */}



            {isAddEmpModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Add Employee</h3>
                            <button onClick={() => setIsAddEmpModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateEmployee} className="space-y-4">
                            <input required placeholder="Employee Name" className="w-full p-2 border rounded-lg" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                            <select className="w-full p-2 border rounded-lg" value={newEmployee.gender} onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <input required type="email" placeholder="Email Address" className="w-full p-2 border rounded-lg" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
                            <input required placeholder="Shop Location (e.g. Chennai South)" className="w-full p-2 border rounded-lg" value={newEmployee.shopLocation} onChange={e => setNewEmployee({ ...newEmployee, shopLocation: e.target.value })} />
                            <p className="text-xs text-slate-500">Default password will be: <strong>(name before @) + pds@123</strong></p>
                            <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">Create Employee</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
