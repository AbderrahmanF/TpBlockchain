// Configuration des réseaux
const NETWORKS = {
    // Réseau local Hardhat
    hardhat: {
        name: "Hardhat",
        chainId: 31337,
        rpcUrl: "http://127.0.0.1:8545",
        configFile: "contract-config.js"
    },
    // Réseau de test Sepolia
    sepolia: {
        name: "Sepolia",
        chainId: 11155111,
        rpcUrl: "https://sepolia.infura.io/v3/", // Sera complété par MetaMask
        configFile: "contract-config-sepolia.js"
    }
};

// Fonction pour vérifier si MetaMask est installé
function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

// Fonction pour vérifier si nous sommes sur le bon réseau
async function checkNetwork(expectedChainId) {
    if (!isMetaMaskInstalled()) {
        return false;
    }
    
    try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        return parseInt(currentChainId, 16) === expectedChainId;
    } catch (error) {
        console.error("Erreur lors de la vérification du réseau:", error);
        return false;
    }
}

// Fonction pour demander à l'utilisateur de changer de réseau
async function switchNetwork(chainId) {
    if (!isMetaMaskInstalled()) {
        alert("MetaMask n'est pas installé. Veuillez installer MetaMask et réessayer.");
        return false;
    }
    
    try {
        // Demander à l'utilisateur de changer de réseau
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        return true;
    } catch (error) {
        // Si le réseau n'est pas configuré dans MetaMask
        if (error.code === 4902) {
            try {
                // Ajouter le réseau Sepolia si nécessaire
                if (chainId === 11155111) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${chainId.toString(16)}`,
                                chainName: 'Sepolia Test Network',
                                nativeCurrency: {
                                    name: 'Sepolia ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['https://sepolia.infura.io/v3/'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }
                        ]
                    });
                    return true;
                }
            } catch (addError) {
                console.error("Erreur lors de l'ajout du réseau:", addError);
                return false;
            }
        }
        console.error("Erreur lors du changement de réseau:", error);
        return false;
    }
}

// Fonction pour charger la configuration du contrat en fonction du réseau
async function loadContractConfig(network) {
    // Si nous sommes en mode hardhat (local), utiliser directement la configuration déjà chargée
    if (network === 'hardhat' && typeof CONTRACT_CONFIG !== 'undefined') {
        console.log("Utilisation de la configuration locale déjà chargée");
        return CONTRACT_CONFIG;
    }
    
    return new Promise((resolve, reject) => {
        try {
            // Pour Sepolia, charger la configuration spécifique
            if (network === 'sepolia') {
                // Supprimer l'ancien script s'il existe
                const oldScript = document.getElementById('contract-config-script');
                if (oldScript) {
                    oldScript.remove();
                }
                
                // Créer un nouveau script pour charger la configuration
                const script = document.createElement('script');
                script.id = 'contract-config-script';
                script.src = NETWORKS[network].configFile;
                script.onload = () => {
                    console.log(`Configuration du contrat chargée pour ${network}`);
                    if (typeof CONTRACT_CONFIG !== 'undefined') {
                        resolve(CONTRACT_CONFIG);
                    } else {
                        reject(new Error(`La configuration pour ${network} n'a pas pu être chargée correctement`));
                    }
                };
                script.onerror = (error) => {
                    console.error(`Erreur lors du chargement de la configuration pour ${network}:`, error);
                    reject(error);
                };
                
                // Ajouter le script au document
                document.head.appendChild(script);
            } else {
                // Pour d'autres réseaux, utiliser la configuration par défaut
                resolve(CONTRACT_CONFIG);
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la configuration:", error);
            reject(error);
        }
    });
}

// Exporter les fonctions et configurations
window.NetworkConfig = {
    NETWORKS,
    isMetaMaskInstalled,
    checkNetwork,
    switchNetwork,
    loadContractConfig
};
