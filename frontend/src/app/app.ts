import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlockchainService } from './services/blockchain.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule
  ],
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

adminUser = '';
adminPassword = '';

adminLogged = false;

  constructor(
    private blockchainService: BlockchainService
  ) {}

  async connectWallet() {

    try {

      this.walletAddress =
        await this.blockchainService.connectWallet();

      this.plans =
        await this.blockchainService.getPlans();

      this.memberships =
        await this.blockchainService.getMyMemberships();

      this.isAdmin =
        await this.blockchainService.isOwner();
        console.log("Es admin:", this.isAdmin);

      const balance =
        await this.blockchainService.getContractBalance();

      this.contractBalance =
        balance.toString();

    } catch (error) {

      console.error(error);

    }
  }

  async buyPlan(plan: any) {

    try {

      await this.blockchainService.buyMembership(
        plan.id,
        plan.price
      );

      this.memberships =
        await this.blockchainService.getMyMemberships();

      const balance =
        await this.blockchainService.getContractBalance();

      this.contractBalance =
        balance.toString();

      alert(
        'Membresía comprada correctamente'
      );

    } catch (error) {

      console.error(error);

    }
  }

  async withdrawFunds() {

    try {

      await this.blockchainService.withdrawFunds();

      const balance =
        await this.blockchainService.getContractBalance();

      this.contractBalance =
        balance.toString();

      alert(
        'Fondos retirados correctamente'
      );

    } catch (error) {

      console.error(error);

    }
  }

  async createPlan() {

  if (!this.blockchainService.contract) {

    alert(
      'Primero conecta MetaMask'
    );

    return;
  }

  try {

    await this.blockchainService.createPlan(
      this.newPlanName,
      this.newPlanDuration,
      this.newPlanPrice
    );

    this.plans =
      await this.blockchainService.getPlans();

    this.newPlanName = '';
    this.newPlanDuration = 30;
    this.newPlanPrice = '';

    alert(
      'Plan creado correctamente'
    );

  } catch(error) {

    console.error(error);

  }

}
  showClient() {

  this.currentView = 'client';

}

showAdmin() {

  this.currentView = 'admin';

}

loginAdmin() {

  if (
    this.adminUser === 'admin' &&
    this.adminPassword === 'admin123'
  ) {

    this.adminLogged = true;
    await this.loadAllMemberships();

    alert(
      'Bienvenido Administrador'
    );

  } else {

    alert(
      'Usuario o contraseña incorrectos'
    );

  }

}
async loadAllMemberships() {

  try {

    const total =
      await this.blockchainService
        .getTotalMemberships();

    this.allMemberships = [];

    for (
      let i = 0;
      i < Number(total);
      i++
    ) {

      const membership =
        await this.blockchainService
          .contract
          .getMembership(i);

      const valid =
        await this.blockchainService
          .contract
          .isMembershipValid(i);

      this.allMemberships.push({
        tokenId: i,
        planId: Number(membership[0]),
        startDate: Number(membership[1]),
        endDate: Number(membership[2]),
        valid
      });

    }

  } catch(error) {

    console.error(error);

  }
}

async cancelMembership(
  tokenId: number
) {

  try {

    await this.blockchainService
      .cancelMembership(tokenId);

    await this.loadAllMemberships();

    alert(
      'Membresía cancelada'
    );

  } catch(error) {

    console.error(error);

  }
}

async extendMembership(
  tokenId: number
) {

  try {

    await this.blockchainService
      .extendMembership(
        tokenId,
        this.extendDays
      );

    await this.loadAllMemberships();

    alert(
      'Membresía extendida'
    );

  } catch(error) {

    console.error(error);

  }
}

}
