/* eslint-disable no-use-before-define */
import Vue from 'vue';
import moment from 'moment';

import { requests } from '../constants';
import { alerts, neo, dex, settings, storage } from '../services';

export {
  addToOrderHistory,
  appendValuationsToMarktsForPrevewing,
  clearActiveTransaction,
  clearRecentTransactions,
  clearSearchTransactions,
  endRequest,
  failRequest,
  handleLogout,
  handleNetworkChange,
  orderBookSnapshotReceived,
  orderBookUpdateReceived,
  putBlockDetails,
  putTransactionDetail,
  resetRequests,
  setAcceptCommitInfo,
  setAcceptDexDemoVersion,
  setAcceptDexOutOfDate,
  setActiveTransaction,
  setClaimModalModel,
  setCommitChangeInProgress,
  setCommitModalModel,
  setCommitState,
  setConfirmDismissKyc,
  setContacts,
  setCurrency,
  setCurrencySymbol,
  setCurrentMarket,
  setCurrentNetwork,
  setCurrentWallet,
  setDepositWithdrawModalModel,
  setDexChartState,
  setFractureGasModalModel,
  setGasClaim,
  setGasFracture,
  setHoldings,
  setKycInProgressModalModel,
  setLastReceivedBlock,
  setLastSuccessfulRequest,
  setLatestVersion,
  setLoginRef,
  setMarkets,
  setMenuCollapsed,
  setMenuToggleable,
  setOrderHistory,
  setOrderPrice,
  setOrderQuantity,
  setOrderToConfirm,
  setOrdersToShow,
  setPortfolio,
  setRecentTransactions,
  setSearchTransactionFromDate,
  setSearchTransactionToDate,
  setSearchTransactions,
  setSendInProgress,
  setSendModel,
  setShowAddContactModal,
  setShowAddTokenModal,
  setShowClaimGasModal,
  setShowEditContactModal,
  setShowImportAWalletModal,
  setShowLearnMore,
  setShowLoginToWalletModal,
  setShowPortfolioHeader,
  setShowSendAddressModal,
  setShowSendRequestLedgerSignature,
  setShowSendWithLedgerModal,
  setShowWalletBackupModal,
  setSocketOrderCreated,
  setSocketOrderCreationFailed,
  setSocketOrderMatchFailed,
  setSocketOrderMatched,
  setStatsToken,
  setStyleMode,
  setSystemWithdraw,
  setSystemWithdrawMergeState,
  setTickerDataByMarket,
  setTradeHistory,
  setTradesBucketed,
  setWallets,
  setWithdrawInProgressModalModel,
  startRequest,
  startSilentRequest,
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR,
};

// local constants
const TRADE_MSG_LENGTH = 3;

function clearActiveTransaction(state) {
  state.showPriceTile = true;
}

function clearLocalNetworkState(state) {
  state.holdings = [];
  state.statsToken = null;
  state.portfolio = {};
  state.recentTransactions = [];
}

function clearRecentTransactions(state) {
  state.recentTransactions = [];
}

function clearSearchTransactions(state) {
  state.searchTransactions = [];
}

function endRequest(state, payload) {
  updateRequest(state, payload, requests.SUCCESS);
}

function failRequest(state, payload) {
  updateRequest(state, payload, requests.FAILED);
}

function handleLogout(state) {
  state.holdings = [];
  state.recentTransactions = [];
  state.searchTransactions = [];
  state.nep5Balances = {};
  state.sendInProgress = {};
  state.currentMarket = null;
  state.menuToggleable = false;
  state.orderHistory = [];
  state.dexChartState = false;
  neo.fetchNEP5Tokens();
  storage.delete('dexInfoAccepted');
  storage.delete('commitInfoAccepted');
  storage.delete('dexChartState');
}

function handleNetworkChange(state) {
  state.holdings = [];
  state.recentTransactions = [];
  state.searchTransactions = [];
  state.nep5Balances = {};
  state.orderHistory = null;
  state.currentMarket = null;
  neo.fetchNEP5Tokens(() => {
    // Fast load balances of user assets
    this.dispatch('fetchHoldings');
    this.dispatch('fetchRecentTransactions');
  });
}

function orderBookSnapshotReceived(state, res) {
  const orderBook = dex.formOrderBook(res.asks, res.bids);
  orderBook.pair = res.pair;

  Vue.set(state, 'orderBook', orderBook);
}

function orderBookUpdateReceived(state, res) {
  if (!state.orderBook || state.orderBook.pair !== res.pair) {
    return;
  }

  const orderBook = dex.updateOrderBook(state.orderBook, res.side, res.changes);
  const side = res.side === 'ask' ? orderBook.asks : orderBook.bids;
  Vue.set(state.orderBook, res.side, side);
}

