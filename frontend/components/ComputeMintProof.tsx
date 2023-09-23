"use client";

import { exp_elgamal_encrypt } from "./bjj_utils.js";
import { genProof } from './proof_utils_front.js';
import { useState, useEffect } from "react";
import { ContractFactory, providers } from 'ethers';
import { abi, bytecode } from "../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import { useAccount, useConnect } from "wagmi";
import SpinnerComponent from "./SpinnerComponent";
import Modal from 'react-modal';






export default function ComputeMintProof({PK, onChange, setSupply}:{PK: any, onChange: any, setSupply: any}) {
  const [isOpenManual, setIsOpenManual] = useState(false);
  const [startProving, setStartProving] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [isCorrectProof, setIsCorrectProof] = useState(false);
  const [computedAlready, setComputedAlready] = useState(false);
  const handleEnterManually = async () => {
    setIsOpenManual(true);
    setStartProving(true);
  };
  const [privateKeyValue, setPrivateKeyValue] = useState(BigInt(0));
  const [randomnessValue, setRandomnessValue] = useState(BigInt(0));
  const [valueValue, setValueValue] = useState(BigInt(0));
  const [C1xValue, setC1xValue] = useState(BigInt(0));
  const [C1yValue, setC1yValue] = useState(BigInt(0));
  const [C2xValue, setC2xValue] = useState(BigInt(0));
  const [C2yValue, setC2yValue] = useState(BigInt(0));
  const [proof, setProof] = useState(new Uint8Array());

  useEffect(()=>{startProving && confirmEnterManually()},[randomnessValue]);

  const onChangeText = async ()=>{
    const max_value = BigInt("2736030358979909402780800718157159386076813972158567259200215660948447373041");
    const encryptedTotalSupply = await exp_elgamal_encrypt({x:BigInt(PK.x),y:BigInt(PK.y)},Number(valueValue));
    setRandomnessValue(encryptedTotalSupply.randomness);
    setC1xValue(encryptedTotalSupply.C1.x);
    setC1yValue(encryptedTotalSupply.C1.y);
    setC2xValue(encryptedTotalSupply.C2.x);
    setC2yValue(encryptedTotalSupply.C2.y);
    
  }
  const confirmEnterManually = async () => {


    const enteredValues = {
      private_key: BigInt(privateKeyValue),
      randomness: BigInt(randomnessValue),
      public_key_x: BigInt(PK.x),
      public_key_y: BigInt(PK.y),
      value: BigInt(valueValue),
      C1_x: BigInt(C1xValue),
      C1_y: BigInt(C1yValue),
      C2_x: BigInt(C2xValue),
      C2_y: BigInt(C2yValue)};

      
      try{const proof_mint = await genProof("mint",enteredValues);
          setIsCorrectProof(true);
          setProof(proof_mint);
        }
      catch {
        console.log("Failed proof, ensure keys are correct");
        setIsCorrectProof(false);
      }
      setIsProving(false);
      setComputedAlready(true);
      
      
  }

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
    }
  };

  return(
    <div>
      {<button onClick={handleEnterManually}>Enter Circuit Inputs</button>}
      <Modal isOpen={isOpenManual} onRequestClose={() => setIsOpenManual(false)} style={modalStyle} shouldCloseOnOverlayClick={false} shouldCloseOnEsc={false}>
      {
        <div>
          <p>
            <strong>Please enter the inputs of the mint circuit needed to compute the proof off-chain:</strong> <br/>
          </p>
          <br/>
          <p>
          <strong>Private Key:</strong> &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;<input type="number" className="w-8/12" value={privateKeyValue} onChange={(e) => {setPrivateKeyValue(e.target.value)}} style={{ border: '1px solid black' }}/>  &nbsp; &nbsp; <i>(Private Input)</i> 
          </p>
          <p>
          <strong>Total Supply to mint:</strong>  <input type="number" className="w-2/12" value={BigInt(valueValue)} onChange={(e) => {setValueValue(e.target.value)}} style={{ border: '1px solid black' }}/> <i> &nbsp; &nbsp;Must be less than 1099511627775 (max(uint40))</i>
          </p>
        </div>
      }
        {!isProving && <button onClick={() => {setIsProving(true);onChangeText();}}>Compute proof</button>}
        {isProving && <button><SpinnerComponent />Proving...</button>}
        {(isCorrectProof && !isProving) && <button onClick={()=>{onChange(proof);setIsOpenManual(false);setSupply({totalSupplyClear: BigInt(valueValue),
                                                                                                                    totalSupplyC1x: BigInt(C1xValue),
                                                                                                                    totalSupplyC1y: BigInt(C1yValue),
                                                                                                                    totalSupplyC2x: BigInt(C2xValue),
                                                                                                                    totalSupplyC2y: BigInt(C2yValue)})}}>Continue with this proof</button>}
        {(computedAlready && !isCorrectProof && !isProving) && <p>Proving failed, ensure keys are correct then retry proving...</p>}
      </Modal>
    </div>
  )
}
