/* Solidity contract unit tests. For integration
   tests using JS as you can simulate calls from
   different addresses than the deployed contracts'.
*/
pragma solidity ^0.4.22;

import "./OraclizeUtils.sol";
import "./ImageSeller.sol";

contract Proxy {
    // type cast to 40 byte 0 address of form 0x0000...
    address public constant ZERO_ADDR = address(0x0);

    event LogMsgSender(address sender);
    event LogAddImageToRegistry(bool response);

    // account addresses mapped to imageseller contract instances
    mapping(address => address) public registrySellers;
    uint public numSellers;

    function getSellerContract(address addr) public view returns (address) {
        emit LogMsgSender(addr);
        return registrySellers[addr];
    }

    function fooImageSeller(string payload) public returns(bool) {
        // test simple call to ImageSeller contract
        bool response = registrySellers[msg.sender].call(
            bytes4(sha3("fooImageSeller(string)")), payload);
        return response;
    }

    // addImageToRegistry: proxy contract uses call to call
    // encoding/transport mechanism to call
    // ImageSeller functions
    function addImageToRegistry(string unencryptIpfsHash, string encryptIpfsHash,
        uint256 discount, uint256 price, uint256 expiry) public returns(bool) {
        emit LogMsgSender(msg.sender);
        address contractAddr = getSellerContract(msg.sender);
        require(contractAddr != ZERO_ADDR); // child contract needs to be in existence
        //ImageSeller contractImageSeller = ImageSeller(contractAddr);
        //contractImageSeller.addImageToRegistry(unencryptIpfsHash, encryptIpfsHash, discount, price, expiry);

        // for uint in call signature you must use uint256
        bool response = contractAddr.call(
            bytes4(keccak256("addImageToRegistry(string,string,uint256,uint256,uint256)")),
                unencryptIpfsHash, encryptIpfsHash, discount, price, expiry);

        //emit LogAddImageToRegistry();
        return response;
    }
    // TODO: add rest of functions from ImageSeller
}


contract ImageSellerFactory is Proxy {

    address[] registrySellersContracts;

    event LogImageSellerCreation(string description);
    event LogMsgSender(address sender);
    event LogImageSeller(address sender);

    function getContracts() view returns(address[]) {
        return registrySellersContracts;
    }

    function createImageSeller() public {
        // note: msg.sender is 0 in truffle console
        // call createImageSeller with {from: account} last
        // parameter to drive who msg.sender is.
        address owner = msg.sender;
        if (registrySellers[owner] == 0) {
            emit LogImageSellerCreation('Created new image seller');
            address imageSeller = new ImageSeller(owner);
            emit LogImageSeller(imageSeller);
            registrySellers[owner] = imageSeller;
            registrySellersContracts.push(imageSeller);
            emit LogMsgSender(owner);
            numSellers += 1;
        } else {
            emit LogImageSellerCreation('Owner address already has an ImageSeller contract');
        }
    }
    // TODO: add safe destroy function
}
