import { Injectable } from '@angular/core';
import {
  BrowserProvider,
  Contract,
  parseEther
} from 'ethers';

import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS
} from '../abis/MembershipNFTABI';

declare global {
  interface Window {
    ethereum?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {

  provider!: BrowserProvider;
  contract: any;

  async connectWallet(): Promise<string> {

    if (!window.ethereum) {
      throw new Error('MetaMask no instalado');
    }

    this.provider = new BrowserProvider(window.ethereum);
    console.log("Direccion:", CONTRACT_ADDRESS);

const code =
  await this.provider.getCode(
    CONTRACT_ADDRESS
  );

console.log("Codigo:", code);

    await this.provider.send(
      'eth_requestAccounts',
      []
    );

    const signer = await this.provider.getSigner();

    this.contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    return await signer.getAddress();
  }

  async getPlans() {

    const totalPlans =
      await this.contract.nextPlanId();

    const plans = [];

    for (
      let i = 0;
      i < Number(totalPlans);
      i++
    ) {

      const plan =
        await this.contract.plans(i);

      plans.push({
        id: i,
        name: plan.name,
        durationDays:
          Number(plan.durationDays),
        price: plan.price.toString(),
        active: plan.active
      });
    }

    return plans;
  }

  async buyMembership(
    planId: number,
    priceWei: string
  ) {

    const tx =
      await this.contract.buyMembership(
        planId,
        {
          value: priceWei
        }
      );

    await tx.wait();
}
async getMyMemberships() {

  const tokenIds =
    await this.contract.getMyMemberships();

  console.log("Token IDs:", tokenIds);

  const memberships = [];

  for (const tokenId of tokenIds) {

    const membership =
      await this.contract
        .getMembership(tokenId);

    const valid =
      await this.contract
        .isMembershipValid(tokenId);

    memberships.push({
      tokenId: Number(tokenId),
      planId: Number(membership[0]),
      startDate: Number(membership[1]),
      endDate: Number(membership[2]),
      valid
    });
  }

  return memberships;
}
async isOwner() {

  const signer =
    await this.provider.getSigner();

  const currentAddress =
    await signer.getAddress();

  const owner =
    await this.contract.owner();

  return (
    currentAddress.toLowerCase()
    ===
    owner.toLowerCase()
  );
}
async getContractBalance() {

  const balance =
    await this.provider.getBalance(
      CONTRACT_ADDRESS
    );

  return balance;
}
async withdrawFunds() {

  const tx =
    await this.contract.withdraw();

  await tx.wait();
}
async createPlan(
  name: string,
  durationDays: number,
  priceWei: string
) {

  const tx =
    await this.contract.createPlan(
      name,
      durationDays,
      priceWei
    );

  await tx.wait();
}
async cancelMembership(tokenId: number) {

  const tx =
    await this.contract.cancelMembership(
      tokenId
    );

  await tx.wait();
}

async extendMembership(
  tokenId: number,
  days: number
) {

  const tx =
    await this.contract.extendMembership(
      tokenId,
      days
    );

  await tx.wait();
}

async getTotalMemberships() {

  return await this.contract
    .getTotalMemberships();
}

}