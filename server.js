const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ===== MODEL =====
const MemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, default: 'Monthly' },
    totalFees: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    remainingDues: { type: Number, default: 0 },
    paymentStatus: { 
        type: String, 
        enum: ['Paid', 'Partial', 'Pending'], 
        default: 'Pending' 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentHistory: { type: Array, default: [] },
    reminderSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Member = mongoose.model('Member', MemberSchema);

// ===== ROUTES =====

// ✅ GET - All members
app.get('/api/members', async (req, res) => {
    try {
        const members = await Member.find().sort({ createdAt: -1 });
        res.json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ POST - Add member
app.post('/api/members', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Received:', data);
        
        if (!data.name || !data.phone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name and phone are required' 
            });
        }
        
        const remainingDues = (data.totalFees || 0) - (data.amountPaid || 0);
        
        let paymentStatus = 'Pending';
        if (remainingDues <= 0) {
            paymentStatus = 'Paid';
        } else if (data.amountPaid > 0) {
            paymentStatus = 'Partial';
        }
        
        const memberData = {
            name: data.name,
            phone: data.phone,
            plan: data.plan || 'Monthly',
            totalFees: Number(data.totalFees) || 0,
            amountPaid: Number(data.amountPaid) || 0,
            remainingDues: remainingDues,
            paymentStatus: paymentStatus,
            startDate: data.planStartDate || new Date(),
            endDate: data.planEndDate || new Date(),
            paymentHistory: [],
            reminderSent: false
        };
        
        const member = new Member(memberData);
        await member.save();
        
        console.log('✅ Member saved:', member._id);
        
        res.status(201).json({ 
            success: true, 
            data: member,
            message: '✅ Member added successfully!' 
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ✅ DELETE - Member
app.delete('/api/members/:id', async (req, res) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        res.json({ success: true, message: '✅ Member deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ POST - Payment
app.post('/api/members/:id/payment', async (req, res) => {
    try {
        const { amount, method, note } = req.body;
        const member = await Member.findById(req.params.id);
        
        if (!member) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        
        member.amountPaid += Number(amount);
        member.remainingDues = member.totalFees - member.amountPaid;
        
        if (member.remainingDues <= 0) {
            member.paymentStatus = 'Paid';
        } else {
            member.paymentStatus = 'Partial';
        }
        
        if (!member.paymentHistory) member.paymentHistory = [];
        member.paymentHistory.push({
            amount: Number(amount),
            date: new Date(),
            method: method || 'Cash',
            note: note || ''
        });
        
        await member.save();
        
        res.json({ 
            success: true, 
            data: member,
            message: `✅ ₹${amount} paid successfully!`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== MONGODB CONNECTION =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymdb';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        // Server start
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.log('❌ MongoDB connection error:', err);
        process.exit(1);
    });