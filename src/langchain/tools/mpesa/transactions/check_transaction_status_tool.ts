import { Tool } from '@langchain/core/tools';
import { supabaseClient } from '../../../../utils/supabaseClient';

export class CheckTransactionStatusTool extends Tool {
    name = 'mpesa_check_transaction_status';

    description = `Checks the status of an M-Pesa transaction. Use this tool after the user has initiated an stk push and the first response of a successful STK has been done
  
Inputs (input is a JSON string):
- checkoutRequestId: string - (optional The CheckoutRequestID from the STK Push response (optional, will use the last transaction if not provided)
- mpesaReceipt: string - The M-Pesa receipt number (optional, will use the last transaction if not provided)

Example usage:
1. {
  "checkoutRequestId": "ws_CO_11042025071101496795565344",
}

2. {
    "mpesaReceipt": "TDC8EKCW82"
}
  `;

    context?: any;

    protected async _call(input: string): Promise<string> {
        try {
            const parsedInput = JSON.parse(input);
            
            // Get the last transaction from the context if available
            const lastTransaction = this.context?.lastTransaction;
            
            // Use the provided checkoutRequestId or the one from the last transaction
            const checkoutRequestId = parsedInput.checkoutRequestId || (lastTransaction?.checkoutRequestId);
            
            // Use the provided mpesaReceipt or the one from the last transaction
            const mpesaReceipt = parsedInput.mpesaReceipt || (lastTransaction?.mpesaReceipt);
            
            if (!checkoutRequestId && !mpesaReceipt) {
                return JSON.stringify({
                    status: "error",
                    message: "No transaction ID or receipt provided and no recent transaction found in context",
                    code: "MISSING_INPUT",
                });
            }
            
            // Query the database for the transaction status
            let query = supabaseClient
                .from('manivas_stk_transactions')
                .select('*');
                
            if (checkoutRequestId) {
                query = query.eq('checkout_request_id', checkoutRequestId);
            } else if (mpesaReceipt) {
                query = query.eq('mpesa_receipt', mpesaReceipt);
            }
            
            const { data, error } = await query;
            
            if (error) {
                throw new Error(`Database query error: ${error.message}`);
            }
            
            if (!data || data.length === 0) {
                return JSON.stringify({
                    status: "not_found",
                    message: "Transaction not found in the database",
                    code: "NOT_FOUND",
                });
            }
            
            const transaction = data[0];
            
            // Format the response based on the transaction status
            let statusMessage = "";
            if (transaction.status === 'completed') {
                statusMessage = `Transaction completed successfully! Amount: KES ${transaction.amount}, Receipt: ${transaction.mpesa_receipt}`;
            } else if (transaction.status === 'failed') {
                statusMessage = `Transaction failed. Reason: ${transaction.result_desc}`;
            } else {
                statusMessage = `Transaction is still pending. Probably due to a pending STK Push or the response has not been registered yet. Please reach out if status still persists.`;
            }
            
            return JSON.stringify({
                status: "success",
                message: statusMessage,
                data: transaction
            });
        } catch (error: any) {
            console.error("Error checking transaction status:", error);
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
} 