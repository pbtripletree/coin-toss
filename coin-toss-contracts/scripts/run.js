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

  let playerBalance = await hre.ethers.provider.getBalance(
    owner.address
  );

  console.log(
    "Contract balance:",
    hre.ethers.utils.formatEther(contractBalance)
  );

  console.log("My balance:", hre.ethers.utils.formatEther(playerBalance));

  /*
   * Let's try two waves now
   */
  const wager = 0.1
  let coinTossTxn = await coinTossContract.toss(true, { value: hre.ethers.utils.parseUnits(`${wager}`, 'ether').toHexString() });
  await coinTossTxn.wait();

  playerBalance = await hre.ethers.provider.getBalance(
    owner.address
  );

  contractBalance = await hre.ethers.provider.getBalance(
    coinTossContract.address
  );

  console.log(
    "Contract balance:",
    hre.ethers.utils.formatEther(contractBalance)
  );

  console.log("My balance:", hre.ethers.utils.formatEther(playerBalance));

  coinTossTxn = await coinTossContract.toss(false, { value: hre.ethers.utils.parseUnits(`${wager}`, 'ether').toHexString() });
  await coinTossTxn.wait();

  playerBalance = await hre.ethers.provider.getBalance(
    owner.address
  );

  contractBalance = await hre.ethers.provider.getBalance(
    coinTossContract.address
  );

  console.log(
    "Contract balance:",
    hre.ethers.utils.formatEther(contractBalance)
  );

  console.log("My balance:", hre.ethers.utils.formatEther(playerBalance));

  const tosses = await coinTossContract.getAllTosses();
  console.log(tosses);
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
