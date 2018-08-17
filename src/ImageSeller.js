import * as data from '../build//contracts/ImageSeller.json'
const abi = data.abi

import ImageSeller from '../build/contracts/ImageSeller.json';
const contract = require('truffle-contract');
var ImageSellerInst = contract(ImageSeller);

// when deploying to a mainnet or testnet use new web3.eth.Contract(abi, address) to export contract
export var ImageSellerInst;
export default abi