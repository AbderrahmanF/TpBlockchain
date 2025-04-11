const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Déploiement du contrat VoteElectroniqueUpgradeable...");
  
  // Récupérer les signers
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec l'adresse:", deployer.address);
  
  // Récupération du contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  
  // Déploiement en tant que contrat upgradeable (proxy)
  const voteElectronique = await upgrades.deployProxy(VoteElectronique, [], {
    initializer: "initialize",
  });
  
  await voteElectronique.waitForDeployment();
  
  const address = await voteElectronique.getAddress();
  console.log("VoteElectroniqueUpgradeable déployé à l'adresse:", address);
  
  // Créer un fichier de configuration pour l'interface web
  const configContent = `
// Configuration générée automatiquement
const CONTRACT_CONFIG = {
  address: "${address}",
  network: "localhost",
  deploymentTime: "${new Date().toISOString()}"
};
  `;
  
  fs.writeFileSync('contract-config.js', configContent);
  console.log("Fichier de configuration généré: contract-config.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
