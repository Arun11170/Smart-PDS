const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-pds';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));



// Schemas
const BeneficiarySchema = new mongoose.Schema({
    name: String, // Head of Family
    gender: String, // Head Gender
    card: { type: String, unique: true },
    members: Number,
    status: { type: String, default: 'Active' },
    familyMembers: [{
        name: String,
        age: Number,
        gender: String, // New
        relation: String // Head, Spouse, Child
    }],
    assignedShop: String, // Links to Employee.shopLocation
    assignedEmployee: String, // Auto-Assigned Employee Email
    rationStatus: {
        month: String, // e.g. "2024-01"
        isReceived: { type: Boolean, default: false },
        receivedDate: Date
    },
    specialRations: [{
        name: String,
        date: Date,
        description: String
    }]
});

const EmployeeSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String, // In production, hash this!
    role: { type: String, default: 'employee' }, // 'manager' | 'employee'
    shopLocation: { type: String, default: 'Main Office' }, // New Field: Shop Location
    gender: { type: String, default: 'Other' }, // New Field: Gender
    status: { type: String, default: 'active', enum: ['active', 'pending_disable', 'disabled'] } // New Field: Account Status
});

const InventorySchema = new mongoose.Schema({
    type: { type: String, unique: true }, // 'daily_stock'
    total: Number,
    dispensed: Number
});

const TransactionSchema = new mongoose.Schema({
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    beneficiaryName: String,
    cardId: String,
    employeeEmail: String,
    items: Object, // { rice: 5, sugar: 5, special: ... }
    date: { type: Date, default: Date.now },
    location: String
});

const ShopSchema = new mongoose.Schema({
    code: { type: String, unique: true }, // e.g., 01AC001
    name: String,
    ownerName: String,
    address: String,
    tehsil: String,
    district: String,
    contactNumber: String
});

