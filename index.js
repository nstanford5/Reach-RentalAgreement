import React from 'react';
import AppViews from './views/AppViews.js';
import DeployerViews from './views/DeployerViews.js';
import AttacherViews from './views/AttacherViews.js';
import {renderDOM, renderView} from './views/render.js';
import './index.css';
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
const reach = loadStdlib(process.env);
//const stdlib = loadStdlib();

//import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib';
//import { bigNumberToNumber } from '@reach-sh/stdlib/dist/types/CBR';
//import { bigNumberToNumber } from '@reach-sh/stdlib/dist/types/CBR';
/*reach.setWalletFallback(reach.walletFallback({
    providerEnv: {
      ALGO_TOKEN: '',
      ALGO_SERVER: "https://testnet-api.algonode.cloud",
      ALGO_PORT: '',
      ALGO_INDEXER_TOKEN: '',
      ALGO_INDEXER_SERVER: "https://testnet-idx.algonode.cloud",
      ALGO_INDEXER_PORT: '',
    }, MyAlgoConnect}));*/


import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib';
reach.setWalletFallback(reach.walletFallback({
  providerEnv: 'TestNet', MyAlgoConnect }));


// declare constants
const intToOutcome = ['A withdrew', 'B withdrew', 'Both parties withdrew', 'Agreement continues'];
const {standardUnit} = reach;
const defaults = {defaultFundAmt: '10', defaultWager: '0', standardUnit};

class App extends React.Component {
    // state based views
    constructor(props) {
        super(props);
        this.state = {view: 'ConnectAccount', ...defaults};
    }
    async componentDidMount() {
        const acc = await reach.getDefaultAccount();
        const balAtomic = await reach.balanceOf(acc);
        const bal = reach.formatCurrency(balAtomic, 4);
        this.setState({acc, bal});
        if(await reach.canFundFromFaucet()){
            this.setState({view: 'FundAccount'});
        } else {
            this.setState({view: 'DeployerOrAttacher'});
        }
    }
    async fundAccount(fundAmount) {
        await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount));
        this.setState({view: 'DeployerOrAttacher'});
    }
    async skipFundAccount() {this.setState({view: 'DeployerOrAttacher'}); }
    selectAttacher() {this.setState({view: 'Wrapper', ContentView: Attacher});}
    selectDeployer() {this.setState({view: 'Wrapper', ContentView: Deployer});}
    render() { return renderView(this, AppViews);}
}

// Shared
class Shared extends React.Component {
    //these are the function definitions
    // these mirror the front end
    random() { return reach.hasRandom.random(); }
    async getChoice() {
      const choice = await new Promise(resolveChoiceP => {
        this.setState({view: 'GetHand', playable: true, resolveChoiceP});
      });
      return choice;
    }
    seeOutcome(i) { this.setState({view: 'Done', outcome: intToOutcome[i]});}
    informTimeout() {this.setState({view: 'Timeout'}); }
    playChoice(x) {
      this.state.resolveChoiceP(x);
  }
}

class Deployer extends Shared {
    constructor(props) {
        super(props);
        this.state = {view: 'SetWager'};
    }
    setWager(wager) {this.setState({view: 'Deploy', wager});}
    async deploy() {
        const ctc = this.props.acc.contract(backend);
        this.setState({view: 'Deploying', ctc});
        this.wager = reach.parseCurrency(this.state.wager);
        this.deadline = {ETH: 10, ALGO: 100, CFX: 1000}[reach.connector];
        backend.A(ctc, this);
        const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
        this.setState({view: 'WaitingForAttacher', ctcInfoStr});
    }
    render() { return renderView(this, DeployerViews); }
    // this is the end of Deployer
}

// Attacher
class Attacher extends Shared {
    constructor(props) {
        super(props);
        this.state = {view: 'Attach'};
    }
    attach(ctcInfoStr) {
        const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
        this.setState({view: 'Attaching'});
        backend.B(ctc, this);
    }
    async acceptWager(wagerAtomic){
        const wager = reach.formatCurrency(wagerAtomic, 4);
        return await new Promise(resolveAcceptedP => {
            this.setState({view: 'AcceptTerms', wager, resolveAcceptedP});
        });
    }
    termsAccepted() {
        this.state.resolveAcceptedP();
        this.setState({view: 'WaitingForTurn'});
    }
    render() { return renderView(this, AttacherViews);}
}
renderDOM(<App />);
