"use client";

import { exp_elgamal_decrypt_embedded, intToLittleEndianHex } from "./bjj_utils.js";
import { useState, useEffect } from "react";
import { ContractFactory, providers } from 'ethers';
import { abi, bytecode } from "../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import { useAccount } from "wagmi";
import SpinnerComponent from "./SpinnerComponent";
import Babygiant from "../components/Babygiant";
import Modal from 'react-modal';






export default function DecryptBalance({Cxy, onChange}:{Cxy: any, onChange: any}) {
  const { address, isConnected } = useAccount();
  const [isOpenManual, setIsOpenManual] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCorrectDecryption, setIsCorrectDecryption] = useState(false);
  const [computedAlready, setComputedAlready] = useState(false);
  const [decryptedBal, setDecryptedBal] = useState("");
  const [isNull, setIsNull] = useState("");
  
  useEffect(()=>{
    if (Cxy[0]===BigInt(0) && Cxy[1]===BigInt(0) && Cxy[2]===BigInt(0) && Cxy[3]===BigInt(0)){
      setIsNull(true);
    } else {
      setIsNull(false);
    }
  },[Cxy]);

  const handleEnterManually = async () => {
    setIsOpenManual(true);
  };
  const [privateKeyValue, setPrivateKeyValue] = useState(BigInt(0));

  const modalStyle = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-40%',
        transform: 'translate(-50%, -50%)',
        paddingLeft: '5%',
        paddingRight: '5%',
    }
  };


  const calculate = async (Embx,Emby) => {
    const numberOfWorkers = Math.max(1,window.navigator.hardwareConcurrency-2) || 8; // Default to 8 if the property isn't supported
    let workersCompleted = 0;
    let found = false;
    async function onWorkerMessage(event: any) {
      workersCompleted++;
      if (event.data!=="dl_not_found") {
        setDecryptedBal(event.data.toString());
        found = true;
      }
      if ((workersCompleted===numberOfWorkers) && !found){
        setIsDecrypting(false);
        throw new Error("Discrete Log Not Found! Ensure private key is correct and encrypted value is between 0 and max(uint40).");
      }
    }
    let n = 1048576; // sqrt(max(uint40))
    let chunkSize = Math.ceil(n / numberOfWorkers);

    for (let i = 0; i < numberOfWorkers; i++) {
      const myWorker = new Worker(new URL('./worker_babygiant.js', import.meta.url));
      myWorker.onmessage = onWorkerMessage;
  
      let start = i * chunkSize;
      let end = Math.min(n, start + chunkSize);
      myWorker.postMessage({ Cx: Embx, Cy: Emby, min_range: start, max_range: end });
    }

  };

  const decrypt = async (privateKey_)=>{
    
    try{
      const decrypted_embedded = await exp_elgamal_decrypt_embedded(BigInt(privateKey_),{x:Cxy[0],y:Cxy[1]},{x:Cxy[2],y:Cxy[3]});
      await calculate(await intToLittleEndianHex(decrypted_embedded.x),await intToLittleEndianHex(decrypted_embedded.y));
      } catch(e) {
        setIsDecrypting(false);
      }
    setComputedAlready(true);
    //
  }

  return(
    <div>
      {isNull && (<>Your balance is null at the moment : you cannot send tokens yet, but you are able to receive some.</>)}
      {!isNull && <button className="mt-2" onClick={handleEnterManually}>Decrypt Balance</button>}
      <Modal isOpen={isOpenManual} onRequestClose={() => setIsOpenManual(false)} style={modalStyle} shouldCloseOnOverlayClick={false} shouldCloseOnEsc={false}>
      {
        <div>
          <p>
            <strong>Please enter your private key to decrypt your balance off-chain:</strong> <br/>
          </p>
          <br/>
          <p>
          <strong>Private Key:</strong> &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;<input type="number" className="w-full" value={privateKeyValue} onChange={(e) => {setPrivateKeyValue(e.target.value)}} style={{ border: '1px solid black' }}/>  
          </p>
        </div>
      }
        
        {(!isDecrypting) && <button className="mt-4" onClick={() => {setIsDecrypting(true);decrypt(privateKeyValue)}}>Decrypt</button>}
        {(isDecrypting && !decryptedBal) && <button><SpinnerComponent />Decrypting...</button>}
        {(computedAlready && !decryptedBal && !isDecrypting ) && <p>Decryption failed, ensure private key is correct then retry decrypting...</p>}
        {(computedAlready && decryptedBal) && <p>Decrypted Balance: {decryptedBal}</p>}
        {(computedAlready && decryptedBal) && <button onClick={()=>{onChange(decryptedBal, privateKeyValue);setIsOpenManual(false)}}>Transfer Token</button>}
      </Modal>
    </div>
  )
}
