<template>
  <section id="dex">
    <div class="grid" v-if="connected">
      <div class="grid--column column-left">
        <div class="grid--cell left-top">
          <router-view name="left-top"></router-view>
        </div>
        <div v-if="isLoggedIn" class="grid--cell left-bottom">
          <router-view name="left-bottom"></router-view>
        </div>
        <div v-else class="grid--cell left-bottom">
          <div>
            <div @click="handleLoginToTradeClicked" class="login-to-trade-btn">{{ $t('loginToTrade') }}</div>
          </div>
        </div>
      </div>
      <div class="grid--column column-middle">
        <div class="grid--cell middle-top">
          <router-view name="middle-top"></router-view>
        </div>
        <div v-if="isLoggedIn" class="grid--cell middle-bottom">
          <router-view name="middle-bottom"></router-view>
        </div>
      </div>
      <div class="grid--column column-right">
        <div class="grid--cell right-top">
          <router-view name="right-top"></router-view>
        </div>
        <div class="grid--cell right-bottom">
          <router-view name="right-bottom"></router-view>
        </div>
      </div>
    </div>
    <div v-else class="zero-state">
      <aph-icon name="no-transactions"></aph-icon>
      <div class="label">{{$t('unableToReachTradingServer')}}</div>
    </div>
    <dex-demo-confirmation v-if="shouldShowDemoConfirmation"></dex-demo-confirmation>
    <dex-out-of-date v-if="shouldShowOutOfDate"></dex-out-of-date>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
import { defaultSettings } from '../constants';
import DexDemoConfirmation from './modals/DexDemoConfirmation';
import DexOutOfDate from './modals/DexOutOfDate';
import assets from '../services/assets';
import router from '../router';
import storage from '../services/storage';

