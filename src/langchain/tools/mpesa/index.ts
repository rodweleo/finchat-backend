import { Tool } from "@langchain/core/tools";
import MpesaAgentKit from "../../../agent/mpesa";
import { STKPushTool, CheckTransactionStatusTool, BuyHBARCompleteWorkflowTool } from "./transactions";
import { HederaTransferHbarTool } from "../..";
import { SendWhatsAppMessageTool } from "../communication/whatsapp";
import HederaAgentKit from "../../../agent";

/**
 * Creates an array of M-Pesa tools for use with LangChain
 * @param mpesaAgentKit MpesaAgentKit instance
 * @returns Array of M-Pesa tools
 */
export function createMPesaTools(mpesaAgentKit: MpesaAgentKit, hederaAgentKit: HederaAgentKit): Tool[] {
    return [
        new STKPushTool(mpesaAgentKit),
        new CheckTransactionStatusTool(),
        new BuyHBARCompleteWorkflowTool(
            new STKPushTool(mpesaAgentKit),
            new CheckTransactionStatusTool(),
            new HederaTransferHbarTool(hederaAgentKit),
            new SendWhatsAppMessageTool()
        )
    ];
}