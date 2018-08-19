
## Avoiding Common Attack Vectors


#### Integer arithmetic and overflow
- OraclizeUtils library offers safe addition function used
in ImageSeller for any addition. Throws on overflow.

#### Re-entrancy attacks
- malicious code cannot call back into ImageSeller since "transfer" is
used to send Ether to contract owner (locked down via a modifier on withdraw function)
- recursive calls back into ImageSeller from external contract are thus
prohibited

#### Poison Data
- validation done before state mutated in ImageSeller via "check effects interactions" pattern
- Specifically, price is required to be greater than 0 for adding an image to seller's registry
- Require Price > sale price before returned unencrypted IPFS hash to buyer

#### Malicious Admins
- This attack is prevented by the onlyOwner modifier in ImageSeller
- Only one admin per deployed ImageSeller, the contract deployer.

#### TX.origin
- all contracts use msg.sender which is safer since it does not follow
call stack up to original tx in an embedded call scenario.

#### Gas Limits
- utility function in OraclizeUtils library used to ensure enough gas is 
sent by buyers in ImageSeller "buyFromRegistry" function.

#### Check Effects Interactions
- this pattern is used in any function in ImageSeller that deals with
value. This includes payable function for buying an image and withdraw function.
- First, sanity checks are made. Did buyer send enough ether to cover image cost ?
- Then, contract state members are mutated. Registry updated for new sale. Balance updated.
- Finally, external side effects if any are executed. `msg.sender.transfer` on withdraw function.