const Beneficiary = mongoose.model('Beneficiary', BeneficiarySchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Shop = mongoose.model('Shop', ShopSchema);

// Routes

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Case insensitive email check
        const user = await Employee.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.json({ success: true, user: { name: user.name, role: user.role } });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find({ role: 'employee' });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NEW: Get All Shops
app.get('/api/shops', async (req, res) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        // Generate default password: username + pds@123
        const emailLower = req.body.email.toLowerCase();
        const emailPrefix = emailLower.split('@')[0];
        const defaultPassword = `${emailPrefix}pds@123`;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        const newEmp = await Employee.create({
            name: req.body.name,
            email: emailLower,
            role: 'employee',
            shopLocation: req.body.shopLocation || 'Main Office',
            gender: req.body.gender || 'Other',
            password: hashedPassword
        });
        res.json(newEmp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees/request-disable', async (req, res) => {
    try {
        const { email } = req.body;
        await Employee.findOneAndUpdate({ email: email.toLowerCase() }, { status: 'pending_disable' });
        res.json({ success: true, message: "Disable Request Sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Employee.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Employee Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
    try {
        let inv = await Inventory.findOne({ type: 'daily_stock' });
        if (!inv) {
            inv = await Inventory.create({ type: 'daily_stock', total: 1000, dispensed: 0 });
        }
        res.json(inv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory/add', async (req, res) => {
    try {
        const { amount } = req.body;
        const inv = await Inventory.findOneAndUpdate(
            { type: 'daily_stock' },
            { $inc: { total: amount } },
            { new: true, upsert: true }
        );
        res.json(inv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BENEFICIARIES ---
app.get('/api/beneficiaries', async (req, res) => {
    try {
        const users = await Beneficiary.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.post('/api/beneficiaries/assign', async (req, res) => {
    try {
        const { employeeEmail, beneficiaryIds } = req.body;
        await Beneficiary.updateMany(
            { _id: { $in: beneficiaryIds } },
            { $set: { assignedEmployee: employeeEmail } }
        );
        res.json({ success: true, message: "Assigned successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/beneficiaries/:id', async (req, res) => {
    try {
        await Beneficiary.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Beneficiary Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Monthly Ration (Manager Only)
app.post('/api/ration/reset', async (req, res) => {
    try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await Beneficiary.updateMany({}, {
            $set: {
                "rationStatus.month": currentMonth,
                "rationStatus.isReceived": false,
                "rationStatus.receivedDate": null
            }
        });
        res.json({ success: true, message: `Ration reset for ${currentMonth}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/beneficiaries/card/:cardId', async (req, res) => {
    try {
        const user = await Beneficiary.findOne({ card: req.params.cardId });
        if (!user) return res.status(404).json({ error: "Card not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DISPENSE ---
app.post('/api/dispense', async (req, res) => {
    try {
        const { cardId, weight, specialRation } = req.body;

        // Update Inventory
        await Inventory.findOneAndUpdate(
            { type: 'daily_stock' },
            { $inc: { dispensed: weight } },
            { new: true }
        );

        // 2. Lookup Beneficiary (Needed for logging and updates)
        const user = await Beneficiary.findOne({ card: cardId });
        if (!user) return res.status(404).json({ error: "Beneficiary not found" });

        const update = {
            "rationStatus.isReceived": true,
            "rationStatus.receivedDate": new Date()
        };

        if (specialRation) {
            await Beneficiary.findOneAndUpdate(
                { card: cardId },
                {
                    $set: update,
                    $push: { specialRations: { name: specialRation, date: new Date(), description: "Bonus" } }
                }
            );
        } else {
            await Beneficiary.findOneAndUpdate(
                { card: cardId },
                { $set: update }
            );
        }

        // 3. Log Transaction
        await Transaction.create({
            beneficiaryId: user._id,
            beneficiaryName: user.name,
            cardId: user.card,
            employeeEmail: req.body.employeeEmail || "Unknown",
            items: { rice: 5, sugar: 5, special: specialRation || null },
            location: user.address || "Unknown Area"
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORTS ---
app.get('/api/reports', async (req, res) => {
    try {
        const { employee } = req.query;
        let query = {};
        if (employee) {
            query.employeeEmail = employee;
        }
        // distinct reports sort by date desc
        const reports = await Transaction.find(query).sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEEDING
const seedManager = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    const exists = await Employee.findOne({ role: 'manager' });
    if (exists) {
        // Update password to hashed version to ensure login works
        exists.password = hashedPassword;
        await exists.save();
        console.log("✅ Updated Manager Password (Hashed)");
    } else {
        await Employee.create({
            name: 'Supervisor',
            email: 'admin@pds.com',
            password: hashedPassword,
            role: 'manager'
        });
        console.log("✅ Seeded Manager: admin@pds.com");
    }
};

const seedBeneficiaries = async () => {
    const count = await Beneficiary.countDocuments();
    if (count === 0) {
        await Beneficiary.insertMany([
            { name: "Ramesh Gupta", card: "RC-1001", members: 4, status: "Active", familyMembers: [] },
            { name: "Sita Devi", card: "RC-1002", members: 3, status: "Active", familyMembers: [] },
            { name: "Abdul Khan", card: "RC-1003", members: 5, status: "Active", familyMembers: [] }
        ]);
        console.log("✅ Seeded 3 Dummy Beneficiaries");
    }
};


const seedShops = async () => {
    const count = await Shop.countDocuments();
    if (count === 0) {
        console.log("🌱 Seeding Coimbatore FPS Data...");

        // Real Coimbatore Tehsils & Realistic Locations
        const shops = [
            // --- COIMBATORE NORTH ---
            { code: "12CN001", name: "Ganapathy Co-op", ownerName: "K. Palanisamy", address: "12, Sathy Road, Ganapathy", tehsil: "Coimbatore North", district: "Coimbatore", contactNumber: "9842200001" },
            { code: "12CN002", name: "Saravanampatti FPS", ownerName: "M. Velusamy", address: "45, Thudiyalur Rd, Saravanampatti", tehsil: "Coimbatore North", district: "Coimbatore", contactNumber: "9842200002" },
            { code: "12CN003", name: "Peelamedu Society", ownerName: "R. Krishnan", address: "88, Avinashi Rd, Peelamedu", tehsil: "Coimbatore North", district: "Coimbatore", contactNumber: "9842200003" },
            { code: "12CN004", name: "Gandhipuram Market", ownerName: "S. Murugan", address: "10,  Cross Cut Rd, Gandhipuram", tehsil: "Coimbatore North", district: "Coimbatore", contactNumber: "9842200004" },

            // --- COIMBATORE SOUTH ---
            { code: "12CS001", name: "Ramanathapuram FPS", ownerName: "P. Selvaraj", address: "22, Trichy Rd, Ramanathapuram", tehsil: "Coimbatore South", district: "Coimbatore", contactNumber: "9842200005" },
            { code: "12CS002", name: "Singanallur Unit", ownerName: "D. Ravi", address: "15, Kamarajar Rd, Singanallur", tehsil: "Coimbatore South", district: "Coimbatore", contactNumber: "9842200006" },
            { code: "12CS003", name: "Ukkadam Central", ownerName: "A. Mohamed", address: "33, Pollachi Main Rd, Ukkadam", tehsil: "Coimbatore South", district: "Coimbatore", contactNumber: "9842200007" },
            { code: "12CS004", name: "Town Hall Co-op", ownerName: "J. Suresh", address: "5, Big Bazaar St, Town Hall", tehsil: "Coimbatore South", district: "Coimbatore", contactNumber: "9842200008" },

            // --- POLLACHI ---
            { code: "12PO001", name: "Pollachi Market", ownerName: "K. Gounder", address: "100, Market Rd, Pollachi", tehsil: "Pollachi", district: "Coimbatore", contactNumber: "9842200009" },
            { code: "12PO002", name: "Mahalingapuram FPS", ownerName: "R. Natarajan", address: "12, Kovai Rd, Mahalingapuram", tehsil: "Pollachi", district: "Coimbatore", contactNumber: "9842200010" },
            { code: "12PO003", name: "Venkatesa Colony", ownerName: "S. Balan", address: "44, Palghat Rd, Pollachi", tehsil: "Pollachi", district: "Coimbatore", contactNumber: "9842200011" },

            // --- METTUPALAYAM ---
            { code: "12MT001", name: "Mettupalayam Main", ownerName: "V. Rangarajan", address: "55, Ooty Main Rd, Mettupalayam", tehsil: "Mettupalayam", district: "Coimbatore", contactNumber: "9842200012" },
            { code: "12MT002", name: "Karamadai FPS", ownerName: "P. Shanmugam", address: "22, Coimbatore Rd, Karamadai", tehsil: "Mettupalayam", district: "Coimbatore", contactNumber: "9842200013" },

            // --- SULUR ---
            { code: "12SU001", name: "Sulur Air Force", ownerName: "M. Kannan", address: "8, Kangeyam Rd, Sulur", tehsil: "Sulur", district: "Coimbatore", contactNumber: "9842200014" },
            { code: "12SU002", name: "Palladam Road Unit", ownerName: "R. Karthik", address: "15, Trichy Rd, Sulur", tehsil: "Sulur", district: "Coimbatore", contactNumber: "9842200015" },

            // --- VALPARAI ---
            { code: "12VP001", name: "Valparai Estate", ownerName: "D. Wilson", address: "40, Main Rd, Valparai", tehsil: "Valparai", district: "Coimbatore", contactNumber: "9842200016" },

            // --- PERUR ---
            { code: "12PE001", name: "Perur Temple Rd", ownerName: "S. Mani", address: "12, Siruvani Rd, Perur", tehsil: "Perur", district: "Coimbatore", contactNumber: "9842200017" },
            { code: "12PE002", name: "Thondamuthur FPS", ownerName: "K. Raju", address: "5, Narasipuram Rd, Thondamuthur", tehsil: "Perur", district: "Coimbatore", contactNumber: "9842200018" },

            // --- KINATHUKADAVU ---
            { code: "12KK001", name: "Kinathukadavu Main", ownerName: "M. Kandasamy", address: "88, Pollachi Rd, Kinathukadavu", tehsil: "Kinathukadavu", district: "Coimbatore", contactNumber: "9842200019" }
        ];

        await Shop.insertMany(shops);
        console.log("✅ Seeded 19 Realistic Coimbatore FPS Shops across 8 Tehsils");
    }
};

const runSeeds = async () => {
    await seedManager();
    await seedBeneficiaries();
    // await seedShops(); // DISABLED: Preserving manual Excel import
};
runSeeds();

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
