const ImageSeller = artifacts.require("./ImageSeller.sol");
const ImageSellerFactory = artifacts.require("./ImageSellerFactory.sol");
const OraclizeUtils = artifacts.require("./OraclizeUtils.sol");

module.exports = function(deployer, network, accounts) {
    const userAddress = accounts[3]; //need an acct to pass to ImageSeller ctor
    deployer.deploy(OraclizeUtils);
    // libraries need to be deployed and linked before consuming contract
    deployer.link(OraclizeUtils, ImageSeller);
    //deployer.link(OraclizeUtils, ImageSellerFactory);
    deployer.deploy(ImageSeller, userAddress);
    //deployer.deploy(ImageSellerFactory);
};
