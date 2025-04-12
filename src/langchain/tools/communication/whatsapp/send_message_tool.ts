
import { Tool } from '@langchain/core/tools';
import { sendWhatsAppMessage } from '../../../../services/WhatsappService';
import { v4 as uuidv4 } from 'uuid';

export class SendWhatsAppMessageTool extends Tool {
    name = 'send_whatsapp_message';

    description = `Sends a WhatsApp message to a user. Use this tool to notify users about transaction status.
  
Inputs (input is a JSON string):
- phoneNumber: string - The recipient's phone number in format 254XXXXXXXXX (e.g., "254712345678")
- message: string - The message to send

Example usage:
{
  "phoneNumber": "254712345678",
  "message": "Your HBAR tokens have been successfully transferred!"
}`;

    protected async _call(input: string): Promise<string> {
        try {
            const parsedInput = JSON.parse(input);

            if (!parsedInput.phoneNumber || !parsedInput.message) {
                return JSON.stringify({
                    status: "error",
                    message: "Missing required fields: phoneNumber or message",
                    code: "MISSING_INPUT",
                });
            }

            const messageId = uuidv4()
            // Send WhatsApp message
            await sendWhatsAppMessage({
                to: parsedInput.phoneNumber, 
                text: parsedInput.message,
                messageId: messageId
            });

            return JSON.stringify({
                status: "success",
                message: "WhatsApp message sent successfully",
                data: {
                    phoneNumber: parsedInput.phoneNumber,
                    message: parsedInput.message
                }
            });
        } catch (error: any) {
            console.error("Error sending WhatsApp message:", error);
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
}