import express, { Request, Response } from 'express';
import { generateMpesaAccessToken } from './services/AuthService';
import * as dotenv from "dotenv"
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

const port = 3001;

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

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
