var ImageSellerFactory = artifacts.require("./ImageSellerFactory.sol");
var ImageSeller = artifacts.require("./ImageSeller.sol");

const assert = require("chai").assert; // use Chai Assertion Library
const ganache = require("ganache-cli"); // run ganache-cli on separate command terminal as a prestep
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);

describe('Test adding new image seller', () => {
    contract('ImageSellerFactory', accounts => {
        let ImageFactory

        beforeEach('Create Image Factory Instance for each test', async function () {
            ImageFactory = await ImageSellerFactory.new()
        })

        it('Check for 0 sellers before adding one', async function () {
            const numSellers = await ImageFactory.numSellers()
            assert.equal(numSellers, 0, "Number of sellers should be 0")
        })

        it('Create a new Image Seller', async function () {
            await ImageFactory.createImageSeller({from: accounts[0]})
            const numSellers = await ImageFactory.numSellers()
            assert.equal(numSellers, 1, "Number of sellers should be 1")
        })
    })
})


describe('Test adding new photo to image seller marketplace', () => {
    contract('ImageSellerFactory', accounts => {
        let ImageFactory

        beforeEach('Create Image Factory Instance for each test', async function () {
            ImageFactory = await ImageSellerFactory.new()
            await ImageFactory.createImageSeller({from: accounts[1]})
        })

        it('Image should be added to registry', async function () {
            const sellerContractAddr = await ImageFactory.getSellerContract(accounts[1])
            await ImageSeller.at(sellerContractAddr).addImageToRegistry(
                "image1", "encrypt_image1", 0, 100, 1000, {from: accounts[1]})
            const encryptHash = await ImageSeller.at(sellerContractAddr).getSellerEncryptHash("image1")
            assert.equal(encryptHash, "encrypt_image1", "Image not added to seller registry")
        })
    })
})

describe('Test buying photo from different account than seller', () => {
    contract('ImageSellerFactory', accounts => {
        let ImageFactory
        let sellerContractAddr

        beforeEach('Create Image Factory Instance for each test', async function () {
            ImageFactory = await ImageSellerFactory.new()
            await ImageFactory.createImageSeller({from: accounts[0]})
            sellerContractAddr = await ImageFactory.getSellerContract(accounts[0])
            await ImageSeller.at(sellerContractAddr).addImageToRegistry(
                "image1", "encrypt_image1", 0, 8000000, 1000, {from: accounts[0]})
        })

        it('Check sales', async function () {
            let numSales = (await ImageSeller.at(
                sellerContractAddr).getSellerNumSales .call("image1",{from: accounts[0]})).toNumber()
            assert.equal(numSales, 0, "Number of sales should be 0")
        })

        it('Buy an image', async function () {
            let unencryptHash
            await ImageSeller.at(
                sellerContractAddr).buyFromRegistry("image1", {from: accounts[1], value: 9000000, gas: 5000000}).then(
                    function(result) {
                        // result is an object with the following values:
                        //
                        // result.tx      => transaction hash, string
                        // result.logs    => array of decoded events that were triggered within this transaction
                        // result.receipt => transaction receipt object, which includes gas used
                        for (var i = 0; i < result.logs.length; i++) {
                            var log = result.logs[i];

                            //console.log(log)
                            if (log.event == "LogUnencryptHash") {
                                // We found the event!
                                unencryptHash = log.args.unencryptHash
                                break;
                            }
                        }
                    }
            )
            assert.equal(unencryptHash, "encrypt_image1", "Unencrypted ipfs hashes not equal")
            let numSales = (await ImageSeller.at(
                sellerContractAddr).getSellerNumSales .call("image1",{from: accounts[0]})).toNumber()
            assert.equal(numSales, 1, "Number of sales should be 1")
        })
    })
})

