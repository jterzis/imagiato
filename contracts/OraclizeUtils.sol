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

    function toString(address x) returns (string) {
        // utf
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++)
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
        return string(b);
    }

    function add(uint a, uint b) internal returns (uint) {
        uint c = a + b;
        assert(c >= a);
        return c;
    }

    function assert(bool assertion) internal {
        if (!assertion) {
            throw;
        }
    }

}
