// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @dev Minimal registry: (hash, humanCode, issuer, timestamp, revoked)
 *      PLUS: on‑chain signature check so only whitelisted signers can store.
 */
contract EurekaInvoiceRegistry is Ownable, Pausable {
    constructor() Ownable(msg.sender) {}   // <-- add this line
    struct Invoice {
        bytes16  hash;        // MD5 of the PDF
        string   code;        // e.g. INV-1A2B-3C4D
        address  issuer;      // address that signed the hash
        uint256  timestamp;
        bool     revoked;
    }

    mapping(string => Invoice) public invoices;
    mapping(address => bool)  public whitelist;

    /* ───────────────────────── Signer admin ────────────────────────── */
    function addSigner(address s) external onlyOwner { whitelist[s] = true; }
    function delSigner(address s) external onlyOwner { whitelist[s] = false; }

    /* ───────────────────────── Submit / revoke ─────────────────────── */
    function submitInvoice(
        bytes16 pdfHash,
        string calldata code,
        bytes calldata sig
    ) external whenNotPaused {
        require(whitelist[_recover(pdfHash, sig)], "bad sig / signer");
        require(invoices[code].timestamp == 0, "code exists");

        invoices[code] = Invoice({
            hash: pdfHash,
            code: code,
            issuer: msg.sender,
            timestamp: block.timestamp,
            revoked: false
        });
    }

    function revokeInvoice(string calldata code) external {
        Invoice storage inv = invoices[code];
        require(inv.timestamp != 0, "unknown code");
        require(msg.sender == inv.issuer || msg.sender == owner(), "no auth");
        inv.revoked = true;
    }

    /* ───────────────────────── Internal utils ──────────────────────── */
    function _recover(bytes16 h, bytes calldata sig)
        internal
        pure
        returns (address)
    {
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n16", h));
        (bytes32 r, bytes32 s, uint8 v) = abi.decode(sig, (bytes32,bytes32,uint8));
        return ecrecover(digest, v, r, s);
    }
}
