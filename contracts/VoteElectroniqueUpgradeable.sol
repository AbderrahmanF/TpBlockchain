// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import des contrats upgradeable d'OpenZeppelin
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract VoteElectroniqueUpgradeable is Initializable, AccessControlUpgradeable {
    // Définition des rôles spécifiques
    bytes32 public constant PRESIDENT_ROLE = keccak256("PRESIDENT_ROLE");
    bytes32 public constant SCRUTATEUR_ROLE = keccak256("SCRUTATEUR_ROLE");
    bytes32 public constant SECRETARY_ROLE   = keccak256("SECRETARY_ROLE");

    // Mapping pour la whitelist des électeurs
    mapping(address => bool) public whitelist;

    // Structure d'une résolution de vote
    struct Resolution {
        uint id;
        string titre;
        uint256 votesPour;
        uint256 votesContre;
        uint256 votesNeutre;
        bool voteCloture;
        mapping(address => bool) aVote; // Empêche le double vote
    }
    
    // Compteur de résolutions créées
    uint public resolutionCount;
    // Mapping interne des résolutions (les résolutions ne peuvent pas être rendues publiques directement à cause du mapping interne)
    mapping(uint => Resolution) private resolutions;

    // Événements pour le suivi des actions
    event ResolutionAjoutee(uint indexed id, string titre);
    event VoteEnregistre(uint indexed resolutionId, address voter, string voteType);
    event ParticipantAjoute(address participant);
    event ParticipantSupprime(address participant);
    event VoteCloture(uint indexed resolutionId);

    // La fonction initialize remplace le constructeur pour un contrat upgradeable
    function initialize() public initializer {
        __AccessControl_init();
        // Le déployeur reçoit le rôle admin par défaut
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ======================================================
    // Gestion de la Whitelist
    // ======================================================

    /// @notice Ajoute un participant à la whitelist (accessible uniquement par l'admin)
    function ajouterParticipant(address _participant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_participant != address(0), "Adresse invalide");
        whitelist[_participant] = true;
        emit ParticipantAjoute(_participant);
    }
    
    /// @notice Supprime un participant de la whitelist (accessible uniquement par l'admin)
    function supprimerParticipant(address _participant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(whitelist[_participant], "Participant non present");
        whitelist[_participant] = false;
        emit ParticipantSupprime(_participant);
    }

    // ======================================================
    // Gestion des Résolutions
    // ======================================================

    /// @notice Crée une nouvelle résolution à voter (accessible uniquement par l'admin)
    function ajouterResolution(string calldata _titre) external onlyRole(DEFAULT_ADMIN_ROLE) {
        resolutionCount++;
        // Récupération de la résolution dans le mapping
        Resolution storage res = resolutions[resolutionCount];
        res.id = resolutionCount;
        res.titre = _titre;
        res.voteCloture = false;
        emit ResolutionAjoutee(resolutionCount, _titre);
    }
    
    /// @notice Permet à un électeur de voter sur une résolution donnée
    /// @param _resolutionId L'identifiant de la résolution
    /// @param _voteType Le type de vote : "pour", "contre" ou "neutre"
    function voter(uint _resolutionId, string calldata _voteType) external {
        require(whitelist[msg.sender], "Non autorise a voter");
        require(_resolutionId > 0 && _resolutionId <= resolutionCount, "Resolution inexistante");
        Resolution storage res = resolutions[_resolutionId];
        require(!res.voteCloture, "Vote deja cloture");
        require(!res.aVote[msg.sender], "Vous avez deja vote");

        // Marquer que l'électeur a voté pour cette résolution
        res.aVote[msg.sender] = true;
        bytes32 voteHash = keccak256(abi.encodePacked(_voteType));

        if (voteHash == keccak256(abi.encodePacked("pour"))) {
            res.votesPour++;
        } else if (voteHash == keccak256(abi.encodePacked("contre"))) {
            res.votesContre++;
        } else if (voteHash == keccak256(abi.encodePacked("neutre"))) {
            res.votesNeutre++;
        } else {
            revert("Type de vote invalide");
        }
        emit VoteEnregistre(_resolutionId, msg.sender, _voteType);
    }
    
    /// @notice Clôture le vote sur une résolution (accessible uniquement par l'admin)
    function cloturerVote(uint _resolutionId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_resolutionId > 0 && _resolutionId <= resolutionCount, "Resolution inexistante");
        Resolution storage res = resolutions[_resolutionId];
        require(!res.voteCloture, "Vote deja cloture");
        res.voteCloture = true;
        emit VoteCloture(_resolutionId);
    }
    
    /// @notice Permet de consulter les résultats d'une résolution
    /// @return pour Nombre de votes "pour"
    /// @return contre Nombre de votes "contre"
    /// @return neutre Nombre de votes "neutre"
    function obtenirResultats(uint _resolutionId) external view returns (uint256 pour, uint256 contre, uint256 neutre) {
        require(_resolutionId > 0 && _resolutionId <= resolutionCount, "Resolution inexistante");
        Resolution storage res = resolutions[_resolutionId];
        return (res.votesPour, res.votesContre, res.votesNeutre);
    }

    // ======================================================
    // Gestion Avancée des Rôles
    // ======================================================

    /// @notice Attribue le rôle de Président (accessible uniquement par l'admin)
    function assignerRolePresident(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(PRESIDENT_ROLE, account);
    }
    
    /// @notice Attribue le rôle de Scrutateur (accessible uniquement par l'admin)
    function assignerRoleScrutateur(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SCRUTATEUR_ROLE, account);
    }
    
    /// @notice Attribue le rôle de Secrétaire (accessible uniquement par l'admin)
    function assignerRoleSecretary(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SECRETARY_ROLE, account);
    }
}
