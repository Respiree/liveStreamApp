import React from 'react';

import PatientStore from './patient';
import UIStore from './uiStore';
import BleStore from './bluetooth';
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";
const queryClient = new QueryClient();
export const stores = {
  patient: PatientStore,
  ui: UIStore,
  bluetooth: BleStore
};

const storeContext = React.createContext(stores);

export const withStoresProvider = (C: React.FC) => (props: any) => {
  return (
    <QueryClientProvider client={queryClient}>
    <storeContext.Provider value={stores}>
      <C {...props} />
    </storeContext.Provider>
    </QueryClientProvider>
  );
};

export const useStores = () => React.useContext(storeContext);

export const hydrateStores = async () => {
  for (const key in stores) {
    if (Object.prototype.hasOwnProperty.call(stores, key)) {
      const s = stores[key];

      if (s.hydrate) {
        await s.hydrate();
      }
    }
  }
};
