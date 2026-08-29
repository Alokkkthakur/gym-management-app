const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'members.json');

// Ensure directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Create file if not exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

console.log('📁 Data file path:', DATA_FILE);

// ===== API ROUTES =====

// GET - Load all members
app.get('/api/members', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// ✅ POST - Add new member (APPEND)
app.post('/api/members', (req, res) => {
    try {
        const members = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const newMember = {
            ...req.body,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        members.push(newMember);
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        console.log('✅ Member added:', newMember.name, 'Total:', members.length);
        res.json({ success: true, member: newMember });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// ✅ POST - Save all data (BULK SAVE)
app.post('/api/members/save-all', (req, res) => {
    try {
        const members = req.body;
        if (!Array.isArray(members)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        console.log('✅ Data saved to file:', members.length, 'members');
        res.json({ success: true, count: members.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// PUT - Update member
app.put('/api/members/:id', (req, res) => {
    try {
        let members = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const index = members.findIndex(m => m._id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Member not found' });
        members[index] = { ...members[index], ...req.body };
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// DELETE - Remove member
app.delete('/api/members/:id', (req, res) => {
    try {
        let members = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        members = members.filter(m => m._id !== req.params.id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Data saved at: ${DATA_FILE}`);
});