import { Tool } from '@langchain/core/tools';
import { CheckTransactionStatusTool } from './check_transaction_status_tool';
import { HederaTransferHbarTool } from '../../..';
import { SendWhatsAppMessageTool } from '../../communication/whatsapp';
import { STKPushTool } from './initiate_stk_push_tool';


export class BuyHBARCompleteWorkflowTool extends Tool {
    name = 'buy_hbar_complete_workflow';
    context?: any;

    private stkPushTool: STKPushTool;
    private checkTransactionTool: CheckTransactionStatusTool;
    private transferHBARTool: HederaTransferHbarTool;
    private sendWhatsAppTool: SendWhatsAppMessageTool;
    private pollingTimeouts: Map<string, NodeJS.Timeout> = new Map();

    description = `This tool handles the complete workflow of buying HBAR tokens using M-Pesa. Use this tool to buy HBAR tokens using MPesa It will:
    1. Initiate an M-Pesa payment
    2. Check if the payment was completed
    3. Transfer HBAR tokens to your Hedera account
    4. Send you a WhatsApp confirmation
    
Inputs (input is a JSON string):
- amount: number - The amount to be paid in M-Pesa (e.g., 1000)
- phoneNumber: string - The customer's phone number in format 254XXXXXXXXX (e.g., "254712345678")
- hederaAccountId: string - The Hedera Account ID where HBAR tokens will be sent (e.g., "0.0.123456")
- accountReference: (string, optional) - Reference for the transaction (e.g., "ORDER123")
- transactionDesc: (string, optional) - Description of the transaction (e.g., "Payment for Order #123")

Example usage:
{
  "amount": 1000,
  "phoneNumber": "254712345678",
  "hederaAccountId": "0.0.123456",
  "accountReference": "ORDER123",
  "transactionDesc": "Payment for Order #123"
}`;

    constructor(
        stkPushTool: STKPushTool,
        checkTransactionTool: CheckTransactionStatusTool,
        transferHBARTool: HederaTransferHbarTool,
        sendWhatsAppTool: SendWhatsAppMessageTool
    ) {
        super();
        this.stkPushTool = stkPushTool;
        this.checkTransactionTool = checkTransactionTool;
        this.transferHBARTool = transferHBARTool;
        this.sendWhatsAppTool = sendWhatsAppTool;
    }

    private calculateHBARAmount(mpesaAmount: number): number {
        return mpesaAmount / 100; // Example: 1 M-Pesa = 0.01 HBAR
    }

    private startPolling(transactionId: string, phoneNumber: string, hederaAccountId: string, amount: number) {
        // Clear any existing timeout for this transaction
        if (this.pollingTimeouts.has(transactionId)) {
            clearTimeout(this.pollingTimeouts.get(transactionId));
        }

        // Set a timeout to stop polling after 20 seconds
        const timeout = setTimeout(async () => {
            console.log(`Polling timeout reached for transaction ${transactionId}`);
            this.pollingTimeouts.delete(transactionId);

            // Send a timeout message to the user
            await this.sendWhatsAppTool.invoke(JSON.stringify({
                phoneNumber,
                message: `Your M-Pesa payment for HBAR tokens is taking longer than expected. Please check your phone to complete the payment. If you've already paid, please contact support.`
            }));
        }, 10000);

        this.pollingTimeouts.set(transactionId, timeout);

        // Function to poll for transaction status
        const poll = async () => {
            // Check transaction status
            const statusResult = await this.checkTransactionTool.invoke(JSON.stringify({
                checkoutRequestId: transactionId
            }));

            console.log("Transaction status: ", statusResult)

            const parsedStatus = JSON.parse(statusResult);

            // Transaction is completed, transfer HBAR tokens
            const hbarAmount = this.calculateHBARAmount(amount);

            const transferResult = await this.transferHBARTool.invoke(JSON.stringify({
                toAccountId: hederaAccountId,
                amount: hbarAmount
            }));

            console.log("HBAR Transfer result: ", transferResult)

            const parsedTransfer = JSON.parse(transferResult);

            if (parsedTransfer.status === "success") {
                // Send success message to user
                await this.sendWhatsAppTool.invoke(JSON.stringify({
                    phoneNumber,
                    message: `Your HBAR tokens have been successfully transferred to your Hedera account ${hederaAccountId}. Amount: ${hbarAmount} HBAR. Transaction ID: ${transactionId}`
                }));
            } else {
                // Send error message about transfer
                await this.sendWhatsAppTool.invoke(JSON.stringify({
                    phoneNumber,
                    message: `Your M-Pesa payment was successful, but there was an issue transferring HBAR tokens. Please contact support with transaction ID: ${transactionId}`
                }));
            }

            // Stop polling
            clearTimeout(timeout);
            this.pollingTimeouts.delete(transactionId);

            if (parsedStatus.status === "success" && parsedStatus.data.status === 'failed') {
                // Transaction failed, notify user
                await this.sendWhatsAppTool.invoke(JSON.stringify({
                    phoneNumber,
                    message: `Your M-Pesa payment for HBAR tokens failed. Reason: ${parsedStatus.data.result_desc}. Please try again.`
                }));

                // Stop polling
                clearTimeout(timeout);
                this.pollingTimeouts.delete(transactionId);
            } else {
                // Transaction not completed yet, check again in 10 seconds
                setTimeout(poll, 1000); // Reduced from 3000 to 1000 (1 second)
            }
        };

        // Start polling
        poll();
    }

    protected async _call(input: string): Promise<string> {
        try {
            const parsedCompleteWF = JSON.parse(input)

            // Step 1: Initiate M-Pesa payment
            const buyResult = await this.stkPushTool.invoke(input);
            const parsedBuyResult = JSON.parse(buyResult);

            if (parsedBuyResult.status !== "success") {
                return buyResult; 
            }

            console.log("STK Response: " + buyResult)

            // Extract transaction details
            const transactionId = parsedBuyResult.data.CheckoutRequestID;
            const phoneNumber = parsedCompleteWF.phoneNumber;
            const hederaAccountId = parsedCompleteWF.hederaAccountId;
            const amount = parsedCompleteWF.amount;

            // Send initial WhatsApp message
            await this.sendWhatsAppTool.invoke(JSON.stringify({
                phoneNumber,
                message: `Your M-Pesa payment for HBAR tokens has been initiated. Please complete the payment on your phone. Once confirmed, HBAR tokens will be sent to your Hedera account ${hederaAccountId}.`
            }));

            // Start polling for transaction completion
            this.startPolling(transactionId, phoneNumber, hederaAccountId, amount);

            // Return success response
            return JSON.stringify({
                status: "success",
                message: "M-Pesa payment initiated. You will receive a WhatsApp message once the payment is confirmed and HBAR tokens are transferred.",
                data: {
                    transactionId,
                    phoneNumber,
                    hederaAccountId,
                    amount,
                    nextSteps: [
                        "Complete the payment on your phone",
                        "Wait for payment confirmation",
                        "You will receive a WhatsApp message when HBAR tokens are transferred"
                    ]
                }
            });
        } catch (error: any) {
            console.error("Error in buy HBAR workflow:", error);
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
}