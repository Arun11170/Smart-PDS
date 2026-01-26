import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Users, Save, ArrowLeft, Plus, Trash2, Store } from 'lucide-react';

const AddBeneficiary = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const API_URL = 'http://localhost:5000/api';

    const [shops, setShops] = useState([]);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            setCurrentUser(parsedUser);
            // Default assigned shop to user's location
            setFormData(prev => ({ ...prev, assignedShop: parsedUser.shopLocation || '' }));
        } else {
            navigate('/');
        }
        fetchShops();
    }, [navigate]);

    const fetchShops = async () => {
        try {
            const res = await fetch(`${API_URL}/shops`);
            const data = await res.json();
            setShops(data);
        } catch (err) { console.error("Failed to fetch shops"); }
    };

    const [formData, setFormData] = useState({
        name: '',
        card: '',
        gender: 'Male',
        address: '',
        assignedShop: '', // New Field
        familyMembers: []
    });

    const handleAddMember = () => {
        setFormData({
            ...formData,
            familyMembers: [...formData.familyMembers, { name: '', age: '', gender: 'Male', relation: 'Child' }]
        });
    };

    const handleRemoveMember = (index) => {
        const updated = formData.familyMembers.filter((_, i) => i !== index);
        setFormData({ ...formData, familyMembers: updated });
    };

    const handleMemberChange = (index, field, value) => {
        const updated = [...formData.familyMembers];
        updated[index][field] = value;
        setFormData({ ...formData, familyMembers: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const payload = {
                submittedBy: currentUser.email,
                data: {
                    ...formData,
                    members: 1 + formData.familyMembers.length,
                    assignedShop: formData.assignedShop || currentUser.shopLocation || 'Main Office'
                }
            };

            const res = await fetch(`${API_URL}/beneficiary-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                alert("Request Submitted Successfully! Admin will review.");
                navigate('/home');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Submission failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/home')} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">New Beneficiary Request</h1>
                            <p className="text-pink-100 text-sm">Fill in details to request addition to database</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* Section 1: Head of Family */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <User className="text-pink-500" /> Head of Family Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                                <input required className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                    placeholder="e.g. Ramesh Gupta"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Ration Card Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input required className="w-full pl-10 p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                        placeholder="e.g. RC-123456"
                                        value={formData.card} onChange={e => setFormData({ ...formData, card: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
                                <select className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Address (Optional)</label>
                                <input className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                    placeholder="Village / Town"
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            {/* Shop Selection */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Assigned Ration Shop</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <select
                                        className="w-full pl-10 p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-pink-500 outline-none transition-all appearance-none"
                                        value={formData.assignedShop}
                                        onChange={e => setFormData({ ...formData, assignedShop: e.target.value })}
                                    >
                                        <option value="">-- Select Shop --</option>
                                        {shops.map(shop => (
                                            <option key={shop._id || shop.code} value={shop.name}>{shop.name} ({shop.address})</option>
                                        ))}
                                        {/* Fallback if user's shop isn't in list */}
                                        {currentUser?.shopLocation && !shops.find(s => s.name === currentUser.shopLocation) && (
                                            <option value={currentUser.shopLocation}>{currentUser.shopLocation} (My Shop)</option>
                                        )}
                                    </select>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Beneficiary will be linked to this shop.</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 2: Family Members */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-pink-500" /> Family Members
                            </h3>
                            <button type="button" onClick={handleAddMember} className="text-pink-600 font-bold text-sm bg-pink-50 px-4 py-2 rounded-lg hover:bg-pink-100 transition-colors flex items-center gap-2">
                                <Plus size={16} /> Add Member
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                            {formData.familyMembers.length === 0 && (
                                <p className="text-center text-slate-400 py-4">No family members added yet.</p>
                            )}
                            {formData.familyMembers.map((member, index) => (
                                <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => handleRemoveMember(index)} className="text-red-400 hover:text-red-600 p-1">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Member {index + 1}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <input placeholder="Member Name" required className="w-full p-2 border rounded-lg text-sm"
                                                value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} />
                                        </div>
                                        <div>
                                            <input placeholder="Age" required type="number" className="w-full p-2 border rounded-lg text-sm"
                                                value={member.age} onChange={e => handleMemberChange(index, 'age', e.target.value)} />
                                        </div>
                                        <div className="flex gap-2">
                                            <select className="w-1/2 p-2 border rounded-lg text-sm"
                                                value={member.gender} onChange={e => handleMemberChange(index, 'gender', e.target.value)}>
                                                <option>Male</option>
                                                <option>Female</option>
                                            </select>
                                            <select className="w-1/2 p-2 border rounded-lg text-sm"
                                                value={member.relation} onChange={e => handleMemberChange(index, 'relation', e.target.value)}>
                                                <option>Spouse</option>
                                                <option>Child</option>
                                                <option>Parent</option>
                                                <option>Sibling</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Stats & Submit */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-slate-400 text-sm">Total Members to Register</p>
                            <p className="text-3xl font-bold">{1 + formData.familyMembers.length} <span className="text-lg text-slate-600 font-normal">Person(s)</span></p>
                        </div>
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 rounded-xl font-bold shadow-lg shadow-rose-900/30 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                            <Save size={20} /> Submit Request
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddBeneficiary;
