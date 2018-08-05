/* Note: Use .sol tests for unit tests
   and .js tests for integration tests
   since it is not possible to pick and choose
   web3 addresses for testing inter-contract
   calls.
*/
pragma solidity ^0.4.22;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ImageSellerFactory.sol";

contract TestImageSellerFactory {
    function testCreateImageSellFactory() public {
        ImageSellerFactory imageFactory = ImageSellerFactory(
            DeployedAddresses.ImageSellerFactory());

        uint numSellers = imageFactory.numSellers();
        Assert.equal(uint(numSellers), uint(0), "Number of sellers should start at zero!");

    }

}
