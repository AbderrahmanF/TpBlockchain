const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Attribution du rôle d'administrateur...");
  
  // Adresse de votre compte MetaMask
  const YOUR_ADDRESS = "0xEe3EA397B1a44f823df1275824F2E86BDf97FB61";
  
  // Récupérer les signers
  const [deployer] = await ethers.getSigners();
  console.log("Exécution avec l'adresse:", deployer.address);
  
  // Récupérer l'adresse du contrat depuis le fichier de configuration
  const fs = require('fs');
  const path = require('path');
  
  let contractAddress;
  try {
    const configPath = path.join(__dirname, '../contract-config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const addressMatch = configContent.match(/address: "([^"]+)"/);
    if (addressMatch && addressMatch[1]) {
      contractAddress = addressMatch[1];
    } else {
      throw new Error("Adresse du contrat non trouvée dans le fichier de configuration");
    }
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier de configuration:", error);
    contractAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; // Adresse par défaut
  }
  
  console.log("Adresse du contrat:", contractAddress);
  
  // Se connecter au contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  const voteElectronique = await VoteElectronique.attach(contractAddress);
  
  // Constante pour le rôle d'administrateur (DEFAULT_ADMIN_ROLE)
  const DEFAULT_ADMIN_ROLE = ethers.utils.hexZeroPad("0x", 32); // 0x0000...0000
  
  // Vérifier si l'adresse a déjà le rôle d'administrateur
  const hasRole = await voteElectronique.hasRole(DEFAULT_ADMIN_ROLE, YOUR_ADDRESS);
  if (hasRole) {
    console.log(`L'adresse ${YOUR_ADDRESS} a déjà le rôle d'administrateur.`);
    return;
  }
  
  // Attribuer le rôle d'administrateur
  console.log(`Attribution du rôle d'administrateur à l'adresse ${YOUR_ADDRESS}...`);
  const tx = await voteElectronique.grantRole(DEFAULT_ADMIN_ROLE, YOUR_ADDRESS);
  await tx.wait();
  
  console.log("Transaction confirmée!");
  
  // Vérifier que le rôle a bien été attribué
  const hasRoleAfter = await voteElectronique.hasRole(DEFAULT_ADMIN_ROLE, YOUR_ADDRESS);
  if (hasRoleAfter) {
    console.log(`L'adresse ${YOUR_ADDRESS} a maintenant le rôle d'administrateur.`);
  } else {
    console.log(`Erreur: L'adresse ${YOUR_ADDRESS} n'a pas le rôle d'administrateur.`);
  }
  
  // Ajouter également l'adresse à la whitelist
  console.log(`Ajout de l'adresse ${YOUR_ADDRESS} à la whitelist...`);
  const tx2 = await voteElectronique.ajouterParticipant(YOUR_ADDRESS);
  await tx2.wait();
  
  console.log("Transaction confirmée!");
  console.log("Votre adresse a été ajoutée à la whitelist.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
