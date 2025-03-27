import { nseStockInvestmentContract } from "../../blockchain";

export async function get_stock_by_symbol(stockSymbol: string) {

    try {
        const result = await nseStockInvestmentContract.getStockDetails(stockSymbol);

        // Format the response
        const stockDetails = {
            name: result[0],         // Stock name (e.g., "IBM" or "Safaricom")
            price: Number(result[1]), // Convert BigNumber to a regular number
            totalSupply: Number(result[2]), // Convert BigNumber to a regular number
            active: result[3],       // Stock active status (true/false)
        };

        return stockDetails;

    } catch (error) {
        console.error(`Error retrieving ${stockSymbol}'s stock details:`, error);
    }
}

get_stock_by_symbol("SCOM").then((res) => {
    console.log(res)
})