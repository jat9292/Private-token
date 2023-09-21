"use client";

import { generatePrivateAndPublicKey } from "./bjj_utils.js";
import { useState, useEffect } from "react";
import Modal from 'react-modal';

function ClipboardCopy({ copyText, wasCopied, setWasCopied }) {
  const [isCopied, setIsCopied] = useState(false);
  

  async function copyTextToClipboard(text) {
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
      <input type="text" value={copyText} readOnly size={copyText.length+5 || 1} style={{ fontWeight: 'bold' }}/>
      <button onClick={handleCopyClick} className='bg-red-500'>
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  );
}
  

export default function KeyGenerator() {
  const [keys, setKeys] = useState({
    privateKey: BigInt(0),
    publicKey: { x: BigInt(0), y: BigInt(0) },
  });
  const [isOpen, setIsOpen] = useState(false);
  const [wasCopied, setWasCopied] = useState(false);

  const handleGenerate = async () => {
    const generatedKeys = await generatePrivateAndPublicKey();
    setKeys(generatedKeys);
    setIsOpen(true);
  };
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
      <button onClick={handleGenerate}>Generate Keys</button>
      {keys && (
        <div>
          <p>
            <strong>Private Key:</strong> {(keys.publicKey.x.toString()+keys.publicKey.y.toString()!='00') &&<div style={{ display: 'inline-block' }}>You should have copied it and saved it already (if not regenerate new keys)</div>}
          </p>
          <p>
            <strong>Public Key X:</strong> {keys.publicKey.x.toString()}
          </p>
          <p>
            <strong>Public Key Y:</strong> {keys.publicKey.y.toString()}
          </p>
        </div>
      )}
      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} style={modalStyle} shouldCloseOnOverlayClick={false}>
      {keys && (
        <div>
          <p>
            <strong>Private Key: <div style={{ color: 'red' }}>/ ! \ You MUST copy and save it somewhere safe and NEVER share it with a third-party / ! \ <br/>
            / ! \ Loosing or sharing it could lead to a loss of funds / ! \ </div></strong> <ClipboardCopy copyText={keys.privateKey.toString()} wasCopied={wasCopied} setWasCopied={setWasCopied} />
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
        
      )}
        {!wasCopied && <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >OK</button>}
        {wasCopied && <button onClick={() => {setIsOpen(false);setWasCopied(false)}}>OK</button>}
      </Modal>
    </div>
  );
}

