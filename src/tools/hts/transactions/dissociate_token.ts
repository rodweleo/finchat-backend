import { DissociateTokenResult } from "../../../types";
import { Client, TokenDissociateTransaction, TokenId } from "@hashgraph/sdk";

export const dissociate_token = async (
    tokenId: TokenId,
    client: Client
): Promise<DissociateTokenResult> => {

    const tx = await new TokenDissociateTransaction()
        .setAccountId(client.operatorAccountId!.toString())
        .setTokenIds([tokenId])

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("Token dissociation failed")

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString(),
    }
}