
import { ethers, parseEther } from "ethers"

const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL!);

export const verifyAddress = (address: string) => {
    return ethers.isAddress(address)
}

export const sendCrypto = (to: string, amount: number) => {

    if (!verifyAddress(to)) {
        throw new Error("Invalid wallet address")
    }

    const wallet = new ethers.Wallet(process.env.MANIVAS_ETH_ACCOUNT_PRIVATE_KEY!, provider);

    const transaction = {
        to,
        value: parseEther(amount.toString())
    }

    return wallet.sendTransaction(transaction);
}

export const checkCryptoWalletBalance = async (address: string) => {
    if (!verifyAddress(address)) {
        throw new Error("Invalid wallet address")
    }

    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance)
}

export const verifyCryptoTransaction = async (transactionHash: string) => {
    const transaction = await provider.getTransactionReceipt(transactionHash);
    return transaction
}