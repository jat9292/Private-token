import * as myFunctions from './babyjubjub_utils.js';

const main = () => {
    const functionName = process.argv[2];
    const args = process.argv.slice(3);

    if (myFunctions[functionName]) {
        console.log(myFunctions[functionName](...args));
    } else {
        console.error('Function not found!');
    }
};

main();