pragma solidity ^0.4.20;

import "github.com/oraclize/ethereum-api/oraclizeAPI_0.5.sol";

library OraclizeUtils {
    function enoughBalance(uint balance) returns (bool) {
        // oraclize queries require a min of 200k gas * 20 Gwei
        // = 0.004 ETH
        if (balance >= (200000 * 20)) {
            return true;
        }
        return false;
    }
}


contract SellImages is usingOraclize {
    /* @dev One contract created per seller address
    *  @dev This contract stores registry of IPFS hash
    *  addresses (1 encrypted, 1 unencrypted) referencing
    *  image location in IPFS.
    *  @dev Sales are performed via atomic transfer of eth
    *  to contract owner's address and de-cryption of IPFS
    *  encrypted hash of full size non watermarked image.
    *  Onus is on client to take returned de-crypted hash
    *  reference and download image from IPFS host.
    */

    // protect other contracts from introspecting registry of IPFS
    // key is unencrypted IPFS
    mapping(string => SaleStruct) private registry;
    mapping(bytes32 => bool) validIds; // used for validating Query IDs

    address public owner;
    uint public creationTime;
    struct SaleStruct {
        uint price; //in Gwei (10^-18 ETH / 1 Gwei)
        uint numSales;
        uint expiry; // based on block number
        uint discount; // pct expressed as int interval [0-100]
        string encryptIpfsHash;
        string decryptIpfsHash; // transient storage for image IPFS for async oraclize callback
    }

    // events used to track contract actions
    event LogOraclizeQuery(string description);

    constructor() public {
        owner = msg.sender;
        creationTime = now;
    }

    // Fallback function - Called if other functions don't match call or
    // sent ether without data
    // Typically, called when invalid data is sent
    // Added so ether sent to this contract is reverted if the contract fails
    // otherwise, the sender's money is transferred to contract
    function () {
        revert();
    }

    modifier onlyOwner() {
        require(msg.sender == owner,"Unauthorized account");
        _;
    }

    // addImageToRegistry adds ipfs hashes to registry
    // by adding mapping key for unencrypted hash whose
    // value is SalesStruct which contains encrypted hash
    // of corresponding IPFS reference as well as pricing
    // parameters. Schedule callback with oraclize for
    // encrypted IPFS hash, which presumably was encrypted
    // on client using oraclize public key.
    // Only contract that registered oraclize callback to
    // encrypted string first can decrypt the hash.
    // Gas cost incurred by seller.
    function addImageToRegistry(string unencryptIpfsHash, string encryptIpfsHash,
        uint discount, uint price, uint expiry) external onlyOwner {
        SaleStruct memory saleStruct = SaleStruct({price: price, discount: discount,
            expiry: expiry, encryptIpfsHash: encryptIpfsHash, numSales: 0,
            decryptIpfsHash: "0"
            });
        registry[unencryptIpfsHash] = saleStruct;

    }

    // buyFromRegistry uses check-effects-interactions pattern to
    // check msg value sent against price of image corresponding to IPFS hash,
    // ensure unencrypted hash of true image is available from oraclize
    // increment contract balance by price, send remainder to caller
    // check off query to prevent replay attacks
    // ultimately return unencrypted IPFS hash to caller for download
    function buyFromRegistry(string unencryptIpfsHash) payable public returns (string) {
        SaleStruct salesStruct = registry[unencryptIpfsHash];
        require(OraclizeUtils.enoughBalance(this.balance), "Insuffucient Contract balance");
        require(msg.value >= salesStruct.price, "Insufficient Eth to buy image");

        // send query using decrypt data source
        // only deployed contract address can decrypt exact string
        // that was encrypted using oraclize public api
        bytes32 queryId = oraclize_query("decrypt", salesStruct.encryptIpfsHash);

        LogOraclizeQuery("Oraclize query was send, standing by for answer...");

        // add query ID to mapping
        validIds[queryId] = true;
    }

    // Callback function for Oraclize once it retrieves data from query invocation
    function __callback(bytes32 queryId, string result, bytes proof) public {
        require(msg.sender == oraclize_cbAddress());
        // result s Should be decrypted hash
        // TODO: make sure result is accessible by calling func to return to client
    }
    // external
    // public
    // internal
    // private
}