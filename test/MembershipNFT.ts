import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("MembershipNFT", function () {

  it("Debe crear un plan correctamente", async function () {

    const membership = await ethers.deployContract("MembershipNFT");

    await membership.createPlan(
      "Basico",
      30,
      ethers.parseEther("0.01")
    );

    const plan = await membership.plans(0);

    expect(plan.name).to.equal("Basico");
    expect(plan.durationDays).to.equal(30n);
    expect(plan.active).to.equal(true);

  });
  it("Debe permitir comprar una membresia NFT", async function () {

  const membership = await ethers.deployContract("MembershipNFT");

  await membership.createPlan(
    "Basico",
    30,
    ethers.parseEther("0.01")
  );

  await membership.buyMembership(
    0,
    {
      value: ethers.parseEther("0.01")
    }
  );

  expect(await membership.ownerOf(0)).to.not.equal(
    "0x0000000000000000000000000000000000000000"
  );

  const data = await membership.getMembership(0);

  expect(data[0]).to.equal(0n);

  expect(data[1]).to.be.greaterThan(0n);

  expect(data[2]).to.be.greaterThan(data[1]);

});

});