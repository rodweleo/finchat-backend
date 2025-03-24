import { AssociateTokenResult } from "../../../types";
import {Client, TokenAssociateTransaction, TokenId} from "@hashgraph/sdk";

export const associate_token = async (
    tokenId: TokenId,
    client: Client
): Promise<AssociateTokenResult> => {

    const tx = await new TokenAssociateTransaction()
        .setAccountId(client.operatorAccountId!.toString())
        .setTokenIds([tokenId])

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("Token Association failed")

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString(),
    }
}