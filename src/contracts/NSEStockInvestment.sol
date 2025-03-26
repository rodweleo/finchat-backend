// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NSEStockInvestment {
    struct Stock {
        string symbol;
        string name;
        uint256 price;  // Stock price in smallest unit
        uint256 totalSupply;
        bool active; // controls if trading is enabled
    }

    // Struct for investor portfolio holdings
    struct Holding {
        string symbol;
        uint256 totalShares;
    }

    mapping(string => Stock) public stocks;
    // Mapping from investor to stock symbol to share count
    mapping(address => mapping(string => uint256)) private userHoldings;
    // Array to track all stock symbols in the contract
    string[] public stockSymbols;
    address public owner;

    event StockPurchased(address indexed user, string stockSymbol, uint256 amount);
    event StockSold(address indexed user, string stockSymbol, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addStock(
        string memory _symbol, 
        string memory _name, 
        uint256 _price, 
        uint256 _totalSupply
    ) public onlyOwner {
        require(!stocks[_symbol].active, "Stock already exists");
        stocks[_symbol] = Stock(_symbol, _name, _price, _totalSupply, true);
        stockSymbols.push(_symbol);
    }
    
    // Allow owner to enable or disable a stock for trading
    function setStockActive(string memory _symbol, bool _active) public onlyOwner {
        require(bytes(stocks[_symbol].name).length != 0, "Stock does not exist");
        stocks[_symbol].active = _active;
    }

    function buyStock(string memory _symbol, uint256 _amount) public payable {
        require(stocks[_symbol].active, "Stock is not active for trading");
        require(stocks[_symbol].totalSupply >= _amount, "Not enough stocks available");

        uint256 cost = stocks[_symbol].price * _amount;
        require(msg.value >= cost, "Insufficient funds sent");

        stocks[_symbol].totalSupply -= _amount;
        userHoldings[msg.sender][_symbol] += _amount;

        // Refund any excess ETH sent
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit StockPurchased(msg.sender, _symbol, _amount);
    }

    function sellStock(string memory _symbol, uint256 _amount) public {
        require(stocks[_symbol].active, "Stock is not active for trading");
        require(userHoldings[msg.sender][_symbol] >= _amount, "Not enough stocks owned");

        userHoldings[msg.sender][_symbol] -= _amount;
        stocks[_symbol].totalSupply += _amount;

        uint256 payout = stocks[_symbol].price * _amount;
        payable(msg.sender).transfer(payout);

        emit StockSold(msg.sender, _symbol, _amount);
    }

    /// @notice Retrieves the investor's portfolio.
    /// @dev Returns an array of holdings (symbol and totalShares) for all stocks the user has ever bought.
    function getInvestorPortfolio(address _investor) public view returns (Holding[] memory) {
        // First count how many stocks the investor has nonzero holdings in.
        uint256 count = 0;
        for (uint256 i = 0; i < stockSymbols.length; i++) {
            if (userHoldings[_investor][stockSymbols[i]] > 0) {
                count++;
            }
        }
        
        Holding[] memory portfolio = new Holding[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < stockSymbols.length; i++) {
            uint256 shares = userHoldings[_investor][stockSymbols[i]];
            if (shares > 0) {
                portfolio[index] = Holding(stockSymbols[i], shares);
                index++;
            }
        }
        return portfolio;
    }

    // Retrieve stock details including active status
    function getStockDetails(string memory _symbol) public view returns (string memory name, uint256 price, uint256 totalSupply, bool active) {
        require(bytes(stocks[_symbol].name).length != 0, "Stock does not exist");
        Stock memory stock = stocks[_symbol];
        return (stock.name, stock.price, stock.totalSupply, stock.active);
    }

    function getAllStocks() public view returns (Stock[] memory) {
        uint256 count = stockSymbols.length;
        Stock[] memory stockData = new Stock[](count);

        for (uint256 i = 0; i < count; i++) {
            string memory symbol = stockSymbols[i];
            stockData[i] = stocks[symbol]; // ✅ Symbol is now part of Stock struct
        }

        return stockData;
    }
}