export default {
  beforeDestroy() {
    this.$store.commit('setShowPortfolioHeader', true);
    clearInterval(this.connectionStatusInterval);
    clearInterval(this.marketsRefreshInterval);
    clearInterval(this.completeSystemAssetWithdrawalsInterval);
    clearInterval(this.tickerRefreshInterval);
  },

  components: {
    DexDemoConfirmation,
    DexOutOfDate,
  },

  computed: {
    isLoggedIn() {
      return !!this.$store.state.currentWallet;
    },

    isOutOfDate() {
      if (!this.$store.state.latestVersion) {
        return true;
      }
      const currentNetworkLatestDexScriptHash = this.$store.state.currentNetwork.net === 'MainNet' ?
        this.$store.state.latestVersion.prodExchangeScriptHash : this.$store.state.latestVersion.testExchangeScriptHash;
      return currentNetworkLatestDexScriptHash.replace('0x', '') !== this.$store.state.currentNetwork.dex_hash;
    },

    shouldShowDemoConfirmation() {
      return (!this.acceptDexDemoVersion && !this.isOutOfDate) || this.showLearnMore;
    },

    shouldShowOutOfDate() {
      return this.isOutOfDate && !this.$store.state.acceptDexOutOfDate && this.isLoggedIn;
    },

    ...mapGetters([
      'showLearnMore',
      'acceptDexDemoVersion',
    ]),
  },

  created() {
    if (this.isLoggedIn) {
      this.handleCreatedIfLoggedIn();
    } else {
      this.handleCreatedIfPreviewing();
    }
  },

  data() {
    return {
      connected: false,
    };
  },

  methods: {
    handleCreatedIfLoggedIn() {
      this.setConnected();
      this.connectionStatusInterval = setInterval(() => {
        this.setConnected();
      }, 1000);
      this.marketsRefreshInterval = setInterval(() => {
        this.loadMarkets();
      }, this.$constants.intervals.MARKETS_POLLING);
      this.completeSystemAssetWithdrawalsInterval = setInterval(() => {
        this.$services.dex.completeSystemAssetWithdrawals();
      }, this.$constants.intervals.COMPLETE_SYSTEM_WITHDRAWALS);
      this.tickerRefreshInterval = setInterval(() => {
        this.loadTickerData();
      }, this.$constants.intervals.TICKER_POLLING);
    },

    handleCreatedIfPreviewing() {
      this.setConnected();
      this.connectionStatusInterval = setInterval(() => {
        this.setConnected();
      }, 1000);
      this.marketsRefreshInterval = setInterval(() => {
        this.loadMarkets();
      }, this.$constants.intervals.MARKETS_POLLING);
      this.tickerRefreshInterval = setInterval(() => {
        this.loadTickerData();
      }, this.$constants.intervals.TICKER_POLLING);
    },

    handleLoginToTradeClicked() {
      router.replace(defaultSettings.LOGIN_ROUTE);
    },

    handleMountedIfLoggedIn() {
      this.$store.commit('setShowPortfolioHeader', false);
      this.loadMarkets();
      this.loadTickerData();

      this.$services.dex.completeSystemAssetWithdrawals();

      this.$store.commit('setSocketOrderCreated', (message) => {
        /* eslint-disable max-len */
        this.$services.alerts.success(`${(message.side === 'bid' ? 'Buy' : 'Sell')} Order Created. x${message.data.quantity} @${message.data.price}`);
        this.$store.dispatch('fetchHoldings');
      });

      const services = this.$services;
      const store = this.$store;
      store.commit('setSocketOrderMatched', (message) => {
        /* eslint-disable max-len */
        services.alerts.success(`${(message.side === 'bid' ? 'Buy' : 'Sell')} Order Filled. x${message.data.quantity} @${message.data.price}`);
        // If the asset purchased is not a user asset, we must add it as one.
        // Note: Since this runs from a mutation it is safe to add it directly)

        const market = _.find(store.state.markets, { marketName: message.pair });

        const userAssets = assets.getUserAssets();
        let addedToken = false;
        if (!_.has(userAssets, market.baseAssetId)) {
          store.dispatch('addToken', {
            hashOrSymbol: market.baseAssetId,
          });
          addedToken = true;
        }
        if (!_.has(userAssets, market.quoteAssetId)) {
          store.dispatch('addToken', {
            hashOrSymbol: market.quoteAssetId,
          });
          addedToken = true;
        }

        if (!addedToken) {
          this.$store.dispatch('fetchHoldings');
        }
      });

      store.commit('setSocketOrderCreationFailed', (message) => {
        services.alerts.error(`Failed to Create ${(message.side === 'bid' ? 'Buy' : 'Sell')} Order. ${message.data.errorMessage}`);
      });

      store.commit('setSocketOrderMatchFailed', (message) => {
        services.alerts.error(`Failed to Match ${(message.side === 'bid' ? 'Buy' : 'Sell')} x${message.data.quantity}. ${message.data.errorMessage}`);
      });

      services.neo.promptGASFractureIfNecessary();

      this.setInfoAcceptedFromStorage();
    },

    handleMountedIfPreviewing() {
      this.$store.commit('setShowPortfolioHeader', false);
      this.loadMarkets(this.loadMarketValuations);
      this.loadTickerData();
      this.setInfoAcceptedFromStorage();
    },

    loadMarkets(done = _.noop) {
      this.$store.dispatch('fetchMarkets', {
        done: (markets) => {
          if (!this.$store.state.currentMarket) {
            const marketData = this.$services.dex.getMarketDataFromName(this.$route.params.market);
            if (!marketData) {
              this.$router.push(this.$constants.defaultSettings.LANDING_ROUTE);
              return;
            }

            // TODO: this should be better handled using an interval and cancelling once complete
            if (!this.$store.state.socket.client || !this.$store.state.socket.isConnected) {
              setTimeout(() => {
                this.$store.commit('setCurrentMarket', marketData);
              }, 200);
              return;
            }

            this.$store.commit('setCurrentMarket', marketData);
          }

          done(markets);
        },
      });
    },

    loadMarketValuations(markets) {
      this.$store.dispatch('fetchValuations', {
        done: (valuations) => {
          this.$store.commit('appendValuationsToMarktsForPrevewing', valuations);
        },
        symbols: _.uniq(_.merge(_.map(markets, 'quoteCurrency'), _.map(markets, 'baseCurrency'))),
      });
    },

    loadTickerData() {
      this.$services.dex.fetchTickerData()
        .then((tickerData) => {
          this.$store.commit('setTickerDataByMarket', tickerData);
        });
    },

    setConnected() {
      if (!this.$store.state.socket || this.$store.state.socket.isConnected !== true) {
        if (moment().utc().diff(this.$store.state.socket.connectionClosed, 'milliseconds')
          > this.$constants.timeouts.WEBSOCKET_CONNECTION) {
          this.connected = false;
          return;
        }
      }

      if (this.$store.state.currentMarket) {
        if (!this.$store.state.socket.subscribedMarket
          || this.$store.state.socket.subscribedMarket !== this.$store.state.currentMarket.marketName) {
          this.$store.dispatch('subscribeToMarket', {
            market: this.$store.state.currentMarket,
          });
        }
      }

      this.connected = true;
    },

    setInfoAcceptedFromStorage() {
      if (storage.get('dexInfoAccepted') === true) {
        this.$store.commit('setAcceptDexDemoVersion', true);
      }
    },
  },

  mounted() {
    if (this.isLoggedIn) {
      this.handleMountedIfLoggedIn();
    } else {
      this.handleMountedIfPreviewing();
    }
  },

  beforeRouteUpdate(to, from, next) {
    const marketData = this.$services.dex.getMarketDataFromName(to.params.market);
    if (!marketData) {
      this.$router.push(this.$constants.defaultSettings.LANDING_ROUTE);
      return;
    }
    this.$store.commit('setCurrentMarket', marketData);
    next();
  },
};
</script>

<style lang="scss">
#dex {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: 1;
  justify-content: center;
  width: 100%;

  .grid {
    display: flex;
    flex-direction: row;
    flex: 1;
    height: 100%;
    padding: $space;
    width: 100%;
  }

  .grid--column {
    display: flex;
    flex-direction: column;

    &.column-left {
      flex: 1;
    }

    &.column-middle {
      flex: 3;
    }

    &.column-right {
      flex: 1;
    }

    .grid--cell {
      flex-direction: row;
      flex: 1;
      display: flex;
      flex-direction: column;

      > * {
        flex: 1;
      }

      &.right-top {
        flex: 2;
        margin-top: 0 !important;
      }

      &.right-bottom {
        flex: 1;
      }

      &.left-top {
        flex: none;
      }

      &.left-bottom {
        flex: 1;
      }

      &.middle-bottom {
        flex: 1;
      }

      &.middle-top {
        flex: 2;
      }

      & + .grid--cell {
        margin-top: $space;
      }
    }

    & + .grid--column {
      margin-left: $space;
    }
  }

  > .zero-state {
    @extend %tile-light;

    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    width: 100%;

    .aph-icon {
      svg {
        height: toRem(52px);

        .fill {
          fill: $purple;
        }
      }
    }

    .label {
      color: $purple;
      font-weight: GilroyMedium;
      margin-top: $space-lg;
    }
  }

  .login-to-trade-btn {
    @extend %btn;

    flex: none !important;
  }
}
</style>
