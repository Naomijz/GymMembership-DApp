// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MembershipNFT is ERC721, Ownable {

    uint256 private nextTokenId;

    struct Plan {
        string name;
        uint256 durationDays;
        uint256 price;
        bool active;
    }

    struct Membership {
        uint256 planId;
        uint256 startDate;
        uint256 endDate;
    }

    mapping(uint256 => Plan) public plans;
    mapping(uint256 => Membership) public memberships;

    uint256 public nextPlanId;

    constructor()
    ERC721("ChainPass Membership", "CPM")
    Ownable(msg.sender)
{
    // 0.0001 ETH = 100000000000000 Wei (muy barato para pruebas)
    plans[nextPlanId] = Plan({
        name: "Basico",
        durationDays: 30,
        price: 100000000000000,
        active: true
    });

    nextPlanId++;

    // 0.0003 ETH = 300000000000000 Wei
    plans[nextPlanId] = Plan({
        name: "Premium",
        durationDays: 90,
        price: 300000000000000,
        active: true
    });

    nextPlanId++;
}

function createPlan(
    string memory _name,
    uint256 _durationDays,
    uint256 _price
) public onlyOwner {

    plans[nextPlanId] = Plan({
        name: _name,
        durationDays: _durationDays,
        price: _price,
        active: true
    });

    nextPlanId++;
}

function buyMembership(uint256 _planId) public payable {

    Plan memory selectedPlan = plans[_planId];

    require(selectedPlan.active, "Plan no disponible");

    require(
        msg.value >= selectedPlan.price,
        "ETH insuficiente"
    );

    uint256 tokenId = nextTokenId;

    _safeMint(msg.sender, tokenId);

    memberships[tokenId] = Membership({
        planId: _planId,
        startDate: block.timestamp,
        endDate: block.timestamp + (selectedPlan.durationDays * 1 days)
    });

    nextTokenId++;
}

function isMembershipValid(
    uint256 tokenId
)
    public
    view
    returns (bool)
{
    return block.timestamp <= memberships[tokenId].endDate;
}

function getMembership(
    uint256 tokenId
)
    public
    view
    returns (
        uint256,
        uint256,
        uint256
    )
{
    Membership memory m = memberships[tokenId];

    return (
        m.planId,
        m.startDate,
        m.endDate
    );
}

function withdraw() public onlyOwner {

    uint256 balance = address(this).balance;

    require(
        balance > 0,
        "No hay fondos"
    );

    payable(owner()).transfer(balance);
}

function getMyMemberships()
    public
    view
    returns (uint256[] memory)
{
    uint256 total = balanceOf(msg.sender);

    uint256[] memory ids =
        new uint256[](total);

    uint256 counter = 0;

    for (
        uint256 i = 0;
        i < nextTokenId;
        i++
    ) {
        if (ownerOf(i) == msg.sender) {
            ids[counter] = i;
            counter++;
        }
    }

    return ids;
}

function deactivatePlan(
    uint256 planId
)
    public
    onlyOwner
{
    plans[planId].active = false;
}

function activatePlan(
    uint256 planId
)
    public
    onlyOwner
{
    plans[planId].active = true;
}

function getContractBalance()
    public
    view
    returns(uint256)
{
    return address(this).balance;
}

function cancelMembership(
    uint256 tokenId
)
    public
    onlyOwner
{
    memberships[tokenId].endDate =
        block.timestamp;
}

// Al ampliar se mintea un NFT nuevo con nueva vigencia
// que comienza donde termina el anterior
function extendMembership(
    uint256 originalTokenId,
    uint256 extraDays
)
    public
    onlyOwner
{
    Membership memory original =
        memberships[originalTokenId];

    address memberOwner =
        ownerOf(originalTokenId);

    uint256 newTokenId = nextTokenId;

    _safeMint(memberOwner, newTokenId);

    // La nueva vigencia empieza donde termina la anterior
    uint256 newStart = original.endDate;
    uint256 newEnd = newStart + (extraDays * 1 days);

    memberships[newTokenId] = Membership({
        planId: original.planId,
        startDate: newStart,
        endDate: newEnd
    });

    nextTokenId++;
}

function getTotalMemberships()
    public
    view
    returns(uint256)
{
    return nextTokenId;
}
}
