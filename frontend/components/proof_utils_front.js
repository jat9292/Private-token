import circuit_mint from '../../circuits/mint/target/mint.json' assert { type: 'json' };
import circuit_transfer from '../../circuits/transfer/target/transfer.json' assert { type: 'json' };
import circuit_transfer_to_new from '../../circuits/transfer_to_new/target/transfer_to_new.json' assert { type: 'json' };
import { ethers } from 'ethers';
import initACVM, { executeCircuit, compressWitness } from '@noir-lang/acvm_js';
import { decompressSync } from 'fflate';


import {
    Crs,
    newBarretenbergApiAsync,
    RawBuffer,
  } from '@aztec/bb.js/dest/browser/index.js';

export async function genProof(circuit_name,inputs){
  await initACVM();

  if (typeof inputs === "string"){
    inputs = JSON.parse(inputs); // this is to be able to use the cli_utils.js to generate proofs, otherwise, if genProof is called in the front-end, inputs should be an object with BigInt values : see examples in the commented tests at the bottom of this file
  }
  let acirBuffer;
  switch (circuit_name) {
  case 'mint':
    acirBuffer = Buffer.from(circuit_mint.bytecode, 'base64');
    break;
  case 'transfer':
    acirBuffer = Buffer.from(circuit_transfer.bytecode, 'base64');
    break;
  case 'transfer_to_new':
    acirBuffer = Buffer.from(circuit_transfer_to_new.bytecode, 'base64');
    break;
  default:
    console.log(`Circuit name not recognized`);
    return;
  }

  const acirBufferUncompressed = decompressSync(acirBuffer);
  const numberOfWorkers = Math.max(1,window.navigator.hardwareConcurrency-2) || 8; // Default to 8 if the property isn't supported
  const api = await newBarretenbergApiAsync(numberOfWorkers);
  const [exact, circuitSize, subgroup] = await api.acirGetCircuitSizes(acirBufferUncompressed);

  const subgroupSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
  const crs = await Crs.new(subgroupSize + 1);
  
  await api.commonInitSlabAllocator(subgroupSize);
  await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
  const acirComposer = await api.acirNewAcirComposer(subgroupSize);

  async function generateWitness(input, acirBuffer) {
    const initialWitness = new Map();

    let k = 0;
    for (let key in input) {
      k+=1;
      initialWitness.set(k, ethers.utils.hexZeroPad(`0x${input[key].toString(16)}`, 32));
    }

    const witnessMap = await executeCircuit(acirBuffer, initialWitness, () => {
      throw Error('unexpected oracle');
    });

    const witnessBuff = compressWitness(witnessMap);
    return witnessBuff;
  }

  async function generateProof(witness) {
    const proof = await api.acirCreateProof(
      acirComposer,
      acirBufferUncompressed,
      decompressSync(witness),
      false,
    );
    return proof;
  }

  async function verifyProof(proof) {
    await api.acirInitProvingKey(acirComposer, acirBufferUncompressed);
    const verified = await api.acirVerifyProof(acirComposer, proof, false);
    return verified;
  }

  const witness = await generateWitness(inputs, acirBuffer);
  console.log('Witness generated!');
  const proof = await generateProof(witness);
  console.log('Proof generated!');
  await verifyProof(proof);
  console.log('Proof verified!');
  api.destroy();
  
  return proof;
}

