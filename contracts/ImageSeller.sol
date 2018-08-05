pragma solidity ^0.4.20;

// github imports only in Remix IDE
// import "github.com/oraclize/ethereum-api/oraclizeAPI_0.5.sol";
import "./OraclizeAPI_0pt5.sol";
import "./OraclizeUtils.sol";


contract ImageSeller is usingOraclize {
    /* @dev One contract created per seller address
    *  @dev This contract stores registry of IPFS hash
    *  addresses (1 encrypted, 1 unencrypted) referencing
    *  image locations in IPFS per seller (owner).
    *  @dev Sales are performed via atomic transfer of eth
    *  to contract owner's address and de-cryption of IPFS
    *  encrypted hash of full size non watermarked image.
    *  Onus is on client to take returned de-crypted hash
    *  reference and download image from IPFS host.
    */

    uint constant gasLimitForOraclize = 175000; // gas limit for Oraclize callback
    mapping(string => SaleStruct) private registry; // private so that registry is hidden from other contracts
    mapping(bytes32 => QueryStruct) private validIds; // used for validating Query IDs
    mapping(address => uint) private withdrawals; // keep track of balance withdrawals
    address public factory; // address of factory parent contract
    address public owner; // seller and creator of child contract
    uint public creationTime;

    struct QueryStruct {
        bool queried; // on when query in transit
        string decryptIpfsHash; // image unencrypted IPFS hash *protect* this field
    }

    struct SaleStruct {
        uint price; // in Gwei (10^-18 ETH / 1 Gwei)
        uint numSales;
        uint expiry; // based on block number
        uint discount; // pct expressed as int interval [0-100]
        string encryptIpfsHash;
    }

    // events used to track contract actions
    event LogOraclizeQuery(string description);
    event LogResultReceived(string result);
    event LogHashRemoved(string description, string unencryptIpfsHash, address owner);
    event LogAddImageToRegistry(string description);
    event LogImageSellerOwner(address);

    constructor(address _owner) public {
        emit LogImageSellerOwner(_owner);
        owner = _owner;
        factory = msg.sender;
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
        uint discount, uint price, uint expiry) public onlyOwner {
        emit LogAddImageToRegistry('About to add image to registry');
        SaleStruct memory saleStruct = SaleStruct({price: price, discount: discount,
            expiry: expiry, encryptIpfsHash: encryptIpfsHash, numSales: 0});
        registry[unencryptIpfsHash] = saleStruct;
        emit LogAddImageToRegistry('Image added to registry');
    }

    // buyFromRegistry uses check-effects-interactions pattern to
    // check msg value sent against price of image corresponding to IPFS hash,
    // ensure unencrypted hash of true image is available from oraclize
    // increment contract balance by price, send remainder to caller
    // check off query to prevent replay attacks
    // ultimately return unencrypted IPFS hash to caller for download.
    // TODO: use state object and 2 stage purchase to ensure buyer obtains unencrypted IPFS hash
    // TODO: or revert transaction see https://solidity.readthedocs.io/en/v0.4.24/solidity-by-example.html
    function buyFromRegistry(string unencryptIpfsHash) payable public returns (string) {
        SaleStruct memory salesStruct = registry[unencryptIpfsHash];
        require(OraclizeUtils.enoughBalance(msg.value), "Not enough gas");
        require(msg.value >= (salesStruct.price - 0.004 ether), "Insufficient Eth to buy image");

        // send query using decrypt data source
        // only deployed contract address can decrypt exact string
        // that was encrypted using oraclize public api
        bytes32 queryId = oraclize_query("decrypt", salesStruct.encryptIpfsHash,
            gasLimitForOraclize);

        emit LogOraclizeQuery("Oraclize query was send, standing by for answer...");

        // add unique query ID to mapping with true until callback called
        validIds[queryId] = QueryStruct({queried: true, decryptIpfsHash: "0"});
        registry[unencryptIpfsHash].numSales += 1;
    }

    // removeFromRegistry removes an image from the sale registry
    // and emits an event. Only the seller can remove an image.
    // Client needs to ensure all buyers have downloaded images
    // from IPFS before de-mounting image hash after removal from
    // registry.
    function removeFromRegistry(string unencryptIpfsHash) public onlyOwner {
        delete registry[unencryptIpfsHash];
        emit LogHashRemoved("IPFS Hash removed from registry", unencryptIpfsHash, msg.sender);
    }

    // withdrawBalance transfers balance to an address
    // uses check-effects-interactions and only owner can call
    function withdrawBalance(address withdrawAddress) public onlyOwner {
        // transfer throws on exception, safe against re-entrancy
        require(address(this).balance > 0, "Nothing to withdraw from balance");
        withdrawals[withdrawAddress] = address(this).balance;
        withdrawAddress.transfer(address(this).balance);
    }

    // Callback function for Oraclize once it retrieves data from query invocation
    function __callback(bytes32 queryId, string result, bytes proof) public {
        require(msg.sender == oraclize_cbAddress());
        require(validIds[queryId].queried);

        // result Should be decrypted hash
        validIds[queryId].decryptIpfsHash = result;

        emit LogResultReceived(result); // TODO: remove in production
        // make sure callback for a given query Id is never called twice
        validIds[queryId].queried = false;

    }

    function fooImageSeller(string payload) public {
        emit LogResultReceived(payload);
        emit LogImageSellerOwner(this.owner);
    }
}