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

  // Búsqueda por wallet (admin)
  searchWallet = '';
  searchResults: any[] = [];
  searchDone = false;

  hasActiveMembership = false;

  // Animación de compra
  showSuccessAnimation = false;

  // QR
  qrTokenId: number | null = null;
  qrDataUrl = '';

  constructor(private blockchainService: BlockchainService) {}

  ngOnInit() { document.body.classList.add('home-view'); }

  weiToEth(wei: string): string {
    try { return parseFloat(formatEther(BigInt(wei))).toFixed(6); }
    catch { return '0'; }
  }

  planPriceEth(priceWei: string): string { return this.weiToEth(priceWei); }

  // Devuelve el nombre del plan dado su ID
  getPlanName(planId: number): string {
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.name : `Plan #${planId}`;
  }

  async connectWallet() {
    try {
      this.walletAddress = await this.blockchainService.connectWallet();
      this.plans = await this.blockchainService.getPlans();
      this.memberships = await this.blockchainService.getMyMemberships();
      this.hasActiveMembership = await this.blockchainService.hasActiveMembership(this.walletAddress);
      this.isAdmin = await this.blockchainService.isOwner();
      const balance = await this.blockchainService.getContractBalance();
      this.contractBalance = this.weiToEth(balance.toString());
    } catch (error) { console.error(error); }
  }

  async buyPlan(plan: any) {
    if (this.hasActiveMembership) {
      alert('Ya tienes una membresía activa. Espera a que expire o cancélala para comprar otra.');
      return;
    }
    try {
      await this.blockchainService.buyMembership(plan.id, plan.price);
      this.memberships = await this.blockchainService.getMyMemberships();
      this.hasActiveMembership = await this.blockchainService.hasActiveMembership(this.walletAddress);
      const balance = await this.blockchainService.getContractBalance();
      this.contractBalance = this.weiToEth(balance.toString());
      this.triggerSuccessAnimation();
    } catch (error) { console.error(error); }
  }

  // Renovar membresía — el cliente paga el precio del plan original
  async renewMembership(membership: any) {
    try {
      const plan = this.plans.find(p => p.id === membership.planId);
      if (!plan) { alert('Plan no encontrado'); return; }
      await this.blockchainService.renewMembership(membership.tokenId, plan.price);
      this.memberships = await this.blockchainService.getMyMemberships();
      this.triggerSuccessAnimation();
    } catch (error) { console.error(error); }
  }

  // Animación de éxito al comprar o renovar
  triggerSuccessAnimation() {
    this.showSuccessAnimation = true;
    setTimeout(() => { this.showSuccessAnimation = false; }, 3000);
  }

  // Generar QR del NFT usando API pública
  async generateQR(tokenId: number) {
    this.qrTokenId = tokenId;
    const text = `ChainPass NFT #${tokenId} | Contrato: ${(await this.blockchainService.getContractBalance(), '0xBC9Eec04DdE2d7fde30f2dd961b41ad1bC138227')}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    this.qrDataUrl = url;
  }

  closeQR() { this.qrTokenId = null; this.qrDataUrl = ''; }

  searchError = '';

  // Buscar membresías por wallet (admin)
  async searchByWallet() {
    if (!this.searchWallet) return;
    this.searchResults = [];
    this.searchDone = false;
    this.searchError = '';
    try {
      const total = await this.blockchainService.getTotalMemberships();
      for (let i = 0; i < Number(total); i++) {
        try {
          const owner = await this.blockchainService.getMembershipOwner(i);
          if (owner.toLowerCase() === this.searchWallet.toLowerCase()) {
            const membership = await this.blockchainService.contract.getMembership(i);
            const valid = await this.blockchainService.contract.isMembershipValid(i);
            this.searchResults.push({
              tokenId: i,
              planId: Number(membership[0]),
              startDate: Number(membership[1]),
              endDate: Number(membership[2]),
              valid,
              owner
            });
          }
        } catch { /* token eliminado o inaccesible, se omite */ }
      }
    } catch (error) {
      console.error(error);
      this.searchError = 'Error al consultar el contrato. Verifica la conexión.';
    }
    this.searchDone = true;
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
      this.newPlanName = ''; this.newPlanDuration = 30; this.newPlanPrice = '';
      alert('Plan creado correctamente');
    } catch (error) { console.error(error); }
  }

  startEditPlan(plan: any) {
    this.editingPlan = plan;
    this.editPlanName = plan.name;
    this.editPlanDuration = plan.durationDays;
    this.editPlanPrice = this.weiToEth(plan.price);
  }

  cancelEditPlan() { this.editingPlan = null; }

  async saveEditPlan() {
    try {
      const priceInWei = parseEther(this.editPlanPrice).toString();
      await this.blockchainService.editPlan(this.editingPlan.id, this.editPlanName, this.editPlanDuration, priceInWei);
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

  showClient() { this.currentView = 'client'; document.body.classList.remove('home-view'); }

  goHome() { this.currentView = ''; document.body.classList.add('home-view'); }
  showAdmin() { this.currentView = 'admin'; this.adminError = ''; document.body.classList.remove('home-view'); }

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
        const owner = await this.blockchainService.getMembershipOwner(i);
        this.allMemberships.push({
          tokenId: i,
          planId: Number(membership[0]),
          startDate: Number(membership[1]),
          endDate: Number(membership[2]),
          valid,
          owner
        });
      }
    } catch (error) { console.error(error); }
  }

  async cancelMembership(tokenId: number) {
    try {
      await this.blockchainService.cancelMembership(tokenId);
      await this.loadAllMemberships();
      if (this.walletAddress) {
        this.hasActiveMembership = await this.blockchainService.hasActiveMembership(this.walletAddress);
      }
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