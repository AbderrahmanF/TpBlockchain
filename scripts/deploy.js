const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Déploiement du contrat VoteElectroniqueUpgradeable...");
  
  // Récupération du contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  
  // Déploiement en tant que contrat upgradeable (proxy)
  const voteElectronique = await upgrades.deployProxy(VoteElectronique, [], {
    initializer: "initialize",
  });
  
  await voteElectronique.waitForDeployment();
  
  console.log("VoteElectroniqueUpgradeable déployé à l'adresse:", await voteElectronique.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
