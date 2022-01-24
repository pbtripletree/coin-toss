// Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract TossToken is ERC20, Ownable {

    constructor() public ERC20("TossToken", "TOSS") {}

    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}
