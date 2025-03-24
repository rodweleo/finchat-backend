import axios from "axios";
import { generateMpesaAccessToken } from "./AuthService";
import { supabaseClient } from "../utils/supabaseClient";

export const initiateStkPush = async (userId: string, amount: number, phoneNumber: string) => {
    try {
        const { access_token } = await generateMpesaAccessToken();

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const shortCode = process.env.MPESA_SANDBOX_SHORTCODE!;
        const passkey = process.env.MPESA_SANDBOX_PASSKEY!;
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: shortCode,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_STKPUSH_CALLBACK_URL!,
            AccountReference: 'TestPayment',
            TransactionDesc: 'Payment for Buying Crypto'
        };

        const response = await axios.post(`${process.env.MPESA_SANDBOX_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        // 🔹 Save STK initiation response in Supabase
        const { CheckoutRequestID, MerchantRequestID, ResponseCode, ResponseDescription } = response.data;

        const { error } = await supabaseClient
            .from("manivas_stk_transactions")
            .insert([{
                user_id: userId,
                phone_number: phoneNumber,
                amount,
                checkout_request_id: CheckoutRequestID,
                merchant_request_id: MerchantRequestID,
                response_code: ResponseCode,
                response_desc: ResponseDescription,
                status: 'pending'
            }])

        if (error) {
            return { ...response.data, error: error };
        }

        return { ...response.data, error: null };
    } catch (error: any) {
        console.error('STK Push Error:', error.response ? error.response.data : error.message);
        return { error: error.response ? error.response.data : error.message }
    }
}