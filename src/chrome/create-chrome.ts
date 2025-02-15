import { createFetchPermissionsWatcher } from '../auth/fetchPermissions';
import { AppNavigationCB, ChromeAPI, GenericCB, NavDOMEvent } from '@redhat-cloud-services/types';
import { Store } from 'redux';
import { AnalyticsBrowser } from '@segment/analytics-next';
import get from 'lodash/get';
import Cookies from 'js-cookie';

import {
  AppNavClickItem,
  appAction,
  appNavClick,
  appObjectId,
  globalFilterScope,
  removeGlobalFilter,
  toggleDebuggerButton,
  toggleDebuggerModal,
  toggleFeedbackModal,
  toggleGlobalFilter,
} from '../redux/actions';
import { ITLess, getEnv, getEnvDetails, isBeta, isProd, updateDocumentTitle } from '../utils/common';
import { createSupportCase } from '../utils/createCase';
import debugFunctions from '../utils/debugFunctions';
import { flatTags } from '../components/GlobalFilter/globalFilterApi';
import { PUBLIC_EVENTS } from '../utils/consts';
import { usePendoFeedback } from '../components/Feedback';
import { middlewareListener } from '../redux/redux-config';
import { clearAnsibleTrialFlag, isAnsibleTrialFlagActive, setAnsibleTrialFlag } from '../utils/isAnsibleTrialFlagActive';
import chromeHistory from '../utils/chromeHistory';
import { ReduxState } from '../redux/store';
import { STORE_INITIAL_HASH } from '../redux/action-types';
import { FlagTagsFilter } from '../@types/types';
import useBundle, { getUrl } from '../hooks/useBundle';
import { warnDuplicatePkg } from './warnDuplicatePackages';
import { getVisibilityFunctions } from '../utils/VisibilitySingleton';
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import qe from '../utils/iqeEnablement';
import { RegisterModulePayload } from '../state/atoms/chromeModuleAtom';

export type CreateChromeContextConfig = {
  useGlobalFilter: (callback: (selectedTags?: FlagTagsFilter) => any) => ReturnType<typeof callback>;
  store: Store<ReduxState>;
  setPageMetadata: (pageOptions: any) => any;
  analytics: AnalyticsBrowser;
  quickstartsAPI: ChromeAPI['quickStarts'];
  helpTopics: ChromeAPI['helpTopics'];
  chromeAuth: ChromeAuthContextValue;
  registerModule: (payload: RegisterModulePayload) => void;
};