function putTransactionDetail(state, transactionDetail) {
  const details = state.transactionDetails;
  _.set(details, transactionDetail.txid.replace('0x', ''), transactionDetail);
}

function putBlockDetails(state, blockDetails) {
  _.set(state.blockDetails, blockDetails.hash, blockDetails);
}

function resetRequests(state) {
  state.requests = {};
}

function setLoginRef(state, value) {
  state.loginRef = value;
}

function setAcceptCommitInfo(state, value) {
  if (!value && state.acceptCommitInfo) {
    storage.delete('commitInfoAccepted');
  } else if (value && !state.acceptCommitInfo) {
    storage.set('commitInfoAccepted', true);
  }
  state.acceptCommitInfo = value;
}

function setAcceptDexDemoVersion(state, value) {
  if (!value && state.acceptDexDemoVersion[state.currentNetwork.net]) {
    storage.delete('dexInfoAccepted');
  } else if (value && !state.acceptDexDemoVersion[state.currentNetwork.net]) {
    storage.set('dexInfoAccepted', true);
  }
  Vue.set(state.acceptDexDemoVersion, state.currentNetwork.net, value);
}

function setAcceptDexOutOfDate(state, value) {
  state.acceptDexOutOfDate = value;
}

function setActiveTransaction(state, transaction) {
  state.activeTransaction = transaction;
  state.showPriceTile = false;
}

function setClaimModalModel(state, model) {
  state.claimModalModel = model;
}

function setCommitChangeInProgress(state, value) {
  state.commitChangeInProgress = value;
}

function setCommitModalModel(state, model) {
  state.commitModalModel = model;
}

async function setCommitState(state, commitState) {
  if (!state.currentWallet || !state.currentNetwork) {
    return;
  }

  state.commitState = commitState;
}

function setContacts(state, contacts) {
  state.contacts = contacts;
}

function setCurrency(state, currency) {
  state.currency = currency;
}

function setCurrencySymbol(state, currencySymbol) {
  state.currencySymbol = currencySymbol;
}

function setCurrentWallet(state, currentWallet) {
  state.holdings = [];
  state.statsToken = null;
  state.portfolio = {};
  state.recentTransactions = [];

  state.currentWallet = currentWallet;
}

function setCurrentMarket(state, market) {
  if (state.currentMarket) {
    if (!market || state.currentMarket.marketName !== market.marketName) {
      this.dispatch('unsubscribeFromMarket', {
        market: state.currentMarket,
      });
    }
  }

  state.currentMarket = market;
  state.ordersToShow = market.marketName;

  if (state.currentMarket) {
    this.dispatch('subscribeToMarket', {
      market: state.currentMarket,
    });
  }
}

function setCurrentNetwork(state, network) {
  if (state.currentNetwork && state.currentNetwork.net !== network.net) {
    clearLocalNetworkState(state);
  }

  state.currentNetwork = network;
}

function setDepositWithdrawModalModel(state, model) {
  state.depositWithdrawModalModel = model;
}

function setGasClaim(state, value) {
  state.gasClaim = value;
}

function setGasFracture(state, facture) {
  state.gasFracture = facture;
}

async function setHoldings(state, holdings) {
  if (!_.isEmpty(holdings)) {
    state.holdings = holdings;
  }

  if (!state.statsToken && !_.isEmpty(holdings)) {
    state.statsToken = holdings[0];
  } else if (state.statsToken) {
    state.statsToken = _.find(state.holdings, { symbol: state.statsToken.symbol });

    if (!state.statsToken && !_.isEmpty(holdings)) {
      state.statsToken = holdings[0];
    }
  }
}

function setKycInProgressModalModel(state, model) {
  state.kycInProgressModalModel = model;
}

function setLastReceivedBlock(state) {
  state.lastReceivedBlock = moment().unix();
}

function setLastSuccessfulRequest(state) {
  state.lastSuccessfulRequest = moment().unix();
}

function setMarkets(state, markets) {
  state.markets = markets;
}

function setOrderPrice(state, price) {
  state.orderPrice = price;
}

function setOrderQuantity(state, quantity) {
  state.orderQuantity = quantity;
}

function setPortfolio(state, portfolio) {
  if (portfolio) {
    state.portfolio = portfolio;
  }
}

