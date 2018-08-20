## Design Pattern Decisions

#### Pattern 1: Factory

There are 3 solidity contracts that comprise this project: `Proxy`, `ImageSeller.sol` and `ImageSellerFactory.sol`.

`ImageSellerFactory` as it's name implies offers one method that creates a child contract instance of `ImageSeller`.

By using a factory design, all image seller's created are compatible with one another since they offer a unified single interface,
which makes maintenance easier and safer.

The factory contract stores the resultant contract address in storage in an array called `registrySellersContracts`.
The caller which is typically a web3 aware frontend manages the life cycle of child contracts, each of which is a separately owned instance of `ImageSeller`.

This design is particularly useful for de-multiplexing a trustless p2p marketplace for the purpose of presenting a single frontend experience to the end user, in our case buyers of stock photos.

The frontend could easily dispatch to the correct child contract when a buyer starts the buying experience (by clicking on "buy" button next to a compressed image) by simply storing the deployer address, the caller of `createImageSeller` 
factory method along with the image name for an image added. 

The view function in `ImageSellerFactory`, which is free to call, returns the child contract address given the deployer address. The frontend can then instantiate an instance of 
child contract `ImageSeller` using web3 and the JSON abi and start interacting directly with the unified interface offered, allowing for new images to be added by contract owner
(original deployer address) and images to be bought by other addresses given the image name (which is assumed to be unique in a seller's contract).

#### Pattern 2: Proxy

`Proxy` also implements a proxy pattern that allows a client to call `ImageSeller` children contract instances
without instantiating instances using web3 in the frontend. Since `ImageSellerFactory` is derived from `Proxy`
it inherits all of its storage members and methods.

There are some tradeoffs though with this proxy approach that did not warrant using it in production in lieu of directly
calling instantiated child contracts using web3. The first problem is that this approach is not easily maintainable since for every
new public method added to `ImageSeller` a new method would need to be added to `Proxy`. Also, in later version of solidity compiler (^0.4.22)
a preferred way to make a proxy call (contract -> contract) is using "call" with a keccak256 hash of the callee's function signature.
All uint members of callee method need to be uint256 which adds extra storage costs to `ImageSeller` since the `SalesStruct` has several uint members.

However, the biggest reason for not using proxy to call child contracts from `ImageFactory` is that a malicious user could easily
subclass ImageSellerFactory and institute a `payable` fallback method that creates a re-entrancy attack against `ImageSeller` by 
recursively calling the `ImageSeller` withdraw method until gas runs out. 

Simplicity is most important in solidity programming and adding a layer of obfuscation via the Proxy pattern seemed to present
more maintenance and security concerns than benefits which is why though it was implemented it is not used in production on the frontend.


#### Pattern 3: Inheritance

Single inheritance is used with `ImageSellerFactory` which is an instance of `Proxy` contract and shares
it's member storage data and methods. The benefit is that one contract is deployed and it is easier to reason
about the Factory which only offers a static `create` method in accordance with the factory design pattern.

If we wanted to create a `VideoSellerFactory` we would simply subclass `Proxy` and implement a new `create` method
within `VideoSellerFactory`. The proxy would still store child contract `VideoSeller` instances in it's registry member storage map.

Therefore, using inheritance with factory method is particularly extensible since only one method needs to be implemented
as the child contracts the factory outputs change with the introduction of new products to sell in the decentralized marketplace.

#### Pattern 4: Emergency Stop
 
 Implemented in ImageSeller contract. Can only be set by contract owner (deployer). Prevents running methods to add new images,
 or buy an images as a buyer.