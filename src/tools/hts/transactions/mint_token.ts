import { Client, TokenId, TokenMintTransaction } from "@hashgraph/sdk"
import { MintTokenResult } from "../../../types";

export const mint_token = async (
    tokenId: TokenId,
    amount: number,
    client: Client
): Promise<MintTokenResult> => {
    const tx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .freezeWith(client);

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("Token Minting Transaction failed");

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString(),
    }
}