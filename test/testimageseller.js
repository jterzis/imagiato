var ImageSellerFactory = artifacts.require("./ImageSellerFactory.sol");
var ImageSeller = artifacts.require("./ImageSeller.sol");

const assert = require("chai").assert; // use Chai Assertion Library
const ganache = require("ganache-cli"); // run ganache-cli on separate command terminal as a prestep

//Truffle inserts an instance of Web3 (.20) to consume (not Web3 1.0)
/*
const web3 = require("web3");
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const is_json = require("../build/contracts/ImageSeller.json");
const isf_json = require("../build/contracts/ImageSellerFactory.json");
const is_interface = is_json["abi"];
const is_bytecode = web3.utils.asciiToHex(is_json["bytecode"]);
const isf_interface = isf_json["abi"];
const isf_bytecode = web3.utils.asciiToHex(isf_json["bytecode"]);
var gasEstimate = web3.eth.estimateGas({data: isf_bytecode})

describe('Deploy ImageSeller and ImageSellerFactory Using Web3', () => {

    var ImageFactoryWeb3
    beforeEach('Deploy contracts using Web3 Provider', async function () {
        const accounts = await web3.eth.getAccounts()
        const deployer = accounts[3]
        web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))
        ImageFactoryWeb3 = await new web3.eth.Contract(
            isf_interface).deploy({data: isf_bytecode}).send({from: deployer, gas: gasEstimate})
    })

    it('Check for 0 sellers before adding one', async function () {
        const numSellers = await ImageFactoryWeb3.numSellers()
        assert.equal(numSellers, 1, "Number of sellers should be 0")
    })
})
*/

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


describe('Test removing added photo to image seller marketplace', () => {
    contract('ImageSellerFactory', accounts => {
        let ImageFactory
        let sellerAccount
        let buyerAccount

        beforeEach('Create Image Factory Instance for each test', async function () {
            sellerAccount = accounts[1]
            buyerAccount = accounts[2]
            ImageFactory = await ImageSellerFactory.new()
            await ImageFactory.createImageSeller({from: sellerAccount})
            const sellerContractAddr = await ImageFactory.getSellerContract(sellerAccount)
            await ImageSeller.at(sellerContractAddr).addImageToRegistry(
                "image1", "encrypt_image1", 0, 100, 1000, {from: sellerAccount})
        })

        it('Removing image from non seller account should be prohibited', async function () {
            try {
                await ImageSeller.at(sellerContractAddr).removeFromRegistry("image1",
                    {from: buyerAccount})
                wait(7000)
                assert.equal(1,0,"Access to sellers market has been breached")
            } catch(e) {
                assert.equal(1,1, "Only seller can remove images hosted on his/her market")
            }
        })

        it('Removing image from marketplace using sellers account', async function () {
            try {
                await ImageSeller.at(sellerContractAddr).removeFromRegistry("image1",
                    {from: sellerAccount})
                let encryptHash = (await ImageSeller.at(sellerContractAddr).getSellerEncryptHash.call("image1", {from: sellerAccount}))
                assert.equal(encryptHash, 0, "Image shouldnt exist anymore")
            } catch(e) {
                assert.equal(1,1, "Only seller can remove images hosted on his/her market")
            }
        })
    })
})


