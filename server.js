const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ============= ROUTES =============

// Get all members
app.get('/api/members', async (req, res) => {
    try {
        const Member = require('./models/Member');
        const members = await Member.find();
        res.json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new member
app.post('/api/members', async (req, res) => {
    try {
        const Member = require('./models/Member');
        const data = req.body;
        
        // Calculate dues
        data.remainingDues = data.totalFees - data.amountPaid;
        if (data.remainingDues <= 0) {
            data.paymentStatus = 'Paid';
        } else if (data.amountPaid > 0) {
            data.paymentStatus = 'Partial';
        } else {
            data.paymentStatus = 'Pending';
        }
        
        const member = new Member(data);
        await member.save();
        res.status(201).json({ success: true, data: member });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 🗑️ DELETE Member - NAYA ROUTE
app.delete('/api/members/:id', async (req, res) => {
    try {
        const Member = require('./models/Member');
        const member = await Member.findByIdAndDelete(req.params.id);
        
        if (!member) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        
        res.json({ 
            success: true, 
            message: `✅ ${member.name} deleted successfully!` 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 💰 Add Payment
app.post('/api/members/:id/payment', async (req, res) => {
    try {
        const Member = require('./models/Member');
        const { amount, method, note } = req.body;
        
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        
        member.amountPaid += amount;
        member.lastPaymentDate = new Date();
        member.paymentHistory.push({
            amount: amount,
            date: new Date(),
            method: method || 'Cash',
            note: note || ''
        });
        
        member.remainingDues = member.totalFees - member.amountPaid;
        
        if (member.remainingDues <= 0) {
            member.paymentStatus = 'Paid';
        } else {
            member.paymentStatus = 'Partial';
        }
        
        await member.save();
        
        res.json({ 
            success: true, 
            data: member,
            message: `✅ Payment of ₹${amount} added successfully!`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Payment History
app.get('/api/members/:id/payments', async (req, res) => {
    try {
        const Member = require('./models/Member');
        const member = await Member.findById(req.params.id);
        
        if (!member) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        
        res.json({
            success: true,
            data: {
                totalFees: member.totalFees,
                amountPaid: member.amountPaid,
                remainingDues: member.remainingDues,
                paymentStatus: member.paymentStatus,
                paymentHistory: member.paymentHistory
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Reminder
app.post('/api/send-reminder/:memberId', async (req, res) => {
    try {
        const Member = require('./models/Member');
        const member = await Member.findById(req.params.memberId);
        
        if (!member) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        
        member.reminderSent = true;
        member.reminderSentAt = new Date();
        await member.save();
        
        res.json({ 
            success: true, 
            message: `✅ Reminder sent to ${member.name}` 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// HTML Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============= SERVER START =============

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym-management')
.then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📱 Open browser: http://localhost:${PORT}`);
    });
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});