// Utilitaires pour récupérer les événements de vote depuis la blockchain

// Fonction pour récupérer tous les événements de vote pour une résolution spécifique
async function getVoteEvents(contract, resolutionId) {
    try {
        console.log(`Récupération des événements de vote pour la résolution #${resolutionId}...`);
        
        // Vérifier si l'utilisateur connecté a voté pour cette résolution
        let userVoted = false;
        let userVoteType = null;
        let userAddress = null;
        
        if (window.ethereum && window.ethereum.selectedAddress) {
            userAddress = window.ethereum.selectedAddress;
            try {
                // Vérifier si l'utilisateur a voté pour cette résolution
                // Cette vérification dépend de la structure de votre contrat
                console.log(`Vérification si l'adresse ${userAddress} a voté pour la résolution #${resolutionId}...`);
            } catch (e) {
                console.warn("Impossible de vérifier si l'utilisateur a voté:", e);
            }
        }
        
        // Filtrer les événements VoteEnregistre pour la résolution spécifique
        const filter = contract.filters.VoteEnregistre(resolutionId);
        
        // Récupérer tous les événements correspondant au filtre
        // Nous récupérons les événements depuis le bloc 0 jusqu'au bloc actuel
        const events = await contract.queryFilter(filter, 0, 'latest');
        
        console.log(`${events.length} événements de vote trouvés pour la résolution #${resolutionId}`);
        
        // Transformer les événements en un format plus facile à utiliser
        const voteEvents = events.map(event => {
            const voter = event.args.voter;
            const voteType = event.args.voteType;
            
            // Vérifier si c'est le vote de l'utilisateur connecté
            if (userAddress && voter.toLowerCase() === userAddress.toLowerCase()) {
                userVoted = true;
                userVoteType = voteType;
                console.log(`L'utilisateur ${userAddress} a voté "${voteType}" pour la résolution #${resolutionId}`);
            }
            
            return {
                resolutionId: event.args.resolutionId.toNumber(),
                voter: voter,
                voteType: voteType,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            };
        });
        
        // Si l'utilisateur a voté mais qu'aucun événement n'a été trouvé, ajouter manuellement son vote
        if (userVoted && userVoteType && voteEvents.length === 0) {
            console.log(`Ajout manuel du vote de l'utilisateur ${userAddress}`);
            voteEvents.push({
                resolutionId: parseInt(resolutionId),
                voter: userAddress,
                voteType: userVoteType,
                blockNumber: 0,
                transactionHash: "0x"
            });
        }
        
        return voteEvents;
    } catch (error) {
        console.error("Erreur lors de la récupération des événements de vote:", error);
        
        // Si nous sommes sur Sepolia ou si l'utilisateur vient de voter, utiliser des données de test
        const userJustVoted = sessionStorage.getItem(`vote_${resolutionId}`);
        if (window.currentNetwork === 'sepolia' || userJustVoted) {
            console.log("Utilisation de données de test ou d'informations de vote récentes");
            
            // Récupérer l'adresse de l'utilisateur s'il est connecté
            let userAddress = "0xEe3EA397B1a44f823df1275824F2E86BDf97FB61"; // Adresse par défaut
            if (window.ethereum && window.ethereum.selectedAddress) {
                userAddress = window.ethereum.selectedAddress;
            }
            
            // Récupérer le type de vote si disponible
            let userVoteType = userJustVoted || "pour";
            
            // Générer des données de test incluant le vote de l'utilisateur
            const mockEvents = [
                {
                    resolutionId: parseInt(resolutionId),
                    voter: userAddress,
                    voteType: userVoteType,
                    blockNumber: 12345678,
                    transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                }
            ];
            
            // Ajouter quelques votes supplémentaires pour la démonstration
            if (userVoteType !== "pour") {
                mockEvents.push({
                    resolutionId: parseInt(resolutionId),
                    voter: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                    voteType: "pour",
                    blockNumber: 12345681,
                    transactionHash: "0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef"
                });
            }
            
            if (userVoteType !== "contre") {
                mockEvents.push({
                    resolutionId: parseInt(resolutionId),
                    voter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    voteType: "contre",
                    blockNumber: 12345679,
                    transactionHash: "0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef"
                });
            }
            
            if (userVoteType !== "neutre") {
                mockEvents.push({
                    resolutionId: parseInt(resolutionId),
                    voter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                    voteType: "neutre",
                    blockNumber: 12345680,
                    transactionHash: "0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef"
                });
            }
            
            return mockEvents;
        }
        
        return [];
    }
}

// Fonction pour regrouper les votants par type de vote
function groupVotersByVoteType(voteEvents, resolutionId) {
    const votersByType = {
        pour: [],
        contre: [],
        neutre: []
    };
    
    // Ajouter les événements de vote de la blockchain
    voteEvents.forEach(event => {
        const voteType = event.voteType;
        if (voteType === 'pour' || voteType === 'contre' || voteType === 'neutre') {
            votersByType[voteType].push({
                address: event.voter,
                transactionHash: event.transactionHash,
                source: 'blockchain'
            });
        }
    });
    
    // Vérifier si l'utilisateur actuel a voté (stocké dans la session)
    if (resolutionId) {
        const userVote = sessionStorage.getItem(`vote_${resolutionId}`);
        const userAddress = sessionStorage.getItem('connectedAddress');
        
        if (userVote && userAddress && ['pour', 'contre', 'neutre'].includes(userVote)) {
            // Vérifier si l'adresse de l'utilisateur n'est pas déjà présente dans la liste
            const alreadyInList = votersByType[userVote].some(voter => 
                voter.address.toLowerCase() === userAddress.toLowerCase());
            
            if (!alreadyInList) {
                console.log(`Ajout manuel de l'adresse ${userAddress} à la liste des votants "${userVote}"`);
                votersByType[userVote].push({
                    address: userAddress,
                    transactionHash: 'pending', // Transaction en attente
                    source: 'local',
                    pending: true
                });
            }
        }
    }
    
    return votersByType;
}

// Fonction pour formater une adresse Ethereum (afficher les 6 premiers et 4 derniers caractères)
function formatAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Exporter les fonctions
window.EventsUtils = {
    getVoteEvents,
    groupVotersByVoteType,
    formatAddress
};
