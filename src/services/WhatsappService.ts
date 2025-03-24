
import WhatsApp from 'whatsapp';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Your test sender phone number
const wa = new WhatsApp(Number(process.env.WA_PHONE_NUMBER_ID!));


export async function send_message(recipient_number: number) {
    try {
        const sent_text_message = wa.messages.text({ "body": "FinChat is live now." }, recipient_number);

        await sent_text_message.then((res) => {
            console.log(res.rawResponse());
        });
    }
    catch (e) {
        console.log(JSON.stringify(e));
    }
}

export interface SendWhatsAppMessageProps {
    to: number;
    messageId: string;
    text: string
}

export const sendWhatsAppMessage = async ({ to, messageId, text }: SendWhatsAppMessageProps) => {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${process.env.CLOUD_API_VERSION!}/${process.env.WA_PHONE_NUMBER_ID!}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: 'individual',
                to: to,
                type: "text",
                // template: {
                //     name: "finchat_transaction_success",
                //     language: {
                //         code: "en_US",
                //     },
                //     components: [
                //         {
                //             type: "body",
                //             parameters: [
                //                 { type: "text", text: "Winnie Gitau" },
                //                 { type: "text", text: "500 HBAR" },
                //                 { type: "text", text: "50 KPLC Shares" },
                //             ],
                //         },
                //     ],
                // },
                text: {
                    "body": text
                },
                context: {
                    message_id: messageId
                }

            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN!}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Message sent:", response.data);
    } catch (error: any) {
        console.error("Error sending message:", error.response?.data || error.message);
    }
};