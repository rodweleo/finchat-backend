import { ethers, ContractTransactionReceipt } from "ethers";
import { getContractAbi, nseStockInvestmentContract, provider } from "../../blockchain";

export async function buy_stock(stockSymbol: string, amount: number, clientPrivateKey: string) {

    if (!clientPrivateKey) {
        throw new Error("Invalid client private key. Please provide a valid private key to ensure the transactions are seamless.");
    }

    const wallet = new ethers.Wallet(clientPrivateKey, provider)
    const abi = getContractAbi('NSEStockInvestment')
    const contract = new ethers.Contract(nseStockInvestmentContract!, abi, wallet);

    try {
        const tx = await contract.buyStock(stockSymbol, amount, { value: ethers.parseEther(String(amount * 1)) });
        console.log("Transaction Sent:", tx.hash);

        const receipt: ContractTransactionReceipt = await tx.wait(); // Wait for transaction confirmation

        console.log("Transaction receipt: ", JSON.stringify(receipt))

        return receipt;

    } catch (error) {
        console.error("Error buying stocks:", error);
    }
}

buy_stock("SCOM", 5, "1dd4a76ef40387669b63a7fe8282bd05624d0b88a9cd92b1a38c46a38d59f8bc")