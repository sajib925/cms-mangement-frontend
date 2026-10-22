import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import collectionReducer from "@/redux/collectionSlice";

import { dataApi } from "@/redux/api/dataApi"

export const store = configureStore({
  reducer: {
    [dataApi.reducerPath]: dataApi.reducer,
    collection: collectionReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(dataApi.middleware),
  devTools: import.meta.env.DEV,
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch