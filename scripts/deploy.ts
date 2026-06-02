import { network } from "hardhat";

const { ethers } = await network.create();

async function main() {

    const signers =
        await ethers.getSigners();

    console.log(
        "Cuenta #19:",
        await signers[19].getAddress()
    );

    const membership =
        await ethers.deployContract(
            "MembershipNFT"
        );

    await membership.waitForDeployment();

    console.log(
        "Contrato desplegado en:",
        await membership.getAddress()
    );

    console.log(
        "Owner:",
        await membership.owner()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});