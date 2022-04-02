const Decentragram = artifacts.require("Decentragram");

module.exports = function(deployer) {
  //Migra los smart contracts de la PC a la Blockchain
  deployer.deploy(Decentragram);
};