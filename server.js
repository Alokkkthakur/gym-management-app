const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Data file path
// server.js me ye change karein
const DATA_FILE = path.join(__dirname, 'data', 'members.json');

// Sirf tabhi create karein jab file exist nahi karti
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}
// ===== API ROUTES =====

// GET - Load all members
app.get('/api/members', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const members = JSON.parse(data);
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST - Add new member
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
        res.json({ success: true, member: newMember });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// PUT - Update member
app.put('/api/members/:id', (req, res) => {
    try {
        let members = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const index = members.findIndex(m => m._id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }
        members[index] = { ...members[index], ...req.body };
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        res.json({ success: true, member: members[index] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update data' });
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
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

// POST - Save all data (bulk save)
app.post('/api/members/save-all', (req, res) => {
    try {
        const members = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        res.json({ success: true, message: 'All data saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// GET - Download backup
app.get('/api/backup', (req, res) => {
    res.download(DATA_FILE, 'members_backup.json');
});

// POST - Import data
app.post('/api/import', (req, res) => {
    try {
        const data = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Data imported successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to import data' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Data saved at: ${DATA_FILE}`);
});