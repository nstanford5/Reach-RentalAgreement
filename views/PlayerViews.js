//import { doStdlibLoad } from '@reach-sh/stdlib/dist/types/registry';
import React from 'react';

const exports = {};

// Player views must be extended.
// It does not have its own Wrapper view.

exports.GetHand = class extends React.Component {
  render() {
    const {parent, playable, choice} = this.props;
    return (
      <div>
        <br />
        {!playable ? 'Please wait...' : ''}
        <br />
        {'Please pick a hand'}
        <br />
        <br />
        <button
          disabled={!playable}
          onClick={() => parent.playChoice(true)}
        >Continue Agreement</button>
        <button
          disabled={!playable}
          onClick={() => parent.playChoice(false)}
        >Withdraw Funds</button>
      </div>
    );
  }
}

exports.WaitingForResults = class extends React.Component {
  render() {
    return (
      <div>
        Waiting for results...
      </div>
    );
  }
}

exports.Done = class extends React.Component {
  render() {
    const {outcome} = this.props;
    return (
      <div>
        Thank you for playing. The outcome of this game was:
        <br />{outcome || 'Unknown'}
      </div>
    );
  }
}

exports.Timeout = class extends React.Component {
  render() {
    return (
      <div>
        There's been a timeout. (Someone took too long.)
      </div>
    );
  }
}

export default exports;
