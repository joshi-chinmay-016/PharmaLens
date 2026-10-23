import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import investigationsReducer from './investigationsSlice';
import sourcesReducer from './sourcesSlice';
import analysisReducer from './slices/analysisSlice';

export const store = configureStore({
  reducer: {
    investigations: investigationsReducer,
    sources: sourcesReducer,
    analysis: analysisReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
