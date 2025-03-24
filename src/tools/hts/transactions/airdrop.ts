import { Client, TokenId, AccountId, TokenAirdropTransaction } from "@hashgraph/sdk"
import { AirdropResult } from "../../../types";

export interface AirdropRecipient {
  accountId: string | AccountId;
  amount: number;
}

export const airdrop_token = async (
  tokenId: TokenId,
  recipients: AirdropRecipient[],
  client: Client
): Promise<AirdropResult> => {
  const tx = new TokenAirdropTransaction();
  
  // Add token transfers for each recipient
  for (const recipient of recipients) {
    // Deduct from sender
    tx.addTokenTransfer(tokenId, client.operatorAccountId!, -recipient.amount);
    // Add to recipient
    tx.addTokenTransfer(tokenId, recipient.accountId, recipient.amount);
  }

  const txResponse = await tx.freezeWith(client).execute(client);
  const receipt = await txResponse.getReceipt(client);
  const txStatus = receipt.status;

  if (!txStatus.toString().includes('SUCCESS'))
    throw new Error("Token Airdrop Transaction failed");

  return {
    status: txStatus.toString(),
    txHash: txResponse.transactionId.toString(),
  }
} 