function setRecentTransactions(state, transactions) {
  const existingIsEmpty = !state.recentTransactions || state.recentTransactions.length === 0;

  _.sortBy(transactions, 'block_index').forEach((transaction) => {
    const existingTransaction = _.find(
      state.recentTransactions,
      { hash: transaction.hash, symbol: transaction.symbol },
    );
    if (existingTransaction) {
      return;
    }
    state.recentTransactions.unshift(transaction);
    if (existingIsEmpty === false) {
      alerts.success(`New Transaction Found. TX: ${transaction.hash}`);
    }
  });
}

function setLatestVersion(state, version) {
  state.latestVersion = version;
}

function setSearchTransactionFromDate(state, fromDate) {
  state.searchTransactionFromDate = fromDate;
}

function setSearchTransactionToDate(state, toDate) {
  state.searchTransactionToDate = toDate;
}

function setSearchTransactions(state, transactions) {
  state.searchTransactions = transactions;
}

function setShowAddContactModal(state, value) {
  state.showAddContactModal = value;
  state.currentEditContact = null;
}

function setShowAddTokenModal(state, value) {
  state.showAddTokenModal = value;
}

function setShowEditContactModal(state, contact) {
  state.showAddContactModal = true;
  state.currentEditContact = contact;
}

function setShowSendAddressModal(state, value) {
  state.showSendAddressModal = value;
}

function setShowLoginToWalletModal(state, wallet) {
  const show = wallet !== null;
  state.showLoginToWalletModal = show;
  state.currentLoginToWallet = wallet;
}

function setShowPortfolioHeader(state, value) {
  state.showPortfolioHeader = value;
}

function setShowImportAWalletModal(state, value) {
  state.showImportAWalletModal = value;
}

function setShowSendWithLedgerModal(state, value) {
  state.showSendWithLedgerModal = value;
}

function setConfirmDismissKyc(state, value) {
  state.confirmDismissKyc = value;
}


function setShowSendRequestLedgerSignature(state, value) {
  state.showSendRequestLedgerSignature = value;
}

function setSendInProgress(state, value) {
  Vue.set(state.sendInProgress, state.currentNetwork.net, value);
}

function setSendModel(state, value) {
  Vue.set(state.sendModel, state.currentNetwork.net, value);
}

function setShowWalletBackupModal(state, value) {
  state.showWalletBackupModal = value;
}

function setSocketOrderCreated(state, value) {
  state.socket.orderCreated = value;
}

function setSocketOrderMatched(state, value) {
  state.socket.orderMatched = value;
}

function setSocketOrderCreationFailed(state, value) {
  state.socket.orderCreationFailed = value;
}

function setSocketOrderMatchFailed(state, value) {
  state.socket.orderMatchFailed = value;
}

function setStatsToken(state, token) {
  state.statsToken = token;
  state.showPriceTile = true;
  state.activeTransaction = null;
}

function setWallets(state, wallets) {
  state.wallets = wallets;
}

function setWithdrawInProgressModalModel(state, model) {
  state.withdrawInProgressModalModel = model;
}

function setSystemWithdraw(state, value) {
  state.systemWithdraw = value;
}

function setSystemWithdrawMergeState(state, value) {
  if (state.systemWithdraw && typeof state.systemWithdraw === 'object') {
    state.systemWithdraw = _.merge(_.cloneDeep(state.systemWithdraw), value);
  }
}

function setOrderHistory(state, orders) {
  state.orderHistory = orders;
}

function setDexChartState(state, value) {
  if (JSON.stringify(state.dexChartState) !== JSON.stringify(value)) {
    storage.set('dexChartState', value);
  }
  state.dexChartState = value;
}

function setFractureGasModalModel(state, model) {
  state.fractureGasModalModel = model;
}

function setShowClaimGasModal(state, value) {
  state.showClaimGasModal = value;
}


function startRequest(state, payload) {
  updateRequest(state, payload, requests.PENDING);
}

function startSilentRequest(state, payload) {
  updateRequest(state, Object.assign(payload, { isSilent: true }), requests.PENDING);
}


function setStyleMode(state, style) {
  state.styleMode = style;
}

function setTickerDataByMarket(state, tickerDataByMarket) {
  state.tickerDataByMarket = tickerDataByMarket;
}

function setTradeHistory(state, tradeHistory) {
  state.tradeHistory = tradeHistory;
}

function setTradesBucketed(state, apiBuckets) {
  state.tradeHistory.apiBuckets = apiBuckets;
}

function appendValuationsToMarktsForPrevewing(state, valuations) {
  const lowercaseCurrency = settings.getCurrency().toLowerCase();

  state.markets = state.markets.map((market) => {
    const valuation = valuations[market.baseCurrency];

    return _.merge(
      market,
      valuation,
      { baseUnitValue: parseFloat(valuation[`price_${lowercaseCurrency}`]) },
    );
  });
}

