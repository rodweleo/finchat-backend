import { Client, TokenId, TokenRejectTransaction } from "@hashgraph/sdk";
import { RejectTokenResult } from "../../../types";

export const reject_token = async (
    tokenId: TokenId,
    client: Client
): Promise<RejectTokenResult> => {
    const tx = new TokenRejectTransaction()
        .setOwnerId(client.operatorAccountId!)
        .addTokenId(tokenId)
        .freezeWith(client);

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("Token Rejection Transaction failed");

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString()
    }
}