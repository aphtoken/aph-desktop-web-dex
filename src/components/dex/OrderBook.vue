<template>
  <section id="dex--order-book">
    <div class="color-mode-btn" @click="toggleNightMode">
      <template v-if="$store.state.styleMode === 'Night'">
        <aph-icon name="sun"></aph-icon>
        {{$t('dayMode')}}
      </template>
      <template v-else>
        <aph-icon name="moon"></aph-icon>
        {{$t('nightMode')}}
      </template>
    </div>
    <aph-spinner-wrapper ws-message-op="subscribe" ws-message-type="bookSnapshot" ws-message-args="orderBook">
      <div class="header">
        <h1 class="underlined">{{$t('orderBook')}}</h1>
      </div>
      <div class="body">
        <div class="book" v-if="$store.state.orderBook && $store.state.currentMarket">
          <div class="order-book-table asks">
            <div class="header">
              <div class="cell">price ({{ $store.state.currentMarket.baseCurrency }})</div>
              <div class="cell">{{$t('size')}}</div>
              <div class="cell">&nbsp;</div>
            </div>
            <div class="body">
              <div class="row" v-for="(ask, index) in $store.state.orderBook.asks" :key="index">
                <div class="cell price red" @click="setPrice(ask.price)">{{ getPrice(ask) }}</div>
                <div class="cell quantity" @click="setQuantity(index, $store.state.orderBook.asks)">{{ getQuantity(ask) }}</div>
                <div class="cell graph">
                  <span class="size-bar size-total red" :style="{ width: (ask.quantityTotalRatio * 100) + '%' }"></span>
                  <span class="size-bar red" :style="{ width: (ask.quantityRatio * 100) + '%' }"></span>
                </div>
              </div>
            </div>
          </div>
          <div class="spread-divider">
            <div class="label">{{$t('spread')}}</div>
            <div class="value">{{ $formatNumber($store.state.orderBook.spread) }}</div>
            <div>&nbsp;</div>
          </div>
          <div class="order-book-table bids">
            <div class="body">
              <div class="row" v-for="(bid, index) in $store.state.orderBook.bids" :key="index">
                <div class="cell price green" @click="setPrice(bid.price)">{{ getPrice(bid) }}</div>
                <div class="cell quantity" @click="setQuantity(index, $store.state.orderBook.bids)">{{ getQuantity(bid) }}</div>
                <div class="cell graph" >
                  <span class="size-bar size-total green" :style="{ width: (bid.quantityTotalRatio * 100) + '%' }"></span>
                  <span class="size-bar green" :style="{ width: (bid.quantityRatio * 100) + '%', 'border-right-width': (bid.quantityTotalRatio * 100) + '%' }"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aph-spinner-wrapper>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';

let loadBookIntervalId;
let storeUnwatch;

