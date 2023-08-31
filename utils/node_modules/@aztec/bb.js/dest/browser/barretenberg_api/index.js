import { BufferDeserializer, NumberDeserializer, VectorDeserializer, BoolDeserializer, StringDeserializer, } from '../serialize/index.js';
import { Fr, Fq, Point, Buffer32, Buffer128, Ptr } from '../types/index.js';
export class BarretenbergApi {
    constructor(binder) {
        this.binder = binder;
    }
    async destroy() {
        await this.binder.wasm.destroy();
    }
    async pedersenInit() {
        const result = await this.binder.callWasmExport('pedersen___init', [], []);
        return;
    }
    async pedersenCompressFields(left, right) {
        const result = await this.binder.callWasmExport('pedersen___compress_fields', [left, right], [Fr]);
        return result[0];
    }
    async pedersenPlookupCompressFields(left, right) {
        const result = await this.binder.callWasmExport('pedersen___plookup_compress_fields', [left, right], [Fr]);
        return result[0];
    }
    async pedersenCompress(inputsBuffer) {
        const result = await this.binder.callWasmExport('pedersen___compress', [inputsBuffer], [Fr]);
        return result[0];
    }
    async pedersenPlookupCompress(inputsBuffer) {
        const result = await this.binder.callWasmExport('pedersen___plookup_compress', [inputsBuffer], [Fr]);
        return result[0];
    }
    async pedersenCompressWithHashIndex(inputsBuffer, hashIndex) {
        const result = await this.binder.callWasmExport('pedersen___compress_with_hash_index', [inputsBuffer, hashIndex], [Fr]);
        return result[0];
    }
    async pedersenCommit(inputsBuffer) {
        const result = await this.binder.callWasmExport('pedersen___commit', [inputsBuffer], [Fr]);
        return result[0];
    }
    async pedersenPlookupCommit(inputsBuffer) {
        const result = await this.binder.callWasmExport('pedersen___plookup_commit', [inputsBuffer], [Fr]);
        return result[0];
    }
    async pedersenPlookupCommitWithHashIndex(inputsBuffer, hashIndex) {
        const result = await this.binder.callWasmExport('pedersen___plookup_commit_with_hash_index', [inputsBuffer, hashIndex], [Fr]);
        return result[0];
    }
    async pedersenBufferToField(data) {
        const result = await this.binder.callWasmExport('pedersen___buffer_to_field', [data], [Fr]);
        return result[0];
    }
    async pedersenHashInit() {
        const result = await this.binder.callWasmExport('pedersen_hash_init', [], []);
        return;
    }
    async pedersenHashPair(left, right) {
        const result = await this.binder.callWasmExport('pedersen_hash_pair', [left, right], [Fr]);
        return result[0];
    }
    async pedersenHashMultiple(inputsBuffer) {
        const result = await this.binder.callWasmExport('pedersen_hash_multiple', [inputsBuffer], [Fr]);
        return result[0];
    }
    async pedersenHashMultipleWithHashIndex(inputsBuffer, hashIndex) {
        const result = await this.binder.callWasmExport('pedersen_hash_multiple_with_hash_index', [inputsBuffer, hashIndex], [Fr]);
        return result[0];
    }
    async pedersenHashToTree(data) {
        const result = await this.binder.callWasmExport('pedersen_hash_to_tree', [data], [VectorDeserializer(Fr)]);
        return result[0];
    }
    async blake2s(data) {
        const result = await this.binder.callWasmExport('blake2s', [data], [Buffer32]);
        return result[0];
    }
    async blake2sToField(data) {
        const result = await this.binder.callWasmExport('blake2s_to_field_', [data], [Fr]);
        return result[0];
    }
    async schnorrComputePublicKey(privateKey) {
        const result = await this.binder.callWasmExport('schnorr_compute_public_key', [privateKey], [Point]);
        return result[0];
    }
    async schnorrNegatePublicKey(publicKeyBuffer) {
        const result = await this.binder.callWasmExport('schnorr_negate_public_key', [publicKeyBuffer], [Point]);
        return result[0];
    }
    async schnorrConstructSignature(message, privateKey) {
        const result = await this.binder.callWasmExport('schnorr_construct_signature', [message, privateKey], [Buffer32, Buffer32]);
        return result;
    }
    async schnorrVerifySignature(message, pubKey, sigS, sigE) {
        const result = await this.binder.callWasmExport('schnorr_verify_signature', [message, pubKey, sigS, sigE], [BoolDeserializer()]);
        return result[0];
    }
    async schnorrMultisigCreateMultisigPublicKey(privateKey) {
        const result = await this.binder.callWasmExport('schnorr_multisig_create_multisig_public_key', [privateKey], [Buffer128]);
        return result[0];
    }
    async schnorrMultisigValidateAndCombineSignerPubkeys(signerPubkeyBuf) {
        const result = await this.binder.callWasmExport('schnorr_multisig_validate_and_combine_signer_pubkeys', [signerPubkeyBuf], [Point, BoolDeserializer()]);
        return result;
    }
    async schnorrMultisigConstructSignatureRound1() {
        const result = await this.binder.callWasmExport('schnorr_multisig_construct_signature_round_1', [], [Buffer128, Buffer128]);
        return result;
    }
    async schnorrMultisigConstructSignatureRound2(message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf) {
        const result = await this.binder.callWasmExport('schnorr_multisig_construct_signature_round_2', [message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf], [Fq, BoolDeserializer()]);
        return result;
    }
    async schnorrMultisigCombineSignatures(message, signerPubkeysBuf, roundOneBuf, roundTwoBuf) {
        const result = await this.binder.callWasmExport('schnorr_multisig_combine_signatures', [message, signerPubkeysBuf, roundOneBuf, roundTwoBuf], [Buffer32, Buffer32, BoolDeserializer()]);
        return result;
    }
    async srsInitSrs(pointsBuf, numPoints, g2PointBuf) {
        const result = await this.binder.callWasmExport('srs_init_srs', [pointsBuf, numPoints, g2PointBuf], []);
        return;
    }
    async examplesSimpleCreateAndVerifyProof() {
        const result = await this.binder.callWasmExport('examples_simple_create_and_verify_proof', [], [BoolDeserializer()]);
        return result[0];
    }
    async testThreads(threads, iterations) {
        const result = await this.binder.callWasmExport('test_threads', [threads, iterations], [NumberDeserializer()]);
        return result[0];
    }
    async testThreadAbort() {
        const result = await this.binder.callWasmExport('test_thread_abort', [], []);
        return;
    }
    async testAbort() {
        const result = await this.binder.callWasmExport('test_abort', [], []);
        return;
    }
    async commonInitSlabAllocator(circuitSize) {
        const result = await this.binder.callWasmExport('common_init_slab_allocator', [circuitSize], []);
        return;
    }
    async acirGetCircuitSizes(constraintSystemBuf) {
        const result = await this.binder.callWasmExport('acir_get_circuit_sizes', [constraintSystemBuf], [NumberDeserializer(), NumberDeserializer(), NumberDeserializer()]);
        return result;
    }
    async acirNewAcirComposer(sizeHint) {
        const result = await this.binder.callWasmExport('acir_new_acir_composer', [sizeHint], [Ptr]);
        return result[0];
    }
    async acirDeleteAcirComposer(acirComposerPtr) {
        const result = await this.binder.callWasmExport('acir_delete_acir_composer', [acirComposerPtr], []);
        return;
    }
    async acirCreateCircuit(acirComposerPtr, constraintSystemBuf, sizeHint) {
        const result = await this.binder.callWasmExport('acir_create_circuit', [acirComposerPtr, constraintSystemBuf, sizeHint], []);
        return;
    }
    async acirInitProvingKey(acirComposerPtr, constraintSystemBuf) {
        const result = await this.binder.callWasmExport('acir_init_proving_key', [acirComposerPtr, constraintSystemBuf], []);
        return;
    }
    async acirCreateProof(acirComposerPtr, constraintSystemBuf, witnessBuf, isRecursive) {
        const result = await this.binder.callWasmExport('acir_create_proof', [acirComposerPtr, constraintSystemBuf, witnessBuf, isRecursive], [BufferDeserializer()]);
        return result[0];
    }
    async acirLoadVerificationKey(acirComposerPtr, vkBuf) {
        const result = await this.binder.callWasmExport('acir_load_verification_key', [acirComposerPtr, vkBuf], []);
        return;
    }
    async acirInitVerificationKey(acirComposerPtr) {
        const result = await this.binder.callWasmExport('acir_init_verification_key', [acirComposerPtr], []);
        return;
    }
    async acirGetVerificationKey(acirComposerPtr) {
        const result = await this.binder.callWasmExport('acir_get_verification_key', [acirComposerPtr], [BufferDeserializer()]);
        return result[0];
    }
    async acirVerifyProof(acirComposerPtr, proofBuf, isRecursive) {
        const result = await this.binder.callWasmExport('acir_verify_proof', [acirComposerPtr, proofBuf, isRecursive], [BoolDeserializer()]);
        return result[0];
    }
    async acirGetSolidityVerifier(acirComposerPtr) {
        const result = await this.binder.callWasmExport('acir_get_solidity_verifier', [acirComposerPtr], [StringDeserializer()]);
        return result[0];
    }
    async acirSerializeProofIntoFields(acirComposerPtr, proofBuf, numInnerPublicInputs) {
        const result = await this.binder.callWasmExport('acir_serialize_proof_into_fields', [acirComposerPtr, proofBuf, numInnerPublicInputs], [VectorDeserializer(Fr)]);
        return result[0];
    }
    async acirSerializeVerificationKeyIntoFields(acirComposerPtr) {
        const result = await this.binder.callWasmExport('acir_serialize_verification_key_into_fields', [acirComposerPtr], [VectorDeserializer(Fr), Fr]);
        return result;
    }
}
export class BarretenbergApiSync {
    constructor(binder) {
        this.binder = binder;
    }
    async destroy() {
        await this.binder.wasm.destroy();
    }
    pedersenInit() {
        const result = this.binder.callWasmExport('pedersen___init', [], []);
        return;
    }
    pedersenCompressFields(left, right) {
        const result = this.binder.callWasmExport('pedersen___compress_fields', [left, right], [Fr]);
        return result[0];
    }
    pedersenPlookupCompressFields(left, right) {
        const result = this.binder.callWasmExport('pedersen___plookup_compress_fields', [left, right], [Fr]);
        return result[0];
    }
    pedersenCompress(inputsBuffer) {
        const result = this.binder.callWasmExport('pedersen___compress', [inputsBuffer], [Fr]);
        return result[0];
    }
    pedersenPlookupCompress(inputsBuffer) {
        const result = this.binder.callWasmExport('pedersen___plookup_compress', [inputsBuffer], [Fr]);
        return result[0];
    }
    pedersenCompressWithHashIndex(inputsBuffer, hashIndex) {
        const result = this.binder.callWasmExport('pedersen___compress_with_hash_index', [inputsBuffer, hashIndex], [Fr]);
        return result[0];
    }
    pedersenCommit(inputsBuffer) {
        const result = this.binder.callWasmExport('pedersen___commit', [inputsBuffer], [Fr]);
        return result[0];
    }
    pedersenPlookupCommit(inputsBuffer) {
        const result = this.binder.callWasmExport('pedersen___plookup_commit', [inputsBuffer], [Fr]);
        return result[0];
    }
    pedersenPlookupCommitWithHashIndex(inputsBuffer, hashIndex) {
        const result = this.binder.callWasmExport('pedersen___plookup_commit_with_hash_index', [inputsBuffer, hashIndex], [Fr]);
        return result[0];
    }
    pedersenBufferToField(data) {
        const result = this.binder.callWasmExport('pedersen___buffer_to_field', [data], [Fr]);
        return result[0];
    }
    pedersenHashInit() {
        const result = this.binder.callWasmExport('pedersen_hash_init', [], []);
        return;
    }
    pedersenHashPair(left, right) {
        const result = this.binder.callWasmExport('pedersen_hash_pair', [left, right], [Fr]);
        return result[0];
    }
    pedersenHashMultiple(inputsBuffer) {
        const result = this.binder.callWasmExport('pedersen_hash_multiple', [inputsBuffer], [Fr]);
        return result[0];
    }
    pedersenHashMultipleWithHashIndex(inputsBuffer, hashIndex) {
        const result = this.binder.callWasmExport('pedersen_hash_multiple_with_hash_index', [inputsBuffer, hashIndex], [Fr]);
        return result[0];
    }
    pedersenHashToTree(data) {
        const result = this.binder.callWasmExport('pedersen_hash_to_tree', [data], [VectorDeserializer(Fr)]);
        return result[0];
    }
    blake2s(data) {
        const result = this.binder.callWasmExport('blake2s', [data], [Buffer32]);
        return result[0];
    }
    blake2sToField(data) {
        const result = this.binder.callWasmExport('blake2s_to_field_', [data], [Fr]);
        return result[0];
    }
    schnorrComputePublicKey(privateKey) {
        const result = this.binder.callWasmExport('schnorr_compute_public_key', [privateKey], [Point]);
        return result[0];
    }
    schnorrNegatePublicKey(publicKeyBuffer) {
        const result = this.binder.callWasmExport('schnorr_negate_public_key', [publicKeyBuffer], [Point]);
        return result[0];
    }
    schnorrConstructSignature(message, privateKey) {
        const result = this.binder.callWasmExport('schnorr_construct_signature', [message, privateKey], [Buffer32, Buffer32]);
        return result;
    }
    schnorrVerifySignature(message, pubKey, sigS, sigE) {
        const result = this.binder.callWasmExport('schnorr_verify_signature', [message, pubKey, sigS, sigE], [BoolDeserializer()]);
        return result[0];
    }
    schnorrMultisigCreateMultisigPublicKey(privateKey) {
        const result = this.binder.callWasmExport('schnorr_multisig_create_multisig_public_key', [privateKey], [Buffer128]);
        return result[0];
    }
    schnorrMultisigValidateAndCombineSignerPubkeys(signerPubkeyBuf) {
        const result = this.binder.callWasmExport('schnorr_multisig_validate_and_combine_signer_pubkeys', [signerPubkeyBuf], [Point, BoolDeserializer()]);
        return result;
    }
    schnorrMultisigConstructSignatureRound1() {
        const result = this.binder.callWasmExport('schnorr_multisig_construct_signature_round_1', [], [Buffer128, Buffer128]);
        return result;
    }
    schnorrMultisigConstructSignatureRound2(message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf) {
        const result = this.binder.callWasmExport('schnorr_multisig_construct_signature_round_2', [message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf], [Fq, BoolDeserializer()]);
        return result;
    }
    schnorrMultisigCombineSignatures(message, signerPubkeysBuf, roundOneBuf, roundTwoBuf) {
        const result = this.binder.callWasmExport('schnorr_multisig_combine_signatures', [message, signerPubkeysBuf, roundOneBuf, roundTwoBuf], [Buffer32, Buffer32, BoolDeserializer()]);
        return result;
    }
    srsInitSrs(pointsBuf, numPoints, g2PointBuf) {
        const result = this.binder.callWasmExport('srs_init_srs', [pointsBuf, numPoints, g2PointBuf], []);
        return;
    }
    examplesSimpleCreateAndVerifyProof() {
        const result = this.binder.callWasmExport('examples_simple_create_and_verify_proof', [], [BoolDeserializer()]);
        return result[0];
    }
    testThreads(threads, iterations) {
        const result = this.binder.callWasmExport('test_threads', [threads, iterations], [NumberDeserializer()]);
        return result[0];
    }
    testThreadAbort() {
        const result = this.binder.callWasmExport('test_thread_abort', [], []);
        return;
    }
    testAbort() {
        const result = this.binder.callWasmExport('test_abort', [], []);
        return;
    }
    commonInitSlabAllocator(circuitSize) {
        const result = this.binder.callWasmExport('common_init_slab_allocator', [circuitSize], []);
        return;
    }
    acirGetCircuitSizes(constraintSystemBuf) {
        const result = this.binder.callWasmExport('acir_get_circuit_sizes', [constraintSystemBuf], [NumberDeserializer(), NumberDeserializer(), NumberDeserializer()]);
        return result;
    }
    acirNewAcirComposer(sizeHint) {
        const result = this.binder.callWasmExport('acir_new_acir_composer', [sizeHint], [Ptr]);
        return result[0];
    }
    acirDeleteAcirComposer(acirComposerPtr) {
        const result = this.binder.callWasmExport('acir_delete_acir_composer', [acirComposerPtr], []);
        return;
    }
    acirCreateCircuit(acirComposerPtr, constraintSystemBuf, sizeHint) {
        const result = this.binder.callWasmExport('acir_create_circuit', [acirComposerPtr, constraintSystemBuf, sizeHint], []);
        return;
    }
    acirInitProvingKey(acirComposerPtr, constraintSystemBuf) {
        const result = this.binder.callWasmExport('acir_init_proving_key', [acirComposerPtr, constraintSystemBuf], []);
        return;
    }
    acirCreateProof(acirComposerPtr, constraintSystemBuf, witnessBuf, isRecursive) {
        const result = this.binder.callWasmExport('acir_create_proof', [acirComposerPtr, constraintSystemBuf, witnessBuf, isRecursive], [BufferDeserializer()]);
        return result[0];
    }
    acirLoadVerificationKey(acirComposerPtr, vkBuf) {
        const result = this.binder.callWasmExport('acir_load_verification_key', [acirComposerPtr, vkBuf], []);
        return;
    }
    acirInitVerificationKey(acirComposerPtr) {
        const result = this.binder.callWasmExport('acir_init_verification_key', [acirComposerPtr], []);
        return;
    }
    acirGetVerificationKey(acirComposerPtr) {
        const result = this.binder.callWasmExport('acir_get_verification_key', [acirComposerPtr], [BufferDeserializer()]);
        return result[0];
    }
    acirVerifyProof(acirComposerPtr, proofBuf, isRecursive) {
        const result = this.binder.callWasmExport('acir_verify_proof', [acirComposerPtr, proofBuf, isRecursive], [BoolDeserializer()]);
        return result[0];
    }
    acirGetSolidityVerifier(acirComposerPtr) {
        const result = this.binder.callWasmExport('acir_get_solidity_verifier', [acirComposerPtr], [StringDeserializer()]);
        return result[0];
    }
    acirSerializeProofIntoFields(acirComposerPtr, proofBuf, numInnerPublicInputs) {
        const result = this.binder.callWasmExport('acir_serialize_proof_into_fields', [acirComposerPtr, proofBuf, numInnerPublicInputs], [VectorDeserializer(Fr)]);
        return result[0];
    }
    acirSerializeVerificationKeyIntoFields(acirComposerPtr) {
        const result = this.binder.callWasmExport('acir_serialize_verification_key_into_fields', [acirComposerPtr], [VectorDeserializer(Fr), Fr]);
        return result;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnX2FwaS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLGtCQUFrQixFQUNsQixrQkFBa0IsRUFDbEIsZ0JBQWdCLEVBQ2hCLGtCQUFrQixHQUNuQixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRTVFLE1BQU0sT0FBTyxlQUFlO0lBQzFCLFlBQW1CLE1BQTBCO1FBQTFCLFdBQU0sR0FBTixNQUFNLENBQW9CO0lBQUcsQ0FBQztJQUVqRCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVELEtBQUssQ0FBQyxZQUFZO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLE9BQU87SUFDVCxDQUFDO0lBRUQsS0FBSyxDQUFDLHNCQUFzQixDQUFDLElBQVEsRUFBRSxLQUFTO1FBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25HLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxLQUFLLENBQUMsNkJBQTZCLENBQUMsSUFBUSxFQUFFLEtBQVM7UUFDckQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMs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