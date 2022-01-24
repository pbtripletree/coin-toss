import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers, utils } from "ethers";
import abi from "./utils/CoinToss.json";
import tokenABI from "./utils/TossToken.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const [tossing, setTossing] = useState(false);

  const [allTosses, setAllTosses] = useState([]);

  const [wager, setWager] = useState(1);

  const [contractBalance, setContractBalance] = useState(0);

  const [userBalance, setUserBalance] = useState(0);

  const contractAddress = "0x392C3118D6D442679250151f82b7c58E2890dffF";

  const tokenContractAddress = "0x1b5dde59a16f86f7a7aa2f71a638c34c572a1965";

  const contractABI = abi.abi;
  const tokenContractABI = tokenABI.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getUserBalance = async (tokenContract) => {
    let balance;
    if (currentAccount) {
      balance = ethers.utils.formatEther(
        await tokenContract.balanceOf(currentAccount)
      );
    } else {
      const { ethereum } = window;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const userAccount = accounts[0];
      balance = ethers.utils.formatEther(
        await tokenContract.balanceOf(userAccount)
      );
    }
    return Math.round(balance, 1);
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllTosses();
    } catch (error) {
      console.log(error);
    }
  };

  const toss = async (side) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const coinTossContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const tokenContract = new ethers.Contract(
          tokenContractAddress,
          tokenContractABI,
          signer
        );

        const approveTxn = await tokenContract.approve(
          contractAddress,
          ethers.utils.parseUnits(`${wager}`, "ether")
        );
        setTossing(true);
        await approveTxn.wait();

        const tossTokenTxn = await coinTossContract.tossToken(
          side,
          ethers.utils.parseUnits(`${wager}`, "ether"),
          tokenContractAddress,
          { gasLimit: 300000 }
        );

        const message = await tossTokenTxn.wait();
        console.log(message);

        setTossing(false);

        const balance = await tokenContract.balanceOf(contractAddress);

        setContractBalance(ethers.utils.formatEther(balance));
        setUserBalance(await getUserBalance(tokenContract));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllTosses = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const coinTossContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const tokenContract = new ethers.Contract(
          tokenContractAddress,
          tokenContractABI,
          signer
        );

        const tosses = await coinTossContract.getAllTosses();

        const balance = await tokenContract.balanceOf(contractAddress);

        setContractBalance(ethers.utils.formatEther(balance));

        setUserBalance(await getUserBalance(tokenContract));

        const tossesCleaned = tosses
          .map((toss) => {
            return {
              address: toss.tosser,
              timestamp: new Date(toss.timestamp * 1000),
              wager: toss.wager,
              result: toss.result,
            };
          })
          .sort(function (a, b) {
            console.log(new Date(a.timestamp).getTime());
            return new Date(a.timestamp).getTime() >
              new Date(a.timestamp).getTime()
              ? 1
              : -1;
          });

        console.log(tossesCleaned);

        setAllTosses(tossesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let coinTossContract;

    const onNewToss = (from, timestamp, wager, result) => {
      setAllTosses((prevState) => [
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          wager: wager,
          result: result,
        },
        ...prevState,
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      coinTossContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      coinTossContract.on("NewToss", onNewToss);
    }

    return () => {
      if (coinTossContract) {
        coinTossContract.off("NewToss", onNewToss);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">🦄</div>
        <div className="header">Toss some $TOSS</div>

        <div className="bio">Win or lose 🤷‍♀️!</div>

        {!currentAccount && [
          <button className="tossButton" onClick={connectWallet}>
            Connect Wallet
          </button>,
        ]}

        {currentAccount && [
          <div className="bio">
            <b>Toss contract balance 👀: {contractBalance} $TOSS</b>
          </div>,
          <div className="bio">
            <b>Your balance 👍: {userBalance} $TOSS</b>
          </div>,
          <div className="bio">Wager 💰⬇️</div>,
          <input
            type="number"
            value={wager}
            label="wager"
            min="1"
            max="10"
            className="wager"
            onChange={(e) => setWager(e.target.value)}
          />,
        ]}

        {currentAccount &&
          !tossing && [
            <button className="tossButton" onClick={() => toss(true)}>
              Heads 🧐
            </button>,
            <button className="tossButton" onClick={() => toss(false)}>
              Tails 😬
            </button>,
          ]}

        {tossing && <p>tossing...</p>}

        {currentAccount && <div className="bio">Recent tosses:</div>}

        {allTosses.slice(0, 20).map((toss, index) => {
          const tossMessage = `${toss.address} ${toss.result ? `📈` : `📉`} ${
            toss.result
              ? Math.round(ethers.utils.formatEther(toss.wager) * 2, 1)
              : Math.round(ethers.utils.formatEther(toss.wager), 1)
          } $TOSS`;
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                margin: "16px",
                padding: "8px",
              }}
            >
              <div>{tossMessage}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
