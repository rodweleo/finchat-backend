import { Client, TokenId, TransferTransaction, AccountId } from "@hashgraph/sdk"
import { TransferTokenResult } from "../../../types";

export const transfer_token = async (
  tokenId: TokenId,
  toAccountId: string | AccountId,
  amount: number,
  client: Client
): Promise<TransferTokenResult> => {
  const tx = new TransferTransaction()
    .addTokenTransfer(tokenId, client.operatorAccountId!, -amount)
    .addTokenTransfer(tokenId, toAccountId, amount)

  const txResponse = await tx.execute(client)
  const receipt = await txResponse.getReceipt(client)
  const txStatus = receipt.status;

  if (!txStatus.toString().includes('SUCCESS'))
    throw new Error("Token Transfer Transaction failed")

  return {
    status: txStatus.toString(),
    txHash: txResponse.transactionId.toString(),
  }
}
