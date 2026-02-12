const sinon = require('sinon');
const chai = require('chai');
const {expect} = chai;

let sandbox;
beforeEach(() => {
  sandbox = sinon.createSandbox();
});
afterEach(() => {
  sandbox.restore();
});

module.exports = {sinon, chai, expect, getSandbox: () => sandbox};
