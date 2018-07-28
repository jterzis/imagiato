const ImageSeller = artifacts.require("./ImageSeller.sol");
const OraclizeUtils = artifacts.require("./OraclizeUtils.sol");

module.exports = function(deployer) {
    deployer.deploy(OraclizeUtils);
    deployer.link(OraclizeUtils, ImageSeller);
    deployer.deploy(ImageSeller);
};
