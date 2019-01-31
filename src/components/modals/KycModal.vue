<template>
  <div>
    <modal-wrapper id="aph-kyc-modal">
    <!-- <div class="aph-kyc-modal" id="aph-kyc-modal"> -->
      <div class="header">{{ getHeader() }}</div>
      <div id="frame-content" v-if="kycStatus === 'kycneeded'">
        <!-- NOTE: instead of using sandbox, we could probably use the router to handle redirects -->
        <iframe class="kyc-iframe" :src="getKycUrl()" sandbox="allow-forms allow-scripts allow-same-origin"></iframe>
      </div>
      <div class="body" v-if="kycStatus !== 'kycneeded'" >
        <div v-if="kycStatus.startsWith('accepted')">
          <p>Your KYC Application was accepted. Please wait while your application
            is processed and your account has been whitelisted.</p>
          <p>To check again just dismiss this dialog and attempt a deposit again.</p>
        </div>
        <div v-if="kycStatus.startsWith('manualReview')">
          <p>Your KYC Application was received as of {{ reviewTime }}, but requires manual review,
            which may take up to a few days.</p>
          <p>To check again just dismiss this dialog and attempt a deposit again.</p>
        </div>
        <div v-if="kycStatus.startsWith('denied')">
          <p>Unfortunately your KYC Application was denied.</p>
          <p>You must wait an additional {{ deniedRemainingMinutes }} minutes in order to try again.</p>
        </div>
        <div v-if="kycStatus.startsWith('disabled')">
          <p>We are temporarily not accepting KYC applications.</p>
          <p>This issue should be remedied in the near future. Please be patient and try again later. </p>
        </div>
      </div>

    <button class="dismiss-btn" @click="close">Dismiss</button>
    <!-- </div> -->
    </modal-wrapper>
    <aph-confirm-dismiss-kyc-modal v-if="$store.state.confirmDismissKyc"
                                   :onContinue="handleContinue" :onDismiss="handleDismiss"/>
  </div>
</template>

