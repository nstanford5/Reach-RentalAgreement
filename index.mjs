import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib();

console.log("Launching...");

// ask needs to be implemented from the stdlib
const isA = await ask.ask(
  `Are you initiating this contract?`,
  ask.yesno
);

const who = isA ? 'A' : 'B';
console.log(`Starting Rental Agreement as ${who}`);

const createAcc = await ask.ask(
  `Would you like to create an account?`,
  ask.yesno
);

let acc = null;
if(createAcc){
  // create new test account and fund with 1000 tokens
  acc = await stdlib.newTestAccount(stdlib.parseCurrency(1000));
} else { // import account from secret mnemonic
  const secret = await ask.ask(
    `What is your account secret?`,
    (x => x)
  );
  acc = await stdlib.newAccountFromSecret(secret);
}

// who is it?
// deploy or attach accordingly
let ctc = null;
if (isA){
  ctc = acc.contract(backend);
  ctc.getInfo().then((info) => {
    console.log(`The contract is deployed = ${JSON.stringify(info)}`);
  });
} else {
  const info = await ask.ask(
    `Please paste the contract information`,
    JSON.parse
  );
  ctc = acc.contract(backend, info);
}

const fmt = (x) => stdlib.formatCurrency(x, 4);
const getBalance = async () => fmt(await stdlib.balanceOf(acc));

const before = await getBalance();
console.log(`Your balance is ${before}`);

const interact = { ...stdlib.hasRandom };

interact.informTimeout = () => {
  console.log(`There was a timeout`);
  process.exit(1);
};

if(isA) {
  const amount = await ask.ask(
    `How much is the agreement for?`,
    stdlib.parseCurrency
  );
  interact.wager = amount;
} else { // must be B
  interact.acceptWager = async (amount) => {
    const accepted = await ask.ask(
      `Do you agree the amount for the contract is ${fmt(amount)}`,
      ask.yesno
    );
    if(!accepted){
      process.exit(0);
    }
  };
}

interact.getChoice = async () => {
  const choice = await ask.ask(
    `Would you like to continue with the contract?`,
    ask.yesno
  );
  return choice;
}

const OUTCOME = ['A withdraws', 'B withdraws', 'Both parties withdraw', 'Agreement Continues'];
interact.seeOutcome = (outcome) => {
  console.log(`The outcome is: ${OUTCOME[outcome]}`);
};

const part = isA ? ctc.p.A : ctc.p.B;
await part(interact);

const after = await getBalance();
console.log(`Your balance is now ${after}`);

console.log('Rental Agreement Participants');

ask.done();
