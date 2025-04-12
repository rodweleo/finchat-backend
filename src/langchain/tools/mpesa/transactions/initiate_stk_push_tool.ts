import { Tool } from '@langchain/core/tools';
import { STKPushRequest } from '../../../../types';
import MpesaAgentKit from '../../../../agent/mpesa';

export class STKPushTool extends Tool {
    name = 'mpesa_stk_push';
    context?: any;

    description = `Initiates an M-Pesa STK Push (Lipa Na M-Pesa Online) transaction when requested to use MPesa when making transactions.
  
Inputs (input is a JSON string):
- amount: number - The amount to be paid (e.g., 1000)
- phoneNumber: string - The customer's phone number in format 254XXXXXXXXX (e.g., "254712345678")
- accountReference: (string, optional) - Reference for the transaction (e.g., "ORDER123")
- transactionDesc: (string, optional) - Description of the transaction (e.g., "Payment for Order #123")

Example usage:
{
  "amount": 1000,
  "phoneNumber": "254712345678",
  "accountReference": "ORDER123",
  "transactionDesc": "Payment for Order #123"
}`;

    constructor(private mpesaAgentKit: MpesaAgentKit) {
        super()
    }

    protected async _call(input: string): Promise<string> {
        try {
            const parsedInput = JSON.parse(input);
            
            // Get the user's phone number from the context if available
            const userPhoneNumber = this.context?.userPhoneNumber;
            
            // Use the provided phone number or the one from context
            const phoneNumber = parsedInput.phoneNumber || userPhoneNumber;

            // Generate default values for account reference and transaction description if not provided
            const accountReference = parsedInput.accountReference || `ORDER-${Date.now().toString().slice(-6)}`;
            const transactionDesc = parsedInput.transactionDesc || `Payment for ${accountReference}`;

            if (!parsedInput.amount || !phoneNumber) {
                return JSON.stringify({
                    status: "error",
                    message: "Missing required fields: amount or phoneNumber",
                    code: "MISSING_INPUT",
                });
            }

            const requestData: STKPushRequest  = {
                Amount: parsedInput.amount,
                PhoneNumber: phoneNumber,
                AccountReference: accountReference,
                TransactionDesc: transactionDesc,
            };

            const txRes = await this.mpesaAgentKit.initiateStkPush(requestData);

            // Store the transaction details in the context for later use
            if (this.context) {
                this.context.lastTransaction = {
                    checkoutRequestId: txRes.CheckoutRequestID,
                    merchantRequestId: txRes.MerchantRequestID,
                    accountReference: accountReference,
                    amount: parsedInput.amount,
                    phoneNumber: phoneNumber,
                    timestamp: new Date().toISOString()
                };
            }

            return JSON.stringify({
                status: "success",
                message: "STK Push initiated successfully",
                data: {...txRes}
            });
        } catch (error: any) {
            console.error("Error initiating STK Push:", error);
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
} 