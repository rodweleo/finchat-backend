import express, { Request, Response } from 'express';
import { generateMpesaAccessToken } from './services/AuthService';
import * as dotenv from "dotenv"
import axios from 'axios';
import { initiateStkPush } from './services/StkPushService';
import { supabaseClient } from './utils/supabaseClient';
import { checkMpesaTransactionStatus } from './services/TransactionService';
import cors from "cors"
import { checkCryptoWalletBalance, sendCrypto, verifyCryptoTransaction } from './services/ContractService';

dotenv.config()

const app = express();
app.use(express.json())
app.use(cors({
    origin: "*"
}))

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;


app.post("/api/v1/crypto/payment/send", async (req, res) => {
    const { to, amount } = req.body;

    try {
        const response = await sendCrypto(to, amount);

        res.send(response);
    } catch (e: any) {
        res.status(500).json(e.message)
    }
})

app.get("/api/v1/crypto/checkWalletBalance", async (req, res) => {
    const { address } = req.query;

    try {
        const response = await checkCryptoWalletBalance(address as string);

        res.send(response);
    } catch (e: any) {
        res.status(500).json(e.message)
    }
})

app.get("/api/v1/crypto/verifyTransaction", async (req, res) => {
    const { transactionHash } = req.query;

    try {
        const response = await verifyCryptoTransaction(transactionHash as string);

        if (!response) {
            res.status(404).json({ message: "Transaction not found" })
            return;
        }

        res.send(response);
    } catch (e: any) {
        res.status(500).json(e.message)
    }
})

app.get("/api/v1/mpesa/auth/accessToken", async (req: Request, res: Response) => {
    const response = await generateMpesaAccessToken();
    res.send(response);
})

app.post("/api/v1/mpesa/payment/initiateStkPush", async (req: Request, res: Response) => {

    const { userId, amount, phoneNumber } = req.body;
    const response = await initiateStkPush(userId, amount, phoneNumber);

    const { error } = response

    if (error) {
        res.status(500).json({
            error: error.message
        })
    }

    res.send(response);
})

app.post("/api/v1/mpesa/payment/stkCallbackURL", async (req, res) => {
    try {
        const { Body } = req.body;
        const { stkCallback } = Body;
        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

        let mpesaReceipt = null;
        let amount = null;
        let phoneNumber = null;

        if (CallbackMetadata && CallbackMetadata.Item) {
            for (let item of CallbackMetadata.Item) {
                if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = item.Value;
                if (item.Name === 'Amount') amount = item.Value;
                if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
            }
        }

        // 🔹 Update Supabase with STK Callback response
        const { error } = await supabaseClient
            .from('manivas_stk_transactions')
            .update({
                result_code: ResultCode,
                result_desc: ResultDesc,
                mpesa_receipt: mpesaReceipt,
                status: ResultCode === 0 ? 'completed' : 'failed'
            })
            .eq('checkout_request_id', CheckoutRequestID);

        console.log("STK Callback Processed Successfully");

        if (error) {
            res.status(500).json({ error })
        }
    } catch (e: any) {
        console.error("STK Callback Error:", e.message);
        res.status(500).json({ message: "Error processing callback" });
    }
})

app.post('/api/v1/mpesa/transactions/checkTransactionStatus', async (req, res) => {
    const { mpesa_receipt_no } = req.body;

    const response = await checkMpesaTransactionStatus(mpesa_receipt_no);

    console.log(response)

    res.send(response)
})

app.post('/api/v1/mpesa/transactionStatus/resultURL', async (req, res) => {
    try {
        const callbackData = req.body.Result;
        console.log("Transaction Status Callback Data:", callbackData);

        const { TransactionID, ResultCode, ResultDesc } = callbackData;

        let amount = null;
        let phoneNumber = null;

        if (callbackData.ResultParameters && callbackData.ResultParameters.ResultParameter) {
            for (let item of callbackData.ResultParameters.ResultParameter) {
                if (item.Key === 'Amount') amount = item.Value;
                if (item.Key === 'DebitPartyName') phoneNumber = item.Value;
            }
        }

        // 🔹 Update Supabase with transaction status
        const { error } = await supabaseClient
            .from('manivas_stk_transactions')
            .update({
                result_code: ResultCode,
                result_desc: ResultDesc,
                amount: amount,
                phone_number: phoneNumber,
                status: ResultCode === 0 ? 'completed' : 'failed'
            })
            .eq('mpesa_receipt', TransactionID);

        if (error) throw error;

        console.log("Transaction Status Updated Successfully");
        res.status(200).json({ message: "Transaction status updated" });

    } catch (error: any) {
        console.error("Transaction Status Callback Error:", error.message);
        res.status(500).json({ message: "Error processing transaction status callback" });
    }
});

app.post('/api/v1/whatsapp/webhook', async (req, res) => {
    // log incoming messages
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    // check if the webhook request contains a message
    // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

    // check if the incoming message contains text
    if (message?.type === "text") {
        // extract the business number to send the reply from it
        const business_phone_number_id =
            req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

        // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                to: message.from,
                text: { body: "Echo: " + message.text.body },
                context: {
                    message_id: message.id, // shows the message as a reply to the original user message
                },
            },
        });

        // mark incoming message as read
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: message.id,
            },
        });
    }

    res.sendStatus(200);
})

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/api/v1/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // check the mode and token sent are correct
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        // respond with 200 OK and challenge token from the request
        res.status(200).send(challenge);
        console.log("Webhook verified successfully!");
    } else {
        // respond with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);
    }
});

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});
