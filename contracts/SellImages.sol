pragma solidity ^0.4.23;

contract SellImages {
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
    address public owner;
    uint public creationTime;
    struct SaleStruct {
        uint price;
        uint numSales;
        uint expiry; //based on block number
        uint discount; //pct expressed as int interval [0-100]
        string encryptIpfsHash;
    }

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
            expiry: expiry, encryptIpfsHash: encryptIpfsHash, numSales: 0
            });
        registry[unencryptIpfsHash] = saleStruct;

    }
    // external
    // public
    // internal
    // private
}
