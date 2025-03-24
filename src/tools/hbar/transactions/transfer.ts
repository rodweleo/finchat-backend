import { Client, Hbar, TransferTransaction, AccountId } from "@hashgraph/sdk"
import { TransferHBARResult } from "../../../types";

export const transfer_hbar = async (
    client: Client,
    toAccountId: string | AccountId,
    amount: string,
): Promise<TransferHBARResult> => {
    const operatorAccountId = client.operatorAccountId?.toString();

    if(!operatorAccountId) {
        throw new Error("Invalid operator accountId in client");
    }

    const tx = new TransferTransaction()
        .addHbarTransfer(operatorAccountId, new Hbar(-amount))
        .addHbarTransfer(toAccountId, new Hbar(amount))

    const txResponse = await tx.execute(client)
    const receipt = await txResponse.getReceipt(client)
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("HBAR Transfer Transaction failed")

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString(),
    }
}
