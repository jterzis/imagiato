import ImageSellerFactory from '../build/contracts/ImageSellerFactory';
const contract = require('truffle-contract');
const imageSellerFactory = contract(ImageSellerFactory);

// when deploying to a mainnet or testnet use new web3.eth.Contract(abi, address) to export contract
export default imageSellerFactory;
