const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// 🔗 MongoDB Connection String (Aap apna MongoDB Atlas URL yahan daal sakte hain, ya local MongoDB use kar sakte hain)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/viraj_fitness_pro';

mongoose.connect(MONGO_URI)
    .then(() => console.log('🟢 Connected to MongoDB Successfully! Data is 100% safe.'))
    .catch(err => console.error('🔴 MongoDB Connection Error:', err));

const Member = require('./models/Member');

// ===== API ROUTES =====

// GET - Load all members from Database
app.get('/api/members', async (req, res) => {
    try {
        const members = await Member.find().sort({ createdAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// POST - Add new member
app.post('/api/members', async (req, res) => {
    try {
        const newMember = new Member(req.body);
        const savedMember = await newMember.save();
        console.log('✅ Member saved to DB:', savedMember.name);
        res.json({ success: true, member: savedMember });
    } catch (error) {
        console.error('❌ Error saving member:', error);
        res.status(500).json({ error: 'Failed to save member' });
    }
});

// PUT - Update member (Renew, Add Payment, etc.)
app.put('/api/members/:id', async (req, res) => {
    try {
        const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
        console.log('🔄 Member updated in DB:', updatedMember.name);
        res.json({ success: true, member: updatedMember });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// DELETE - Remove member
app.delete('/api/members/:id', async (req, res) => {
    try {
        const deletedMember = await Member.findByIdAndDelete(req.params.id);
        if (!deletedMember) return res.status(404).json({ error: 'Member not found' });
        console.log('🗑️ Member deleted from DB');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});