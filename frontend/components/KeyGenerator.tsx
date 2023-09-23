"use client";

import { generatePrivateAndPublicKey } from "./bjj_utils.js";
import { useState, useEffect } from "react";
import Modal from 'react-modal';

function ClipboardCopy({ copyText, wasCopied, setWasCopied }:{ copyText: any, wasCopied: any, setWasCopied: any }) {
  const [isCopied, setIsCopied] = useState(false);
  

  async function copyTextToClipboard(text:string) {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand('copy', true, text);
    }
  }

  const handleCopyClick = () => {
    // Asynchronously call copyTextToClipboard
    copyTextToClipboard(copyText)
      .then(() => {
        // If successful, update the isCopied state value
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      })
      .catch((err) => {
        console.log(err);
      });
    setWasCopied(true);
  }

  return (
    <div>
      <input type="text" value={copyText} readOnly size={copyText.length+10 || 1} style={{ padding:"5px", fontWeight: 'bold' }}/>
      <br/>
      <button onClick={handleCopyClick} className='bg-red-500'>
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  );
}
  

export default function KeyGenerator({onChange, registered}:{onChange: any, registered: any}) {
  const [keys, setKeys] = useState({
    privateKey: BigInt(0),
    publicKey: { x: BigInt(0), y: BigInt(0) },
  });
  const [textValueX, setTextValueX] = useState('');
  const [textValueY, setTextValueY] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenManual, setIsOpenManual] = useState(false);
  const [wasCopied, setWasCopied] = useState(false);

  const handleGenerate = async () => {
    const generatedKeys = await generatePrivateAndPublicKey();
    setKeys(generatedKeys);
    setIsOpen(true);
    onChange({x:generatedKeys.publicKey.x.toString(),y:generatedKeys.publicKey.y.toString()});
  };

  const handleEnterManually = async () => {
    setIsOpenManual(true);
  };

  const confirmEnterManually = async () => {
    const enteredKeys = {
      privateKey: BigInt(0),
      publicKey: { x: BigInt(textValueX), y: BigInt(textValueY) },
      };
    setKeys(enteredKeys);
    onChange({x:enteredKeys.publicKey.x.toString(),y:enteredKeys.publicKey.y.toString()});
  }

  const modalStyle = {
    
    overlay: {
       backgroundColor: 'rgba(0, 0, 0, 0.6)'
    },
    content: {
      'text-align': 'center',
       top: '50%',
       left: '50%',
       right: 'auto',
       bottom: 'auto',
       marginRight: '-50%',
       transform: 'translate(-50%, -50%)'
    }
 }

  return (
    <div>
      {!registered && <button onClick={handleGenerate}>Generate New Keys</button>}
      {registered && <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >Generate New Keys</button>}
      &nbsp; - or alternatively :
      {!registered && <button onClick={handleEnterManually}>Use already owned public key</button>}
      {registered && <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >Use already owned public key</button>}
      {
        <div>
          <p>
            <strong>Private Key:</strong> {(keys.publicKey.x.toString()+keys.publicKey.y.toString()!='00') &&<div style={{ display: 'inline-block' }}>You should have copied it and saved it already (if not, then regenerate new keys)</div>}
          </p>
          <p>
            <strong>Public Key X:</strong> {keys.publicKey.x.toString()}
          </p>
          <p>
            <strong>Public Key Y:</strong> {keys.publicKey.y.toString()}
          </p>
        </div>
      }

      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} style={modalStyle} shouldCloseOnOverlayClick={false} shouldCloseOnEsc={false}>
      {
        <div>
          <p>
            <strong>Private Key: <div style={{ color: 'red' }}>/ ! \ You MUST copy and save it somewhere safe and NEVER share it with a third-party / ! \ <br/>
            / ! \ Loosing it will make your funds stuck, sharing it will allow anyone to decrypt your balance / ! \ </div></strong> 
            <ClipboardCopy copyText={keys.privateKey.toString()} wasCopied={wasCopied} setWasCopied={setWasCopied} />
          </p>
          <br/>
          <br/>
          <br/>
          <p>
            <strong>Public Key X:</strong> {keys.publicKey.x.toString()}
          </p>
          <p>
            <strong>Public Key Y:</strong> {keys.publicKey.y.toString()}
          </p>
          <br/>
        </div>
      }
        {!wasCopied && <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >OK</button>}
        {wasCopied && <button onClick={() => {setIsOpen(false);setWasCopied(false)}}>OK</button>}
      </Modal>

      <Modal isOpen={isOpenManual} onRequestClose={() => setIsOpenManual(false)} style={modalStyle} shouldCloseOnOverlayClick={false} shouldCloseOnEsc={false}>
      {
        <div>
          <p>
            <strong>Please enter a public key for which you already own the corresponding private key. <br/>
              Ensure that the public key is valid : it MUST be a point on Baby Jubjub curve, in Twisted Edwards form.</strong>
          </p>
          <br/>
          <p>
          <strong>Public Key X: </strong><input type="number" value={textValueX} onChange={(e) => setTextValueX(e.target.value)} style={{ border: '1px solid black' }}/>
          </p>
          <p>
            <strong>Public Key Y: </strong><input type="number" value={textValueY} onChange={(e) => setTextValueY(e.target.value)} style={{ border: '1px solid black' }}/>
          </p>
        </div>
      }
        {<button onClick={() => {confirmEnterManually();setIsOpenManual(false);setWasCopied(false)}}>OK</button>}
      </Modal>
    </div>
  );
}

