import { ethers } from "ethers";
import sdk from "./1-initialize-sdk.js";

// This is the address to our ERC-20 token contract.
const tokenModule = sdk.getTokenModule(
  "0x1b5dDE59A16F86f7a7AA2F71a638c34C572a1965"
);

(async () => {
  try {
    // Grab all the addresses of people who own our membership NFT, which has
    // a tokenId of 0.
    const walletAddresses = [
      "0x694Afea1c9123f14d7C75D230369d92C2f729303",
      "0x9e5c5105e2Ff7E92CC51C757548D101e1753C46F",
    ];

    // Loop through the array of addresses.
    const airdropTargets = walletAddresses.map((address) => {
      // Pick a random # between 1000 and 10000.
      const randomAmount = Math.floor(
        Math.random() * (10000 - 1000 + 1) + 1000
      );
      console.log("✅ Going to airdrop", randomAmount, "tokens to", address);

      // Set up the target.
      const airdropTarget = {
        address,
        // Remember, we need 18 decimal placees!
        amount: ethers.utils.parseUnits(randomAmount.toString(), 18),
      };

      return airdropTarget;
    });

    // Call transferBatch on all our airdrop targets.
    console.log("🌈 Starting airdrop...");
    await tokenModule.transferBatch(airdropTargets);
    console.log("✅ Successfully airdropped tokens!");
  } catch (err) {
    console.error("Failed to airdrop tokens", err);
  }
})();
