let wasm;

import("../circuits/exponential_elgamal/babygiant/pkg/index.js").then((module) => {
  wasm = module;
})
/*
function babyGiant(Cx,Cy){
  let wasm;
  import("../circuits/exponential_elgamal/babygiant/pkg/index.js")
  .then((module) => {
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
    wasm = module;
  })
  .catch((error) => {
    console.error("Failed to load the Wasm module:", error);
  });
    return wasm.do_compute_dlog(Cx, Cy);
}

babyGiant("05c8f08545f6882bad9807a929ab4685d47216b8422d61ab49e3bed0cb12e705","10c3d3d9d7b645fae3488ac1783f253a56fe190387c6d643d6a74631d5b2bd00")


export function babyGiant(Cx,Cy){
  let wasm;
  import("../circuits/exponential_elgamal/babygiant/pkg/index.js")
  .then((module) => {
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
    wasm = module;
  })
  .catch((error) => {
    console.error("Failed to load the Wasm module:", error);
  });
    return wasm.do_compute_dlog(Cx, Cy);
}*/