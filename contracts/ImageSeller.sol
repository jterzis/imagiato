pragma solidity ^0.4.22;

import "./OraclizeAPI_0pt5.sol";
import "./OraclizeUtils.sol";

/** @title Image Seller Contract */
contract ImageSeller is usingOraclize {
    /** @dev One contract created per seller address
     *  This contract stores registry of IPFS hash
     *  addresses (1 encrypted, 1 unencrypted) referencing
     *  image locations in IPFS per seller (owner).
     *  Sales are performed via atomic transfer of eth
     *  to contract owner's address and de-cryption of IPFS
     *  encrypted hash of full size non watermarked image.
     *  Onus is on client to take returned de-crypted hash
     *  reference and download image from IPFS host.
     */

    bool isStopped = false; // for emergency stop
    uint constant gasLimitForOraclize = 175000; // gas limit for Oraclize callback
    mapping(string => SaleStruct) private registry; // private so that registry is hidden from other contracts
    mapping(bytes32 => QueryStruct) private validIds; // used for validating Query IDs
    mapping(address => uint) private withdrawals; // keep track of balance withdrawals
    mapping(address => uint) balance; //to track msg value for purchases
    address public factory; // address of factory parent contract
    address public owner; // seller and creator of child contract
    uint public creationTime;
    uint totalNumSales;

    event LogMsgSender(address sender);
    event LogUnencryptHash(string unencryptHash);
    event LogMsgValue(uint price);
    event LogBalance(uint bal);
    event LogContractAddress(address contractAddr);
    event LogOwner(address owner);
    event LogOraclizeQuery(string description);
    event LogResultReceived(string result);
    event LogHashRemoved(string description, string unencryptIpfsHash, address owner);
    event LogAddImageToRegistry(string description);
    event LogImageSellerOwner(address owner);
    event LogTotalSales(uint sales);

    function getTotalNumSales() public view returns (uint) {
        return totalNumSales;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getBalance() public view returns (uint) {
        return balance[owner];
    }

    function getSellerEncryptHash(string unencryptHash) public view returns (string) {
        // emit LogMsgSender(msg.sender);
        return registry[unencryptHash].encryptIpfsHash;
    }

    function getSellerNumSales(string unencryptHash) public view returns (uint) {
        return registry[unencryptHash].numSales;
    }

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


    function ImageSeller(address _owner) public {
        emit LogImageSellerOwner(_owner);
        owner = _owner;
        factory = msg.sender;
        creationTime = now;
        totalNumSales = 0;
    }

    // Fallback function - Called if other functions don't match call or
    // sent ether without data
    // Typically, called when invalid data is sent
    // Added so ether sent to this contract is reverted if the contract fails
    // otherwise, the sender's money is transferred to contract
    function () payable {
        emit LogResultReceived("Reverting! Something went wrong!");
        revert();
    }

    modifier onlyOwner() {
        require(msg.sender == owner,"Unauthorized account");
        _;
    }

    modifier onlyExisting(string unencryptHash) {
        if (bytes(registry[unencryptHash].encryptIpfsHash).length != 0) {
            _;
        }
    }

    modifier stoppedInEmergency {
        require(!isStopped);
        _;
    }

    function stopContract() public onlyOwner {
        isStopped = true;
    }

    function resumeContract() public onlyOwner {
        isStopped = false;
    }

    function addImageToRegistry(string unencryptIpfsHash, string encryptIpfsHash,
        uint discount, uint price, uint expiry) public onlyOwner stoppedInEmergency {
        /** @dev addImageToRegistry adds IPFS hashes to registry by
         *  mapping unenrypted hash key whose value is SalesStruct
         *  containing encrypted hash of corresponding IPFS ref hash
         *  along with pricing parameters for image file.
         *  @param unencryptIpfsHash - plain text name of image file
         *  @param encryptIpfsHash - encrypted hash ref from IPFS
         *  @param discount - discount (0,100)
         *  @param price - price in Wei (10^18 Wei / Ether)
         *  @param expiry - in block number
        */

        emit LogAddImageToRegistry('About to add image to registry');
        // initialize a struct to memory by directly initing each field
        require(price > 0);
        registry[unencryptIpfsHash].price = price;
        registry[unencryptIpfsHash].discount = discount;
        registry[unencryptIpfsHash].expiry = expiry;
        registry[unencryptIpfsHash].encryptIpfsHash = encryptIpfsHash;
        registry[unencryptIpfsHash].numSales = 0;
        emit LogAddImageToRegistry('Image added to registry');
    }

    function buyFromRegistry(string unencryptIpfsHash) public payable stoppedInEmergency {
        /** @dev buyFromRegistry uses check-effects-interactions pattern
         *  to check msg.value sent against price of image and incrementing
         *  contract balance to account for purchase. Events used to transmit
         *  success metadata. Frontend should mine event data to ensure tx went
         *  through successfully.
         *  @param unencryptIpfsHash - image name
         */
        require(OraclizeUtils.enoughBalance(msg.value), "Not enough gas");
        // need to provide enough value to cover price
        // oraclize query price not passed on to buyer
        require(msg.value >= (registry[unencryptIpfsHash].price), "Insufficient Eth to buy image");
        // send query using decrypt data source
        // only deployed contract address can decrypt exact string
        // that was encrypted using oraclize public api
        /**
        bytes32 queryId = oraclize_query("decrypt", salesStruct.encryptIpfsHash,
            gasLimitForOraclize);
        */
        emit LogOraclizeQuery("Oraclize query was send, standing by for answer...");
        emit LogUnencryptHash(registry[unencryptIpfsHash].encryptIpfsHash);
        emit LogMsgValue(msg.value);
        emit LogContractAddress(address(this));
        emit LogOwner(owner);
        // add unique query ID to mapping with true until callback called
        registry[unencryptIpfsHash].numSales = OraclizeUtils.add(registry[unencryptIpfsHash].numSales,1);
        totalNumSales = OraclizeUtils.add(totalNumSales, 1);
        balance[owner] = OraclizeUtils.add(balance[owner], msg.value);
        emit LogTotalSales(totalNumSales);
    }

    function removeFromRegistry(string unencryptIpfsHash) public onlyOwner stoppedInEmergency onlyExisting(unencryptIpfsHash) {
        /** @dev removeFromRegistry removes an image from the sale registry and emits an event.
         *  Only the seller can remove an image. Client (caller) should ensure all buyers have
         *  downloaded images (pull from IPFS using hash).
         *  @param unencryptIpfsHash - image name
         */
        delete registry[unencryptIpfsHash];
        emit LogHashRemoved("IPFS Hash removed from registry", unencryptIpfsHash, msg.sender);
    }

    function withdrawBalance(address withdrawAddress) public onlyOwner {
        /** @dev transfers balance to an ethereum address.
         *  Can only be called by contract owner.
         *  Uses check-effects-interactions pattern
         */
        require(msg.sender == withdrawAddress);
        emit LogBalance(balance[msg.sender]);
        withdrawals[msg.sender] = OraclizeUtils.add(withdrawals[msg.sender], balance[msg.sender]);
        // transfer throws on exception and safe against re-entrancy
        msg.sender.transfer(balance[msg.sender]);
        balance[msg.sender] = 0;
    }

    function __callback(bytes32 queryId, string result, bytes proof) public {
        // @dev Callback function for Oraclize once it retrieves data from query invocation
        require(msg.sender == oraclize_cbAddress());
        require(validIds[queryId].queried);

        // result Should be decrypted hash
        validIds[queryId].decryptIpfsHash = result;

        emit LogResultReceived(result); // TODO: remove in production
        // make sure callback for a given query Id is never called twice
        validIds[queryId].queried = false;

    }

    function safeDestroy() onlyOwner {
        /** @dev Low cost way to teardown
         *  contract and send bal to owner
         */
        selfdestruct(owner);
    }
}
