// Fonction pour connecter MetaMask
window.connectWallet = async function() {
    try {
        console.log("Tentative de connexion à MetaMask...");
        
        // Vérifier si MetaMask est installé
        if (!NetworkConfig.isMetaMaskInstalled()) {
            updateStatus("MetaMask n'est pas installé. Veuillez installer l'extension MetaMask.", "warning");
            return;
        }
        
        // Demander à l'utilisateur de se connecter à MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        
        // Stocker l'adresse de l'utilisateur dans la session pour l'utiliser dans l'affichage des votes
        sessionStorage.setItem('connectedAddress', userAddress);
        
        // Configurer le provider et le signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        // Vérifier que l'adresse du contrat est définie
        if (!contractAddress) {
            updateStatus("Erreur: L'adresse du contrat n'est pas définie. Vérifiez la configuration.", "danger");
            return;
        }
        
        console.log("Création de l'instance du contrat avec l'adresse:", contractAddress);
        
        // Créer une instance du contrat
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // Mettre à jour le statut
        updateStatus(`Connecté avec le compte: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`, "success");
        
        // Vérifier si l'utilisateur est dans la whitelist
        try {
            const isInWhitelist = await contract.whitelist(userAddress);
            const whitelistStatus = document.getElementById('whitelist-status');
            whitelistStatus.classList.remove('d-none');
            
            if (isInWhitelist) {
                whitelistStatus.classList.remove('alert-warning', 'alert-secondary');
                whitelistStatus.classList.add('alert-success');
                whitelistStatus.innerHTML = `
                    <strong>Statut Whitelist:</strong> Votre adresse est autorisée à voter! ✅
                `;
            } else {
                whitelistStatus.classList.remove('alert-success', 'alert-secondary');
                whitelistStatus.classList.add('alert-warning');
                whitelistStatus.innerHTML = `
                    <strong>Statut Whitelist:</strong> Votre adresse n'est pas encore autorisée à voter. 
                    Utilisez le bouton "Ajouter mon adresse à la Whitelist" dans la section Administration. ⚠️
                `;
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de la whitelist:", error);
        }
        
        // Mettre à jour les informations du contrat
        const network = await provider.getNetwork();
        document.getElementById('contract-info').innerHTML += `
            <strong>Réseau:</strong> ${network.name} (ChainID: ${network.chainId})<br>
            <strong>Adresse du contrat:</strong> ${contractAddress}<br>
            <strong>Votre adresse:</strong> ${userAddress}
        `;
        
        // Vérifier les rôles de l'utilisateur
        try {
            // Vérifier si l'utilisateur est dans la whitelist
            let isWhitelisted = false;
            try {
                isWhitelisted = await contract.whitelist(userAddress);
            } catch (e) {
                console.log("Erreur lors de la vérification de whitelist, essai avec estParticipant");
                try {
                    isWhitelisted = await contract.estParticipant(userAddress);
                } catch (e2) {
                    console.error("Impossible de vérifier si l'utilisateur est dans la whitelist:", e2);
                }
            }
            
            // Vérifier les rôles de l'utilisateur
            const isAdmin = await contract.hasRole("0x0000000000000000000000000000000000000000000000000000000000000000", userAddress);
            const isPresident = await contract.hasRole(ethers.utils.id("PRESIDENT_ROLE"), userAddress);
            const isScrutateur = await contract.hasRole(ethers.utils.id("SCRUTATEUR_ROLE"), userAddress);
            const isSecretaire = await contract.hasRole(ethers.utils.id("SECRETAIRE_ROLE"), userAddress);
            
            // Afficher ou masquer la section d'administration en fonction des rôles
            const adminSection = document.getElementById('admin-section');
            if (isAdmin || isPresident || isScrutateur || isSecretaire) {
                adminSection.style.display = 'block';
            } else {
                adminSection.style.display = 'none';
            }
            
            console.log("Rôles de l'utilisateur:", { isWhitelisted, isAdmin, isPresident, isScrutateur, isSecretaire });
        } catch (error) {
            console.error("Erreur lors de la vérification des rôles:", error);
        }
        
        // Mettre à jour le nombre de résolutions
        try {
            await updateResolutionCount();
        } catch (error) {
            console.error("Erreur lors de la mise à jour du nombre de résolutions:", error);
        }
        
        // Configurer les écouteurs d'événements
        setupEventListeners();
        
        // Écouter les changements de compte
        window.ethereum.on('accountsChanged', (accounts) => {
            window.location.reload();
        });
        
        // Écouter les changements de réseau
        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
        });
        
    } catch (error) {
        console.error("Erreur lors de la connexion à MetaMask:", error);
        updateStatus(`Erreur de connexion à MetaMask: ${error.message}. Veuillez autoriser l'accès.`, "danger");
    }
}

// Fonction pour changer de réseau
window.changeNetwork = async function(event) {
    currentNetwork = event.target.value;
    window.currentNetwork = currentNetwork; // Mettre à jour la variable globale
    console.log(`Changement de réseau vers: ${currentNetwork}`);
    
    // Si nous passons à Sepolia, vérifier que MetaMask est configuré pour ce réseau
    if (currentNetwork === 'sepolia') {
        const isCorrectNetwork = await NetworkConfig.checkNetwork(NetworkConfig.NETWORKS.sepolia.chainId);
        if (!isCorrectNetwork) {
            const switched = await NetworkConfig.switchNetwork(NetworkConfig.NETWORKS.sepolia.chainId);
            if (!switched) {
                updateStatus("Impossible de changer de réseau. Veuillez configurer Sepolia dans MetaMask manuellement.", "warning");
                return;
            }
        }
    }
    
    // Réinitialiser l'application avec le nouveau réseau
    init();
}
