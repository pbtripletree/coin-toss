//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoinToss {
    bool private result;
    string public functionCalled;

    event NewToss(address indexed from, uint256 timestamp, uint256 wager, bool result);

    struct Toss {
        address tosser;
        uint256 timestamp;
        uint256 wager;
        bool result;
    }

    Toss[] tosses;

    constructor() payable {
        console.log("We have been constructed!");
        /*
         * Set the initial seed
         */
        result = rand() % 2 == 0 ? true : false;
    }

    function sendEther() external payable {
      functionCalled = 'sendEther';
    }

    fallback() external payable {
      functionCalled = 'fallback';
    }

    receive() external payable {
        functionCalled = 'receive';
    }

    function tossToken (bool guess, uint256 wager, address tokenAddress) public payable returns (string memory) {
      IERC20 token = IERC20(address(tokenAddress));
      require(token.transferFrom(msg.sender, address(this), wager));

      uint256 prize = 2 * wager;
      bool won = result == guess;
      result = rand() % 2 == 0 ? true : false;
      if (won) {
        token.approve(address(this), prize);
        bool success = token.transferFrom(address(this), msg.sender, prize);
        require(success, "Failed to withdraw TOSS from contract.");
        tosses.push(Toss(msg.sender, block.timestamp, wager, true));
        emit NewToss(msg.sender, block.timestamp, wager, true);
        console.log('you won!');
        return "You won! Keep it up.";
      } else {
        tosses.push(Toss(msg.sender, block.timestamp, wager, false));
        emit NewToss(msg.sender, block.timestamp, wager, false);
        console.log('you lost!');
        return "You lost! Try again.";
      }
    }

    function toss (bool guess) public payable returns (string memory) {
      uint256 prize = 2 * msg.value;
      bool won = result == guess;
      result = rand() % 2 == 0 ? true : false;
      console.log(result);
      if (won) {
        require(
            prize <= address(this).balance,
            "Trying to withdraw more money than they contract has."
        );
        (bool success, ) = (msg.sender).call{ value: prize }("");
        require(success, "Failed to withdraw money from contract.");
        tosses.push(Toss(msg.sender, block.timestamp, msg.value, true));
        emit NewToss(msg.sender, block.timestamp, msg.value, true);
        console.log('you won!');
        return "You won! Keep it up.";
      } else {
        tosses.push(Toss(msg.sender, block.timestamp, msg.value, false));
        emit NewToss(msg.sender, block.timestamp, msg.value, false);
        console.log('you lost!');
        return "You lost! Try again.";
      }
    }

    function getAllTosses() public view returns (Toss[] memory) {
        return tosses;
    }

    function rand() private view returns(uint256)
    {
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp + block.difficulty +
            ((uint256(keccak256(abi.encodePacked(block.coinbase)))) / (block.timestamp)) +
            block.gaslimit +
            ((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
            block.number
        )));

        return (seed - ((seed / 1000) * 1000));
    }
}
