import React, { useEffect, useState } from "react";
import "./App.css";
import { useWeb3 } from "@3rdweb/hooks";
import { ThirdwebSDK } from "@3rdweb/sdk";

import { ethers } from "ethers";

const sdk = new ThirdwebSDK("rinkeby");

const tokenModule = sdk.getTokenModule(
  "0x1b5dde59a16f86f7a7aa2f71a638c34c572a1965"
);

const voteModule = sdk.getVoteModule(
  "0xcE92548CC0F159Cf847Bc561Ddd307deCDF5D7a8"
);

const bankAddress = "0x392C3118D6D442679250151f82b7c58E2890dffF";

const App = () => {
  const { connectWallet, address, error, provider } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [toExecute, setToExecute] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const signer = provider ? provider.getSigner() : undefined;
  const [isVoting, setIsVoting] = useState(false);
  const [isProposing, setIsProposing] = useState(false);

  // Another useEffect!
  useEffect(() => {
    // We pass the signer to the sdk, which enables us to interact with
    // our deployed contract!
    sdk.setProviderOrSigner(signer);
  }, [signer]);

  useEffect(() => {
    if (!address) {
      return;
    }
  }, [address]);

  const fetchProposals = async () => {
    const proposals = await voteModule.getAll();
    const activeProposals = await Promise.all(
      proposals.map(async (proposal) => {
        if (proposal.state !== 1) return null;
        const voted = await voteModule
          .hasVoted(proposal.proposalId, address)
          .then((vote) => vote);
        if (!voted) return proposal;
      })
    );
    setToExecute(
      proposals.filter(
        (proposal) => proposal.state === 4 && proposal.proposer === address
      )
    );
    setProposals(activeProposals.filter((proposal) => proposal));
  };

  useEffect(async () => {
    // A simple call to voteModule.getAll() to grab the proposals.
    if (!address) return;
    await fetchProposals();
  }, [address]);

  // useEffect(() => {
  //   if (proposals.length) {
  //     console.log("proposals have length");
  //     setCurrentProposal(
  //       proposals.find(
  //         (proposal) => !voteModule.hasVoted(proposal.proposalId, address)
  //       )
  //     );
  //     console.log(currentProposal);
  //   }
  // }, [proposals]);

  const executeProposal = async (proposalId) => {
    setToExecute(
      toExecute.filter((proposal) => proposal.proposalId !== proposalId)
    );
    setIsExecuting(true);
    await voteModule.execute(proposalId);
    setIsExecuting(false);
  };

  const requestFillTreasury = async () => {
    const amount = 100_000;
    setIsProposing(true);
    const newProposal = await voteModule.propose(
      address +
        " is requesting to mint " +
        amount +
        " $TOSS tokens and give to treasury! (vote-id: " +
        new Date() +
        ")",
      [
        {
          // Our nativeToken is ETH. nativeTokenValue is the amount of ETH we want
          // to send in this proposal. In this case, we're sending 0 ETH.
          // We're just minting new tokens to the treasury. So, set to 0.
          nativeTokenValue: 0,
          transactionData: tokenModule.contract.interface.encodeFunctionData(
            // We're doing a mint! And, we're minting to the voteModule, which is
            // acting as our treasury.
            "mint",
            [bankAddress, ethers.utils.parseUnits(amount.toString(), 18)]
          ),
          // Our token module that actually executes the mint.
          toAddress: tokenModule.address,
        },
      ]
    );
    setIsProposing(false);
    await fetchProposals();
  };

  const requestToken = async () => {
    const amount = 1_000;
    setIsProposing(true);
    const newProposal = await voteModule.propose(
      address +
        " is requesting to mint and recieve " +
        amount +
        " $TOSS tokens! (proposed at: " +
        new Date() +
        ")",
      [
        {
          // Our nativeToken is ETH. nativeTokenValue is the amount of ETH we want
          // to send in this proposal. In this case, we're sending 0 ETH.
          // We're just minting new tokens to the treasury. So, set to 0.
          nativeTokenValue: 0,
          transactionData: tokenModule.contract.interface.encodeFunctionData(
            // We're doing a mint! And, we're minting to the voteModule, which is
            // acting as our treasury.
            "mint",
            [address, ethers.utils.parseUnits(amount.toString(), 18)]
          ),
          // Our token module that actually executes the mint.
          toAddress: tokenModule.address,
        },
      ]
    );
    setIsProposing(false);
    await fetchProposals();
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">📈</div>
        <div className="header">$TOSS Decisions</div>
        <div className="bio">Decide things!</div>
        {!provider && [
          <button
            className="requestButton"
            onClick={() => connectWallet("injected")}
          >
            Connect Wallet
          </button>,
        ]}
        {provider && <div className="bio">Connected!</div>}
        {provider &&
          !isVoting &&
          !isProposing && [
            <button className="requestButton" onClick={() => requestToken()}>
              Request Token
            </button>,
            <button
              className="requestButton"
              onClick={() => requestFillTreasury()}
            >
              Mint to Treasury
            </button>,
          ]}
        {isProposing && <div className="bio">Proposing...</div>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            //before we do async things, we want to disable the button to prevent double clicks
            setIsVoting(true);

            // lets get the votes from the form for the values
            const votes = proposals.map((proposal) => {
              let voteResult = {
                proposalId: proposal.proposalId,
                //abstain by default
                vote: 2,
              };
              proposal.votes.forEach((vote) => {
                const elem = document.getElementById(
                  proposal.proposalId + "-" + vote.type
                );

                if (elem.checked) {
                  voteResult.vote = vote.type;
                  return;
                }
              });
              return voteResult;
            });
            // first we need to make sure the user delegates their token to vote
            try {
              //we'll check if the wallet still needs to delegate their tokens before they can vote
              const delegation = await tokenModule.getDelegationOf(address);
              // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
              if (delegation === ethers.constants.AddressZero) {
                //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                await tokenModule.delegateTo(address);
              }
              // then we need to vote on the proposals
              try {
                await Promise.all(
                  votes.map(async (vote) => {
                    // before voting we first need to check whether the proposal is open for voting
                    // we first need to get the latest state of the proposal
                    const proposal = await voteModule.get(vote.proposalId);
                    // then we check if the proposal is open for voting (state === 1 means it is open)
                    if (proposal.state === 1) {
                      // if it is open for voting, we'll vote on it
                      return voteModule.vote(vote.proposalId, vote.vote);
                    }
                    // if the proposal is not open for voting we just return nothing, letting us continue
                    return;
                  })
                );
                try {
                  // if any of the propsals are ready to be executed we'll need to execute them
                  // a proposal is ready to be executed if it is in state 4
                  await Promise.all(
                    votes.map(async (vote) => {
                      // we'll first get the latest state of the proposal again, since we may have just voted before
                      const proposal = await voteModule.get(vote.proposalId);

                      //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                      if (proposal.state === 4) {
                        return voteModule.execute(vote.proposalId);
                      }
                    })
                  );
                  // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                  // and log out a success message
                  setProposals([]);
                  console.log("successfully voted");
                } catch (err) {
                  console.error("failed to execute votes", err);
                }
              } catch (err) {
                console.error("failed to vote", err);
              }
            } catch (err) {
              console.error("failed to delegate tokens");
            } finally {
              // in *either* case we need to set the isVoting state to false to enable the button again
              setIsVoting(false);
            }
          }}
        >
          {toExecute.map((proposal, index) => (
            <div key={proposal.proposalId} className="card">
              <h5>{proposal.description}</h5>
              <button
                className="requestButton"
                disabled={isExecuting}
                onClick={() => executeProposal(proposal.proposalId)}
              >
                Execute
              </button>
            </div>
          ))}
          {proposals.map((proposal, index) => (
            <div key={proposal.proposalId} className="card">
              <h5>{proposal.description}</h5>
              <div>
                {proposal.votes.map((vote) => (
                  <div key={vote.type}>
                    <input
                      type="radio"
                      id={proposal.proposalId + "-" + vote.type}
                      name={proposal.proposalId}
                      value={vote.type}
                      //default the "abstain" vote to chedked
                      defaultChecked={vote.type === 2}
                    />
                    <label htmlFor={proposal.proposalId + "-" + vote.type}>
                      {vote.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button disabled={isVoting} type="submit">
            {isVoting ? "Voting..." : "Submit Votes"}
          </button>
          <small>
            This will trigger multiple transactions that you will need to sign.
          </small>
        </form>
      </div>
    </div>
  );
};

export default App;
