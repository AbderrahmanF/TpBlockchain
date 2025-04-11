const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Se connecter au contrat
  const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
  const voteElectronique = VoteElectronique.attach(contractAddress);
  
  // Vérifier le nombre de résolutions
  const resolutionCount = await voteElectronique.resolutionCount();
  console.log("Nombre de résolutions:", resolutionCount.toString());
  
  try {
    console.log("Tentative d'obtention des résultats pour la résolution 1...");
    const resultats = await voteElectronique.obtenirResultats(1);
    console.log("Résultats pour la résolution 1:", {
      pour: resultats[0].toString(),
      contre: resultats[1].toString(),
      neutre: resultats[2].toString()
    });
    
    // Essayons d'ajouter un vote pour voir si cela fonctionne
    console.log("Tentative d'ajout d'un participant à la whitelist...");
    const accounts = await ethers.getSigners();
    const voter = accounts[1];
    
    const txWhitelist = await voteElectronique.ajouterParticipant(voter.address);
    await txWhitelist.wait();
    console.log(`Participant ${voter.address} ajouté à la whitelist`);
    
    console.log("Tentative de vote avec le participant...");
    const txVote = await voteElectronique.connect(voter).voter(1, "pour");
    await txVote.wait();
    console.log("Vote 'pour' enregistré avec succès!");
    
    // Vérifier les résultats après le vote
    const newResultats = await voteElectronique.obtenirResultats(1);
    console.log("Nouveaux résultats après le vote:", {
      pour: newResultats[0].toString(),
      contre: newResultats[1].toString(),
      neutre: newResultats[2].toString()
    });
    
  } catch (error) {
    console.error("Erreur:", error.message);
    console.error("Stack:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
