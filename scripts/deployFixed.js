const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Déploiement du contrat VoteElectroniqueUpgradeable avec correction...");
  
  // Récupération du contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  
  // Déploiement en tant que contrat upgradeable (proxy)
  const voteElectronique = await upgrades.deployProxy(VoteElectronique, [], {
    initializer: "initialize",
  });
  
  await voteElectronique.deployed();
  
  console.log("VoteElectroniqueUpgradeable déployé à l'adresse:", voteElectronique.address);
  
  // Vérification que le contrat fonctionne correctement
  try {
    const count = await voteElectronique.resolutionCount();
    console.log("Nombre initial de résolutions:", count.toString());
    
    // Ajouter une résolution de test
    const tx = await voteElectronique.ajouterResolution("Résolution de test");
    await tx.wait();
    
    const countAfter = await voteElectronique.resolutionCount();
    console.log("Nombre de résolutions après ajout:", countAfter.toString());
    
    console.log("Déploiement et test réussis!");
  } catch (error) {
    console.error("Erreur lors des tests:", error);
  }
  
  // Générer un fichier de configuration pour l'interface web
  const fs = require('fs');
  const configContent = `
// Configuration générée automatiquement
const CONTRACT_CONFIG = {
  address: "${voteElectronique.address}",
  network: "localhost",
  deploymentTime: "${new Date().toISOString()}"
};

// Exporter la configuration
if (typeof module !== 'undefined') {
  module.exports = CONTRACT_CONFIG;
}
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
