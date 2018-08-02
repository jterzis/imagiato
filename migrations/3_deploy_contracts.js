const ImageSellerFactory = artifacts.require("./ImageSellerFactory.sol");
const OraclizeUtils = artifacts.require("./OraclizeUtils.sol");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(OraclizeUtils);
    // libraries need to be deployed and linked before consuming contract
    deployer.link(OraclizeUtils, ImageSellerFactory);
    deployer.deploy(ImageSellerFactory);
};
