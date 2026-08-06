const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], required: true },
    planStartDate: { type: Date, required: true },
    planEndDate: { type: Date, required: true },
    totalFees: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    remainingDues: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
    lastPaymentDate: { type: Date },
    paymentHistory: [{
        amount: Number,
        date: Date,
        method: String,
        note: String
    }],
    isActive: { type: Boolean, default: true },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date }
}, { timestamps: true });

// ✅ Koi middleware nahi - sirf export
module.exports = mongoose.model('Member', memberSchema);