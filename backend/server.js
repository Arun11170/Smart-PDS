const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// --- WEBSITE EXPLORATION CONTEXT ---
const SITE_KNOWLEDGE = require('./utils/siteKnowledge');
const MULTILINGUAL_QA = require('./utils/multilingual_qa');

const getWebsiteContext = () => {
    return SITE_KNOWLEDGE + '\n\n' + MULTILINGUAL_QA;
};

const app = express();

// 1. HELMET (Secure Headers)
app.use(helmet());

// 2. DATA SANITIZATION (NoSQL Injection)
app.use(mongoSanitize());

// 3. DATA SANITIZATION (XSS)
app.use(xss());

// 4. PARAMETER POLLUTION (HPP)
app.use(hpp());

// 5. CORS (Strict)
const corsOptions = {
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// 6. RATE LIMITING (DoS Protection)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use('/api/', generalLimiter);

const chatLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // limit each IP to 20 chat requests
    message: "Chat limit exceeded. Please wait."
});

// 3. JWT MIDDLEWARE
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_pds_key_change_in_prod';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: "Access Denied: No Token Provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Access Denied: Invalid Token" });
        req.user = user;
        next();
    });
};

app.use(express.json());
app.use(express.json());
// app.use(cors()); REMOVED: Duplicate strict config above

// Config
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-pds';
const PORT = 5000;

// Schemas
const BeneficiarySchema = new mongoose.Schema({
    name: String,
    gender: String,
    card: { type: String, unique: true },
    members: Number,
    status: { type: String, default: 'Active' },
    familyMembers: [{
        name: String,
        age: Number,
        gender: String,
        relation: String
    }],
    assignedShop: String,
    assignedEmployee: String,
    rationStatus: {
        month: String,
        isReceived: { type: Boolean, default: false },
        receivedDate: Date
    },
    specialRations: [{
        name: String,
        date: Date,
        description: String
    }]
});

const BeneficiaryRequestSchema = new mongoose.Schema({
    submissionDate: { type: Date, default: Date.now },
    submittedBy: String,
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'ChangesRequested'] },
    adminComments: String,
    data: {
        name: String,
        gender: String,
        card: { type: String, unique: true },
        members: Number,
        familyMembers: [{
            name: String,
            age: Number,
            gender: String,
            relation: String
        }],
        assignedShop: String
    }
});

const EmployeeSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'employee' },
    shopLocation: { type: String, default: 'Main Office' },
    gender: { type: String, default: 'Other' },
    status: { type: String, default: 'active', enum: ['active', 'pending_disable', 'disabled'] }
});

const InventorySchema = new mongoose.Schema({
    type: { type: String, unique: true }, // 'daily_stock'
    total: Number,
    dispensed: Number
});

const TransactionSchema = new mongoose.Schema({
    txnId: { type: String, unique: true },
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    beneficiaryName: String,
    cardId: String,
    employeeEmail: String,
    items: [
        {
            item: String,
            qty: Number,
            unit: String,
            price: Number
        }
    ],
    totalAmount: Number,
    authMode: String,
    status: { type: String, default: 'SUCCESS' },
    date: { type: Date, default: Date.now },
    location: String
});

const ShopSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    name: String,
    ownerName: String,
    address: String,
    tehsil: String,
    district: String,
    contactNumber: String
});

