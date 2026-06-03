import { Injectable } from '@angular/core';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abis/MembershipNFTABI';

declare global {
  interface Window { ethereum?: any; }
}

@Injectable({ providedIn: 'root' })
export class BlockchainService {

  provider!: BrowserProvider;
  contract: any;

  async connectWallet(): Promise<string> {
    if (!window.ethereum) throw new Error('MetaMask no instalado');

    this.provider = new BrowserProvider(window.ethereum);

    const network = await this.provider.getNetwork();
    if (network.chainId !== 11155111n) {
      try {
        await this.provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await this.provider.send('wallet_addEthereumChain', [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]);
        } else { throw switchError; }
      }
      this.provider = new BrowserProvider(window.ethereum);
    }

    await this.provider.send('eth_requestAccounts', []);
    const signer = await this.provider.getSigner();
    this.contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    return await signer.getAddress();
  }

  async getPlans() {
    const totalPlans = await this.contract.nextPlanId();
    const plans = [];
    for (let i = 0; i < Number(totalPlans); i++) {
      const plan = await this.contract.plans(i);
      if (plan.name !== '') {
        plans.push({
          id: i,
          name: plan.name,
          durationDays: Number(plan.durationDays),
          price: plan.price.toString(),
          active: plan.active
        });
      }
    }
    return plans;
  }

  async buyMembership(planId: number, priceWei: string) {
    const tx = await this.contract.buyMembership(planId, { value: priceWei });
    await tx.wait();
  }

  async getMyMemberships() {
    const tokenIds = await this.contract.getMyMemberships();
    const memberships = [];
    for (const tokenId of tokenIds) {
      const membership = await this.contract.getMembership(tokenId);
      const valid = await this.contract.isMembershipValid(tokenId);
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
    const signer = await this.provider.getSigner();
    const currentAddress = await signer.getAddress();
    const owner = await this.contract.owner();
    return currentAddress.toLowerCase() === owner.toLowerCase();
  }

  async getContractBalance() {
    return await this.provider.getBalance(CONTRACT_ADDRESS);
  }

  async withdrawFunds() {
    const tx = await this.contract.withdraw();
    await tx.wait();
  }

  async createPlan(name: string, durationDays: number, priceWei: string) {
    const tx = await this.contract.createPlan(name, durationDays, priceWei);
    await tx.wait();
  }

  async editPlan(planId: number, name: string, durationDays: number, priceWei: string) {
    const tx = await this.contract.editPlan(planId, name, durationDays, priceWei);
    await tx.wait();
  }

  async deletePlan(planId: number) {
    const tx = await this.contract.deletePlan(planId);
    await tx.wait();
  }

  async cancelMembership(tokenId: number) {
    const tx = await this.contract.cancelMembership(tokenId);
    await tx.wait();
  }

  async extendMembership(tokenId: number, days: number) {
    const tx = await this.contract.extendMembership(tokenId, days);
    await tx.wait();
  }

  async getTotalMemberships() {
    return await this.contract.getTotalMemberships();
  }
}