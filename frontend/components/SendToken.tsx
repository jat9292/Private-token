"use client";

import { exp_elgamal_encrypt } from "./bjj_utils.js";
import { genProof } from './proof_utils_front.js';
import { useState, useEffect } from "react";
import { ContractFactory, providers } from 'ethers';
import PKIjson from "../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import PTjson from "../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import SpinnerComponent from "./SpinnerComponent";
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
  useAccount, useConnect
} from "wagmi";
import { readContract } from '@wagmi/core'

function uint8ArrayToHexString(arr) {
  return '0x' + Array.from(arr).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function isValidEthereumAddress(address) {
  if (!address) return false;
  if (address.length !== 42) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidIntegerInRange(str, max_value) {
  const number = parseInt(str, 10);
  return str === String(number) && number >= 1 && number <= max_value;
}


export default function SendToken({privateKey,PK,PTAddress,balance,encBalance,addressPKI,onChange}:{privateKey: any, PK: any, PTAddress: any, balance: any, encBalance: any, addressPKI: any, onChange: any}) {
  const { address } = useAccount()
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [toggle, setToggle] = useState(false);
  const [toggle2, setToggle2] = useState(false);
  const [toggle3, setToggle3] = useState(false);
  const [isValidAddress,setIsValidAddress] = useState(true);
  const [amountIsInRange,setAmountIsInRange] = useState(true);
  const [recipientIsRegistered,setRecipientIsRegistered] = useState(true);
  const [recipientPK, setRecipientPK] = useState("");
  const [isProving, setIsProving] = useState(false);
  const [isCorrectProof, setIsCorrectProof] = useState(false);
  const [proof, setProof] = useState(new Uint8Array());
  const [computedAlready, setComputedAlready] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [balancesenderEncNew,setBalanceSenderEncNew] = useState("");
  const [balanceRecipientEncNew,setBalanceRecipientEncNew] = useState("");
  const [argumentsTx, setArgumentsTx] = useState("");
  const { config, isLoading : isLoadingPrep } = usePrepareContractWrite({
    address: PTAddress,
    abi: PTjson.abi,
    functionName: "transfer",
    args: argumentsTx,
    account: address
  });

  

  const { data, write, isLoading: isLoadingWrite } = useContractWrite(config);
    // Use the useWaitForTransaction hook to wait for the transaction to be mined and return loading and success states
    const { isLoading, isSuccess } = useWaitForTransaction({
      hash: data?.hash,
      confirmations: 1
    });

  useEffect(()=> {
    const doT = async ()=>{
    if (to){await doTransfer();}} // to avoid during first rendring
    doT();
  },[toggle3])

  useEffect(()=> {
    const doTx = async ()=>{
    if (to){await write?.();
      setIsTransferring(false);}} // to avoid during first rendring
    doTx();
  },[isLoadingPrep])

  useEffect(()=> {
    if (isSuccess){onChange(balance-amount, [balancesenderEncNew.C1.x,balancesenderEncNew.C1.y,balancesenderEncNew.C2.x,balancesenderEncNew.C2.y]);}
  },[isSuccess])

  const doTransfer = async ()=>{
    let sliced_proof_transfer_to_new = uint8ArrayToHexString(proof.slice(16*32)); // there are 16 public inputs (bytes32) for the transfer_to_new circuit
    const argumentsTx_ = [to, 
        {C1x: encBalance[0], C1y: encBalance[1], C2x: encBalance[2], C2y: encBalance[3]}, 
        {C1x: 0, C1y: 0, C2x: 0, C2y: 0}, 
        {C1x: balancesenderEncNew.C1.x, C1y: balancesenderEncNew.C1.y, C2x: balancesenderEncNew.C2.x, C2y: balancesenderEncNew.C2.y}, 
        {C1x: balanceRecipientEncNew.C1.x, C1y: balanceRecipientEncNew.C1.y, C2x: balanceRecipientEncNew.C2.x, C2y: balanceRecipientEncNew.C2.y},
        sliced_proof_transfer_to_new];
    setArgumentsTx(argumentsTx_);
    
  }

  const computeProof = async ()=>{

    const balance_sender_enc_new = await exp_elgamal_encrypt({x:BigInt(PK.X),y:BigInt(PK.Y)},Number(balance)-Number(amount));
    const balance_recipient_enc_new = await exp_elgamal_encrypt({x:BigInt(recipientPK.x),y:BigInt(recipientPK.y)},Number(amount));
    
    const inputs_transfer_to_new = {
      private_key: BigInt(privateKey), 
      randomness1: balance_sender_enc_new.randomness,
      randomness2: balance_recipient_enc_new.randomness,
      value: BigInt(amount.toString()),
      balance_old_me_clear: BigInt(balance),

      public_key_me_x: PK.X,
      public_key_me_y: PK.Y,

      public_key_to_x: recipientPK.x,
      public_key_to_y: recipientPK.y,

      balance_old_me_encrypted_1_x: encBalance[0],
      balance_old_me_encrypted_1_y: encBalance[1],
      balance_old_me_encrypted_2_x: encBalance[2],
      balance_old_me_encrypted_2_y: encBalance[3],

      balance_new_me_encrypted_1_x: balance_sender_enc_new.C1.x,
      balance_new_me_encrypted_1_y: balance_sender_enc_new.C1.y,
      balance_new_me_encrypted_2_x: balance_sender_enc_new.C2.x,
      balance_new_me_encrypted_2_y: balance_sender_enc_new.C2.y,

      balance_new_to_encrypted_1_x: balance_recipient_enc_new.C1.x,
      balance_new_to_encrypted_1_y: balance_recipient_enc_new.C1.y,
      balance_new_to_encrypted_2_x: balance_recipient_enc_new.C2.x,
      balance_new_to_encrypted_2_y: balance_recipient_enc_new.C2.y
      };

      try{const proof_transfer_to_new = await genProof("transfer_to_new",inputs_transfer_to_new);
          setIsCorrectProof(true);
          setProof(proof_transfer_to_new);
          setBalanceSenderEncNew(balance_sender_enc_new);
          setBalanceRecipientEncNew(balance_recipient_enc_new);
          setToggle3(!toggle3);
        }
      catch {
        console.log("Failed proof, ensure keys are correct");
        setIsCorrectProof(false);
      }
      setIsProving(false);
      setIsTransferring(true);
      setComputedAlready(true);
  }
  useEffect(()=> {
    const computeP = async ()=>{
    if (to){await computeProof();}} // to avoid during first rendring
    computeP();
  },[toggle2])
  

  const updateState = async () =>{
    if (isValidAddress && amountIsInRange){
      setIsValidAddress(true);
      setAmountIsInRange(true);
      const PK_ = await readContract({
        address: addressPKI,
        abi: PKIjson.abi,
        functionName: 'getRegistredKey',
        args: [to]
      });
      if (PK_.X=== BigInt(0) && PK_.Y=== BigInt(0)){
        setRecipientIsRegistered(false);
      } else {
        setRecipientPK({x:PK_.X,y:PK_.Y});
        setToggle2(!toggle2);
        setRecipientIsRegistered(true);
        setIsProving(true);
      }
    }
  }

  useEffect(()=> {
    if (to){updateState();} // to avoid during first rendring
  },[toggle])

  const sendFunction = async (to_,amount_) =>{
    if (to && amount) {
      if (!isValidEthereumAddress(to_)) {setIsValidAddress(false);setRecipientIsRegistered(true)} else {setIsValidAddress(true)};
      if (!isValidIntegerInRange(amount_,balance)) {setAmountIsInRange(false);setRecipientIsRegistered(true)} else {setAmountIsInRange(true)};
      setToggle(!toggle)
    }
  }
  


  return (<>
            <div className="flex justify-between items-center">
            <input
              aria-label="Recipient"
              onChange={(e) => setTo(e.target.value)} // update the recipient state on input change
              placeholder="Address destination (should be registered)"
              value={to}
              className="mt-4 bg-[rgb(253,232,255)] rounded-xl border-2 border-[#1d0321] p-5 w-2/5 h-15" />
            <input
              aria-label="Amount"
              onChange={(e) => setAmount(e.target.value)} // update the amount state on input change
              placeholder="Enter amount"
              value={amount}
              className="mt-4 bg-[rgb(253,232,255)] rounded-xl border-2 border-[#1d0321] p-5 w-2/5 h-15" />
            {(!isProving && !isTransferring && !isLoading && !isLoadingPrep && !isLoadingWrite) && <button className="mt-4 mr-4 text-lg px-4 py-2" onClick={()=>sendFunction(to,amount)}>Transfer</button>}
            {isProving && <button className="mt-4 mr-4 text-lg px-4 py-2"><SpinnerComponent/>Proving...</button>}
            {(isTransferring  || isLoading || isLoadingPrep || isLoadingWrite )  && <button className="mt-4 mr-4 text-lg px-4 py-2"><SpinnerComponent/>Transferring...</button>}
          </div>
          {!isValidAddress && <>Address is Invalid<br/></>}
          {!amountIsInRange && <>Amount should be an integer between 1 and {balance}<br/></>}
          {!recipientIsRegistered && <>Recipent is not registered yet</>}
          {isSuccess && (
            <div>
              Successfully sent tokens!
              <div>
                <a href={`https://sepolia.etherscan.io/tx/${data?.hash}`} style={{textDecoration: "underline"}} target="_blank" rel="noopener noreferrer">Check confirmation on Etherscan {data?.hash}</a>
              </div>
            </div>
          )}
        </>
  )
}

  /*const { config } = usePrepareContractWrite({
    address: PTAddress,
    abi: PTjson.abi,
    functionName: "transfer",
    args: [PK.x,PK.y],
    account: address
  });

  const { data, write } = useContractWrite(config);

  // Use the useWaitForTransaction hook to wait for the transaction to be mined and return loading and success states
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    confirmations: 1
  });

  useEffect(() => {
    onChange(isSuccess)
  }, [isSuccess]);

  return (
    <div>
      {(!isLoading && !isSuccess) && <button 
        onClick={() => write?.()}>Register Public Key</button>}
      {isLoading && <button ><SpinnerComponent /> Registering Public Key...</button>}
      {isSuccess && (
        <div>
          <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >Register Public Key</button> <br/>
          Successfully registered your Public Key!
          <div>
            <a href={`https://sepolia.etherscan.io/tx/${data?.hash}`} style={{textDecoration: "underline"}} target="_blank" rel="noopener noreferrer">Check confirmation on Etherscan</a>
          </div>
        </div>
      )}
    </div>
  );*/