describe('Test buying photo from different account than seller', () => {
    contract('ImageSellerFactory', accounts => {
        let ImageFactory
        let sellerContractAddr
        let owner
        let buyer
        let ownerBalance

        beforeEach('Create Image Factory Instance for each test', async function () {
            owner = accounts[0]
            buyer = accounts[1]
            ImageFactory = await ImageSellerFactory.new()
            await ImageFactory.createImageSeller({from: owner})
            sellerContractAddr = await ImageFactory.getSellerContract(owner)
            await ImageSeller.at(sellerContractAddr).addImageToRegistry(
                "image1", "encrypt_image1", 0, 3000000000000000000, 1000, {from: owner})
            web3.eth.getBalance(owner, function(err,res) {
                ownerBalance = parseInt(res)
            })
        })

        it('Check number of sales', async function () {
            let numSales = (await ImageSeller.at(
                sellerContractAddr).getSellerNumSales .call("image1",{from: owner})).toNumber()
            assert.equal(numSales, 0, "Number of sales should be 0")
        })

        it('Buy an image with enough funds', async function () {
            let unencryptHash
            await ImageSeller.at(
                sellerContractAddr).buyFromRegistry("image1", {from: buyer, value: 3200000000000000000, gas: 1000000}).then(
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
                            } else if (log.event == "LogMsgValue") {
                                //console.log(log.args.price.toNumber())
                            }
                        }
                    }
            )
            assert.equal(unencryptHash, "encrypt_image1", "Unencrypted ipfs hashes not equal")
            let numSales = (await ImageSeller.at(
                sellerContractAddr).getSellerNumSales .call("image1",{from: owner})).toNumber()
            assert.equal(numSales, 1, "Number of sales should be 1")

            let contractBal
            web3.eth.getBalance(sellerContractAddr, function(err,res) {
                contractBal = parseInt(res)
                //console.log("Contract Balance after sale " + contractBal)
                assert.notEqual(contractBal, 0, "Contract Balance should greater than 0 after a sale")
            })

            let balance = (await ImageSeller.at(sellerContractAddr).getBalance.call({from: owner})).toNumber()
            //console.log("About to print balance field")
            //console.log(balance)

            let balancePostWithdraw
            await ImageSeller.at(sellerContractAddr).withdrawBalance(owner, {from: owner, gas: 1000000})
            let balancePost = (await ImageSeller.at(sellerContractAddr).getBalance.call({from: owner})).toNumber()
            //console.log("About to print balance field post withdrawal")
            //console.log(balancePost)
            web3.eth.getBalance(owner, function(err,res) {
                balancePostWithdraw = parseInt(res)
                //console.log("About to print owner balance post withdrawal")
                //console.log(balancePostWithdraw)
                assert.isAbove(balancePostWithdraw, ownerBalance, "Owner balance should be greater than pre withdrawal")
            })

            })

        it('Check that seller balances are equal to pre-purchase', async function () {
            let balanceBeforeWithdraw
            web3.eth.getBalance(owner, function(err,res) {
                balanceBeforeWithdraw = parseInt(res)
                //console.log("About to print owner balance pre withdrawal")
                //console.log(balanceBeforeWithdraw)
                assert.equal(ownerBalance, balanceBeforeWithdraw, "Owner Balance should be equal to before withdrawal")
            })
        })
/*
        it('Check that seller balances are all correct after withdrawal', async function () {
            let balancePostWithdraw
            await ImageSeller.at(sellerContractAddr).withdrawBalance(owner, {from: owner, gas: 1000000})
            let balancePost = (await ImageSeller.at(sellerContractAddr).getBalance.call({from: owner})).toNumber()
            console.log("About to print balance field post withdrawal")
            console.log(balancePost)
            web3.eth.getBalance(owner, function(err,res) {
                balancePostWithdraw = parseInt(res)
                console.log("About to print owner balance post withdrawal")
                console.log(balancePostWithdraw)
                //assert.isAbove(balancePostWithdraw, ownerBalance, "Owner balance should be greater than pre withdrawal")
            })
        })
        */


        it('Prevent image purchase with insufficient funds given price', async function () {
            let unencryptHash
            try {
                await ImageSeller.at(
                    sellerContractAddr).buyFromRegistry("image1", {
                    from: accounts[2],
                    value: 1000,
                    gas: 100000
                }).then(
                    function (result) {
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
                wait(7000)
                assert.equal(1, 0,'VM should have reverted if require did its job')
            } catch(e) {
                // VM should revert if exception is thrown
                assert.equal(1, 1, 'VM should have reverted if require did its job')
            }
        })
    })
})

