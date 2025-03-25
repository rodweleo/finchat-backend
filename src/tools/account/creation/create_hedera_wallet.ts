
import { Client, PrivateKey, AccountCreateTransaction, Hbar, Mnemonic } from "@hashgraph/sdk";

export async function create_hedera_wallet() {
    // Load operator credentials from .env (your existing account)
    const { HEDERA_OPERATOR_ACCOUNT_ID, HEDERA_OPERATOR_PRIVATE_KEY } = process.env;

    const operatorPrivateKey = PrivateKey.fromString(HEDERA_OPERATOR_PRIVATE_KEY!);

    if (!HEDERA_OPERATOR_ACCOUNT_ID || !operatorPrivateKey) {
        throw new Error("Operator ID or Private Key is missing!");
    }

    // Create a Hedera client (Testnet)
    const client = Client.forTestnet();
    client.setOperator(HEDERA_OPERATOR_ACCOUNT_ID, operatorPrivateKey);

    // Generate a new key pair
    const newPrivateKey = PrivateKey.generateED25519();
    const newPublicKey = newPrivateKey.publicKey;

    // Create a new account transaction
    const transaction = new AccountCreateTransaction()
        .setKey(newPublicKey) // Set the public key
        .setInitialBalance(new Hbar(10)); // Fund the new account

    // Sign and execute the transaction
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const newAccountId = receipt.accountId!;

    // console.log(`✅ New Hedera Account Created!`);
    // console.log(`📌 Account ID: ${newAccountId}`);
    // console.log(`🔑 Public Key: ${newPublicKey.toString()}`);
    // console.log(`🛡 Private Key: ${newPrivateKey.toString()}`);

    const mnemonic = await Mnemonic.generate12();

    const recoveryPhrase = mnemonic._mnemonic.words.join(",")

    return {
        accountId: newAccountId.toString(),
        publicKey: `0x${newPublicKey.toStringRaw()}`,
        privateKey: newPrivateKey.toString(),
        recoveryPhrase: recoveryPhrase
    };
}
