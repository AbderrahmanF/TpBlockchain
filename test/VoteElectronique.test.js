const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("VoteElectroniqueUpgradeable", function () {
  let voteElectronique;
  let owner, voter1, voter2, voter3;

  beforeEach(async function () {
    // Récupérer les signers pour les tests
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // Déployer le contrat
    const VoteElectronique = await ethers.getContractFactory("VoteElectroniqueUpgradeable");
    voteElectronique = await upgrades.deployProxy(VoteElectronique, [], {
      initializer: "initialize",
    });
    
    await voteElectronique.waitForDeployment();
  });

  it("Le déployeur doit avoir le rôle d'administrateur", async function () {
    // Vérifier que le déployeur a le rôle DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    expect(await voteElectronique.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
  });

  it("Doit permettre à l'administrateur d'ajouter des participants à la whitelist", async function () {
    // Ajouter un participant à la whitelist
    await voteElectronique.ajouterParticipant(voter1.address);
    
    // Vérifier que le participant a été ajouté
    expect(await voteElectronique.whitelist(voter1.address)).to.be.true;
  });

  it("Doit permettre à l'administrateur d'ajouter et gérer une résolution", async function () {
    // Ajouter une résolution
    await voteElectronique.ajouterResolution("Faut-il adopter la proposition A?");
    
    // Vérifier que la résolution a été créée
    expect(await voteElectronique.resolutionCount()).to.equal(1);

    // Ajouter des participants à la whitelist
    await voteElectronique.ajouterParticipant(voter1.address);
    await voteElectronique.ajouterParticipant(voter2.address);
    
    // Voter sur la résolution (Pour)
    await voteElectronique.connect(voter1).voter(1, "pour");
    
    // Voter sur la résolution (Contre)
    await voteElectronique.connect(voter2).voter(1, "contre");
    
    // Vérifier les résultats
    const resultats = await voteElectronique.obtenirResultats(1);
    expect(resultats[0]).to.equal(1); // 1 vote pour
    expect(resultats[1]).to.equal(1); // 1 vote contre
    expect(resultats[2]).to.equal(0); // 0 vote neutre
    
    // Clôturer le vote
    await voteElectronique.cloturerVote(1);
  });

  it("Ne doit pas permettre de voter deux fois", async function () {
    // Ajouter une résolution
    await voteElectronique.ajouterResolution("Résolution double vote");
    
    // Ajouter un participant à la whitelist
    await voteElectronique.ajouterParticipant(voter3.address);
    
    // Premier vote (doit réussir)
    await voteElectronique.connect(voter3).voter(2, "pour");
    
    // Deuxième vote (doit échouer)
    await expect(
      voteElectronique.connect(voter3).voter(2, "contre")
    ).to.be.revertedWith("Vous avez deja vote");
  });

  it("Ne doit pas permettre de voter après la clôture", async function () {
    // Ajouter une résolution
    await voteElectronique.ajouterResolution("Résolution post-clôture");
    
    // Ajouter un participant à la whitelist
    await voteElectronique.ajouterParticipant(voter1.address);
    
    // Clôturer le vote
    // Note: Les id de résolution dépendent des tests précédents, nous utilisons donc l'id actuel
    const currentId = await voteElectronique.resolutionCount();
    await voteElectronique.cloturerVote(currentId);
    
    // Essayer de voter (doit échouer)
    await expect(
      voteElectronique.connect(voter1).voter(currentId, "pour")
    ).to.be.revertedWith("Vote deja cloture");
  });
  
  it("Ne doit pas permettre d'accéder à une résolution inexistante", async function () {
    // Obtenir le nombre actuel de résolutions
    const count = await voteElectronique.resolutionCount();
    const nonExistingId = count.toNumber() + 1;
    
    // Essayer d'obtenir les résultats d'une résolution inexistante
    await expect(
      voteElectronique.obtenirResultats(nonExistingId)
    ).to.be.revertedWith("Resolution inexistante");
    
    // Essayer de voter sur une résolution inexistante
    await voteElectronique.ajouterParticipant(voter1.address);
    await expect(
      voteElectronique.connect(voter1).voter(nonExistingId, "pour")
    ).to.be.revertedWith("Resolution inexistante");
    
    // Essayer de clôturer une résolution inexistante
    await expect(
      voteElectronique.cloturerVote(nonExistingId)
    ).to.be.revertedWith("Resolution inexistante");
  });
});
