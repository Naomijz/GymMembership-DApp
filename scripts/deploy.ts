import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {

    const signers =
        await ethers.getSigners();

    console.log(
        "Desplegando con cuenta:",
        await signers[0].getAddress()
    );

    const membership =
        await ethers.deployContract(
            "MembershipNFT"
        );

    await membership.waitForDeployment();

    const address =
        await membership.getAddress();

    console.log(
        "Contrato desplegado en:",
        address
    );

    console.log(
        "Owner:",
        await membership.owner()
    );

    console.log(
        "\n✅ Copia esta dirección en MembershipNFTABI.ts:",
        address
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});