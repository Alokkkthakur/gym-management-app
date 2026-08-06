const twilio = require('twilio');
require('dotenv').config();

class WhatsAppService {
    constructor() {
        // Check if we have valid credentials
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        
        // ✅ TEMPORARY: Force enable for testing
        // Remove this if block after sandbox is joined
        if (accountSid === 'dummy' || !accountSid) {
            this.isEnabled = false;
            console.log('⚠️ WhatsApp service disabled (dummy credentials)');
            return;
        }
        
        // Check if credentials are valid format
        if (!accountSid || !authToken || !accountSid.startsWith('AC')) {
            console.warn('⚠️ Invalid Twilio credentials. WhatsApp service disabled.');
            this.isEnabled = false;
            return;
        }
        
        try {
            this.accountSid = accountSid;
            this.authToken = authToken;
            this.from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
            this.client = twilio(this.accountSid, this.authToken);
            this.isEnabled = true;
            console.log('✅ WhatsApp service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp service:', error.message);
            this.isEnabled = false;
        }
    }

    async sendReminder(to, memberName, expiryDate) {
        // ✅ If disabled, log instead of sending
        if (!this.isEnabled) {
            console.log('📝 [SIMULATED] WhatsApp reminder would be sent to:', {
                to: to,
                memberName: memberName,
                expiryDate: new Date(expiryDate).toLocaleDateString()
            });
            return { 
                success: true, 
                simulated: true,
                message: `Reminder would be sent to ${memberName} (${to})`
            };
        }

        try {
            const cleanPhone = to.replace(/\s/g, '');
            const formattedDate = new Date(expiryDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            console.log(`📤 Sending WhatsApp to: ${cleanPhone}`);
            console.log(`📝 Message for: ${memberName}`);

            const message = await this.client.messages.create({
                body: `🏋️‍♂️ *GYM REMINDER*\n\nDear ${memberName},\n\nYour gym membership plan will expire on ${formattedDate}.\n\nPlease renew your plan to continue using our services.\n\nThank you! 💪`,
                from: this.from,
                to: `whatsapp:${cleanPhone}`
            });
            
            console.log('✅ WhatsApp message sent:', message.sid);
            return { success: true, messageId: message.sid };
            
        } catch (error) {
            console.error('❌ Error sending WhatsApp message:', error);
            
            let errorMessage = error.message;
            if (error.code === 20003) {
                errorMessage = 'Authentication failed. Check Twilio Account SID and Auth Token.';
            } else if (error.code === 21211) {
                errorMessage = 'Invalid phone number. Format: 919999999999';
            } else if (error.code === 21608) {
                errorMessage = 'WhatsApp Sandbox not joined. Send "join <code>" to +14155238886';
            }
            
            return { 
                success: false, 
                error: errorMessage,
                code: error.code 
            };
        }
    }

    // Test connection
    async testConnection() {
        if (!this.isEnabled) {
            return { success: false, error: 'WhatsApp service not enabled' };
        }
        
        try {
            const account = await this.client.api.accounts(this.accountSid).fetch();
            console.log('✅ Twilio connection successful:', account.friendlyName);
            return { success: true, accountName: account.friendlyName };
        } catch (error) {
            console.error('❌ Twilio connection test failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new WhatsAppService();