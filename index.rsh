/**
 * Rental Agreement - This contract remains indefinite
 * until terminated by one or both parties. If terminated
 * by both parties it is considered on good terms and deposits
 * are returned. If only one party decides to leave the balance
 * is paid to the other participant, considering a disagreement
 * and premature exit of the contract.
 * 
 * This scenario demonstrates the value of decentralization, because
 * in traditional institutions, one party is typically empowered as 
 * always dictating the decision to the other who must take it, as
 * is the case for most landlords; or, the two parties must play
 * "chicken" with each other to see who will flinch first as is often
 * the case in divorces; or, the two parties must pay a third-party
 * to act as the arbitrator
 */

 'reach 0.1';

 const [roundOutcome, A_OUT, B_OUT, BOTH_OUT, BOTH_IN] = makeEnum(4);
 const DEADLINE = 20;
 
 // function that determines state based on user choices
 const contractState = (aChoice, bChoice) => {
   if(aChoice && !bChoice){
     return B_OUT;
   } else {
     if(!aChoice && bChoice){
       return A_OUT;
     } else {
       if(!aChoice && !bChoice){
         return BOTH_OUT;
       } else {
         return BOTH_IN;
       }
     }
   }
 };
 
 // shared player method signatures
 const Shared = {
   ...hasRandom, 
   informTimeout: Fun([], Null),
   getChoice: Fun([], Bool),
   seeOutcome: Fun([UInt], Null),
 };
 
 // Reach app starts here
 export const main = Reach.App(() => {
 
   // participant interact interface
   const A = Participant('A', {
     ...Shared, // inherit all Player functions
     wager: UInt, // declare wager
   });
 
   // participant interact interface
   const B = Participant('B', {
     ...Shared, // inherit all Player functions
     acceptWager: Fun([UInt], Null), // declare acceptWager method signature
   });
 
   // initialize the app
   init();
 
   const informTimeout = () => {
     each([A, B], () => {
       interact.informTimeout();
     });
   };
 
   // first participant creates the wager and deadline
   A.only(() => {
     const wager = declassify(interact.wager);
   });
 
   // The first one to publish deploys the contract
   A.publish(wager)
     .pay(wager);
   commit();
 
   // Hutch always accepts this wager
   B.only(() => {
     interact.acceptWager(wager);
   });
 
   // The second one to publish always attaches
   B.pay(wager)
     .timeout(relativeTime(DEADLINE), () => closeTo(A, informTimeout));
 
   var outcome = BOTH_IN;
   invariant(balance() == 2 * wager);
   while (outcome == BOTH_IN) {
     commit();

     A.only(() => {
      const _aChoice = interact.getChoice();
      const [_aCommit, _aSalt] = makeCommitment(interact, _aChoice);
      const aCommit = declassify(_aCommit);
     });
 
     A.publish(aCommit)
      .timeout(relativeTime(DEADLINE), () => closeTo(B, informTimeout));
     commit();

     B.only(() => {
       const bChoice = declassify(interact.getChoice());
     });
     B.publish(bChoice)
      .timeout(relativeTime(DEADLINE), () => closeTo(A, informTimeout));
     commit();

     A.only(() => {
      const [aSalt, aChoice] = declassify([_aSalt, _aChoice]);
     });
     
     A.publish(aSalt, aChoice);
 
     outcome = contractState(aChoice, bChoice);
     continue;
   }; // end of while loop
 
   // both parties agree, transfer half the contract balance to each
   if(outcome == BOTH_OUT){
     transfer(wager).to(A);
     transfer(wager).to(B);
   } else {
     // they disagree, transfer full balance to the party that remains honest
     transfer(2 * wager).to(outcome == A_OUT ? B : A);
   }
   each([A, B], () => {
    interact.seeOutcome(outcome);
   });
   commit();
   exit();
 });
