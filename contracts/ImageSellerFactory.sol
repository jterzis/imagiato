/* Solidity contract unit tests. For integration
   tests using JS as you can simulate calls from
   different addresses than the deployed contracts'.
*/
pragma solidity ^0.4.22;

import "./OraclizeUtils.sol";
import "./ImageSeller.sol";

contract Proxy {
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
        uint discount, uint price, uint expiry) public returns(bool) {
        require(address(registrySellers[msg.sender]) != address(this.ZERO_ADDR)); // child contract needs to be in existence
        emit LogMsgSender(msg.sender);
        bool response = registrySellers[msg.sender].call(
            bytes4(sha3("addImageToRegistry(string, string, uint, uint, uint)")),
                unencryptIpfsHash, encryptIpfsHash, discount, price, expiry);
        emit LogAddImageToRegistry(response);
        return response;
    }
    // TODO: add rest of functions from ImageSeller
}


contract ImageSellerFactory is Proxy {

    event LogImageSellerCreation(string description);
    event LogMsgSender(address sender);

    function createImageSeller() public {
        if (registrySellers[msg.sender] == 0) {
            emit LogImageSellerCreation('Created new image seller');
            registrySellers[msg.sender] = new ImageSeller(msg.sender);
            emit LogMsgSender(msg.sender);
            numSellers += 1;
        }
    }
    // TODO: add safe destroy function
}
