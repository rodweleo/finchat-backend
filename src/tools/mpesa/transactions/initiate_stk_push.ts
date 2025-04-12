import { MPesa } from "../../../models";
import { STKPushRequest } from "../../../types";
import { supabaseClient } from "../../../utils/supabaseClient";

export const initiate_stk_push = async (options: STKPushRequest) => {
    // Ensure we have a valid callback URL
    const callbackUrl = process.env.HIVEX_SANDBOX_MPESA_CALLBACK_URL!;
    
    if (!callbackUrl) {
        throw new Error("M-Pesa callback URL is not configured. Please set HIVEX_SANDBOX_MPESA_CALLBACK_URL or MPESA_STKPUSH_CALLBACK_URL in your environment variables.");
    }
    
    const mpesa = new MPesa({
        baseUrl: process.env.MPESA_SANDBOX_BASE_URL!,
        consumerKey: process.env.HIVEX_SANDBOX_MPESA_CONSUMER_KEY!,
        consumerSecret: process.env.HIVEX_SANDBOX_MPESA_CONSUMER_SECRET!,
        shortcode: process.env.MPESA_SANDBOX_SHORTCODE!,
        passkey: process.env.HIVEX_SANDBOX_MPESA_PASSKEY!,
        callbackUrl: callbackUrl
    })

    const stkResponse = await mpesa.initiateSTKPush(options.Amount, options.PhoneNumber, options.AccountReference, options.TransactionDesc);

    // Save STK push information to Supabase
    const { error } = await supabaseClient
        .from('manivas_stk_transactions')
        .insert([{
            phone_number: options.PhoneNumber,
            amount: options.Amount,
            checkout_request_id: stkResponse.CheckoutRequestID,
            merchant_request_id: stkResponse.MerchantRequestID,
            response_code: stkResponse.ResponseCode,
            response_desc: stkResponse.ResponseDescription,
            account_reference: options.AccountReference,
            transaction_desc: options.TransactionDesc,
            status: 'pending',
        }]);

    if (error) {
        console.error('Error saving STK push to database:', error);
        // We don't throw the error here since the STK push was successful
        // We just log it and continue with the response
    }

    return stkResponse;
}