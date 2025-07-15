import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Staff, Table, MenuItem, Reservation, Order, KOT, Restaurant } from '../types';
import { parseDateTime } from '../utils/dateUtils';

interface AppState {
  currentUser: User | null;
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  users: User[];
  staff: Staff[];
  tables: Table[];
  menuItems: MenuItem[];
  reservations: Reservation[];
  orders: Order[];
  kots: KOT[];
  selectedTable: Table | null;
}

type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_RESTAURANT'; payload: Restaurant | null }
  | { type: 'LOAD_RESTAURANTS'; payload: Restaurant[] }
  | { type: 'LOAD_INITIAL_DATA'; payload: Partial<AppState> }
  | { type: 'LOAD_INITIAL_DATA_WITH_DATES'; payload: Partial<AppState> }
  | { type: 'ADD_RESTAURANT'; payload: Restaurant }
  | { type: 'UPDATE_RESTAURANT'; payload: Restaurant }
  | { type: 'DELETE_RESTAURANT'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_STAFF'; payload: Staff }
  | { type: 'UPDATE_STAFF'; payload: Staff }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'ADD_TABLE'; payload: Table }
  | { type: 'UPDATE_TABLE'; payload: Table }
  | { type: 'DELETE_TABLE'; payload: string }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM'; payload: string }
  | { type: 'ADD_RESERVATION'; payload: Reservation }
  | { type: 'UPDATE_RESERVATION'; payload: Reservation }
  | { type: 'DELETE_RESERVATION'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'DELETE_ORDER'; payload: string }
  | { type: 'ADD_KOT'; payload: KOT }
  | { type: 'UPDATE_KOT'; payload: KOT }
  | { type: 'DELETE_KOT'; payload: string }
  | { type: 'SELECT_TABLE'; payload: Table | null }

