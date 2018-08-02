pragma solidity ^0.4.20;

import "./ImageSeller.sol";

contract Proxy {
    mapping(address => address) registrySellers;
    // Proxy contract uses call to call
    // encoding/transport mechanism to call
    // ImageSeller functions
    function addImageToRegistry(string unencryptIpfsHash, string encryptIpfsHash,
        uint discount, uint price, uint expiry) internal {
        require(registrySellers[msg.sender] != 0); // child contract needs to be in existence
        registrySellers[msg.sender].call(bytes4(sha3("addImageToRegistry(string, string, uint, uint, uint)")),
            unencryptIpfsHash, encryptIpfsHash, discount, price, expiry);
    }
    //TODO: add rest of functions from ImageSeller
}

contract ImageSellerFactory is Proxy {

    function createImageSeller() public {
        if (registrySellers[msg.sender] == 0) {
            registrySellers[msg.sender] = new ImageSeller(msg.sender);
        }
    }
    //TODO: add safe destroy function

}
