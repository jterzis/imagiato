pragma solidity ^0.4.22;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ImageSeller.sol";
import "../contracts/ImageSellerFactory.sol";

contract TestImageSeller {
    function testCreateImageSeller() public {
        ImageSellerFactory imageFactory = ImageSellerFactory(
            DeployedAddresses.ImageSellerFactory());
        //address msgSender = address(this);
        address msgSender = msg.sender;
        imageFactory.createImageSeller();

        uint numSellers = imageFactory.numSellers();
        Assert.equal(numSellers, 1, "Number of sellers should be 1");

        address sellerContract = imageFactory.getSellerContract(msgSender);
        Assert.notEqual(address(sellerContract), address(imageFactory.ZERO_ADDR), "Seller's contract not in registry!");

        uint256 discount = 0;
        uint256 price = 100;
        uint256 ts = 1000;
        bool response2 = imageFactory.addImageToRegistry(
            "unencryptHash", "encryptHash", discount, price, ts);
        Assert.isTrue(bool(response2), "Add image to registry failed");

    }

}
