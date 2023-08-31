#!/usr/bin/env node
import { Crs, newBarretenbergApiAsync, RawBuffer } from './index.js';
import createDebug from 'debug';
import { readFileSync, writeFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { Command } from 'commander';
createDebug.log = console.error.bind(console);
const debug = createDebug('bb.js');
// Maximum we support.
const MAX_CIRCUIT_SIZE = 2 ** 19;
function getJsonData(jsonPath) {
    const json = readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(json);
    return parsed;
}
function getBytecode(jsonPath) {
    const parsed = getJsonData(jsonPath);
    const buffer = Buffer.from(parsed.bytecode, 'base64');
    const decompressed = gunzipSync(buffer);
    return decompressed;
}
async function getGates(jsonPath, api) {
    const parsed = getJsonData(jsonPath);
    if (parsed.gates) {
        return +parsed.gates;
    }
    const { total } = await computeCircuitSize(jsonPath, api);
    const jsonData = getJsonData(jsonPath);
    jsonData.gates = total;
    writeFileSync(jsonPath, JSON.stringify(jsonData));
    return total;
}
function getWitness(witnessPath) {
    const data = readFileSync(witnessPath);
    const decompressed = gunzipSync(data);
    return decompressed;
}
async function computeCircuitSize(jsonPath, api) {
    debug(`computing circuit size...`);
    const bytecode = getBytecode(jsonPath);
    const [exact, total, subgroup] = await api.acirGetCircuitSizes(bytecode);
    return { exact, total, subgroup };
}
async function init(jsonPath, crsPath) {
    const api = await newBarretenbergApiAsync();
    const circuitSize = await getGates(jsonPath, api);
    const subgroupSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
    if (subgroupSize > MAX_CIRCUIT_SIZE) {
        throw new Error(`Circuit size of ${subgroupSize} exceeds max supported of ${MAX_CIRCUIT_SIZE}`);
    }
    debug(`circuit size: ${circuitSize}`);
    debug(`subgroup size: ${subgroupSize}`);
    debug('loading crs...');
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(subgroupSize + 1, crsPath);
    // Important to init slab allocator as first thing, to ensure maximum memory efficiency.
    await api.commonInitSlabAllocator(subgroupSize);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behaviour, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(subgroupSize);
    return { api, acirComposer, circuitSize: subgroupSize };
}
async function initLite() {
    const api = await newBarretenbergApiAsync(1);
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(1);
    // Load CRS into wasm global CRS state.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(0);
    return { api, acirComposer };
}
export async function proveAndVerify(jsonPath, witnessPath, crsPath, isRecursive) {
    const { api, acirComposer } = await init(jsonPath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(jsonPath);
        const witness = getWitness(witnessPath);
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness, isRecursive);
        debug(`verifying...`);
        const verified = await api.acirVerifyProof(acirComposer, proof, isRecursive);
        console.log(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
export async function prove(jsonPath, witnessPath, crsPath, isRecursive, outputPath) {
    const { api, acirComposer } = await init(jsonPath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(jsonPath);
        const witness = getWitness(witnessPath);
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness, isRecursive);
        debug(`done.`);
        writeFileSync(outputPath, proof);
        console.log(`proof written to: ${outputPath}`);
    }
    finally {
        await api.destroy();
    }
}
export async function gateCount(jsonPath) {
    const api = await newBarretenbergApiAsync(1);
    try {
        console.log(`gates: ${await getGates(jsonPath, api)}`);
    }
    finally {
        await api.destroy();
    }
}
export async function verify(proofPath, isRecursive, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const verified = await api.acirVerifyProof(acirComposer, readFileSync(proofPath), isRecursive);
        console.log(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
export async function contract(outputPath, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const contract = await api.acirGetSolidityVerifier(acirComposer);
        if (outputPath === '-') {
            console.log(contract);
        }
        else {
            writeFileSync(outputPath, contract);
            console.log(`contract written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function writeVk(jsonPath, crsPath, outputPath) {
    const { api, acirComposer } = await init(jsonPath, crsPath);
    try {
        debug('initing proving key...');
        const bytecode = getBytecode(jsonPath);
        await api.acirInitProvingKey(acirComposer, bytecode);
        debug('initing verification key...');
        const vk = await api.acirGetVerificationKey(acirComposer);
        if (outputPath === '-') {
            process.stdout.write(vk);
        }
        else {
            writeFileSync(outputPath, vk);
            console.log(`vk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function proofAsFields(proofPath, numInnerPublicInputs, outputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing proof byte array into field elements');
        const proofAsFields = await api.acirSerializeProofIntoFields(acirComposer, readFileSync(proofPath), numInnerPublicInputs);
        writeFileSync(outputPath, JSON.stringify(proofAsFields.map(f => f.toString())));
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
export async function vkAsFields(vkPath, vkeyOutputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing vk byte array into field elements');
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const [vkAsFields, vkHash] = await api.acirSerializeVerificationKeyIntoFields(acirComposer);
        const output = [vkHash, ...vkAsFields].map(f => f.toString());
        writeFileSync(vkeyOutputPath, JSON.stringify(output));
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
const program = new Command();
program.option('-v, --verbose', 'enable verbose logging', false);
program.option('-c, --crs-path <path>', 'set crs path', './crs');
function handleGlobalOptions() {
    if (program.opts().verbose) {
        createDebug.enable('bb.js*');
    }
}
program
    .command('prove_and_verify')
    .description('Generate a proof and verify it. Process exits with success or failure code.')
    .option('-j, --json-path <path>', 'Specify the JSON path', './target/main.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.tr')
    .option('-r, --recursive', 'prove and verify using recursive prover and verifier', false)
    .action(async ({ jsonPath, witnessPath, recursive, crsPath }) => {
    handleGlobalOptions();
    const result = await proveAndVerify(jsonPath, witnessPath, crsPath, recursive);
    process.exit(result ? 0 : 1);
});
program
    .command('prove')
    .description('Generate a proof and write it to a file.')
    .option('-j, --json-path <path>', 'Specify the JSON path', './target/main.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.tr')
    .option('-r, --recursive', 'prove using recursive prover', false)
    .option('-o, --output-path <path>', 'Specify the proof output path', './proofs/proof')
    .action(async ({ jsonPath, witnessPath, recursive, outputPath, crsPath }) => {
    handleGlobalOptions();
    await prove(jsonPath, witnessPath, crsPath, recursive, outputPath);
});
program
    .command('gates')
    .description('Print gate count to standard output.')
    .option('-j, --json-path <path>', 'Specify the JSON path', './target/main.json')
    .action(async ({ jsonPath }) => {
    handleGlobalOptions();
    await gateCount(jsonPath);
});
program
    .command('verify')
    .description('Verify a proof. Process exists with success or failure code.')
    .requiredOption('-p, --proof-path <path>', 'Specify the path to the proof')
    .option('-r, --recursive', 'prove using recursive prover', false)
    .requiredOption('-k, --vk <path>', 'path to a verification key. avoids recomputation.')
    .action(async ({ proofPath, recursive, vk }) => {
    handleGlobalOptions();
    const result = await verify(proofPath, recursive, vk);
    process.exit(result ? 0 : 1);
});
program
    .command('contract')
    .description('Output solidity verification key contract.')
    .option('-j, --json-path <path>', 'Specify the JSON path', './target/main.json')
    .option('-o, --output-path <path>', 'Specify the path to write the contract', '-')
    .requiredOption('-k, --vk <path>', 'path to a verification key. avoids recomputation.')
    .action(async ({ outputPath, vk }) => {
    handleGlobalOptions();
    await contract(outputPath, vk);
});
program
    .command('write_vk')
    .description('Output verification key.')
    .option('-j, --json-path <path>', 'Specify the JSON path', './target/main.json')
    .requiredOption('-o, --output-path <path>', 'Specify the path to write the key')
    .action(async ({ jsonPath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await writeVk(jsonPath, crsPath, outputPath);
});
program
    .command('proof_as_fields')
    .description('Return the proof as fields elements')
    .requiredOption('-p, --proof-path <path>', 'Specify the proof path')
    .requiredOption('-n, --num-public-inputs <number>', 'Specify the number of public inputs')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the proof fields')
    .action(async ({ proofPath, numPublicInputs, outputPath }) => {
    handleGlobalOptions();
    await proofAsFields(proofPath, numPublicInputs, outputPath);
});
program
    .command('vk_as_fields')
    .description('Return the verifiation key represented as fields elements. Also return the verification key hash.')
    .requiredOption('-i, --input-path <path>', 'Specifies the vk path (output from write_vk)')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the verification key fields and key hash')
    .action(async ({ inputPath, outputPath }) => {
    handleGlobalOptions();
    await vkAsFields(inputPath, outputPath);
});
program.name('bb.js').parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsR0FBRyxFQUF3Qix1QkFBdUIsRUFBRSxTQUFTLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDM0YsT0FBTyxXQUFXLE1BQU0sT0FBTyxDQUFDO0FBQ2hDLE9BQU8sRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ2pELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDbEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVwQyxXQUFXLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUVuQyxzQkFBc0I7QUFDdEIsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBRWpDLFNBQVMsV0FBVyxDQUFDLFFBQWdCO0lBQ25DLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsUUFBZ0I7SUFDbkMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQUVELEtBQUssVUFBVSxRQUFRLENBQUMsUUFBZ0IsRUFBRSxHQUF5QjtJQUNqRSxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDckMsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2hCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0tBQ3RCO0lBQ0QsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sa0JBQWtCLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzFELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN2QixhQUFhLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNsRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxXQUFtQjtJQUNyQyxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkMsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxLQUFLLFVBQVUsa0JBQWtCLENBQUMsUUFBZ0IsRUFBRSxHQUF5QjtJQUMzRSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUNuQyxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUM7QUFDcEMsQ0FBQztBQUVELEtBQUssVUFBVSxJQUFJLENBQUMsUUFBZ0IsRUFBRSxPQUFlO0lBQ25ELE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQXVCLEVBQUUsQ0FBQztJQUU1QyxNQUFNLFdBQVcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRSxJQUFJLFlBQVksR0FBRyxnQkFBZ0IsRUFBRTtRQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixZQUFZLDZCQUE2QixnQkFBZ0IsRUFBRSxDQUFDLENBQUM7S0FDakc7SUFFRCxLQUFLLENBQUMsaUJBQWlCLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDdEMsS0FBSyxDQUFDLGtCQUFrQixZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3hCLHFDQUFxQztJQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVyRCx3RkFBd0Y7SUFDeEYsTUFBTSxHQUFHLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFaEQsdUNBQXVDO0lBQ3ZDLCtHQUErRztJQUMvRyxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXBHLE1BQU0sWUFBWSxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2pFLE9BQU8sRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsQ0FBQztBQUMxRCxDQUFDO0FBRUQsS0FBSyxVQUFVLFFBQVE7SUFDckIsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3QyxxQ0FBcUM7SUFDckMsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTdCLHVDQUF1QztJQUN2QyxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXBHLE1BQU0sWUFBWSxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQUVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsY0FBYyxDQUFDLFFBQWdCLEVBQUUsV0FBbUIsRUFBRSxPQUFlLEVBQUUsV0FBb0I7SUFDL0csTUFBTSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDNUQsSUFBSTtRQUNGLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXRGLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN0QixNQUFNLFFBQVEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM3RSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyQyxPQUFPLFFBQVEsQ0FBQztLQUNqQjtZQUFTO1FBQ1IsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDckI7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxLQUFLLENBQ3pCLFFBQWdCLEVBQ2hCLFdBQW1CLEVBQ25CLE9BQWUsRUFDZixXQUFvQixFQUNwQixVQUFrQjtJQUVsQixNQUFNLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RCxJQUFJO1FBQ0YsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDM0IsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN4QyxNQUFNLEtBQUssR0FBRyxNQUFNLEdBQUcsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdEYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWYsYUFBYSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixVQUFVLEVBQUUsQ0FBQyxDQUFDO0tBQ2hEO1lBQVM7UUFDUixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQjtBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLFNBQVMsQ0FBQyxRQUFnQjtJQUM5QyxNQUFNLEdBQUcsR0FBRyxNQUFNLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQUk7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsTUFBTSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUN4RDtZQUFTO1FBQ1IsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDckI7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxNQUFNLENBQUMsU0FBaUIsRUFBRSxXQUFvQixFQUFFLE1BQWM7SUFDbEYsTUFBTSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxNQUFNLFFBQVEsRUFBRSxDQUFDO0lBQy9DLElBQUk7UUFDRixNQUFNLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRixNQUFNLFFBQVEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMvRixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyQyxPQUFPLFFBQVEsQ0FBQztLQUNqQjtZQUFTO1FBQ1IsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDckI7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxRQUFRLENBQUMsVUFBa0IsRUFBRSxNQUFjO0lBQy9ELE1BQU0sRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsTUFBTSxRQUFRLEVBQUUsQ0FBQztJQUMvQyxJQUFJO1FBQ0YsTUFBTSxHQUFHLENBQUMsdUJBQXVCLENBQUMsWUFBWSxFQUFFLElBQUksU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsTUFBTSxRQUFRLEdBQUcsTUFBTSxHQUFHLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakUsSUFBSSxVQUFVLEtBQUssR0FBRyxFQUFFO1lBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkI7YUFBTTtZQUNMLGFBQWEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsVUFBVSxFQUFFLENBQUMsQ0FBQztTQUNuRDtLQUNGO1lBQVM7UUFDUixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQjtBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLE9BQU8sQ0FBQyxRQUFnQixFQUFFLE9BQWUsRUFBRSxVQUFrQjtJQUNqRixNQUFNLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RCxJQUFJO1FBQ0YsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDaEMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxDQUFDLGtCQUFrQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVyRCxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUNyQyxNQUFNLEVBQUUsR0FBRyxNQUFNLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxRCxJQUFJLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDdEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDMUI7YUFBTTtZQUNMLGFBQWEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsVUFBVSxFQUFFLENBQUMsQ0FBQztTQUM3QztLQUNGO1lBQVM7UUFDUixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQjtBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLGFBQWEsQ0FBQyxTQUFpQixFQUFFLG9CQUE0QixFQUFFLFVBQWtCO0lBQ3JHLE1BQU0sRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsTUFBTSxRQUFRLEVBQUUsQ0FBQztJQUUvQyxJQUFJO1FBQ0YsS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7UUFDMUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxHQUFHLENBQUMsNEJBQTRCLENBQzFELFlBQVksRUFDWixZQUFZLENBQUMsU0FBUyxDQUFDLEVBQ3ZCLG9CQUFvQixDQUNyQixDQUFDO1FBRUYsYUFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2hCO1lBQVM7UUFDUixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQjtBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLFVBQVUsQ0FBQyxNQUFjLEVBQUUsY0FBc0I7SUFDckUsTUFBTSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxNQUFNLFFBQVEsRUFBRSxDQUFDO0lBRS9DLElBQUk7UUFDRixLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztRQUN2RCxNQUFNLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRixNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLHNDQUFzQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVGLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDOUQsYUFBYSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2hCO1lBQVM7UUFDUixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQjtBQUNILENBQUM7QUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBRTlCLE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2pFLE9BQU8sQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRWpFLFNBQVMsbUJBQW1CO0lBQzFCLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRTtRQUMxQixXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzlCO0FBQ0gsQ0FBQztBQUVELE9BQU87S0FDSixPQUFPLENBQUMsa0JBQWtCLENBQUM7S0FDM0IsV0FBVyxDQUFDLDZFQUE2RSxDQUFDO0tBQzFGLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsQ0FBQztLQUMvRSxNQUFNLENBQUMsMkJBQTJCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLENBQUM7S0FDdEYsTUFBTSxDQUFDLGlCQUFpQixFQUFFLHNEQUFzRCxFQUFFLEtBQUssQ0FBQztLQUN4RixNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtJQUM5RCxtQkFBbUIsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQy9FLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDO0FBRUwsT0FBTztLQUNKLE9BQU8sQ0FBQyxPQUFPLENBQUM7S0FDaEIsV0FBVyxDQUFDLDBDQUEwQyxDQUFDO0tBQ3ZELE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsQ0FBQztLQUMvRSxNQUFNLENBQUMsMkJBQTJCLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLENBQUM7S0FDdEYsTUFBTSxDQUFDLGlCQUFpQixFQUFFLDhCQUE4QixFQUFFLEtBQUssQ0FBQztLQUNoRSxNQUFNLENBQUMsMEJBQTBCLEVBQUUsK0JBQStCLEVBQUUsZ0JBQWdCLENBQUM7S0FDckYsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO0lBQzFFLG1CQUFtQixFQUFFLENBQUM7SUFDdEIsTUFBTSxLQUFLLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JFLENBQUMsQ0FBQyxDQUFDO0FBRUwsT0FBTztLQUNKLE9BQU8sQ0FBQyxPQUFPLENBQUM7S0FDaEIsV0FBVyxDQUFDLHNDQUFzQyxDQUFDO0tBQ25ELE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsQ0FBQztLQUMvRSxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtJQUM3QixtQkFBbUIsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDO0FBRUwsT0FBTztLQUNKLE9BQU8sQ0FBQyxRQUFRLENBQUM7S0FDakIsV0FBVyxDQUFDLDhEQUE4RCxDQUFDO0tBQzNFLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSwrQkFBK0IsQ0FBQztLQUMxRSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUUsS0FBSyxDQUFDO0tBQ2hFLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxtREFBbUQsQ0FBQztLQUN0RixNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQzdDLG1CQUFtQixFQUFFLENBQUM7SUFDdEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN0RCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQztBQUVMLE9BQU87S0FDSixPQUFPLENBQUMsVUFBVSxDQUFDO0tBQ25CLFdBQVcsQ0FBQyw0Q0FBNEMsQ0FBQztLQUN6RCxNQUFNLENBQUMsd0JBQXdCLEVBQUUsdUJBQXVCLEVBQUUsb0JBQW9CLENBQUM7S0FDL0UsTUFBTSxDQUFDLDBCQUEwQixFQUFFLHdDQUF3QyxFQUFFLEdBQUcsQ0FBQztLQUNqRixjQUFjLENBQUMsaUJBQWlCLEVBQUUsbURBQW1ELENBQUM7S0FDdEYsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQ25DLG1CQUFtQixFQUFFLENBQUM7SUFDdEIsTUFBTSxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBRUwsT0FBTztLQUNKLE9BQU8sQ0FBQyxVQUFVLENBQUM7S0FDbkIsV0FBVyxDQUFDLDBCQUEwQixDQUFDO0tBQ3ZDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsQ0FBQztLQUMvRSxjQUFjLENBQUMsMEJBQTBCLEVBQUUsbUNBQW1DLENBQUM7S0FDL0UsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtJQUNsRCxtQkFBbUIsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLENBQUM7QUFFTCxPQUFPO0tBQ0osT0FBTyxDQUFDLGlCQUFpQixDQUFDO0tBQzFCLFdBQVcsQ0FBQyxxQ0FBcUMsQ0FBQztLQUNsRCxjQUFjLENBQUMseUJBQXlCLEVBQUUsd0JBQXdCLENBQUM7S0FDbkUsY0FBYyxDQUFDLGtDQUFrQyxFQUFFLHFDQUFxQyxDQUFDO0tBQ3pGLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxpREFBaUQsQ0FBQztLQUM3RixNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO0lBQzNELG1CQUFtQixFQUFFLENBQUM7SUFDdEIsTUFBTSxhQUFhLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUMsQ0FBQztBQUVMLE9BQU87S0FDSixPQUFPLENBQUMsY0FBYyxDQUFDO0tBQ3ZCLFdBQVcsQ0FBQyxtR0FBbUcsQ0FBQztLQUNoSCxjQUFjLENBQUMseUJBQXlCLEVBQUUsOENBQThDLENBQUM7S0FDekYsY0FBYyxDQUFDLDBCQUEwQixFQUFFLHlFQUF5RSxDQUFDO0tBQ3JILE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTtJQUMxQyxtQkFBbUIsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sVUFBVSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQztBQUVMLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyJ9