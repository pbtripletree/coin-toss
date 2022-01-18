import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers, utils } from "ethers";
import abi from "./utils/CoinToss.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const [tossing, setTossing] = useState(false)

  const [allTosses, setAllTosses] = useState([]);

  const [wager, setWager] = useState(1);

  const [contractBalance, setContractBalance] = useState(0);

  const contractAddress = "0xb0220314B172B9395C57894b9154B651BB298918";

  const contractABI = abi.abi;

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

        // await signer.sendTransaction({
        //   to: contractAddress,
        //   from: currentAccount,
        //   value: ethers.utils.parseUnits(`${wager / 10}`, 'ether').toHexString()
        // })

        /*
         * Execute the actual wave from your smart contract
         */
        const tossTxn = await coinTossContract.toss(side, {
          value: ethers.utils.parseUnits(`${wager}`, 'ether').toHexString(),
          gasLimit: 300000,
        });
        setTossing(true)

        const message = await tossTxn.wait();

        console.log(message);

        setTossing(false)

        const balance = await provider.getBalance(contractAddress);

        setContractBalance(ethers.utils.formatEther(balance))
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
        const tosses = await coinTossContract.getAllTosses();

        const balance = await provider.getBalance(contractAddress);
        console.log(balance);
        setContractBalance(ethers.utils.formatEther(balance))

        const tossesCleaned = tosses
          .map((toss) => {
            return {
              address: toss.tosser,
              timestamp: new Date(toss.timestamp * 1000),
              wager: toss.wager,
              result: toss.result
            };
          })
          .sort(function (a, b) {
            console.log(new Date(a.timestamp).getTime());
            return new Date(a.timestamp).getTime() > new Date(a.timestamp).getTime() ? 1 : -1;
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
          result: result
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
        <div className="header">Toss a coin</div>

        <div className="bio"><b>Contract balance: {contractBalance} ETH</b></div>

        <div className="bio">Win or lose money!</div>
        {!currentAccount && (
          <button className="tossButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          [
            <div className="bio">Wager:</div>,
            <input
              type="number"
              value={wager}
              label="wager"
              min="1"
              max="10"
              onChange={(e) => setWager(e.target.value)}
            />
          ]
        )}

        {currentAccount && (
          [
            <button className="tossButton" onClick={() => toss(true)}>
              Heads
            </button>,
            <button className="tossButton" onClick={() => toss(false)}>
              Tails
            </button>,
            <div className="bio">Recent tosses:</div>
          ]
        )}

        {tossing && (<p>tossing...</p>)}

        {allTosses.map((toss, index) => {
          const tossMessage = `${toss.address} ${toss.result ? 'won' : 'lost'} ${toss.result ? (ethers.utils.formatEther(toss.wager)) * 2 : ethers.utils.formatEther(toss.wager)} ETH`
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
