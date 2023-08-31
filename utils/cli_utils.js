import * as myFunctions from './babyjubjub_utils.js';
import * as myFunctions2 from './babygiant_utils.js';

const main = () => {
    const functionName = process.argv[2];
    const args = process.argv.slice(3);

    if (myFunctions[functionName]) {
        console.log(myFunctions[functionName](...args));
    } else {
        if (myFunctions2[functionName]) {
            console.log(myFunctions2[functionName](...args));
        } else{
        console.error('Function not found!');
        }
    }
};

main();