// Tests (same as in the Noir files) : uncomment and run with node
/*
const inputs_mint = {private_key: BigInt('2291123624948246627368989940774052753470489062495018070576418670157516550852'), 
              randomness: BigInt('168986485046885582825082387270879151100288537211746581237924789162159767775'),
              public_key_x: BigInt('11035571757224451620605786890790132844722231619710976007063020523319248877914'),
              public_key_y: BigInt('19186343803061871491190042465391631772251521601054015091722300428018876653532'),
              value: BigInt('1000000000000'),
              C1_x: BigInt('1496197583352242063455862221527010906604817232528901172130809043230997246824'),
              C1_y: BigInt('4254363608840175473367393558422388112815775052382181131620648571022664794991'),
              C2_x: BigInt('7863058870347436223955035015287191170578415873725324596171614557902562847106'),
              C2_y: BigInt('17145727302716684772667316947417711987630303167052440083419636140655821422533')};

await genProof("mint",inputs_mint);

const inputs_transfer = {private_key: BigInt('2291123624948246627368989940774052753470489062495018070576418670157516550852'), 
              randomness1: BigInt('168986485046885582825082387270879151100288537211746581237924789162159767775'),
              randomness2: BigInt('2512595847879910647549805200013822046432901960729162086417588755890198945115'),
              value: BigInt('100'),

              balance_old_me_clear: BigInt('10000'),

              public_key_me_x: BigInt('11035571757224451620605786890790132844722231619710976007063020523319248877914'),
              public_key_me_y: BigInt('19186343803061871491190042465391631772251521601054015091722300428018876653532'),

              public_key_to_x: BigInt('4634264854040818138625745019270360081367026367183099861136305383680538427056'),
              public_key_to_y: BigInt('15673152810959729295350484662231526942827385252225094571441698124202132264222'),

              balance_old_me_encrypted_1_x: BigInt('11017998082309010223062454201157773337951899306065725147149719209748915162513'),
              balance_old_me_encrypted_1_y: BigInt('891184252204890740833160122406506380957356897324023910513221381207852952589'),
              balance_old_me_encrypted_2_x: BigInt('5298835382479142445681385371659434347047865329080629637735841510339448939445'),
              balance_old_me_encrypted_2_y: BigInt('15283092034552309752869941523060486853203301285428932249239358144093632088381'),

              balance_old_to_encrypted_1_x: BigInt('5071608101324055067557638680091755256823694404140603233907036803540380918255'),
              balance_old_to_encrypted_1_y: BigInt('18092433154514174944101765178562257647161151065090166335434817774976138779799'),
              balance_old_to_encrypted_2_x: BigInt('1082231180026508277078874246131871619068588661358314663544508570643578550136'),
              balance_old_to_encrypted_2_y: BigInt('388651153465648939997496065448977003331385093083026411965410133554136862598'),

              balance_new_me_encrypted_1_x: BigInt('1496197583352242063455862221527010906604817232528901172130809043230997246824'),
              balance_new_me_encrypted_1_y: BigInt('4254363608840175473367393558422388112815775052382181131620648571022664794991'),
              balance_new_me_encrypted_2_x: BigInt('7132239081249683658423301873709487886527317837638472026039930231927727767690'),
              balance_new_me_encrypted_2_y: BigInt('20712645620037612149496468163608886190807435151767794218410876452886668026838'),

              balance_new_to_encrypted_1_x: BigInt('12316946172442669334459682536759703104955873651712662817559042780828455956907'),
              balance_new_to_encrypted_1_y: BigInt('8855209734781576767922463747623028875751643647015986898096811877259979051834'),
              balance_new_to_encrypted_2_x: BigInt('13381781522321579577463384919236184801338107357762105556130450464884960013811'),
              balance_new_to_encrypted_2_y: BigInt('10080158840478686055983184310580225578461560961146651995761214473910856556911'),
              };

await genProof("transfer",inputs_transfer);

const inputs_transfer_to_new = {private_key: BigInt('2291123624948246627368989940774052753470489062495018070576418670157516550852'), 
              randomness1: BigInt('168986485046885582825082387270879151100288537211746581237924789162159767775'),
              randomness2: BigInt('2512595847879910647549805200013822046432901960729162086417588755890198945115'),
              value: BigInt('100'),

              balance_old_me_clear: BigInt('10000'),

              public_key_me_x: BigInt('11035571757224451620605786890790132844722231619710976007063020523319248877914'),
              public_key_me_y: BigInt('19186343803061871491190042465391631772251521601054015091722300428018876653532'),

              public_key_to_x: BigInt('4634264854040818138625745019270360081367026367183099861136305383680538427056'),
              public_key_to_y: BigInt('15673152810959729295350484662231526942827385252225094571441698124202132264222'),

              balance_old_me_encrypted_1_x: BigInt('11017998082309010223062454201157773337951899306065725147149719209748915162513'),
              balance_old_me_encrypted_1_y: BigInt('891184252204890740833160122406506380957356897324023910513221381207852952589'),
              balance_old_me_encrypted_2_x: BigInt('5298835382479142445681385371659434347047865329080629637735841510339448939445'),
              balance_old_me_encrypted_2_y: BigInt('15283092034552309752869941523060486853203301285428932249239358144093632088381'),

              balance_new_me_encrypted_1_x: BigInt('1496197583352242063455862221527010906604817232528901172130809043230997246824'),
              balance_new_me_encrypted_1_y: BigInt('4254363608840175473367393558422388112815775052382181131620648571022664794991'),
              balance_new_me_encrypted_2_x: BigInt('7132239081249683658423301873709487886527317837638472026039930231927727767690'),
              balance_new_me_encrypted_2_y: BigInt('20712645620037612149496468163608886190807435151767794218410876452886668026838'),

              balance_new_to_encrypted_1_x: BigInt('5101368220729117265340845140402972511220167236309017717230892476800594300849'),
              balance_new_to_encrypted_1_y: BigInt('9464551464843298006890812707339307347419442508224586622078302003473992946248'),
              balance_new_to_encrypted_2_x: BigInt('12569109508198965523215984731209646522185734359542096304413601810871781846681'),
              balance_new_to_encrypted_2_y: BigInt('13208904001440149853051089636207920553482181951125970640265081452010859970019'),
              };

await genProof("transfer_to_new",inputs_transfer_to_new);
*/