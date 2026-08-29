const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, required: true },
    totalFee: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    joiningDate: { type: String, required: true },
    expiryDate: { type: String, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    cardio: { type: String, default: 'no' },
    paymentStatus: { type: String, default: 'Pending' },
    transactions: [{
        amount: Number,
        method: String,
        date: String,
        type: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);