import { Client, TokenId, TokenMintTransaction } from "@hashgraph/sdk"
import { MintNFTResult } from "../../../types";

// supports adding one metadata with length max 100 bytes
// adding array of metadatas is not implemented
export const mint_nft = async (
    tokenId: TokenId,
    tokenMetadata: Uint8Array<ArrayBufferLike>,
    client: Client
): Promise<MintNFTResult> => {
    const tx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(tokenMetadata)
        .freezeWith(client);

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("NFT token Minting Transaction failed");

    return {
        status: txStatus.toString(),
        txHash: txResponse.transactionId.toString(),
    }
}