import { Client, TokenCreateTransaction, TokenSupplyType, TokenType } from "@hashgraph/sdk";
import { CreateTokenResult } from "../../../types";

export interface CreateTokenOptions {
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: number;
  isSupplyKey?: boolean;
  tokenType: TokenType;
  client: Client;
  maxSupply?: number;
  isMetadataKey?: boolean;
  isAdminKey?: boolean;
  tokenMetadata?: Uint8Array<ArrayBufferLike>;
  memo?: string;
}

export const create_token = async (options: CreateTokenOptions): Promise<CreateTokenResult> => {
  const tx = new TokenCreateTransaction()
      .setTokenName(options.name)
      .setTokenSymbol(options.symbol)
      .setTokenType(options.tokenType)
      .setDecimals(options.decimals || 0)
      .setInitialSupply(options.initialSupply || 0)
      .setTreasuryAccountId(options.client.operatorAccountId!);

  // Optional and conditional parameters
  if (options.maxSupply) {
    tx.setMaxSupply(options.maxSupply).setSupplyType(TokenSupplyType.Finite);
  }
  if (options.tokenMetadata) {
    tx.setMetadata(options.tokenMetadata);
  }
  if (options.memo) {
    tx.setTokenMemo(options.memo);
  }
  if (options.isMetadataKey) {
    tx.setMetadataKey(options.client.operatorPublicKey!);
  }
  if (options.isSupplyKey) {
    tx.setSupplyKey(options.client.operatorPublicKey!);
  }
  if (options.isAdminKey) {
    tx.setAdminKey(options.client.operatorPublicKey!);
  }

  const txResponse = await tx.execute(options.client);
  const receipt = await txResponse.getReceipt(options.client);
  const txStatus = receipt.status;

  if (!receipt.tokenId) throw new Error("Token Create Transaction failed");

  return {
    status: txStatus.toString(),
    txHash: txResponse.transactionId.toString(),
    tokenId: receipt.tokenId,
  };
};