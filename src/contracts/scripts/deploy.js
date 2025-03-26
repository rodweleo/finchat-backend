import { ethers } from "hardhat";

async function main() {
    const NSEStockInvestment = await ethers.getContractFactory("NSEStockInvestment");
    const contract = await NSEStockInvestment.deploy();
    await contract.deployed();

    console.log("NSE Stock Contract deployed at:", contract.address);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
