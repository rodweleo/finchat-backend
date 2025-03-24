
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



export const sendWhatsAppMessage = async (recipient_number: number) => {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${process.env.CLOUD_API_VERSION!}/${process.env.WA_PHONE_NUMBER_ID!}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: 'individual',
                to: recipient_number,
                type: "template",
                template: {
                    name: "finchat_transaction_success",
                    language: {
                        code: "en_US",
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: "Winnie Gitau" },
                                { type: "text", text: "500 HBAR" },
                                { type: "text", text: "50 KPLC Shares" },
                            ],
                        },
                    ],
                },

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

sendWhatsAppMessage(254721540981)