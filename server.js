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
const DATA_FILE = path.join(__dirname, 'data', 'members.json');

// ✅ SAHI - Sirf tabhi create karein jab file exist nahi karti
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

console.log('📁 Data file path:', DATA_FILE);

// ===== API ROUTES =====

app.get('/api/members', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const members = JSON.parse(data);
        res.json(members);
    } catch (error) {
        console.error('❌ Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/members/save-all', (req, res) => {
    try {
        const members = req.body;
        if (!Array.isArray(members)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        console.log('✅ Data saved to file:', members.length, 'members');
        res.json({ success: true, message: 'All data saved successfully', count: members.length });
    } catch (error) {
        console.error('❌ Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data: ' + error.message });
    }
});

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
        console.error('❌ Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

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
        console.error('❌ Error updating data:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

app.delete('/api/members/:id', (req, res) => {
    try {
        let members = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        members = members.filter(m => m._id !== req.params.id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting data:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

app.get('/api/backup', (req, res) => {
    res.download(DATA_FILE, 'members_backup.json');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Data saved at: ${DATA_FILE}`);
});