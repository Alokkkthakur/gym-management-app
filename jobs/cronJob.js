const cron = require('node-cron');
const Member = require('../models/Member');
const whatsappService = require('../services/whatsappService');
const moment = require('moment');

class ReminderJob {
    constructor() {
        // Schedule job to run every day at 9:00 AM
        this.job = cron.schedule('0 9 * * *', async () => {
            console.log('Running daily reminder check...');
            await this.checkAndSendReminders();
        });
    }

    async checkAndSendReminders() {
        try {
            // Calculate date 3 days from now
            const threeDaysFromNow = moment().add(3, 'days').startOf('day').toDate();
            const today = moment().startOf('day').toDate();

            // Find members whose plan expires in exactly 3 days
            // and haven't received reminder yet
            const members = await Member.find({
                planEndDate: {
                    $gte: threeDaysFromNow,
                    $lt: moment(threeDaysFromNow).add(1, 'day').toDate()
                },
                isActive: true,
                reminderSent: false
            });

            console.log(`Found ${members.length} members with expiring plans in 3 days`);

            for (const member of members) {
                console.log(`Sending reminder to ${member.name} (${member.phone})`);
                
                // Send WhatsApp message
                const result = await whatsappService.sendReminder(
                    member.phone,
                    member.name,
                    member.planEndDate
                );

                if (result.success) {
                    // Update member record
                    member.reminderSent = true;
                    member.reminderSentAt = new Date();
                    await member.save();
                    console.log(`✅ Reminder sent successfully to ${member.name}`);
                } else {
                    console.error(`❌ Failed to send reminder to ${member.name}:`, result.error);
                }
            }

        } catch (error) {
            console.error('Error in reminder job:', error);
        }
    }

    // Manual trigger function (for testing)
    async sendManualReminder(memberId) {
        try {
            const member = await Member.findById(memberId);
            if (!member) {
                return { success: false, error: 'Member not found' };
            }

            const result = await whatsappService.sendReminder(
                member.phone,
                member.name,
                member.planEndDate
            );

            if (result.success) {
                member.reminderSent = true;
                member.reminderSentAt = new Date();
                await member.save();
                return { success: true, message: 'Reminder sent successfully' };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Start the cron job
    start() {
        this.job.start();
        console.log('Reminder cron job started');
    }

    // Stop the cron job
    stop() {
        this.job.stop();
        console.log('Reminder cron job stopped');
    }
}

module.exports = new ReminderJob();