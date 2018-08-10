var ImageSellerFactory = artifacts.require("./ImageSellerFactory.sol");

contract('ImageSellerFactory', function(accounts) {

    it("...Image Seller Not Created", function() {
        return ImageSellerFactory.deployed().then(function(instance) {
            FactoryInstance = instance;

            return FactoryInstance.createImageSeller({from: accounts[0]});
        }).then(function() {
            return FactoryInstance.numSellers();
        }).then(function(numSellers) {
            assert.equal(numSellers, 1, "Number of sellers should be 1");
        }).then(function() {
            FactoryInstance.addImageToRegistry("image1", "encryptimage1",
            0, 200, 1000, {from: accounts[0]});
        }).then(function() {
            return FactoryInstance.getSellerContractFromHash("image1");
        }).then(function(sellerContract) {
            // contract forms closure over engulphing scope
            contract = sellerContract;
            // return solidity calls using then so test waits for
            // tx to be mined
            return FactoryInstance.getSellerContract(accounts[0]);
        }).then(function(sellerContract) {
            console.log(sellerContract);
            console.log(contract);
            assert.equal(sellerContract, contract, "Seller contract does not match");
        });
    });
});
