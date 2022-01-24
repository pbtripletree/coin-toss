const main = async () => {
  const coinTossContractFactory = await hre.ethers.getContractFactory(
    "CoinToss"
  );
  const coinTossContract = await coinTossContractFactory.deploy({
    value: hre.ethers.utils.parseEther("0.5"),
  });
  await coinTossContract.deployed();
  console.log("Contract address:", coinTossContract.address);

  const [owner] = await ethers.getSigners();

  let contractBalance = await hre.ethers.provider.getBalance(
    coinTossContract.address
  );

  let playerBalance = await hre.ethers.provider.getBalance(owner.address);

  // console.log(
  //   "Contract balance:",
  //   hre.ethers.utils.formatEther(contractBalance)
  // );
  //
  // console.log("My balance:", hre.ethers.utils.formatEther(playerBalance));

  const tossTokenContractFactory = await hre.ethers.getContractFactory(
    "TossToken"
  );
  const tossTokenContract = await tossTokenContractFactory.deploy();
  await tossTokenContract.deployed();

  console.log("Token address:", tossTokenContract.address);

  const amount = 1_000;
  // We use the util function from "ethers" to convert the amount
  // to have 18 decimals (which is the standard for ERC20 tokens).
  const amountWith18Decimals = hre.ethers.utils.parseUnits(
    amount.toString(),
    18
  );

  tossTokenContract.mint(owner.address, amountWith18Decimals);

  tossTokenContract.approve(
    owner.address,
    ethers.utils.parseUnits("100", "ether")
  );

  tossTokenContract.transferFrom(
    owner.address,
    coinTossContract.address,
    ethers.utils.parseUnits("100", "ether")
  );

  await console.log(
    "contract token balance: ",
    hre.ethers.utils.formatEther(
      await tossTokenContract.balanceOf(coinTossContract.address)
    )
  );

  await console.log(
    "player token balance: ",
    hre.ethers.utils.formatEther(
      await tossTokenContract.balanceOf(owner.address)
    )
  );

  tossTokenContract.approve(
    coinTossContract.address,
    ethers.utils.parseUnits(`1`, "ether")
  );

  let tossWithTokenTxn = await coinTossContract.tossToken(
    true,
    ethers.utils.parseUnits(`1`, "ether"),
    tossTokenContract.address
  );

  await console.log(
    "contract token balance: ",
    hre.ethers.utils.formatEther(
      await tossTokenContract.balanceOf(coinTossContract.address)
    )
  );

  await console.log(
    "player token balance: ",
    hre.ethers.utils.formatEther(
      await tossTokenContract.balanceOf(owner.address)
    )
  );
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
