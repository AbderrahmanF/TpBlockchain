const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Déploiement du contrat VoteElectroniqueUpgradeable sur Sepolia...");
  
  // Récupérer les signers
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec l'adresse:", deployer.address);
  
  // Votre adresse MetaMask
  const YOUR_ADDRESS = "0xEe3EA397B1a44f823df1275824F2E86BDf97FB61";
  
  // Récupération du contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  
  // Déploiement en tant que contrat upgradeable (proxy)
  console.log("Déploiement du proxy...");
  const voteElectronique = await upgrades.deployProxy(VoteElectronique, [], {
    initializer: "initialize",
  });
  
  console.log("En attente de confirmation...");
  await voteElectronique.waitForDeployment();
  
  const address = await voteElectronique.getAddress();
  console.log("VoteElectroniqueUpgradeable déployé à l'adresse:", address);
  
  // Attribuer le rôle d'administrateur à votre adresse MetaMask si elle est différente du déployeur
  if (YOUR_ADDRESS.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log(`Attribution du rôle d'administrateur à ${YOUR_ADDRESS}...`);
    
    // Utiliser directement la valeur du DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    try {
      // Attribuer le rôle d'administrateur à votre adresse
      const tx = await voteElectronique.grantRole(DEFAULT_ADMIN_ROLE, YOUR_ADDRESS);
      await tx.wait();
      console.log(`Rôle d'administrateur attribué à ${YOUR_ADDRESS}`);
      
      // Ajouter votre adresse à la whitelist
      const tx2 = await voteElectronique.ajouterParticipant(YOUR_ADDRESS);
      await tx2.wait();
      console.log(`Adresse ${YOUR_ADDRESS} ajoutée à la whitelist`);
    } catch (error) {
      console.error("Erreur lors de l'attribution des droits:", error);
    }
  } else {
    console.log("Le déployeur est déjà administrateur");
    
    // Ajouter le déployeur à la whitelist
    try {
      const tx = await voteElectronique.ajouterParticipant(deployer.address);
      await tx.wait();
      console.log(`Adresse ${deployer.address} ajoutée à la whitelist`);
    } catch (error) {
      console.error("Erreur lors de l'ajout à la whitelist:", error);
    }
  }
  
  // Créer un fichier de configuration pour l'interface web
  const network = await ethers.provider.getNetwork();
  const configContent = `
// Configuration générée automatiquement pour Sepolia
const CONTRACT_CONFIG = {
  address: "${address}",
  network: "sepolia",
  chainId: ${network.chainId},
  userAddress: "${YOUR_ADDRESS}",
  deploymentTime: "${new Date().toISOString()}"
};
  `;
  
  fs.writeFileSync('contract-config-sepolia.js', configContent);
  console.log("Fichier de configuration généré: contract-config-sepolia.js");
  
  console.log("\nInstructions pour vérifier le contrat sur Etherscan:");
  console.log("npx hardhat verify --network sepolia", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
