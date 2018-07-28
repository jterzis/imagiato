pragma solidity ^0.4.0;

library OraclizeUtils {

    function enoughBalance(uint balance) public pure returns (bool) {
        // oraclize queries require a min of 200k gas * 20 Gwei
        // = 0.004 ETH
        if (balance >= (200000 * 20)) {
            return true;
        }
        return false;
    }
}
