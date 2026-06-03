import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlockchainService } from './services/blockchain.service';
import { parseEther, formatEther } from 'ethers';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  walletAddress = '';
  plans: any[] = [];
  memberships: any[] = [];
  allMemberships: any[] = [];
  extendDays = 30;
  isAdmin = false;
  contractBalance = '0';
  newPlanName = '';
  newPlanDuration = 30;
  newPlanPrice = '';
  currentView = '';
  adminLogged = false;
  adminError = '';

  // Edición de planes
  editingPlan: any = null;
  editPlanName = '';
  editPlanDuration = 30;
  editPlanPrice = '';

  constructor(private blockchainService: BlockchainService) {}

  weiToEth(wei: string): string {
    try { return parseFloat(formatEther(BigInt(wei))).toFixed(6); }
    catch { return '0'; }
  }

  planPriceEth(priceWei: string): string {
    return this.weiToEth(priceWei);
  }

  async connectWallet() {
    try {
      this.walletAddress = await this.blockchainService.connectWallet();
      this.plans = await this.blockchainService.getPlans();
      this.memberships = await this.blockchainService.getMyMemberships();
      this.isAdmin = await this.blockchainService.isOwner();
      const balance = await this.blockchainService.getContractBalance();
      this.contractBalance = this.weiToEth(balance.toString());
    } catch (error) { console.error(error); }
  }

  async buyPlan(plan: any) {
    try {
      await this.blockchainService.buyMembership(plan.id, plan.price);
      this.memberships = await this.blockchainService.getMyMemberships();
      const balance = await this.blockchainService.getContractBalance();
      this.contractBalance = this.weiToEth(balance.toString());
      alert('Membresía comprada correctamente');
    } catch (error) { console.error(error); }
  }

  async withdrawFunds() {
    try {
      await this.blockchainService.withdrawFunds();
      const balance = await this.blockchainService.getContractBalance();
      this.contractBalance = this.weiToEth(balance.toString());
      alert('Fondos retirados correctamente');
    } catch (error) { console.error(error); }
  }

  async createPlan() {
    if (!this.blockchainService.contract) { alert('Primero conecta MetaMask'); return; }
    try {
      const priceInWei = parseEther(this.newPlanPrice).toString();
      await this.blockchainService.createPlan(this.newPlanName, this.newPlanDuration, priceInWei);
      this.plans = await this.blockchainService.getPlans();
      this.newPlanName = '';
      this.newPlanDuration = 30;
      this.newPlanPrice = '';
      alert('Plan creado correctamente');
    } catch (error) { console.error(error); }
  }

  // Abre el formulario de edición con los datos actuales del plan
  startEditPlan(plan: any) {
    this.editingPlan = plan;
    this.editPlanName = plan.name;
    this.editPlanDuration = plan.durationDays;
    this.editPlanPrice = this.weiToEth(plan.price);
  }

  cancelEditPlan() {
    this.editingPlan = null;
  }

  async saveEditPlan() {
    try {
      const priceInWei = parseEther(this.editPlanPrice).toString();
      await this.blockchainService.editPlan(
        this.editingPlan.id,
        this.editPlanName,
        this.editPlanDuration,
        priceInWei
      );
      this.plans = await this.blockchainService.getPlans();
      this.editingPlan = null;
      alert('Plan actualizado correctamente');
    } catch (error) { console.error(error); }
  }

  async deletePlan(planId: number) {
    if (!confirm('¿Estás segura de que quieres eliminar este plan?')) return;
    try {
      await this.blockchainService.deletePlan(planId);
      this.plans = await this.blockchainService.getPlans();
      alert('Plan eliminado');
    } catch (error) { console.error(error); }
  }

  showClient() { this.currentView = 'client'; }
  showAdmin() { this.currentView = 'admin'; this.adminError = ''; }

  async loginAdmin() {
    try {
      this.adminError = '';
      this.walletAddress = await this.blockchainService.connectWallet();
      this.isAdmin = await this.blockchainService.isOwner();
      if (!this.isAdmin) { this.adminError = 'Esta wallet no es la propietaria del contrato.'; return; }
      this.plans = await this.blockchainService.getPlans();
      const balance = await this.blockchainService.getContractBalance();
      this.contractBalance = this.weiToEth(balance.toString());
      this.adminLogged = true;
      await this.loadAllMemberships();
    } catch (error) { console.error(error); this.adminError = 'Error al conectar MetaMask. Intenta de nuevo.'; }
  }

  async loadAllMemberships() {
    try {
      const total = await this.blockchainService.getTotalMemberships();
      this.allMemberships = [];
      for (let i = 0; i < Number(total); i++) {
        const membership = await this.blockchainService.contract.getMembership(i);
        const valid = await this.blockchainService.contract.isMembershipValid(i);
        this.allMemberships.push({
          tokenId: i,
          planId: Number(membership[0]),
          startDate: Number(membership[1]),
          endDate: Number(membership[2]),
          valid
        });
      }
    } catch (error) { console.error(error); }
  }

  async cancelMembership(tokenId: number) {
    try {
      await this.blockchainService.cancelMembership(tokenId);
      await this.loadAllMemberships();
      alert('Membresía cancelada');
    } catch (error) { console.error(error); }
  }

  async extendMembership(tokenId: number) {
    try {
      await this.blockchainService.extendMembership(tokenId, this.extendDays);
      await this.loadAllMemberships();
      alert('Membresía extendida');
    } catch (error) { console.error(error); }
  }
}