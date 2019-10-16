"use strict";

const Agent = require("agentkeepalive");

const defaultAgentOpts = {
  keepAliveMsecs: 3000, // TCP Keep-Alive Probe
  socketActiveTTL: 60000
};

class AgentStore {
  constructor() {
    this.httpAgent = new Agent(defaultAgentOpts);
    this.httpsAgent = new Agent.HttpsAgent(defaultAgentOpts);
  }

  getAgent(protocol) {
    if (protocol === "http:") {
      return this.httpAgent;
    }
    return this.httpsAgent;
  }
}

module.exports = new AgentStore();