export const createChromeContext = ({
  useGlobalFilter,
  store,
  setPageMetadata,
  analytics,
  quickstartsAPI,
  helpTopics,
  registerModule,
  chromeAuth,
}: CreateChromeContextConfig): ChromeAPI => {
  const fetchPermissions = createFetchPermissionsWatcher(chromeAuth.getUser);
  const visibilityFunctions = getVisibilityFunctions();
  const dispatch = store.dispatch;
  const actions = {
    appAction: (action: string) => dispatch(appAction(action)),
    appObjectId: (objectId: string) => dispatch(appObjectId(objectId)),
    appNavClick: (item: AppNavClickItem, event?: NavDOMEvent) => dispatch(appNavClick(item, event)),
    globalFilterScope: (scope: string) => dispatch(globalFilterScope(scope)),
    registerModule: (module: string, manifest?: string) => registerModule({ module, manifest }),
    removeGlobalFilter: (isHidden: boolean) => {
      console.error('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
      return dispatch(removeGlobalFilter(isHidden));
    },
  };

  const on = (type: keyof typeof PUBLIC_EVENTS, callback: AppNavigationCB | GenericCB) => {
    if (!Object.prototype.hasOwnProperty.call(PUBLIC_EVENTS, type)) {
      throw new Error(`Unknown event type: ${type}`);
    }

    const [listener, selector] = PUBLIC_EVENTS[type];
    if (type !== 'APP_NAVIGATION' && typeof selector === 'string') {
      (callback as GenericCB)({
        data: get(store.getState(), selector) || {},
      });
    }
    if (typeof listener === 'function') {
      return middlewareListener.addNew(listener(callback as GenericCB));
    }
  };

  const identifyApp = (_data: any, appTitle?: string, noSuffix?: boolean) => {
    updateDocumentTitle(appTitle, noSuffix);
    return Promise.resolve();
  };

  const isITLessEnv = ITLess();

  const api: ChromeAPI = {
    ...actions,
    auth: {
      getRefreshToken: chromeAuth.getRefreshToken,
      getToken: chromeAuth.getToken,
      getUser: chromeAuth.getUser,
      logout: chromeAuth.logout,
      login: chromeAuth.login,
      doOffline: chromeAuth.doOffline,
      getOfflineToken: chromeAuth.getOfflineToken,
      qe: {
        ...qe,
        init: () => qe.init(store, { current: { user: { access_token: chromeAuth.token } } as any }),
      },
      reAuthWithScopes: chromeAuth.reAuthWithScopes,
    },
    initialized: true,
    isProd,
    forceDemo: () => Cookies.set('cs_demo', 'true'),
    getBundle: () => getUrl('bundle'),
    getBundleData: useBundle,
    getApp: () => getUrl('app'),
    getEnvironment: () => getEnv(),
    getEnvironmentDetails: () => getEnvDetails(),
    createCase: (fields?: any) => chromeAuth.getUser().then((user) => createSupportCase(user!.identity, chromeAuth.token, fields)),
    getUserPermissions: async (app = '', bypassCache?: boolean) => {
      const token = await chromeAuth.getToken();
      return fetchPermissions(token, app, bypassCache);
    },
    identifyApp,
    hideGlobalFilter: (isHidden: boolean) => {
      const initialHash = store.getState()?.chrome?.initialHash;
      /**
       * Restore app URL hash fragment after the global filter is disabled
       */
      if (initialHash) {
        chromeHistory.replace({
          ...chromeHistory.location,
          hash: initialHash,
        });
        dispatch({ type: STORE_INITIAL_HASH });
      }
      dispatch(toggleGlobalFilter(isHidden));
    },
    isBeta,
    isChrome2: true,
    enable: debugFunctions,
    isDemo: () => Boolean(Cookies.get('cs_demo')),
    isPenTest: () => Boolean(Cookies.get('x-rh-insights-pentest')),
    mapGlobalFilter: flatTags,
    navigation: () => console.error("Don't use insights.chrome.navigation, it has been deprecated!"),
    updateDocumentTitle,
    visibilityFunctions,
    on,
    experimentalApi: true,
    isFedramp: isITLessEnv,
    usePendoFeedback,
    segment: {
      setPageMetadata,
    },
    toggleFeedbackModal: (...args) => dispatch(toggleFeedbackModal(...args)),
    enableDebugging: () => dispatch(toggleDebuggerButton(true)),
    toggleDebuggerModal: (...args) => dispatch(toggleDebuggerModal(...args)),
    // FIXME: Update types once merged
    quickStarts: quickstartsAPI as unknown as ChromeAPI['quickStarts'],
    helpTopics,
    clearAnsibleTrialFlag,
    isAnsibleTrialFlagActive,
    setAnsibleTrialFlag,
    chromeHistory,
    analytics: analytics!,
    // FIXME: Update types once merged
    useGlobalFilter: useGlobalFilter as unknown as ChromeAPI['useGlobalFilter'],
    init: () => {
      console.error(
        `Calling deprecated "chrome.init function"! Please remove the function call from your code. Functions "on" and "updateDocumentTitle" are directly accessible from "useChrome" hook.`
      );
      return {
        on,
        updateDocumentTitle,
        identifyApp,
      };
    },
    $internal: {
      store,
    },
    enablePackagesDebug: () => warnDuplicatePkg(),
  };
  return api;
};
