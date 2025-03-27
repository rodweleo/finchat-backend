import { nseStockInvestmentContract } from "../../blockchain";

export async function get_stock_by_symbol(stockSymbol: string) {

    try {
        const result = await nseStockInvestmentContract.getStockDetails(stockSymbol);

        // Format the response
        const stockDetails = result.map((stock: any) => ({
            name: stock[0],         // Stock name (e.g., "IBM" or "Safaricom")
            price: Number(stock[1]), // Convert BigNumber to a regular number
            totalSupply: Number(stock[2]), // Convert BigNumber to a regular number
            active: stock[3],       // Stock active status (true/false)
        }));

        return stockDetails;

    } catch (error) {
        console.error(`Error retrieving ${stockSymbol}'s stock details:`, error);
    }
}