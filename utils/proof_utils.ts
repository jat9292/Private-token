import circuit from '../circuits/mint/target/mint.json' assert { type: 'json' };
import { decompressSync } from 'fflate';

const acirBuffer = Buffer.from(circuit.bytecode, 'base64');
const acirBufferUncompressed = decompressSync(acirBuffer);

import { Crs, newBarretenbergApiAsync, RawBuffer } from '@aztec/bb.js/dest/node/index.js';

const api = await newBarretenbergApiAsync(4);

const [exact, circuitSize, subgroup] = await api.acirGetCircuitSizes(acirBufferUncompressed);
const subgroupSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
const crs = await Crs.new(subgroupSize + 1);
await api.commonInitSlabAllocator(subgroupSize);
await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));

const acirComposer = await api.acirNewAcirComposer(subgroupSize);

import { ethers } from 'ethers'; // I'm lazy so I'm using ethers to pad my input
import { executeCircuit, compressWitness } from '@noir-lang/acvm_js';

async function generateWitness(input: any, acirBuffer: Buffer): Promise<Uint8Array> {
  const initialWitness = new Map<number, string>();
  initialWitness.set(1, ethers.utils.hexZeroPad(`0x${input.x.toString(16)}`, 32));
  initialWitness.set(2, ethers.utils.hexZeroPad(`0x${input.y.toString(16)}`, 32));

  const witnessMap = await executeCircuit(acirBuffer, initialWitness, () => {
    throw Error('unexpected oracle');
  });

  const witnessBuff = compressWitness(witnessMap);
  return witnessBuff;
}