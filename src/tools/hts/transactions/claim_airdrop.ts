import { Client, TokenClaimAirdropTransaction, PendingAirdropId } from "@hashgraph/sdk"
import { ClaimAirdropResult } from "../../../types";

export const claim_airdrop = async (
    client: Client,
    airdropId: PendingAirdropId
): Promise<ClaimAirdropResult> => {
    const tx = new TokenClaimAirdropTransaction()
        .addPendingAirdropId(airdropId)
        .freezeWith(client);

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("Token Airdrop Transaction failed");

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString(),
    }
}