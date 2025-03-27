import { nseStockInvestmentContract } from "../../blockchain";

export async function get_investor_portfolio(investorAddress: string) {

    try {
        const result = await nseStockInvestmentContract.getInvestorPortfolio(investorAddress);

        // Format the response
        const portfolio = result.map((stock: any) => ({
            symbol: stock[0],
            stock: stock[0],
            amount: Number(stock[1]),
        }));

        return portfolio;

    } catch (error) {
        console.error("Error buying stocks:", error);
    }
}