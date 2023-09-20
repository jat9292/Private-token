self.onmessage = async function(event) {
  const wasm = await import("../../circuits/exponential_elgamal/babygiant/pkg/index.js");
  const { Cx, Cy, min_range, max_range } = event.data;
  try {
    const output = wasm.do_compute_dlog(Cx, Cy, BigInt(min_range), BigInt(max_range));
    self.postMessage(output);
  } catch (e) {
    self.postMessage("dl_not_found");
  }
  self.close();
};