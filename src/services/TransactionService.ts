import axios from "axios";
import { generateMpesaAccessToken } from "./AuthService";
import { supabaseClient } from "../utils/supabaseClient";

export const checkMpesaTransactionStatus = async (mpesaReceiptNumber: string) => {

    if (!mpesaReceiptNumber) {
        return { error: "M-Pesa receipt number is required." }
    }

    const url = `${process.env.MPESA_SANDBOX_BASE_URL!}/mpesa/transactionstatus/v1/query`

    const requestPayload = {
        Initiator: "Manivas",
        SecurityCredential: process.env.MPESA_SANDBOX_SECURITY_CREDENTIAL!,
        CommandID: "TransactionStatusQuery",
        TransactionID: mpesaReceiptNumber, // MpesaReceiptNumber from user
        PartyA: process.env.MPESA_SANDBOX_SHORTCODE!,
        IdentifierType: "2", // 4 = Paybill, 1 = MSISDN (phone), 2 = Till Number
        ResultURL: process.env.MPESA_TRANSACTION_STATUS_RESULT_URL!,
        QueueTimeOutURL: process.env.MPESA_TRANSACTION_STATUS_QUEUE_TIMEOUT_URL!,
        Remarks: "Checking transaction status",
        Occasion: "Manual verification"
    };

    try {

        const response = await generateMpesaAccessToken()
        const { access_token } = response;

        const { data } = await axios.post(url, requestPayload, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Transaction Status Response:", data);

        // 🔹 Check if transaction exists in Supabase
        const { data: existingTransaction } = await supabaseClient
            .from('manivas_stk_transactions')
            .select('id, status')
            .eq('mpesa_receipt', mpesaReceiptNumber)
            .single();

        if (!existingTransaction) {
            // 🔹 If transaction is NOT in Supabase, insert a new record
            const { error: insertError } = await supabaseClient
                .from('manivas_stk_transactions')
                .insert([{
                    mpesa_receipt: mpesaReceiptNumber,
                    status: data.Result.ResultCode === 0 ? 'completed' : 'failed',
                    result_desc: data.Result.ResultDesc
                }]);

            if (insertError) throw insertError;
        } else {
            // 🔹 If transaction exists, update the status
            const { error: updateError } = await supabaseClient
                .from('manivas_stk_transactions')
                .update({
                    status: data.Result.ResultCode === 0 ? 'completed' : 'failed',
                    result_desc: data.Result.ResultDesc
                })
                .eq('mpesa_receipt', mpesaReceiptNumber);

            if (updateError) throw updateError;
        }

        return { message: "Transaction status checked successfully", result: data };
    } catch (error: any) {
        console.error("Transaction Status Error:", error.message);
        return { error: "Failed to check transaction status" };
    }
}