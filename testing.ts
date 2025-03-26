
import fs from "fs";
import path from "path";
import { ethers, keccak256 } from "ethers";
import * as dotenv from 'dotenv'
import { Client, PrivateKey, AccountCreateTransaction, Hbar, Mnemonic } from "@hashgraph/sdk";
dotenv.config()

const { NSEStockInvestmentContractAddress, HEDERA_TESTNET_RPC_URL, HEDERA_PRIVATE_KEY } = process.env

const provider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC_URL);
const contract = new ethers.Contract(NSEStockInvestmentContractAddress!, getABI('NSEStockInvestment'), provider);

function getABI(contractName: string) {
    const filePath = path.join(__dirname, `./artifacts/contracts/${contractName}.sol/${contractName}.json`);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return jsonData.abi;
}

async function buyStocks(stockSymbol: string, amount: number) {
    const wallet = new ethers.Wallet(HEDERA_PRIVATE_KEY!, provider)
    const abi = getABI('NSEStockInvestment')
    const contract = new ethers.Contract(NSEStockInvestmentContractAddress!, abi, wallet);


    try {
        const tx = await contract.buyStock(stockSymbol, amount, { value: ethers.parseEther(String(amount * 1)) });
        console.log("Transaction Sent:", tx.hash);

        const receipt = await tx.wait(); // Wait for transaction confirmation
        console.log(receipt)
    } catch (error) {
        console.error("Error buying stocks:", error);
    }
}


// console.log(getABI('NSEStockInvestment'))
buyStocks('SCOM', 5)

function hedera_to_eth_address(hederaPublicKey: string) {
    // Remove the first 24 characters of the public key (prefix)
    let cleanPublicKey = hederaPublicKey.slice(-64);

    // Convert to Buffer for hashing
    let publicKeyBuffer = Buffer.from(cleanPublicKey, "hex");

    // Hash with Keccak-256
    let hash = keccak256(publicKeyBuffer);

    // Take the last 20 bytes (40 hex characters) and prepend "0x"
    return "0x" + hash.slice(-40);
}


async function create_hedera_wallet() {
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

    console.log(`✅ New Hedera Account Created!`);
    console.log(`📌 Account ID: ${newAccountId}`);
    console.log(`🔑 Public Key: ${newPublicKey.toStringRaw()}`);
    console.log(`🛡 Private Key: ${newPrivateKey.toString()}`);

    console.log('Generating the mnemonic...')

    const mnemonic = await Mnemonic.generate12();

    console.log(mnemonic._mnemonic.words.join(","))

    return {
        accountId: newAccountId.toString(),
        publicKey: newPublicKey.toString(),
        privateKey: newPrivateKey.toString(),
    };
}

// console.log(create_hedera_wallet())

// console.log(Mnemonic.generate12().then((res) => {
//     console.log(res)
// }))