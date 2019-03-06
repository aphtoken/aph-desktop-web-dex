import { defaultSettings } from '../constants';
import router from '../router';
import { store } from '../store';

export default {

  success() {
    let redirect = defaultSettings.LANDING_ROUTE;

    if (store.state.loginRef) {
      redirect = store.state.loginRef;
      store.commit('setLoginRef', false);
    }

    router.push(redirect);
  },
};
