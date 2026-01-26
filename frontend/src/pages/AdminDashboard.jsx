import React, { useState, useEffect, useMemo } from 'react';
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
    const [beneficiaryRequests, setBeneficiaryRequests] = useState([]); // New State

    // Filter & Sort States
    const [sortOption, setSortOption] = useState('name'); // 'name' | 'count'
    const [reportFilter, setReportFilter] = useState(''); // Employee email filter
    const [selectedShop, setSelectedShop] = useState(''); // Shop Filter
    const [txnSort, setTxnSort] = useState('date_desc'); // Transaction Sort
    const [networkSort, setNetworkSort] = useState('tehsil_az'); // Shop Network Sort
    const [authFilter, setAuthFilter] = useState(''); // Biometric / OTP
    const [itemFilter, setItemFilter] = useState(''); // Rice / Wheat
    const [isLoading, setIsLoading] = useState(false);

    const [expandedShops, setExpandedShops] = useState({}); // { "Chennai South": true }
    const [expandedBeneficiaries, setExpandedBeneficiaries] = useState({}); // { ben_id: true }

    // Modal States

    const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignModalShop, setAssignModalShop] = useState(null);
    const [assignEmployeeId, setAssignEmployeeId] = useState('');

    // Form States

    const [newEmployee, setNewEmployee] = useState({ name: '', email: '', shopLocation: '', gender: 'Male' });

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchInventory();
        fetchEmployees();
        fetchShops();
        fetchBeneficiaries();
        fetchBeneficiaryRequests();
        // Removed auto-fetch for reports
    }, [activeTab]);

    const handleApplyFilters = () => {
        fetchReports();
    };

    const fetchReports = async () => {
        setIsLoading(true); // Add loading state if needed, or just fetch
        try {
            let query = `?`;
            if (reportFilter) query += `employee=${reportFilter}&`;
            if (selectedShop) query += `shop=${encodeURIComponent(selectedShop)}&`;
            if (txnSort) query += `sort=${txnSort}&`;
            if (authFilter) query += `authMode=${authFilter}&`;
            if (itemFilter) query += `item=${itemFilter}`;

            const res = await fetch(`${API_URL}/reports${query}`);
            const data = await res.json();
            setReports(data);
            setCurrentPage(1); // Reset to page 1 on new filter
        } catch (err) {
            console.error("Failed to fetch reports");
        } finally {
            setIsLoading(false);
        }
    };

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

    const fetchBeneficiaryRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/beneficiary-requests?status=Pending`);
            const data = await res.json();
            setBeneficiaryRequests(data);
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

    const handleRequestAction = async (id, status, comments = "") => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return;
        try {
            const res = await fetch(`${API_URL}/beneficiary-requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminComments: comments })
            });
            if (res.ok) {
                fetchBeneficiaryRequests();
                fetchBeneficiaries(); // Refresh main list if approved
                alert(`Request ${status}`);
            } else {
                const data = await res.json();
                alert(`Error: ${data.error}`);
            }
        } catch (err) { console.error(err); }
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

    const handleOpenAssignModal = (shop, e) => {
        e.stopPropagation();
        setAssignModalShop(shop);
        setAssignEmployeeId('');
        setIsAssignModalOpen(true);
    };

    const handleAssignExisting = async () => {
        if (!assignEmployeeId) return alert("Select an employee");
        try {
            const shopName = assignModalShop.name;
            await fetch(`${API_URL}/employees/${assignEmployeeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopLocation: shopName })
            });
            setIsAssignModalOpen(false);
            fetchEmployees();
            alert(`Employee assigned to ${shopName}!`);
        } catch (err) {
            alert("Failed to assign.");
        }
    };

    const handleQuickCreate = async () => {
        const shop = assignModalShop;
        if (!confirm(`Create dealer for ${shop.name}?\nLogin: ${shop.code}\nPassword: ${shop.code}`)) return;

        try {
            await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${shop.name} Dealer`,
                    email: shop.code,
                    role: 'employee',
                    shopLocation: shop.name,
                    gender: 'Other',
                    password: shop.code
                })
            });
            setIsAssignModalOpen(false);
            fetchEmployees();
            alert(`Dealer Created!\nLogin: ${shop.code}\nPassword: ${shop.code}`);
        } catch (err) {
            alert("Failed to create dealer. Code might be duplicate.");
        }
    };

    const handleAddDealer = async (shop, e) => {
        e.stopPropagation();
        if (!confirm(`Create dealer for ${shop.name}?\nLogin: ${shop.code}\nPassword: ${shop.code}`)) return;

        try {
            await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${shop.name} Dealer`,
                    email: shop.code,
                    role: 'employee',
                    shopLocation: shop.name,
                    gender: 'Other',
                    password: shop.code
                })
            });
            fetchEmployees();
            alert(`Dealer Created!\nLogin: ${shop.code}\nPassword: ${shop.code}`);
        } catch (err) {
            alert("Failed to create dealer. Code might be duplicate.");
        }
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

    // Sort Tehsils sorting logic
    let sortedTehsils = Object.keys(shopsByTehsil);
    if (networkSort === 'tehsil_az') sortedTehsils.sort();
    if (networkSort === 'count_desc') sortedTehsils.sort((a, b) => shopsByTehsil[b].length - shopsByTehsil[a].length);

    // --- OPTIMIZATION: Memoize filtered beneficiaries by shop ---
    // Fixes O(N*M) lag when rendering 5000+ beneficiaries across 100+ shops
    const beneficiariesByShop = useMemo(() => {
        const lookup = {};
        beneficiaries.forEach(ben => {
            // Unify normalization
            const shopName = (ben.assignedShop || 'Unknown').trim();
            if (!lookup[shopName]) lookup[shopName] = [];
            lookup[shopName].push(ben);

            // Also map by tehsil if needed (fallback)
            // But relying on exact shop name match is better for performance
        });
        return lookup;
    }, [beneficiaries]);

    // --- PAGINATION STATES ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReports = reports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reports.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                    <button onClick={() => setActiveTab('reports')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <FileText size={20} /> Transactions
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <UserX size={20} /> Requests
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Package size={20} /> Inventory
                    </button>
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
                                <select
                                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                                    value={networkSort}
                                    onChange={(e) => setNetworkSort(e.target.value)}
                                >
                                    <option value="tehsil_az">Tehsil (A-Z)</option>
                                    <option value="count_desc">Most Shops First</option>
                                </select>
                                <button onClick={() => setIsAddEmpModalOpen(true)} className="bg-white border text-indigo-600 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                                    <Shield size={18} /> Add Employee
                                </button>
                            </div>
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

                                                    // OPTIMIZED LOOKUP
                                                    const shopBeneficiaries = beneficiariesByShop[locationName.trim()] || [];

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
                                                                <div className="flex items-center gap-2">

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
                                        )
                                        }
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

                        {/* BENEFICIARY REQUESTS SECTION */}
                        <h2 className="text-2xl font-bold text-slate-800 mt-8">Beneficiary Approvals</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                        <th className="p-4">Submitted By</th>
                                        <th className="p-4">Beneficiary Details</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {beneficiaryRequests.map(req => (
                                        <tr key={req._id}>
                                            <td className="p-4 font-medium text-sm">
                                                {req.submittedBy}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-slate-800">{req.data?.name} ({req.data?.gender})</p>
                                                <p className="text-xs text-slate-500">Card: {req.data?.card} • Members: {req.data?.members}</p>
                                                <p className="text-xs text-slate-500">Shop: {req.data?.assignedShop}</p>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {new Date(req.submissionDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleRequestAction(req._id, 'Approved')} className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm font-bold flex items-center gap-1"><CheckCircle size={14} /> Approve</button>
                                                <button onClick={() => {
                                                    const reason = prompt("Reason for rejection:");
                                                    if (reason) handleRequestAction(req._id, 'Rejected', reason);
                                                }} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm font-bold flex items-center gap-1"><XCircle size={14} /> Deny</button>
                                                <button onClick={() => {
                                                    const comment = prompt("What changes are needed?");
                                                    if (comment) handleRequestAction(req._id, 'ChangesRequested', comment);
                                                }} className="bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 text-sm font-bold flex items-center gap-1"><AlertTriangle size={14} /> Review</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {beneficiaryRequests.length === 0 && (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">No pending beneficiary requests</td></tr>
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
                            <h2 className="text-2xl font-bold text-slate-800">
                                Transaction Reports <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full ml-2">Count: {reports.length}</span>
                            </h2>
                            <div className="flex gap-2">
                                <select
                                    className="px-4 py-2 border rounded-lg"
                                    value={txnSort}
                                    onChange={(e) => setTxnSort(e.target.value)}
                                >
                                    <option value="date_desc">Newest First</option>
                                    <option value="date_asc">Oldest First</option>
                                    <option value="amount_desc">Highest Amount</option>
                                    <option value="amount_asc">Lowest Amount</option>
                                </select>
                                <select
                                    className="px-4 py-2 border rounded-lg"
                                    value={selectedShop}
                                    onChange={(e) => setSelectedShop(e.target.value)}
                                >
                                    <option value="">All Shops</option>
                                    {shops
                                        .slice()
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(shop => (
                                            <option key={shop._id} value={shop.name}>{shop.name}</option>
                                        ))
                                    }
                                </select>
                                <select
                                    className="px-4 py-2 border rounded-lg"
                                    value={reportFilter}
                                    onChange={(e) => setReportFilter(e.target.value)}
                                >
                                    <option value="">All Employees</option>
                                    {employees.map(e => <option key={e._id} value={e.email}>{e.name} ({e.email})</option>)}
                                </select>
                                <select
                                    className="px-4 py-2 border rounded-lg"
                                    value={authFilter}
                                    onChange={(e) => setAuthFilter(e.target.value)}
                                >
                                    <option value="">All Auth Modes</option>
                                    <option value="Biometric">Biometric</option>
                                    <option value="OTP">OTP</option>
                                </select>
                                <select
                                    className="px-4 py-2 border rounded-lg"
                                    value={itemFilter}
                                    onChange={(e) => setItemFilter(e.target.value)}
                                >
                                    <option value="">All Items</option>
                                    <option value="Rice">Rice</option>
                                    <option value="Wheat">Wheat</option>
                                    <option value="Sugar">Sugar</option>
                                    <option value="Kerosene">Kerosene</option>
                                </select>
                                <button
                                    onClick={handleApplyFilters}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                                >
                                    {isLoading ? 'Loading...' : 'Show Data'}
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-medium">Date / Time</th>
                                        <th className="p-4 font-medium">Txn Info / Beneficiary</th>
                                        <th className="p-4 font-medium">Items Purchased</th>
                                        <th className="p-4 font-medium">Amount / Auth</th>
                                        <th className="p-4 font-medium">Location / Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentReports.map(rep => (
                                        <tr key={rep._id} className="hover:bg-slate-50">
                                            <td className="p-4 text-slate-600 text-sm">
                                                <div className="font-bold text-slate-800">{new Date(rep.date).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-400">{new Date(rep.date).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-900">
                                                <div className="text-xs font-mono bg-slate-100 px-1 rounded inline-block text-slate-500 mb-1">{rep.txnId}</div>
                                                <div>{rep.beneficiaryName}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-700 space-y-1">
                                                    {Array.isArray(rep.items) ? rep.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between w-48 text-xs">
                                                            <span>{item.item} ({item.qty} {item.unit})</span>
                                                            {item.price > 0 && <span className="text-slate-400">₹{item.price * item.qty}</span>}
                                                        </div>
                                                    )) : <span className="text-red-400 text-xs">Invalid Data</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">₹{rep.totalAmount}</div>
                                                <div className={`text-xs inline-block px-2 py-0.5 rounded-full ${rep.authMode === 'Biometric' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {rep.authMode}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-600">{rep.location}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{rep.status}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {reports.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-400">No transactions found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {reports.length > 0 && (
                                <div className="p-4 flex justify-between items-center bg-slate-50 border-t">
                                    <div className="text-sm text-slate-500">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, reports.length)} of {reports.length} entries
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                // Show simplified page range
                                                let p = i + 1;
                                                if (currentPage > 3) p = currentPage - 2 + i;
                                                if (p > totalPages) return null;

                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => paginate(p)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === p ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {
                    activeTab === 'inventory' && (
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
                    )
                }

            </main >

            {/* --- MODALS (Reused) --- */}



            {
                isAddEmpModalOpen && (
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
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={newEmployee.shopLocation}
                                    onChange={e => setNewEmployee({ ...newEmployee, shopLocation: e.target.value })}
                                >
                                    <option value="">-- Select Shop Location --</option>
                                    <option value="Main Office">Main Office</option>
                                    {shops
                                        .slice()
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(shop => (
                                            <option key={shop._id} value={shop.name}>{shop.name}</option>
                                        ))
                                    }
                                </select>
                                <p className="text-xs text-slate-500">Default password will be: <strong>(name before @) + pds@123</strong></p>
                                <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">Create Employee</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                isAssignModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Assign Employee</h3>
                                <button onClick={() => setIsAssignModalOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Existing Employee</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full p-2 border rounded-lg"
                                            value={assignEmployeeId}
                                            onChange={(e) => setAssignEmployeeId(e.target.value)}
                                        >
                                            <option value="">-- Choose Employee --</option>
                                            {employees.map(e => (
                                                <option key={e._id} value={e._id}>
                                                    {e.name} ({e.shopLocation})
                                                </option>
                                            ))
                                            }
                                        </select>
                                        <button onClick={handleAssignExisting} className="bg-purple-600 text-white px-4 rounded-lg font-bold">Assign</button>
                                    </div>
                                </div>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">OR</span></div>
                                </div>

                                <button onClick={handleQuickCreate} className="w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 flex justify-center items-center gap-2">
                                    <Plus size={18} /> Create New ({assignModalShop?.code})
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
