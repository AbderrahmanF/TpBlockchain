const fs = require('fs');
const path = require('path');

// Chemin vers le fichier JSON du contrat compilé
const contractPath = path.join(__dirname, '../artifacts/contracts/VoteElectroniqueUpgradeable.sol/VoteElectroniqueUpgradeable.json');

// Lire le fichier JSON
const contractJson = require(contractPath);

// Extraire l'ABI
const abi = JSON.stringify(contractJson.abi, null, 2);

// Créer un fichier JavaScript qui exporte l'ABI
const abiJs = `// ABI généré automatiquement à partir du contrat compilé
const contractABI = ${abi};

// Exporter l'ABI pour l'utiliser dans d'autres fichiers
if (typeof module !== 'undefined') {
  module.exports = contractABI;
}
`;

// Écrire le fichier JavaScript
fs.writeFileSync(path.join(__dirname, '../abi.js'), abiJs);

console.log('ABI extrait avec succès dans le fichier abi.js');