const Beneficiary = mongoose.model('Beneficiary', BeneficiarySchema);
const BeneficiaryRequest = mongoose.model('BeneficiaryRequest', BeneficiaryRequestSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Shop = mongoose.model('Shop', ShopSchema);

// --- ROUTES ---

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Employee.findOne({ email: email.toLowerCase() });

        if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Generate Token
            const token = jwt.sign(
                { id: user._id, role: user.role, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token, // Send Token
                user: {
                    name: user.name,
                    role: user.role,
                    email: user.email,
                    shopLocation: user.shopLocation
                }
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EMPLOYEES ---
app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
        const employees = await Employee.find({ role: 'employee' });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/shops', async (req, res) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', authenticateToken, async (req, res) => {
    try {
        const emailLower = req.body.email.toLowerCase();
        let plainPassword = req.body.password;

        if (!plainPassword) {
            const emailPrefix = emailLower.split('@')[0];
            plainPassword = `${emailPrefix}pds@123`;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

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

app.post('/api/employees/request-disable', authenticateToken, async (req, res) => {
    try {
        const { email } = req.body;
        await Employee.findOneAndUpdate({ email: email.toLowerCase() }, { status: 'pending_disable' });
        res.json({ success: true, message: "Disable Request Sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Employee.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const updates = req.body;
        const updated = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
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

app.post('/api/inventory/add', authenticateToken, async (req, res) => {
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

app.delete('/api/beneficiaries/:id', authenticateToken, async (req, res) => {
    try {
        await Beneficiary.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Beneficiary Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BENEFICIARY REQUESTS ---
app.post('/api/beneficiary-requests', authenticateToken, async (req, res) => {
    try {
        const { submittedBy, data } = req.body;
        const exists = await Beneficiary.findOne({ card: data.card });
        if (exists) return res.status(400).json({ error: "Card ID already exists in Active Database" });

        const pending = await BeneficiaryRequest.findOne({ 'data.card': data.card, status: 'Pending' });
        if (pending) return res.status(400).json({ error: "A pending request for this Card ID already exists" });

        const request = await BeneficiaryRequest.create({ submittedBy, data, status: 'Pending' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/beneficiary-requests', authenticateToken, async (req, res) => {
    try {
        const { email, status } = req.query;
        let query = {};
        if (email) query.submittedBy = { $regex: new RegExp(`^${email.trim()}$`, 'i') };
        if (status) query.status = status;

        const requests = await BeneficiaryRequest.find(query).sort({ submissionDate: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/beneficiary-requests/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status, adminComments } = req.body;
        const requestId = req.params.id;

        const request = await BeneficiaryRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        if (status === 'Approved') {
            const benefData = request.data;
            const exists = await Beneficiary.findOne({ card: benefData.card });
            if (exists) return res.status(400).json({ error: "Cannot Approve: Card ID already exists in Active Database" });

            await Beneficiary.create({
                ...benefData,
                status: 'Active',
                assignedEmployee: request.submittedBy
            });

            request.status = 'Approved';
            request.adminComments = adminComments || "Approved by Admin";
        } else if (status === 'Rejected') {
            request.status = 'Rejected';
            request.adminComments = adminComments;
        } else if (status === 'ChangesRequested') {
            request.status = 'ChangesRequested';
            request.adminComments = adminComments;
        }

        await request.save();
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ration/reset', authenticateToken, async (req, res) => {
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
app.post('/api/dispense', authenticateToken, async (req, res) => {
    try {
        const { cardId, weight, specialRation } = req.body;
        await Inventory.findOneAndUpdate(
            { type: 'daily_stock' },
            { $inc: { dispensed: weight } },
            { new: true }
        );

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
            await Beneficiary.findOneAndUpdate({ card: cardId }, { $set: update });
        }

        const employee = await Employee.findOne({ email: req.body.employeeEmail?.toLowerCase() });
        const transactionLocation = employee ? employee.shopLocation : (user.assignedShop || "Unknown Area");

        await Transaction.create({
            txnId: `TXN-${Date.now()}`,
            beneficiaryId: user._id,
            beneficiaryName: user.name,
            cardId: user.card,
            employeeEmail: req.body.employeeEmail || "Unknown",
            items: [
                { item: 'Rice', qty: 5, unit: 'kg', price: 0 },
                { item: 'Wheat', qty: 5, unit: 'kg', price: 0 },
                ...(specialRation ? [{ item: specialRation, qty: 1, unit: 'pkg', price: 0 }] : [])
            ],
            totalAmount: 0,
            authMode: 'Biometric',
            status: 'SUCCESS',
            location: transactionLocation
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORTS ---
app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
        const { employee, shop, sort, authMode, item } = req.query;
        let query = {};
        if (employee) query.employeeEmail = { $regex: new RegExp(`^${employee.trim()}$`, 'i') };
        if (shop) query.location = { $regex: new RegExp(`^${shop.trim()}$`, 'i') };
        if (authMode) query.authMode = authMode;
        if (item) query['items.item'] = item;

        let sortOption = { date: -1 };
        if (sort === 'date_asc') sortOption = { date: 1 };
        if (sort === 'amount_desc') sortOption = { totalAmount: -1 };
        if (sort === 'amount_asc') sortOption = { totalAmount: 1 };

        const reports = await Transaction.find(query).sort(sortOption);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// --- LLM CHAT PROXY (Strict Context) ---
app.post('/api/chat/llm', chatLimiter, authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const userRole = req.user.role || 'guest';
        const HF_API_URL_LLM = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

        // System Prompt to ENFORCE Context and enable JSON extraction
        const systemPrompt = `You are the Smart PDS Voice Assistant.
        Current User Role: **${userRole.toUpperCase()}** (Authorized).

        OFFICIAL KNOWLEDGE BASE:
        ${getWebsiteContext()}
        
        INSTRUCTIONS:
        1. **PRIORITY 1: KNOWLEDGE BASE LOOKUP**:
           - SEARCH user's question in the 'OFFICIAL KNOWLEDGE BASE' and 'MULTILINGUAL Q&A' provided above.
           - IF found, use that exact information. Do not hallucinate different rules (e.g., if file says 5kg rice, do NOT say 10kg).

        2. **PRIORITY 2: DOMAIN INTELLIGENCE (The "AI" Part)**:
           - IF the question is NOT in the file, BUT is related to **Public Distribution Systems (PDS), Ration Cards, Food Security, or Government Schemes**:
             - Answer it intelligently using your general knowledge.
             - Explain *concepts* (e.g., "Why is biometric secure?", "What is PDS?").
             - Keep these answers professional and helpful.

        3. **ROLE ENFORCEMENT**:
           - IF Role is 'EMPLOYEE': You CANNOT share stock reports or admin tools. Reply: "Access Denied."
           - IF Role is 'MANAGER': Full access.

        4. **MULTILINGUAL & COMMANDS**: 
           - **Check 'MULTILINGUAL COMMANDS' first.** If user says "Chawal do", return JSON Action immediately.
           - **Output Language**: ALWAYS match the User's input language. (Hindi -> Hindi).

        5. **STRICT JSON OUTPUT (For Actions)**: 
           If the user wants to FILL A FORM or NAVIGATE, return ONLY JSON.
           
           **Format 1: FORM FILLING**
           Trigger: "Fill name...", "Add card...", "Set age..."
           {
             "action": "FORM_FILL",
             "data": { "field_name": "value" },
             "reply": "Updating form..." (Translated)
           }
           Fields: 'name', 'card', 'gender', 'address', 'members', 'age', 'relation'.

           **Format 2: SMART NAVIGATION**
           Trigger: "Go home", "Scan ration", "Check reports"
           {
             "action": "NAVIGATION",
             "target": "/route_path", 
             "reply": "Opening page..." (Translated)
           }
           Routes: /home, /scan, /add-beneficiary, /payment, /admin

        6. **Format 3: GENERAL QUERY**
           For all other questions (Rules, Explanations, Greeting):
           { "reply": "Your intelligent answer here..." (Translated) }

        7. **STRICT BOUNDARY**:
           - Refuse totally unrelated topics (e.g., Movies, Sports, Coding questions).
           - Say: "I can only help with Smart PDS and Ration services."
        
        User Query: ${message}`;

        const response = await fetch(HF_API_URL_LLM, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: `<s>[INST] ${systemPrompt} [/INST]`,
                parameters: {
                    max_new_tokens: 300,
                    return_full_text: false,
                    temperature: 0.1 // Tuned for precision
                }
            }),
        });

        if (!response.ok) throw new Error(`HF API Error: ${response.statusText}`);

        const result = await response.json();
        let rawText = result[0]?.generated_text || "{}";

        // Cleanup: Mistral sometimes adds backticks or explanations even when asked not to.
        // We try to extract JSON if it exists.
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const jsonResponse = JSON.parse(jsonMatch[0]);
                res.json(jsonResponse); // Return structured JSON directly
                return;
            } catch (e) {
                console.log("Failed to parse LLM JSON", e);
            }
        }

        // Fallback for normal text (or failed JSON parse)
        res.json({ reply: rawText.trim() });

    } catch (err) {
        console.error("LLM Error:", err.message);
        res.status(500).json({ error: "AI Service Unavailable" });
    }
});

// --- SEEDING FUNCTIONS ---
const seedManager = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);
    const exists = await Employee.findOne({ role: 'manager' });
    if (exists) {
        exists.password = hashedPassword;
        await exists.save();
    } else {
        await Employee.create({
            name: 'Supervisor',
            email: 'admin@pds.com',
            password: hashedPassword,
            role: 'manager'
        });
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
        // [Shop Data Omitted for Brevity - Keeping Logic]
        console.log("✅ Seeded Shops (Skipped in this concise view)");
    }
};

const runSeeds = async () => {
    try {
        await seedManager();
        await seedBeneficiaries();
        // await seedShops(); 
    } catch (e) {
        console.error("Seed Error:", e.message);
    }
};

// --- SERVER STARTUP (At the very bottom) ---
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        await runSeeds();
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        console.error('⚠️  Make sure MongoDB is installed and running!');
        console.error('   Command: mongod');
        // Do NOT process.exit(1), let it retry or stay up for debugging (optional)
        // But preventing app.listen ensures we don't return 500s for every DB call without a connection.
    });
