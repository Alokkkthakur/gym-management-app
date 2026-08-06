const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const reminderJob = require('../jobs/cronJob');

// Test route to add a member with expiry in 3 days
router.post('/test/add-member', async (req, res) => {
    try {
        const testMember = {
            name: 'Test User',
            phone: '919999999999', // Your WhatsApp number with country code
            plan: 'Monthly',
            planStartDate: new Date(),
            planEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        };
        
        const member = new Member(testMember);
        await member.save();
        res.json({ success: true, data: member });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Test route to manually trigger reminder
router.post('/test/manual-reminder/:memberId', async (req, res) => {
    try {
        const result = await reminderJob.sendManualReminder(req.params.memberId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;