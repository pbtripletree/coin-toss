const main = async () => {
  const coinTossContractFactory = await hre.ethers.getContractFactory(
    "CoinToss"
  );
  const coinTossContract = await coinTossContractFactory.deploy({
    value: hre.ethers.utils.parseEther("0.5"),
  });

  await coinTossContract.deployed();

  console.log("CoinToss address: ", coinTossContract.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
