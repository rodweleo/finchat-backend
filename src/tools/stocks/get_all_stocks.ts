import { nseStockInvestmentContract } from "../../blockchain";

export async function get_all_stocks() {

    try {
        const result = await nseStockInvestmentContract.getAllStocks();

        // Format the response
        const stocks = result.map((stock: any) => ({
            symbol: stock[0],       // Stock symbol (e.g., "IBM")
            name: stock[1],         // Stock name (e.g., "IBM" or "Safaricom")
            price: Number(stock[2]), // Convert BigNumber to a regular number
            totalSupply: Number(stock[3]), // Convert BigNumber to a regular number
            active: stock[4],       // Stock active status (true/false)
        }));

        return stocks;

    } catch (error) {
        console.error("Error buying stocks:", error);
        return []
    }
}