export default {
  beforeDestroy() {
    clearInterval(loadBookIntervalId);
    storeUnwatch();

    this.$store.dispatch('unsubscribeFromMarket', {
      market: this.$store.state.currentMarket,
    });
  },

  mounted() {
    this.loadBook();
    loadBookIntervalId = setInterval(() => {
      this.loadBook();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.currentMarket;
      }, () => {
        this.loadBook();
      });
  },

  methods: {
    addDecimalsToNumString(numString, allowedDecimals) {
      let result = numString;
      // count decimals
      const lastDotIndex = numString.lastIndexOf('.');
      if (lastDotIndex === -1) {
        result += '.';
        result += '0'.repeat(allowedDecimals);
      } else {
        const hasDecimals = (result.length - lastDotIndex) - 1;
        const neededDecimals = allowedDecimals - hasDecimals;
        if (neededDecimals >= 0) {
          result += '0'.repeat(neededDecimals);
        }
      }
      return result;
    },

    getAllowedQuantityDecimals() {
      const currentMarket = this.$store.state.currentMarket;
      const minTickSizeFraction = currentMarket.minimumTickSize
        - Math.floor(currentMarket.minimumTickSize);
      if (minTickSizeFraction <= 0.00000001) {
        return 0;
      }
      return Math.log10(minTickSizeFraction * (10 ** 8));
    },

    getPrice(order) {
      const priceNum = this.$formatNumber(order.price);
      const allowedPriceDecimals = 8 - this.getAllowedQuantityDecimals();
      try {
        return this.addDecimalsToNumString(priceNum, allowedPriceDecimals);
      } catch (e) {
        console.log(e);
        throw e;
      }
    },

    getQuantity(order) {
      try {
        return this.addDecimalsToNumString(this.$formatNumber(order.quantity), this.getAllowedQuantityDecimals());
      } catch (e) {
        console.log(e);
        throw e;
      }
    },

    loadBook() {
      if (!this.$store.state.currentMarket) {
        return;
      }

      setTimeout(() => {
        const asksContainer = this.$refs.asks;

        if (asksContainer) {
          asksContainer.scrollTop = asksContainer.scrollHeight;
        }
      }, 500);
    },

    setPrice(price) {
      this.$store.commit('setOrderPrice', price.toString());
    },

    setQuantity(selectedOrderIndex, orders) {
      if (selectedOrderIndex >= 0 && orders && orders.length) {
        this.$store.commit('setOrderQuantity',
          _.reduce(
            _.slice(orders, 0, selectedOrderIndex),
            (sum, order) => sum.plus(new BigNumber(order.quantity)),
            new BigNumber(orders[selectedOrderIndex].quantity)).toString());
      }
    },
    toggleNightMode() {
      this.$services.settings.setStyleMode(this.$store.state.styleMode === 'Night' ? 'Day' : 'Night');
    },
  },
};
</script>

<style lang="scss">
#dex--order-book {


  display: flex;
  flex-direction: column;

  .component-wrapper {
    @extend %tile-light;
  }

  .header {
    flex: none;
    padding: $space $space 0;

    h1.underlined {
      @extend %underlined-header-sm;

      margin-bottom: 0;
    }
  }

  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: $space;

    .book {
      display: flex;
      flex-direction: column;
      flex: 1;

      .header {
        text-align: center;
        white-space: nowrap;
      }

      .spread-divider {
        align-items: center;
        border-bottom: $border-table-header;
        border-top: $border-table-header;
        display: flex;
        flex: none;
        margin: $space-sm 0;
        padding: $space-sm 0;

        > * {
          flex: 1;
        }

        .label {
          @extend %small-uppercase-grey-label;
        }

        .value {
          font-family: GilroyMedium;
        }
      }

      .order-book-table {
        @extend %dex-table-flex;

        flex: 1;

        .cell {
          &.price, &.quantity {
            font-family: FreeMono !important;
            font-size: toRem(14px) !important;
            font-weight: bold;
            letter-spacing: 0px;
            cursor: pointer;
            text-align: right;
          }
          &.price {
            margin-right: toRem(5px);
          }
          &.quantity {
            margin-right: toRem(5px);
          }

          &.graph {
            font-size: 0;
            text-align: right;
            position: relative;

            .size-bar {
              height: toRem(12px);
              display: inline-block;
              position: absolute;
              right: 0px;

              &.green {
                background-color: $green;
              }

              &.red {
                background-color: $red;
              }

              &.size-total {
                &.green {
                  background-color: $light-green;
                }

                &.red {
                  background-color: $light-red;
                }
              }
            }
          }
        }

        &.asks {
          .body {
            flex-direction: column-reverse;

            /* For Firefox only */
            @supports (-moz-appearance:none) {
              flex-direction: column;
              transform: scaleY(-1);
            }

            .row {
              /* For Firefox only */
              @supports (-moz-appearance:none) {
                transform: scaleY(-1);
              }
            }
          }
        }
      }
    }
  }

  .color-mode-btn {
    @include transition(color);

    align-items: center;
    border: none;
    color: $grey;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    font-family: GilroySemibold;
    padding: $space 0;

    .aph-icon {
      margin: 0 $space;

      svg {
        height: toRem(17px);
      }

      .fill {
        fill: $grey;
      }
    }

    &:hover {
      color: $purple;

      .aph-icon {
        .fill {
          fill: $purple !important;
        }
      }
    }
  }
}
</style>


