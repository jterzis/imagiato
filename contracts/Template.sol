pragma solidity ^0.4.20;
/*
  Dev template for testing Oraclize integration
  Import the Oraclize contract
  outside of Remix, direct imports from GitHub may not be supported
  instead, use a local import or just paste the Oraclize code in directly
*/
import "./OraclizeAPI_0pt5.sol";

contract Template is usingOraclize {

    // Define variables
    uint public randomNumber; // number obtained from random.org
    mapping(bytes32 => bool) validIds; // used for validating Query IDs
    uint constant gasLimitForOraclize = 175000; // gas limit for Oraclize callback

    // Events used to track contract actions
    event LogOraclizeQuery(string description);
    event LogResultReceived(uint number);

    // Constructor
    function Template() public {
        // set Oraclize proof type
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);

        // set gas price for Oraclize callback
        oraclize_setCustomGasPrice(1000000000 wei); // 1 Gwei
    }

    // Query Oraclize to get random number
    function getRandomNumber() public payable {
        // require ETH to cover callback gas costs
        require(msg.value >= 0.000175 ether); // 175,000 gas * 1 Gwei = 0.000175 ETH

        // send query
        bytes32 queryId = oraclize_query(
            "nested",
            "[URL] ['json(https://api.random.org/json-rpc/1/invoke).result.random[\"data\"]', '\\n{\"jsonrpc\": \"2.0\", \"method\": \"generateSignedIntegers\", \"params\": { \"apiKey\": \"${[decrypt] BOxGYn1YIfhJZHTFQKSKZ/G5K2eeUwOnlCZeOOlNdm3ZKoguY0DLeJxaOqHl66GgmTqd7NEYY2g6omOhCguFQUZlz3CyQk8WmEZ5FKWfznFTFCHKkR1CPFoezErj84ukyOnwt6aNAaSJhB5gMWceBRvjVDH/}\", \"n\": 1, \"min\": 1, \"max\": 1000, \"replacement\": true, \"base\": 10${[identity] \"}\"}, \"id\": 14215${[identity] \"}\"}']",
            gasLimitForOraclize
        );

        // log that query was sent
        emit LogOraclizeQuery("Oraclize query was sent, standing by for the answer..");

        // add query ID to mapping
        validIds[queryId] = true;
    }

    // Callback function for Oraclize once it retreives the data
    function __callback(bytes32 queryId, string result, bytes proof) public {
        // only allow Oraclize to call this function
        require(msg.sender == oraclize_cbAddress());

        // validate the ID
        require(validIds[queryId]);

        // set random number, result is of the form: [268]
        // if we also returned serialNumber, form would be "[3008768, [268]]"
        randomNumber = parseInt(result);

        // log the new number that was obtained
        emit LogResultReceived(randomNumber);

        // reset mapping of this ID to false
        // this ensures the callback for a given queryID never called twice
        validIds[queryId] = false;
    }

}
