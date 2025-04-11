const { ethers } = require("hardhat");

async function main() {
  console.log("Déploiement du contrat VoteElectroniqueUpgradeable...");
  
  // Récupération du contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  
  // Déploiement standard (sans proxy pour simplifier)
  const voteElectronique = await VoteElectronique.deploy();
  await voteElectronique.deployed();
  
  // Initialisation manuelle
  await voteElectronique.initialize();
  
  console.log("VoteElectroniqueUpgradeable déployé à l'adresse:", voteElectronique.address);
  
  // Vérification que le contrat fonctionne correctement
  const count = await voteElectronique.resolutionCount();
  console.log("Nombre initial de résolutions:", count.toString());
  
  // Ajouter une résolution de test
  const tx = await voteElectronique.ajouterResolution("Résolution de test");
  await tx.wait();
  
  const countAfter = await voteElectronique.resolutionCount();
  console.log("Nombre de résolutions après ajout:", countAfter.toString());
  
  console.log("Déploiement et test réussis!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