/*
contract('ImageSeller', accounts => {
    it('Simple Test calling Image Seller getter / seller directly', async function () {
        let ImageSellerInstance = await ImageSeller.deployed()
        await ImageSellerInstance.set(5, {from: accounts[2], gas: 4712388, gasPrice: 100000000000})
        // use call to call pure view functions only and convert to number from bigint
        let myuint = (await ImageSellerInstance.get.call()).toNumber()
        assert.equal(myuint, 5, 'Direct call uints should equal 5')
    })
})
describe('Test adding new photo to image seller marketplace', () => {
    contract('ImageSellerFactory', accounts => {
        let ImageFactory
        let ImageSellerInstance

        beforeEach('Create Image Factory Instance for each test', async function () {
            ImageFactory = await ImageSellerFactory.new()
            await ImageFactory.createImageSeller({from: accounts[1]})
        })

        it('Image should be added', async function () {
            await ImageFactory.addImageToRegistry("image2", "encryptimage1",
                0, 200, 1000, {from: accounts[1], gas: 1000000})
            const sellerContractAddr = await ImageFactory.getSellerContract(accounts[1])
            //const sellerCtAddrFromHash = await ImageFactory.getSellerContractHash("image1")
            //const encryptHash = await ImageSeller.at(sellerContractAddr).getSellerEncryptHash(
            //    "image1", {from: accounts[1], gas: 1000000})
            console.log(sellerContractAddr)
            //console.log(encryptHash)
            //assert.equal(encryptHash, "encryptimage1", "Contract not available to add image")
            await ImageSeller.at(sellerContractAddr).set(5, {from: accounts[1]})
            // use call to call pure view functions only and convert to number from bigint
            let myuint = (await ImageSeller.at(sellerContractAddr).get.call()).toNumber()
            assert.equal(myuint, 5, 'Direct call uints should equal 5!')
            await ImageSeller.at(sellerContractAddr).addImageToRegistry("image1", "encryptimage1",
            0, 200, 1000, {from: accounts[1], gas: 1000000})
            const encryptHash = await ImageSeller.at(sellerContractAddr).getSellerEncryptHash(
                "image1", {from: accounts[1], gas: 1000000}
            )
            console.log("About to print encrypt hash")
            console.log(encryptHash)
            const encryptHash2 = await ImageSeller.at(sellerContractAddr).getSellerEncryptHash(
                "image2", {from: accounts[1], gas: 1000000}
            )
            console.log("About to print encrypt hash2")
            console.log(encryptHash2)
            await ImageFactory.set(7, {from: accounts[1], gas: 1000000})
            ImageFactory.get({from: accounts[1], gas: 1000000}).then(function(result) {
                // result is an object with the following values:
                //
                // result.tx      => transaction hash, string
                // result.logs    => array of decoded events that were triggered within this transaction
                // result.receipt => transaction receipt object, which includes gas used

                // We can loop through result.logs to see if we triggered the Transfer event.
                console.log(result)
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];

                    console.log(log)
                    if (log.event == "LogMyUint") {
                        // We found the event!
                        console.log(log)
                        break;
                    }
                }
            })
            //console.log("About to print my innt")
            //console.log(myuint2)
        })

        beforeEach('Add Image Seller Market via Factory', async function () {
        })

        beforeEach('Add image to Image Seller registry', async function () {
        })


        it('Image hash should reside in new image seller contract registry', async function () {
            const sellerContractAddr = await ImageFactory.getSellerContract(accounts[1])
            //const sellerCtAddrFromHash = await ImageFactory.getSellerContractHash("image1")
            const sellerContract = await ImageSeller.at(sellerContractAddr)
            const encryptHash = await sellerContract.getSellerEncryptHash("image1")
            const owner = await sellerContract.getOwner()
            //console.log(sellerContractAddr)
            //console.log(sellerContract)
            //console.log(encryptHash)
            //console.log(owner)
            //console.log(accounts[1])
            //assert.equal(sellerCtAddrFromHash, sellerContractAddr, "Contract addresses should be equal")
            //assert.equal(encryptHash, "encryptimage1", "Encrypted hashes don't match")
        })

        it('Set uint and get to test remote contract call from factory', async function () {
            const sellerContractAddr = await ImageFactory.getSellerContract(accounts[1])
            await ImageFactory.set.call(5, {from: accounts[1], gas: 1000000})
            var myuint = (await ImageFactory.get.call(sellerContractAddr,
                {from: accounts[1], gas: 1000000})).toNumber()
            console.log(myuint)
            assert.equal(myuint, 5, 'Uints should be equal to 5')
        })

        it('Test calling Image Seller getter / seller directly', async function () {
            ImageSellerInstance = await ImageSeller.deployed()
            //ImageSellerInstance = await ImageSeller.new(accounts[2],
            //    {from: accounts[2], gas: 4712388, gasPrice: 100000000000})
            await ImageSellerInstance.set.call(5)
            let myuint = (await ImageSellerInstance.get.call()).toNumber()
            console.log(myuint)
            assert.equal(myuint, 5, 'Direct call uints should equal 5')
        })


    })
})

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

    it("...Image Seller Image Not Removed Successfully", function() {
        return ImageSellerFactory.deployed().then(function(instance) {
            ZERO_ADDR = '0x0000000000000000000000000000000000000000';
            FactoryInstance = instance;
            return FactoryInstance.createImageSeller({from: accounts[0]});
        }).then(function() {
            FactoryInstance.addImageToRegistry("image1", "encryptimage1",
                0, 200, 1000, {from: accounts[0]});
        }).then(function() {
            FactoryInstance.removeFromRegistry("image1", {from: accounts[0]});
        }).then(function () {
            return FactoryInstance.getSellerContractFromHash("image1");
        }).then(function (sellerContract) {
            contract = sellerContract;
            return FactoryInstance.getSellerContract(accounts[0]);
        }).then(function(sellerContract) {
            console.log(sellerContract);
            console.log(contract);
            assert.equal(ZERO_ADDR, contract, "Image not removed from store successfully");
        });
    });

    it("...Image Seller Buy Image From Registry", function() {
        return ImageSellerFactory.deployed().then(function(instance) {
            FactoryInstance = instance;
            return FactoryInstance.createImageSeller({from: accounts[0]});
        }).then(function() {
            FactoryInstance.addImageToRegistry("image1", "encryptimage1",
                0, 1, 1000, {from: accounts[0]});
        }).then(function() {
            FactoryInstance.buyFromRegistry("image1",
                {from: accounts[1],
                    value: web3.utils.toWei('1', 'ether'),
                gas: 100000});
            FactoryInstance.buyFromRegistry("image1",
                {from: accounts[1],
                    value: web3.utils.toWei('1', 'ether'),
                    gas: 100000});
        }).then(function() {
            return FactoryInstance.getSellerContract(accounts[0]);
        }).then(function(sellerContract) {
            return ImageSeller.at(sellerContract).getSellerNumSales("image1", {from: accounts[0]});
        }).then(function(numSales) {
            console.log(numSales);
            assert.equal(numSales, 1, "Num sales should be 1");
        });
    });

    it("...Image Seller Register Images via Proxy", function() {
        return ImageSellerFactory.deployed().then(function(instance) {
            FactoryInstance = instance;
            return FactoryInstance.createImageSeller({from: accounts[0]});
        }).then(function() {
            FactoryInstance.addImageToRegistry("image1", "encryptimage1",
                0, 1, 1000, {from: accounts[0]});
        }).then(function() {
            contract = FactoryInstance.getSellerContractFromHash("image1");
            console.log(contract);
            ImageSeller imageSeller = ImageSeller(contract);
            console.log(imageSeller.getSellerEncryptHash("image1"));
        });
    });
});
*/