<script>
  import ModalWrapper from './ModalWrapper';
  import AphConfirmDismissKycModal from './ConfirmDismissKycModal';

  let watchInterval;

  // TODO: fix TestNet
  const hostAndNetworkToKycUrl = {
    'dex.aphelion.org': {
      TestNet: 'https://regtech.identitymind.store/viewform/54sde/',
      MainNet: 'https://regtech.identitymind.store/viewform/mskuh/' },
  };


  export default {
    components: {
      ModalWrapper,
      AphConfirmDismissKycModal,
    },
    data() {
      return {
        address: '',
        title: 'Loading',
        kycStatus: 'unknown',
        reviewTime: '',
        deniedWaitingMinutes: '',
        deniedRemainingMinutes: '',
        userId: '',
      };
    },

    async mounted() {
      // For testing:
      // this.$store.state.kycInProgressModalModel.kycStatus = 'disabled';
      // this.$store.state.kycInProgressModalModel.kycStatus = 'denied|100000|0';
      // this.$store.state.kycInProgressModalModel.kycStatus = 'denied|100000|100000';
      // this.$store.state.kycInProgressModalModel.kycStatus = 'manualReview|5oclock';
      // this.$store.state.kycInProgressModalModel.kycStatus = 'accepted|25352352352352';

      const services = this.$services;
      const store = this.$store;
      this.address = store.state.kycInProgressModalModel.address;
      this.userId = await services.dex.getKycUserId(this.address);

      this.handleKycStatus(store.state.kycInProgressModalModel.kycStatus);
      if (this.kycStatus === 'kycneeded') {
        const services = this.$services;
        let waitingOnStatus = false;
        watchInterval = setInterval(async () => {
          if (!waitingOnStatus) {
            waitingOnStatus = true;
            try {
              this.handleKycStatus(await services.dex.getKycStatus(this.address));
              console.log(`got status ${this.kycStatus}`);
              if (this.kycStatus !== 'kycneeded') {
                clearInterval(watchInterval);
              }
            } catch (e) {
              // couldn't get KycStatus, we'll just try again
              services.alerts.error(`Error retrieving KYC status. ${e}`);
            } finally {
              waitingOnStatus = false;
            }
          }
        }, 5000);
      }
    },
    methods: {
      getKycUrl() {
        console.log(JSON.stringify(window.location.hostname));
        const windowHostname = window.location.hostname;
        const networksForHost = hostAndNetworkToKycUrl[windowHostname];
        let kycUrl;
        if (networksForHost) {
          kycUrl = networksForHost[this.$store.state.currentNetwork.net];
        }
        if (!kycUrl) kycUrl = this.$store.state.currentNetwork.kycUrl;

        return `${kycUrl}?user_id=${this.userId}`;
      },
      handleContinue() {
      },
      handleDismiss() {
        this.$store.commit('setKycInProgressModalModel', null);
      },
      handleKycStatus(kycStatus) {
        console.log(`kycStatus: ${kycStatus}`);
        let updatedStatus = kycStatus;
        const modal = document.getElementById('aph-kyc-modal');
        if (modal == null) return;
        const content = modal.getElementsByClassName('content')[0];
        if (content == null) return;

        if (kycStatus.startsWith('accepted')) {
          content.style.height = '300px'; // `${Math.floor(340 / 14)}rem`;
          this.title = 'KYC Accepted (whitelisting in progress...)';
          // const txHash = kycStatus.split('|')[1];
          // could monitor for transaction complete and auto-dismiss...
        } else if (kycStatus.startsWith('manualReview')) {
          this.title = 'KYC Pending Manual Review';
          this.reviewTime = kycStatus.split('|')[1];
          content.style.height = '300px'; // `${Math.floor(340 / 14)}rem`;
        } else if (kycStatus.startsWith('denied')) {
          this.title = 'KYC Application Denied';
          const statusTokens = kycStatus.split('|');
          const timeRemaining = statusTokens[2];
          if (timeRemaining > 0) {
            this.deniedRemainingMinutes = (Math.floor(timeRemaining / 60 / 10) / 100).toString();
            const timeWaiting = statusTokens[1];
            this.deniedWaitingMinutes = (Math.floor(timeWaiting / 60 / 10) / 100).toString();
            content.style.height = '260px';
          } else {
            updatedStatus = 'kycneeded';
            console.log(`set status to kyc status to ${this.kycStatus}`);
          }
        } else if (kycStatus.startsWith('disabled')) {
          content.style.height = '300px';
          this.title = 'KYC Temporarily Disabled';
        }

        if (this.kycStatus === 'kycneeded') {
          this.title = 'Proof of Non-US Resident';
          //   content.style.height = '100%';
          // } else {
          //   content.style.height = 'initial';
        }
        this.kycStatus = updatedStatus;
      },

      getHeader() {
        return this.title;
      },
      close() {
        if (this.kycStatus === 'kycneeded') {
          this.$store.commit('setConfirmDismissKyc', true);
          return;
        }
        this.$store.commit('setKycInProgressModalModel', null);
      },
    },
  };
</script>

<style lang="scss">
  #aph-kyc-modal {

    .content {
      width: toRem(900px);
      height: toRem(760px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-content: center;

      .header {
        flex: 1;
        font-family: GilroySemiBold;
        font-size: toRem(30px);
        padding: $space-lg $space-lg 0;
        text-align: center;
      }

      #frame-content {
        flex: auto;
        width: 100%;
      }

      .kyc-iframe {
        flex: 4;
        overflow: auto;
        height: toRem(600px);
        border: none;
        width: 100%;
      }
      .body {
        flex: 3;
        padding: $space $space-lg $space-lg;

        p {
          font-family: GilroySemiBold;
          font-size: toRem(20px);
          text-align: center;
        }
      }
      .dismiss-btn {
        @extend %btn-footer-light;
        border-bottom-left-radius: $border-radius;
        border-bottom-right-radius: $border-radius;
      }
    }
  }
</style>