function addToOrderHistory(state, newOrders) {
  if (!state.orderHistory) {
    state.orderHistory = [];
  }

  for (let i = 0; i < newOrders.length; i += 1) {
    const existingOrderIndex = _.findIndex(state.orderHistory, (order) => {
      return order.orderId === newOrders[i].orderId;
    });

    if (existingOrderIndex > -1) {
      // this order is already in our cache, must be an update
      // remove the existing order and add the updated version to the top
      state.orderHistory.splice(existingOrderIndex, 1);
    }

    state.orderHistory.unshift(newOrders[i]);
  }
}

function setOrderToConfirm(state, order) {
  state.orderToConfirm = order;
  state.showOrderConfirmationModal = !!order;
}

function setOrdersToShow(state, value) {
  state.ordersToShow = value;
}

function setMenuToggleable(state, menuToggleable) {
  state.menuToggleable = menuToggleable;
}

function setMenuCollapsed(state, menuCollapsed) {
  state.menuCollapsed = menuCollapsed;
}

function setShowLearnMore(state, value) {
  state.showLearnMore = value;
}

function SOCKET_ONOPEN(state, event) {
  state.socket.client = event.target;
  state.socket.isConnected = true;
  state.socket.connectionClosed = null;
  if (state.socket.opened) {
    state.socket.opened();
  }
  if (state.needsWsReconnectHandling) {
    state.needsWsReconnectHandling = false;
    if (state.currentMarket) {
      this.dispatch('subscribeToMarket', {
        market: state.currentMarket,
        isRequestSilent: true,
      });

      // Ensure trade history is up-to-date on reconnect. (may have dropped some trades during disconnect)
      this.dispatch('fetchTradeHistory', {
        marketName: state.currentMarket.marketName,
        isRequestSilent: true,
      });
    }
  }
}

function SOCKET_ONCLOSE(state) {
  state.socket.client = null;
  state.socket.isConnected = false;
  if (!state.socket.connectionClosed) {
    state.socket.connectionClosed = moment().utc();
  }
}

function SOCKET_ONMESSAGE(state, message) {
  state.socket.lastMessage = message;

  if (message.subscribe && message.subscribe.indexOf('orderBook') > -1) {
    state.socket.subscribedMarket = message.subscribe.substring(message.subscribe.indexOf(':') + 1);
  } else if (message.unsubscribe && message.unsubscribe.indexOf('orderBook') > -1) {
    state.socket.subscribedMarket = null;
  } else if (message.type === 'bookSnapshot') {
    orderBookSnapshotReceived(state, message);
  } else if (message.type === 'bookUpdate') {
    orderBookUpdateReceived(state, message);
  } else if (message.type === 'orderCreated') {
    if (state.socket.orderCreated) {
      state.socket.orderCreated(message);
    }
  } else if (message.type === 'orderMatched') {
    if (state.socket.orderMatched) {
      state.socket.orderMatched(message);
    }
  } else if (message.type === 'orderCreationFailed') {
    if (state.socket.orderCreationFailed) {
      state.socket.orderCreationFailed(message);
    }
  } else if (message.type === 'orderMatchFailed') {
    if (state.socket.orderMatchFailed) {
      state.socket.orderMatchFailed(message);
    }
  } else if (message.type === 'trades') {
    tradeUpdateReceived(state, message);
  } else if (message.type) {
    // unknown message type
    // console.log(message);
  }
}

function SOCKET_RECONNECT_ERROR(state) {
  state.socket.reconnectError = true;
}

function SOCKET_RECONNECT(state) {
  // Note: at this point SOCKET_ONOPEN will not have been called yet, state.socket.client will still be null
  // So we cannot actually send any messages out the websocket here. We can set a flag so that SOCKET_ONOPEN will know
  // that has opened as a result of a RECONNECT.
  state.needsWsReconnectHandling = true;
}

function tradeUpdateReceived(state, tradeUpdateMsg) {
  if (!state.tradeHistory || !state.tradeHistory.trades) {
    return;
  }

  tradeUpdateMsg.trades.forEach((trade) => {
    if (trade.length !== TRADE_MSG_LENGTH) {
      return;
    }

    state.tradeHistory.trades.unshift({
      // Trade executing in ask side means a Buy executed.
      side: tradeUpdateMsg.side === 'ask' ? 'Buy' : 'Sell',
      price: trade[0],
      quantity: trade[1],
      tradeTime: moment(trade[2]).unix(),
    });
  });
}

function updateRequest(state, { identifier, message, isSilent }, status) {
  Vue.set(state.requests, identifier, { status, message, isSilent });
}