const initialState: AppState = {
  currentUser: null,
  currentRestaurant: null,
  restaurants: [],
  users: [],
  staff: [],
  tables: [],
  menuItems: [],
  reservations: [],
  orders: [],
  kots: [],
  selectedTable: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_INITIAL_DATA':
      // Parse dates for all data that comes from the database
      const parsedPayload = { ...action.payload };
      
      if (parsedPayload.orders) {
        parsedPayload.orders = parsedPayload.orders.map(order => ({
          ...order,
          createdAt: parseDateTime(order.createdAt),
          updatedAt: parseDateTime(order.updatedAt),
        }));
      }
      
      if (parsedPayload.reservations) {
        parsedPayload.reservations = parsedPayload.reservations.map(reservation => ({
          ...reservation,
          date: parseDateTime(reservation.date),
        }));
      }
      
      if (parsedPayload.kots) {
        parsedPayload.kots = parsedPayload.kots.map(kot => ({
          ...kot,
          createdAt: parseDateTime(kot.createdAt),
        }));
      }
      
      if (parsedPayload.staff) {
        parsedPayload.staff = parsedPayload.staff.map(member => ({
          ...member,
          hireDate: parseDateTime(member.hireDate),
        }));
      }
      
      if (parsedPayload.users) {
        parsedPayload.users = parsedPayload.users.map(user => ({
          ...user,
          createdAt: parseDateTime(user.createdAt),
        }));
      }
      
      if (parsedPayload.restaurants) {
        parsedPayload.restaurants = parsedPayload.restaurants.map(restaurant => ({
          ...restaurant,
          createdAt: parseDateTime(restaurant.createdAt),
        }));
      }
      
      return { ...state, ...parsedPayload };
    case 'LOAD_RESTAURANTS':
      return { 
        ...state, 
        restaurants: action.payload.map(restaurant => ({
          ...restaurant,
          createdAt: parseDateTime(restaurant.createdAt),
        }))
      };
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_RESTAURANT':
      return { ...state, currentRestaurant: action.payload };
    case 'ADD_RESTAURANT':
      return { 
        ...state, 
        restaurants: [...state.restaurants, {
          ...action.payload,
          createdAt: parseDateTime(action.payload.createdAt),
        }] 
      };
    case 'UPDATE_RESTAURANT':
      const updatedRestaurant = {
        ...action.payload,
        createdAt: parseDateTime(action.payload.createdAt),
      };
      return {
        ...state,
        restaurants: state.restaurants.map(restaurant => 
          restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
        ),
        currentRestaurant: state.currentRestaurant?.id === updatedRestaurant.id ? updatedRestaurant : state.currentRestaurant,
      };
    case 'DELETE_RESTAURANT':
      return {
        ...state,
        restaurants: state.restaurants.filter(restaurant => restaurant.id !== action.payload),
        currentRestaurant: state.currentRestaurant?.id === action.payload ? null : state.currentRestaurant,
      };
    case 'ADD_USER':
      return { 
        ...state, 
        users: [...state.users, {
          ...action.payload,
          createdAt: parseDateTime(action.payload.createdAt),
        }] 
      };
    case 'UPDATE_USER':
      const updatedUser = {
        ...action.payload,
        createdAt: parseDateTime(action.payload.createdAt),
      };
      return {
        ...state,
        users: state.users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ),
        currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser,
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'ADD_STAFF':
      return { 
        ...state, 
        staff: [...state.staff, {
          ...action.payload,
          hireDate: parseDateTime(action.payload.hireDate),
        }] 
      };
    case 'UPDATE_STAFF':
      const updatedStaff = {
        ...action.payload,
        hireDate: parseDateTime(action.payload.hireDate),
      };
      return {
        ...state,
        staff: state.staff.map(member => 
          member.id === updatedStaff.id ? updatedStaff : member
        ),
      };
    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter(member => member.id !== action.payload),
      };
    case 'ADD_TABLE':
      return { ...state, tables: [...state.tables, action.payload] };
    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map(table => 
          table.id === action.payload.id ? action.payload : table
        ),
      };
    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(table => table.id !== action.payload),
      };
    case 'ADD_MENU_ITEM':
      return { ...state, menuItems: [...state.menuItems, action.payload] };
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.map(item => 
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter(item => item.id !== action.payload),
      };
    case 'ADD_RESERVATION':
      return { 
        ...state, 
        reservations: [...state.reservations, {
          ...action.payload,
          date: parseDateTime(action.payload.date),
        }] 
      };
    case 'UPDATE_RESERVATION':
      const updatedReservation = {
        ...action.payload,
        date: parseDateTime(action.payload.date),
      };
      return {
        ...state,
        reservations: state.reservations.map(reservation => 
          reservation.id === updatedReservation.id ? updatedReservation : reservation
        ),
      };
    case 'DELETE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.filter(reservation => reservation.id !== action.payload),
      };
    case 'ADD_ORDER':
      return { 
        ...state, 
        orders: [...state.orders, {
          ...action.payload,
          createdAt: parseDateTime(action.payload.createdAt),
          updatedAt: parseDateTime(action.payload.updatedAt),
        }] 
      };
    case 'UPDATE_ORDER':
      const updatedOrder = {
        ...action.payload,
        createdAt: parseDateTime(action.payload.createdAt),
        updatedAt: parseDateTime(action.payload.updatedAt),
      };
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ),
      };
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload),
      };
    case 'ADD_KOT':
      return { 
        ...state, 
        kots: [...state.kots, {
          ...action.payload,
          createdAt: parseDateTime(action.payload.createdAt),
        }] 
      };
    case 'UPDATE_KOT':
      const updatedKOT = {
        ...action.payload,
        createdAt: parseDateTime(action.payload.createdAt),
      };
      return {
        ...state,
        kots: state.kots.map(kot => 
          kot.id === updatedKOT.id ? updatedKOT : kot
        ),
      };
    case 'DELETE_KOT':
      return {
        ...state,
        kots: state.kots.filter(kot => kot.id !== action.payload),
      };
    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}