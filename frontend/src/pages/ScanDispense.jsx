import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, RefreshCw, ShoppingBag, User, FileText, AlertTriangle, UserX, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { useLocation } from 'react-router-dom';

const ScanDispense = () => {
    const videoRef = useRef(null);
    const location = useLocation();
    const [step, setStep] = useState(1); // 1: Scan QR, 2: Face Auth, 3: Calculation, 4: Dispense
    const [scannedData, setScannedData] = useState(null);
    const [faceVerified, setFaceVerified] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [dispensing, setDispensing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showReports, setShowReports] = useState(false);
    const [myReports, setMyReports] = useState([]);

    // Check for logged in user
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
    }, []);

    const fetchMyReports = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_URL}/reports?employee=${currentUser.email || currentUser.name}`); // Fallback if structure differs
            const data = await res.json();
            setMyReports(data);
            setShowReports(true);
        } catch (err) { console.error("Failed to fetch reports"); }
    };

    const handleRequestDeactivation = async () => {
        if (!currentUser) return;
        if (!confirm("Are you sure you want to request account deactivation? This sends a request to your manager.")) return;

        try {
            const res = await fetch(`${API_URL}/employees/request-disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUser.email })
            });

            if (res.ok) {
                alert("Deactivation request sent successfully! Your account status is now pending.");
            } else {
                const err = await res.json();
                alert(`Failed to send request: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Network error. Please try again.");
        }
    };

    // Mock Ration Card Data
    const MOCK_OR_DATA = {
        cardId: "RC-12345678",
        familyHead: "Ramesh Gupta",
        members: [
            { name: "Ramesh", type: "adult", age: 45 },
            { name: "Suresh", type: "child", age: 12 },
            { name: "Anita", type: "adult", age: 40 },
            { name: "Priya", type: "child", age: 10 }
        ]
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            console.error("Camera access denied:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    // MERN Backend URL
    const API_URL = 'http://localhost:5000/api';

    // Load Inventory from Backend
    const [inventory, setInventory] = useState({ total: 0, dispensed: 0 });

    useEffect(() => {
        const fetchInv = async () => {
            try {
                const res = await fetch(`${API_URL}/inventory`);
                const data = await res.json();
                setInventory(data);
            } catch (err) { console.error(err); }
        };
        fetchInv();
    }, [step]);

    const handleScanQR = async () => {
        // Simulate QR Code Scan
        const simulatedCardId = "RC-998877";

        try {
            const listRes = await fetch(`${API_URL}/beneficiaries`);
            const list = await listRes.json();

            if (list.length > 0) {
                // Just picking the first found user for demo
                const userDoc = list[0];
                const members = Array(userDoc.members).fill({ type: 'adult' }); // Simple mock members

                // CHECK ASSIGNMENT (Strict Employee Match)
                let assignmentWarning = null;
                // If user has a specific assigned employee, and it's not the current user
                if (userDoc.assignedEmployee && currentUser?.email && userDoc.assignedEmployee !== currentUser.email) {
                    assignmentWarning = `Assigned to ${userDoc.assignedEmployee.split('@')[0]} (${userDoc.assignedShop || 'Unknown Shop'})`;
                } else if (!userDoc.assignedEmployee && userDoc.assignedShop && currentUser?.shopLocation !== userDoc.assignedShop) {
                    // Fallback to location warning if no specific employee assigned
                    assignmentWarning = `Warning: Beneficiary belongs to ${userDoc.assignedShop}`;
                }

                setScannedData({
                    cardId: userDoc.card,
                    familyHead: userDoc.name,
                    members: members,
                    assignedTo: userDoc.assignedShop,
                    assignmentWarning
                });
                setStep(2);
            } else {
                alert("No beneficiaries in Database! Please ask Manager to add one.");
            }
        } catch (err) {
            console.error(err);
            alert("Scan failed. Backend error.");
        }
    };

    const handleFaceAuth = () => {
        // Simulate Face Verification
        setTimeout(() => {
            setFaceVerified(true);
            setStep(3);
        }, 2000);
    };

    const calculateRation = () => {
        if (!scannedData) return { weight: 0, cost: 0 };
        let weight = 0;
        scannedData.members.forEach(m => {
            weight += m.type === 'adult' ? 300 : 100;
        });
        return { weight: weight / 1000, cost: 0 };
    };

    const { weight } = calculateRation();
    const remainingStock = inventory.total - inventory.dispensed;

    const handleDispense = async () => {
        if (weight > remainingStock) {
            alert(`Insufficient Stock! Required: ${weight}kg, Available: ${remainingStock.toFixed(2)}kg`);
            return;
        }

        setDispensing(true);

        try {
            // Call Backend API
            const res = await fetch(`${API_URL}/dispense`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: scannedData.cardId,
                    weight: weight,
                    specialRation: null, // Logic can be added for special rations
                    employeeEmail: currentUser?.email
                })
            });

            if (!res.ok) throw new Error("Dispense failed");

            // Simulate Hardware Delay
            setTimeout(() => {
                setDispensing(false);
                setStep(4);
            }, 3000);

        } catch (err) {
            console.error(err);
            alert("Dispense failed. Check connection.");
            setDispensing(false);
        }
    };

    const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);

    useEffect(() => {
        if (location.state?.action === 'add_beneficiary') {
            setShowAddBeneficiary(true);
            // Clear state so it doesn't reopen on refresh? (Optional, requires navigation replace)
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const [showMyRequests, setShowMyRequests] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [newBeneficiary, setNewBeneficiary] = useState({
        name: '',
        card: '',
        gender: 'Male',
        members: 1,
        familyMembers: [],
        assignedShop: currentUser?.shopLocation || ''
    });

    const fetchMyRequests = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_URL}/beneficiary-requests?email=${currentUser.email}`);
            const data = await res.json();
            setMyRequests(data);
            setShowMyRequests(true);
        } catch (err) { console.error("Failed to fetch requests"); }
    };

    const handleAddBeneficiarySubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const payload = {
                submittedBy: currentUser.email,
                data: {
                    ...newBeneficiary,
                    assignedShop: currentUser.shopLocation || 'Main Office'
                }
            };

            const res = await fetch(`${API_URL}/beneficiary-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                alert("Request Submitted Successfully!");
                setShowAddBeneficiary(false);
                setNewBeneficiary({ name: '', card: '', gender: 'Male', members: 1, familyMembers: [], assignedShop: '' });
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Submission failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-5xl flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Smart Ration Dispenser
                </h1>

                <div className="flex gap-2">
                    <button onClick={() => setShowAddBeneficiary(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm font-medium hover:bg-indigo-700 transition-colors">
                        <User size={18} /> Add New Beneficiary
                    </button>
                    <button onClick={handleRequestDeactivation} className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg shadow-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors">
                        <UserX size={18} /> Request Deactivation
                    </button>
                    <button onClick={() => { fetchMyReports(); fetchMyRequests(); }} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm font-medium text-slate-700 hover:text-indigo-600">
                        <FileText size={18} /> Reports & Requests
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
                {/* Left Column: Camera Feed */}
                <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[400px]">
                    {/* Camera Overlay UI */}
                    <div className="absolute inset-0 z-10 pointer-events-none border-[20px] border-white/10 rounded-3xl"></div>

                    {cameraActive ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-2xl transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="flex bg-slate-900 items-center justify-center w-full h-full text-slate-500 rounded-2xl">
                            <Camera size={48} className="mb-2" />
                            <p>Camera inactive</p>
                        </div>
                    )}

                    {/* Scan Overlay */}
                    {step === 1 && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 border-2 border-indigo-400 rounded-lg animate-pulse bg-indigo-500/10 backdrop-blur-sm relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -ml-1 -mt-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mr-1 -mt-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -ml-1 -mb-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mr-1 -mb-1"></div>
                                <div className="absolute top-1/2 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite]"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Steps & Control */}
                <div className="space-y-6">

                    {/* Status Cards */}
                    <div className="space-y-4">
                        {/* Step 1: User Info */}
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: step >= 2 ? 1 : 0.5, scale: step === 2 ? 1.02 : 1 }}
                            className={`bg-white p-6 rounded-2xl shadow-sm border ${step === 2 ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${scannedData ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {scannedData ? <CheckCircle size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Identity Verification</h3>
                                    <p className="text-sm text-slate-500">{scannedData ? `Card: ${scannedData.cardId} (${scannedData.familyHead})` : "Waiting for QR Scan..."}</p>
                                    {scannedData?.assignmentWarning && (
                                        <div className="flex items-center gap-1 text-xs text-orange-600 font-bold mt-1 bg-orange-50 px-2 py-1 rounded-md">
                                            <AlertTriangle size={12} /> {scannedData.assignmentWarning}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Biometric */}
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: step >= 3 ? 1 : 0.5, scale: step === 3 ? 1.02 : 1 }}
                            className={`bg-white p-6 rounded-2xl shadow-sm border ${step === 3 ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-100'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${faceVerified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {faceVerified ? <CheckCircle size={24} /> : <User size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Biometric Auth</h3>
                                    <p className="text-sm text-slate-500">{faceVerified ? "Face Verified Successfully" : "Pending Verification"}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: Calculation */}
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: step >= 3 ? 1 : 0.5 }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">Total Allocation</h3>
                                <ShoppingBag size={24} className="text-white/80" />
                            </div>
                            <div className="text-4xl font-bold mb-1">{scannedData ? weight : '0.0'} kg</div>
                            <p className="text-sm text-indigo-100">
                                {scannedData ? `${scannedData.members.length} Members (${scannedData.members.filter(m => m.type === 'adult').length} Adults, ${scannedData.members.filter(m => m.type === 'child').length} Children)` : 'No data'}
                            </p>
                        </motion.div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4">
                        {step === 1 && (
                            <button
                                onClick={handleScanQR}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                            >
                                Simulate QR Scan
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={handleFaceAuth}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
                            >
                                Verify Face
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                onClick={handleDispense}
                                disabled={dispensing}
                                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${dispensing ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 active:scale-95'
                                    }`}
                            >
                                {dispensing ? (
                                    <>
                                        <RefreshCw className="animate-spin" /> Dispensing...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag /> Dispense Ration
                                    </>
                                )}
                            </button>
                        )}

                        {step === 4 && (
                            <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center font-medium border border-green-200">
                                Dispensing Complete! Please collect your ration.
                                <button onClick={() => { setStep(1); setScannedData(null); setFaceVerified(false) }} className="block w-full mt-2 text-sm text-green-700 underline">
                                    Process New User
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>


            {/* MY REPORTS MODAL (Now includes Requests) */}
            {
                showReports && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">My Dispense History</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => { setShowReports(false); setShowMyRequests(true); }} className="text-indigo-600 text-sm font-medium">View My Requests</button>
                                    <button onClick={() => setShowReports(false)}><XCircle size={24} /></button>
                                </div>
                            </div>
                            <table className="w-full text-left bg-slate-50 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Beneficiary</th>
                                        <th className="p-3">Items</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {myReports.map(rep => (
                                        <tr key={rep._id}>
                                            <td className="p-3 text-sm">{new Date(rep.date).toLocaleDateString()}</td>
                                            <td className="p-3 font-medium">{rep.beneficiaryName}</td>
                                            <td className="p-3 text-sm">Rice: {rep.items?.rice}, Sugar: {rep.items?.sugar}</td>
                                        </tr>
                                    ))}
                                    {myReports.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-slate-400">No records found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* MY REQUESTS MODAL */}
            {
                showMyRequests && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">My Beneficiary Requests</h3>
                                <button onClick={() => setShowMyRequests(false)}><XCircle size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                {myRequests.map(req => (
                                    <div key={req._id} className="p-4 bg-slate-50 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold">{req.data?.name}</h4>
                                                <p className="text-sm text-slate-500">Card: {req.data?.card}</p>
                                                <p className="text-xs text-slate-400">Submitted: {new Date(req.submissionDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium
                                                ${req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        req.status === 'ChangesRequested' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {req.status}
                                            </div>
                                        </div>
                                        {req.adminComments && (
                                            <div className="mt-2 text-sm bg-yellow-50 p-2 rounded text-yellow-800 border-l-2 border-yellow-400">
                                                <strong>Admin Note:</strong> {req.adminComments}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {myRequests.length === 0 && <p className="text-center text-slate-400">No requests found</p>}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ADD BENEFICIARY MODAL */}
            {
                showAddBeneficiary && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Add Beneficiary Request</h3>
                                <button onClick={() => setShowAddBeneficiary(false)}><XCircle size={24} /></button>
                            </div>
                            <form onSubmit={handleAddBeneficiarySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name (Head of Family)</label>
                                    <input required type="text" className="w-full p-2 border rounded-lg"
                                        value={newBeneficiary.name} onChange={e => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ration Card ID</label>
                                        <input required type="text" className="w-full p-2 border rounded-lg"
                                            value={newBeneficiary.card} onChange={e => setNewBeneficiary({ ...newBeneficiary, card: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                        <select className="w-full p-2 border rounded-lg" value={newBeneficiary.gender} onChange={e => setNewBeneficiary({ ...newBeneficiary, gender: e.target.value })}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Members</label>
                                    <input required type="number" min="1" className="w-full p-2 border rounded-lg"
                                        value={newBeneficiary.members} onChange={e => setNewBeneficiary({ ...newBeneficiary, members: parseInt(e.target.value) })} />
                                </div>

                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 mt-4">
                                    Submit Request
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

        </div >
    );
};


export default ScanDispense;
