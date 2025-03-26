// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NSEStockInvestment {
    struct Stock {
        string name;
        uint256 price;  // Stock price in smallest unit
        uint256 totalSupply;
    }

    mapping(string => Stock) public stocks;
    mapping(address => mapping(string => uint256)) public userHoldings;

    event StockPurchased(address indexed user, string stockSymbol, uint256 amount);
    event StockSold(address indexed user, string stockSymbol, uint256 amount);

    function addStock(string memory _symbol, string memory _name, uint256 _price, uint256 _totalSupply) public {
        stocks[_symbol] = Stock(_name, _price, _totalSupply);
    }

    function buyStock(string memory _symbol, uint256 _amount) public payable {
        require(stocks[_symbol].totalSupply >= _amount, "Not enough stocks available");

        uint256 cost = stocks[_symbol].price * _amount;
        require(msg.value >= cost, "Insufficient funds sent");

        stocks[_symbol].totalSupply -= _amount;
        userHoldings[msg.sender][_symbol] += _amount;

        emit StockPurchased(msg.sender, _symbol, _amount);
    }

    function sellStock(string memory _symbol, uint256 _amount) public {
        require(userHoldings[msg.sender][_symbol] >= _amount, "Not enough stocks owned");

        userHoldings[msg.sender][_symbol] -= _amount;
        stocks[_symbol].totalSupply += _amount;

        uint256 payout = stocks[_symbol].price * _amount;
        payable(msg.sender).transfer(payout);

        emit StockSold(msg.sender, _symbol, _amount);
    }
}